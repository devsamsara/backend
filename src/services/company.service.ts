import { EntityManager } from '@mikro-orm/postgresql';
import crypto from 'node:crypto';
import { z } from 'zod';
import { Company, CompanyStatus } from '../entities/Company.entity';
import User, { UserRole, UserStatus } from '../entities/User.entity';
import { ErrorUtils } from '../utils/error.utils';
import { LoggerUtils } from '../utils/logger.utils';
import { emailService } from './email.service';
import { createServiceResponse } from '../utils/response.util';
import { BaseService } from './base.service';
import { AuthService } from './auth.service';
import { Project, ProjectStatus } from '../entities/Project.entity';
import { PhotoEntity } from '../entities/Photo.entity';
import { storageService } from './storage.service';
import moment from 'moment';
import {
  generateBaseNickname,
  generateNicknameSuffix,
  resolveUniqueNickname,
} from '../utils/nickname.util';
import { persistTimelineEvent } from '../utils/timeline.util';
import { TimelineEventType } from '../entities/TimelineEvent.entity';
import { NotificationService } from './notification.service';

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

const InviteMemberSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  role: z.nativeEnum(UserRole).optional(),
  projectId: z.string().uuid('Invalid project ID'),
});

export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof UpdateCompanySchema>;
export type CompanyFiltersInput = z.infer<typeof CompanyFiltersSchema>;
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;


const companyConfirmStore = new Map<
  string,
  { companyId: string; action: 'approve' | 'reject'; expiresAt: Date }
>();
const inviteStore = new Map<string, { userId: string; expiresAt: Date }>();

function generateTempPassword(): string {
  return `Inv${crypto.randomBytes(6).toString('hex')}1`;
}

export class CompanyService extends BaseService {
  private readonly authService: AuthService;

  private readonly notifications: NotificationService;

