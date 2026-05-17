import { EntityManager } from '@mikro-orm/postgresql';
import crypto from 'node:crypto';
import { z } from 'zod';
import { Company, CompanyStatus } from '../entities/Company.entity';
import User, { UserRole } from '../entities/User.entity';
import { ErrorUtils } from '../utils/error.utils';
import { LoggerUtils } from '../utils/logger.utils';
import { emailService } from './email.service';
import { createServiceResponse } from '../utils/response.util';
import { BaseService } from './base.service';
import { AuthService } from './auth.service';

// ─── Validation Schemas ───────────────────────────────────────────────────────

const CreateCompanySchema = z.object({
  name: z.string().min(2).max(200),
  industry: z.string().min(2).max(100),
  size: z.number().min(1).max(50),
  contactName: z.string().min(2).max(100),
  contactEmail: z.string().email(),
  contactPassword: z.string().min(8),
});

const UpdateCompanySchema = z.object({
  name: z.string().min(2).max(200).optional(),
  industry: z.string().min(2).max(100).optional(),
  size: z.number().min(1).max(50).optional(),
});

const CompanyFiltersSchema = z.object({
  query: z.string().optional(),
  industry: z.string().optional(),
  size: z.number().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof UpdateCompanySchema>;
export type CompanyFiltersInput = z.infer<typeof CompanyFiltersSchema>;

const companyConfirmStore = new Map<
  string,
  { companyId: string; action: 'approve' | 'reject'; expiresAt: Date }
>();

export class CompanyService extends BaseService {
  private readonly authService: AuthService

  constructor(em: EntityManager) {
    super(em);
    this.authService = new AuthService(em);
  }

  async findById(id: string): Promise<Company> {
    const company = await this.em.findOne(
      Company,
      { id },
      { populate: ['users'] }
    );
    if (!company) throw ErrorUtils.notFound('Company');
    return company;
  }

  async getCompanies(rawFilters: Partial<CompanyFiltersInput> = {}) {
    const { query, industry, size, page, limit } =
      CompanyFiltersSchema.parse(rawFilters);
    const where: Record<string, unknown> = {};

    if (query) {
      where.$or = [
        { name: { $ilike: `%${query}%` } },
        { industry: { $ilike: `%${query}%` } },
      ];
    }

    if (industry) where.industry = { $ilike: `%${industry}%` };
    if (size) where.size = size;

    const offset = (page - 1) * limit;
    const [items, total] = await this.em.findAndCount(Company, where as never, {
      limit,
      offset,
      orderBy: { name: 'ASC' },
    });

    return {
      items,
      total,
      page,
      limit,
      hasNextPage: offset + items.length < total,
    };
  }

  async createCompany(input: CreateCompanyInput): Promise<{ message: string }> {
    const data = CreateCompanySchema.parse(input);

    const existing = await this.em.findOne(Company, { name: data.name });
    if (existing)
      throw ErrorUtils.conflict('A company with this name already exists');

    const company = this.em.create(Company, {
      name: data.name,
      industry: data.industry,
      size: data.size,
      status: CompanyStatus.INACTIVE,
    });

    const owner = this.em.create(User, {
      name: data.contactName,
      email: data.contactEmail,
      password: data.contactPassword,
      role: UserRole.ADMIN,
      lastName: '',
      company
    });

    company.owner = owner;

    this.em.persist([company, owner]);
    await this.em.flush();

    LoggerUtils.info(`Company created (pending approval): ${company.name}`);

    // Generate approve/reject tokens — 7 day expiry
    const approveToken = crypto.randomBytes(32).toString('hex');
    const rejectToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    companyConfirmStore.set(approveToken, {
      companyId: company.id,
      action: 'approve',
      expiresAt,
    });
    companyConfirmStore.set(rejectToken, {
      companyId: company.id,
      action: 'reject',
      expiresAt,
    });

    // Send confirmation email to admin (non-blocking)
    emailService
      .sendCompanyConfirmationEmail(
        approveToken,
        {
          name: company.name,
          industry: company.industry,
          size: company.size,
          status: company.status,
        },
        {
          name: data.contactName,
          email: data.contactEmail,
        }
      )
      .catch(err =>
        LoggerUtils.error('Company confirmation email failed', { err })
      );

    const {token} = await this.authService.createTokensPair(company.owner)
    return createServiceResponse(
      200,
      'Company request submitted successfully, You will be notified once it is reviewed',
      true,
      { company, user: company.owner, token}
    );
  }

  // ── Confirm company — PUBLIC (admin clicks email link) ──────────────────────
  async confirmCompany(token: string): Promise<{ message: string }> {
    const entry = companyConfirmStore.get(token);

    if (!entry)
      throw ErrorUtils.badRequest('Invalid or expired confirmation token');

    if (entry.expiresAt < new Date()) {
      companyConfirmStore.delete(token);
      throw ErrorUtils.badRequest('Confirmation token has expired');
    }

    const company = await this.em.findOne(Company, { id: entry.companyId });
    if (!company) throw ErrorUtils.notFound('Company');

    if (entry.action === 'approve') {
      company.status = CompanyStatus.ACTIVE;

      await this.em.flush();
      LoggerUtils.info(`Company approved: ${company.name}`);
      companyConfirmStore.delete(token);

      return {
        message: `Company "${company.name}" has been approved successfully.`,
      };
    }

    // Reject → delete company
    this.em.remove(company);
    await this.em.flush();

    companyConfirmStore.delete(token);

    LoggerUtils.info(`Company rejected and deleted: ${company.name}`);
    return { message: `Company "${company.name}" has been rejected.` };
  }

  // ── Update — PROTECTED (admin/root) ─────────────────────────────────────────
  async updateCompany(
    id: string,
    input: UpdateCompanyInput,
    currentRole: string
  ): Promise<Company> {
    if (currentRole === UserRole.USER) {
      throw ErrorUtils.forbidden('Only admins can update companies');
    }

    const data = UpdateCompanySchema.parse(input);
    const company = await this.findById(id);

    if (data.name && data.name !== company.name) {
      const existing = await this.em.findOne(Company, { name: data.name });
      if (existing)
        throw ErrorUtils.conflict('A company with this name already exists');
    }

    this.em.assign(company, data);
    await this.em.flush();

    LoggerUtils.info(`Company updated: ${company.name}`);
    return company;
  }

  // ── Delete — PROTECTED (admin/root) ─────────────────────────────────────────
  async deleteCompany(id: string, currentRole: string): Promise<boolean> {
    if (currentRole === UserRole.USER) {
      throw ErrorUtils.forbidden('Only admins can delete companies');
    }

    const company = await this.findById(id);

    await company.users.init();
    if (company.users.length > 0) {
      throw ErrorUtils.conflict(
        'Cannot delete a company that still has users assigned'
      );
    }

    await this.em.removeAndFlush(company);
    LoggerUtils.info(`Company deleted: ${company.name}`);
    return true;
  }
}
