import type { GraphQLContext } from '../middlewares/context';
import {
  UpdateUserInput,
  UserFiltersInput,
  UserService,
} from '../services/user.service';
import { ErrorUtils } from '../utils/error.utils';
import { UserRole } from '../entities/User.entity';

// ─── Guards ───────────────────────────────────────────────────────────────────

function requireAuth(context: GraphQLContext) {
  if (!context.user) throw ErrorUtils.unauthorized('You must be logged in');
  return context.user;
}

function requireAdminOrRoot(context: GraphQLContext) {
  const user = requireAuth(context);
  if (user.role === UserRole.USER)
    throw ErrorUtils.forbidden('Admin access required');
  return user;
}

const me = async (_: unknown, __: unknown, ctx: GraphQLContext) => {
  const { id } = requireAuth(ctx);
  const service = new UserService(ctx.em);
  return service.getMe(id);
};

const findUser = async (
  _: unknown,
  { id }: { id: string },
  ctx: GraphQLContext
) => {
  requireAuth(ctx);
  const service = new UserService(ctx.em);
  return service.findById(id);
};

const getUsers = async (
  _: unknown,
  { filters }: { filters?: Partial<UserFiltersInput> },
  ctx: GraphQLContext
) => {
  const { id } = requireAuth(ctx);
  const service = new UserService(ctx.em);
  return service.getUsers(id, filters ?? {});
};

const updateUser = async (
  _: unknown,
  { id, input }: { id: string; input: UpdateUserInput },
  ctx: GraphQLContext
) => {
  const { id: sub, role } = requireAuth(ctx);
  const service = new UserService(ctx.em);
  return service.updateUser(id, input, sub, role);
};

const updateUserPicture = async (
  _: unknown,
  { userId, picture }: { userId: string; picture: string },
  ctx: GraphQLContext
) => {
  const { id, role } = requireAuth(ctx);
  const service = new UserService(ctx.em);
  return service.updateUserPicture(userId, picture, id, role);
};

const deleteUser = async (
  _: unknown,
  { id }: { id: string },
  ctx: GraphQLContext
) => {
  const { role } = requireAdminOrRoot(ctx);
  const service = new UserService(ctx.em);
  return service.deleteUser(id, role);
};

export const userResolvers = {
  Query: {
    me,
    findUser,
    getUsers,
  },

  Mutation: {
    updateUser,
    deleteUser,
    updateUserPicture,
  },
};