  constructor(em: EntityManager) {
    super(em);
    this.authService = new AuthService(em);
    this.notifications = new NotificationService(em);
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
    const [items, total] = await this.em.findAndCount(Company, where, {
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
      company,
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

    const { token } = await this.authService.createTokensPair(company.owner);
    return createServiceResponse(
      200,
      'Company request submitted successfully, You will be notified once it is reviewed',
      true,
      { company, user: company.owner, token }
    );
  }

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

  async deleteCompany(id: string, currentRole: string): Promise<boolean> {
    if (currentRole === UserRole.USER) {
      throw ErrorUtils.forbidden('Only admins can delete companies');
    }

    const company = await this.em.findOne(Company, { id });
    if (!company) throw ErrorUtils.notFound('Company');

    // Phase 1: find every project tied to this company, clean up S3 files,
    // then remove the project rows. DB cascades handle photos / notes / timeline.
    const projects = await this.em.find(
      Project,
      { members: { company } },
      { populate: ['photos'] }
    );

    for (const project of projects) {
      for (const photo of project.photos.getItems()) {
        await storageService.deleteFile(storageService.keyFromUrl(photo.url));
      }
      this.em.remove(project);
    }

    // Unset the owner FK before deleting users — otherwise the DB rejects
    // the user DELETE because company.owner_id still references that user row.
    company.owner = undefined;
    await this.em.flush();

    // Phase 2: remove all company members.
    // DB cascades handle refresh tokens and push tokens.
    await company.users.init();
    for (const user of company.users.getItems()) {
      this.em.remove(user);
    }
    await this.em.flush();

    // Phase 3: remove the company itself.
    this.em.remove(company);
    await this.em.flush();

    LoggerUtils.info(
      `Company "${company.name}" permanently deleted — ${projects.length} project(s), ${company.users.length} user(s)`
    );
    return true;
  }

  async getDashboardData(userId: string) {
    const user = await this.em.findOne(
      User,
      { id: userId },
      { populate: ['company', 'company.users'] }
    );
    if (!user) throw ErrorUtils.notFound('User');

    const { company } = user;

    const projects = await this.em.find(
      Project,
      { members: { company } },
      {
        populate: ['members', 'photos', 'notes'],
        orderBy: { createdAt: 'DESC' },
      }
    );

    const recentPhotos = await this.em.find(
      PhotoEntity,
      { project: projects },
      {
        populate: ['project'],
        orderBy: { createdAt: 'DESC' },
        limit: 6,
      }
    );

    const currentCompany = {
      id: company.id,
      name: company.name,
      users: company.users.getItems().map(u => ({
        id: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl ?? null,
      })),
    };

    const projectStatusCounts = {
      ongoing: 0,
      paused: 0,
      completed: 0,
      cancelled: 0,
    };

    for (const p of projects) {
      switch (p.status) {
        case ProjectStatus.ONGOING:
          projectStatusCounts.ongoing++;
          break;
        case ProjectStatus.PAUSED:
          projectStatusCounts.paused++;
          break;
        case ProjectStatus.COMPLETED:
          projectStatusCounts.completed++;
          break;
        case ProjectStatus.CANCELED:
          projectStatusCounts.cancelled++;
          break;
      }
    }

    const projectStatusData = [
      {
        nameKey: 'home.statusOngoing',
        count: projectStatusCounts.ongoing,
        color: '#8B5CF6',
      },
      {
        nameKey: 'home.statusPaused',
        count: projectStatusCounts.paused,
        color: '#F59E0B',
      },
      {
        nameKey: 'home.statusComplete',
        count: projectStatusCounts.completed,
        color: '#10B981',
      },
      {
        nameKey: 'home.statusCancel',
        count: projectStatusCounts.cancelled,
        color: '#EF4444',
      },
    ];

    const recentProjects = projects.slice(0, 10).map(p => ({
      id: p.id,
      name: p.name,
      location: p.location,
      progress: p.progress,
      status: p.status,
      documentsCount: p.photos.count(),
      commentsCount: p.notes.count(),
      date: p.startDate.toISOString(),
      latitude: p.latitude,
      longitude: p.longitude,
      members: p.members.getItems().map(m => ({
        id: m.id,
        name: m.name,
        avatarUrl: m.avatarUrl ?? null,
      })),
      createdAt: moment(p.createdAt).format('YYYY-MM-DD HH:mm'),
    }));

    const locationMap = new Map<
      string,
      {
        projectsCount: number;
        lastVisit: Date;
        latitude: number;
        longitude: number;
      }
    >();

    for (const p of projects) {
      if (!p.location) continue;

      const entry = locationMap.get(p.location);
      if (entry) {
        entry.projectsCount++;
        if (p.createdAt > entry.lastVisit) entry.lastVisit = p.createdAt;
      } else {
        locationMap.set(p.location, {
          projectsCount: 1,
          lastVisit: p.createdAt,
          latitude: p.latitude!,
          longitude: p.longitude!,
        });
      }
    }

    const recentLocations = Array.from(locationMap.entries())
      .sort((a, b) => b[1].lastVisit.getTime() - a[1].lastVisit.getTime())
      .slice(0, 5)
      .map(([name, data]) => ({
        id: Buffer.from(name).toString('base64url'),
        name,
        projectsCount: data.projectsCount,
        lastVisit: moment(data.lastVisit).format('YYYY-MM-DD HH:mm'),
        latitude: data.latitude,
        longitude: data.longitude,
      }));

    const recentImages = recentPhotos.map(photo => ({
      id: photo.id,
      projectName: photo.project.name,
      url: photo.url,
      date: photo.createdAt,
    }));

    return {
      currentCompany,
      projectStatusData,
      recentProjects,
      recentLocations,
      recentImages,
    };
  }

  async getCompanyMembers(userId: string) {
    const user = await this.em.findOne(
      User,
      { id: userId },
      { populate: ['company'] }
    );
    if (!user) throw ErrorUtils.notFound('User');

    // Load all company members and their projects in one query
    const members = await this.em.find(
      User,
      { company: user.company },
      { populate: ['projects'] }
    );

    const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;
    const now = Date.now();

    // Deduplicate projects across all members using a Set of IDs
    const uniqueProjectIds = new Set<string>();
    let onlineCount = 0;

    const mappedMembers = members.map(member => {
      const isOnline =
        member.lastLoginAt != null &&
        now - member.lastLoginAt.getTime() <= ONLINE_THRESHOLD_MS;

      if (isOnline) onlineCount++;

      member.projects.getItems().forEach(p => uniqueProjectIds.add(p.id));

      return {
        id: member.id,
        name: member.name,
        role: member.role,
        avatarUrl: member.avatarUrl ?? null,
        isOnline,
        projects: member.projects.getItems().map(p => ({
          id: p.id,
          name: p.name,
          status: p.status,
          progress: p.progress,
        })),
      };
    });

    return {
      members: mappedMembers,
      totalProjects: uniqueProjectIds.size,
      onlineCount,
    };
  }

  async inviteMember(
    adminId: string,
    input: InviteMemberInput
  ): Promise<boolean> {
    const data = InviteMemberSchema.parse(input);

    const admin = await this.em.findOne(
      User,
      { id: adminId },
      { populate: ['company'] }
    );
    if (!admin) throw ErrorUtils.notFound('User');

    if (admin.role !== UserRole.ADMIN && admin.role !== UserRole.ROOT) {
      throw ErrorUtils.forbidden('Only admins can invite members');
    }

    // Verificar que el proyecto existe y pertenece a la misma empresa
    const project = await this.em.findOne(Project, {
      id: data.projectId,
      members: { company: admin.company },
    });
    if (!project) throw ErrorUtils.notFound('Project');

    // Email único
    const existing = await this.em.findOne(User, { email: data.email });
    if (existing) throw ErrorUtils.conflict('Email already in use');

    // Nickname único (lógica centralizada en nickname.util)
    const nickname = await resolveUniqueNickname(
      this.em,
      data.name
    );

    // Crear usuario INACTIVE con password temporal
    const tempPassword = generateTempPassword();
    const invitedUser = this.em.create(User, {
      name: data.name,
      email: data.email,
      password: tempPassword,
      nickname,
      role: data.role ?? UserRole.USER,
      status: UserStatus.INACTIVE,
      company: admin.company,
    });

    this.em.persist(invitedUser);

    // Añadir el usuario invitado al proyecto directamente
    await project.members.init();
    project.members.add(invitedUser);

    await this.em.flush();

    LoggerUtils.info(
      `User invited: ${invitedUser.email} → company ${admin.company.name}, project ${project.name}`
    );

    // Token de 24 h
    const token = crypto.randomBytes(32).toString('hex');
    inviteStore.set(token, {
      userId: invitedUser.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    });

    // Email no bloqueante
    emailService
      .sendInvitationEmail(
        { name: invitedUser.name, email: invitedUser.email },
        admin.company.name,
        token
      )
      .catch(err => LoggerUtils.error('Invitation email failed', { err }));

    return true;
  }

  async confirmInvitation(
    token: string
  ): Promise<{ resetToken: string; userName: string }> {
    const entry = inviteStore.get(token);

    if (!entry)
      throw ErrorUtils.badRequest('Invalid or expired invitation token');

    if (entry.expiresAt < new Date()) {
      inviteStore.delete(token);

      const ghost = await this.em.findOne(User, { id: entry.userId });
      if (ghost) {
        await this.em.removeAndFlush(ghost);
        LoggerUtils.info(
          `Expired invitation: ghost account deleted (${ghost.email})`
        );
      }

      throw ErrorUtils.badRequest(
        'This invitation has expired and the account has been removed. Please ask your admin to resend the invitation.'
      );
    }

    // Activar usuario
    const user = await this.em.findOne(User, { id: entry.userId });
    if (!user) throw ErrorUtils.notFound('User');

    if (user.status === UserStatus.ACTIVE) {
      throw ErrorUtils.conflict('This invitation has already been accepted');
    }

    user.status = UserStatus.ACTIVE;

    await this.em.populate(user, ['projects']);

    const projects = user.projects.getItems();
    const fullName = `${user.name} ${user.lastName ?? ''}`.trim();

    // Persist a timeline event for every project the user belongs to — sync, same transaction
    projects.forEach(project =>
      persistTimelineEvent(
        this.em,
        project,
        TimelineEventType.TEAM,
        'Invitación aceptada',
        `${fullName} aceptó la invitación y se unió al equipo`
      )
    );

    await this.em.flush();

    // Notify members of every project in parallel — fire and forget
    await Promise.allSettled(
      projects.map(project =>
        this.notifications
          .notifyProjectMembers(
            project.id,
            `Nuevo miembro en ${project.name}`,
            `${fullName} aceptó la invitación y se unió al equipo`,
            user.id,
            {
              type: 'INVITATION_ACCEPTED',
              projectId: project.id,
              userId: user.id,
            }
          )
          .catch(err =>
            LoggerUtils.error(`Failed to notify project ${project.id}`, { err })
          )
      )
    );

    inviteStore.delete(token);
    LoggerUtils.info(`Invitation accepted: ${user.email}`);

    // Generar token de reset para que el usuario elija su propia contraseña
    const resetToken = this.authService.createPasswordResetToken(user.id);

    return { resetToken, userName: user.name };
  }
}
