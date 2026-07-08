import { EntityManager } from '@mikro-orm/postgresql';
import { z } from 'zod';
import User, { UserRole, UserStatus } from '../entities/User.entity';
import { PhotoEntity } from '../entities/Photo.entity';
import { Note } from '../entities/Note.entity';
import { ErrorUtils } from '../utils/error.utils';
import { LoggerUtils } from '../utils/logger.utils';
import { BaseService } from './base.service';
import { storageService } from './storage.service';
import { CompanyService } from './company.service';

// ─── Validation Schemas ───────────────────────────────────────────────────────

const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  lastName: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  status: z.nativeEnum(UserStatus).optional(),
  role: z.nativeEnum(UserRole).optional(),
});

const UserFiltersSchema = z.object({
  query: z.string().optional(),
  roleFilter: z.nativeEnum(UserRole).optional(),
  stateFilter: z.nativeEnum(UserStatus).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  filterMe: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UserFiltersInput = z.infer<typeof UserFiltersSchema>;

// ─── Service ──────────────────────────────────────────────────────────────────

export class UserService extends BaseService {
  constructor(em: EntityManager) {
    super(em);
  }

  async findById(id: string): Promise<User> {
    const user = await this.em.findOne(
      User,
      { id },
      {
        populate: [
          'company',
          'projects.*'
        ],
      }
    );
    if (!user) throw ErrorUtils.notFound('User');
    return user;
  }

  async getMe(currentUserId: string): Promise<User> {
    return this.findById(currentUserId);
  }

  async getUsers(
    currentUserId: string,
    rawFilters: Partial<UserFiltersInput> = {}
  ) {
    const filters = UserFiltersSchema.parse(rawFilters);
    const { query, roleFilter, stateFilter, page, limit, filterMe } = filters;

    const where: Record<string, unknown> = {};

    if (query) {
      where.$or = [
        { name: { $ilike: `%${query}%` } },
        { lastName: { $ilike: `%${query}%` } },
        { email: { $ilike: `%${query}%` } },
      ];
    }

    if (roleFilter) where.role = roleFilter;
    if (stateFilter) where.status = stateFilter;

    // Exclude current user from results if requested
    if (filterMe) where.id = { $ne: currentUserId };

    const offset = (page - 1) * limit;

    const [items, total] = await this.em.findAndCount(User, where as never, {
      populate: ['company'],
      limit,
      offset,
      orderBy: { createdAt: 'DESC' },
    });

    return {
      items,
      total,
      page,
      limit,
      hasNextPage: offset + items.length < total,
    };
  }

  async updateUser(
    targetId: string,
    input: UpdateUserInput,
    currentUserId: string,
    currentRole: string
  ): Promise<User> {
    const data = UpdateUserSchema.parse(input);

    // Only owner or admin/root can update
    if (targetId !== currentUserId && currentRole === UserRole.USER) {
      throw ErrorUtils.forbidden('Cannot update another user');
    }

    // Only admin/root can change role or status
    if ((data.role || data.status) && currentRole === UserRole.USER) {
      throw ErrorUtils.forbidden(
        'Insufficient permissions to change role or status'
      );
    }

    const user = await this.findById(targetId);
    await user.company.users.init();

    if (data.email && data.email !== user.email) {
      const existing = await this.em.findOne(User, { email: data.email });
      if (existing) throw ErrorUtils.conflict('Email already in use');
    }

    this.em.assign(user, data);
    await this.em.flush();

    LoggerUtils.info(`User updated: ${user.email}`);
    return user;
  }

  async updateUserPicture(
    userId: string,
    picture: string,
    currentUserId: string,
    currentRole: string
  ): Promise<User> {
    if (userId !== currentUserId && currentRole === UserRole.USER) {
      throw ErrorUtils.forbidden("Cannot update another user's picture");
    }

    const user = await this.findById(userId);

    // picture field: add @Property({ nullable: true }) picture?: string to your entity
    user.avatarUrl = picture;
    await this.em.flush();

    return user;
  }

  async deleteUser(targetId: string, currentRole: string): Promise<boolean> {
    if (currentRole === UserRole.USER) {
      throw ErrorUtils.forbidden('Only admins can delete users');
    }

    const user = await this.findById(targetId);
    this.em.remove(user);
    await this.em.flush();

    LoggerUtils.info(`User deleted: ${user.email}`);
    return true;
  }

  async deactivateUser(targetId: string, currentRole: string): Promise<User> {
    if (currentRole === UserRole.USER) {
      throw ErrorUtils.forbidden('Only admins can deactivate users');
    }

    const user = await this.findById(targetId);

    if (user.status === UserStatus.INACTIVE) {
      throw ErrorUtils.conflict('User is already inactive');
    }

    user.status = UserStatus.INACTIVE;
    await this.em.flush();

    LoggerUtils.info(`User deactivated: ${user.email}`);
    return user;
  }

  async permanentlyDeleteUser(
    targetId: string,
    currentRole: string
  ): Promise<boolean> {
    if (currentRole === UserRole.USER) {
      throw ErrorUtils.forbidden('Only admins can permanently delete users');
    }

    const user = await this.em.findOne(
      User,
      { id: targetId },
      { populate: ['companies'] }
    );
    if (!user) throw ErrorUtils.notFound('User');

    // If the user owns one or more companies, deleting the company cascade-deletes
    // all its members (including this user), projects, photos, and notes.
    const ownedCompanies = user.companies.getItems();
    if (ownedCompanies.length > 0) {
      const companyService = new CompanyService(this.em);
      for (const company of ownedCompanies) {
        await companyService.deleteCompany(company.id, currentRole);
      }
      // The user row was already removed as part of the company's user purge.
      LoggerUtils.info(
        `User ${user.email} permanently deleted via company cascade (${ownedCompanies.length} company/companies removed)`
      );
      return true;
    }

    // Regular user (no owned company): clean up their photos and notes first
    // so FK constraints on uploaded_by / author don't block the user DELETE.
    const photos = await this.em.find(PhotoEntity, { uploadedBy: user });
    for (const photo of photos) {
      await storageService.deleteFile(storageService.keyFromUrl(photo.url));
      this.em.remove(photo);
    }

    const notes = await this.em.find(Note, { author: user });
    for (const note of notes) {
      this.em.remove(note);
    }

    // DB cascades handle refresh tokens and push tokens.
    this.em.remove(user);
    await this.em.flush();

    LoggerUtils.info(
      `User permanently deleted: ${user.email} — removed ${photos.length} photo(s) and ${notes.length} note(s)`
    );
    return true;
  }
}
