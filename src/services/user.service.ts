import { EntityManager } from '@mikro-orm/postgresql';
import { z } from 'zod';
import User, { UserRole, UserStatus } from '../entities/User.entity';
import { ErrorUtils } from '../utils/error.utils';
import { LoggerUtils } from '../utils/logger.utils';
import { BaseService } from './base.service';

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
}
