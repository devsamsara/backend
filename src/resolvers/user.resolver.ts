import type { GraphQLContext } from '../middlewares/context';
import { UserService, UpdateUserInput, UserFiltersInput } from '../services/user.service';
import { ErrorUtils } from '../utils/error.utils';
import { UserRole } from '../entities/User.entity';

// ─── Guards ───────────────────────────────────────────────────────────────────

function requireAuth(context: GraphQLContext) {
  if (!context.user) throw ErrorUtils.unauthorized('You must be logged in');
  return context.user;
}

function requireAdminOrRoot(context: GraphQLContext) {
  const user = requireAuth(context);
  if (user.role === UserRole.USER) throw ErrorUtils.forbidden('Admin access required');
  return user;
}

// ─── Resolver ────────────────────────────────────────────────────────────────

export const userResolvers = {
  Query: {
    /**
     * Protected — returns the currently authenticated user's full profile.
     */
    me: async (
      _: unknown,
      __: unknown,
      ctx: GraphQLContext,
    ) => {
      const { sub } = requireAuth(ctx);
      const service = new UserService(ctx.em);
      return service.getMe(sub);
    },

    /**
     * Protected — find any user by ID. Admin/root see any user; regular users
     * can only look up others within their company (extend logic in service).
     */
    findUser: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      const service = new UserService(ctx.em);
      return service.findById(id);
    },

    /**
     * Protected — paginated + filtered user list.
     * Regular users see only active users; admins see all (handled in service).
     */
    getUsers: async (
      _: unknown,
      { filters }: { filters?: Partial<UserFiltersInput> },
      ctx: GraphQLContext,
    ) => {
      const { sub } = requireAuth(ctx);
      const service = new UserService(ctx.em);
      return service.getUsers(sub, filters ?? {});
    },
  },

  Mutation: {
    /**
     * Protected — update user profile.
     * Owners can edit their own data; admins/root can edit anyone and change role/status.
     */
    updateUser: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateUserInput },
      ctx: GraphQLContext,
    ) => {
      const { sub, role } = requireAuth(ctx);
      const service = new UserService(ctx.em);
      return service.updateUser(id, input, sub, role);
    },

    /**
     * Protected — upload/change profile picture.
     * Owners can update their own picture; admins can update anyone's.
     */
    updateUserPicture: async (
      _: unknown,
      { userId, picture }: { userId: string; picture: string },
      ctx: GraphQLContext,
    ) => {
      const { sub, role } = requireAuth(ctx);
      const service = new UserService(ctx.em);
      return service.updateUserPicture(userId, picture, sub, role);
    },

    /**
     * Admin/Root only — permanently delete a user account.
     */
    deleteUser: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      const { role } = requireAdminOrRoot(ctx);
      const service = new UserService(ctx.em);
      return service.deleteUser(id, role);
    },
  },
};
