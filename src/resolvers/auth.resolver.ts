import type { GraphQLContext } from '../middlewares/context';
import { AuthService } from '../services/auth.service';
import { ErrorUtils } from '../utils/error.utils';

// ─── Guard ────────────────────────────────────────────────────────────────────

function requireAuth(context: GraphQLContext) {
  if (!context.user) throw ErrorUtils.unauthorized('You must be logged in');
  return context.user;
}

// ─── Resolver ────────────────────────────────────────────────────────────────

const register = async (
  _: unknown,
  { input }: { input: Parameters<AuthService['register']>[0] },
  ctx: GraphQLContext,
) => {
  const service = new AuthService(ctx.em);
  return service.register(input);
}

  const confirmAccount = async (
  _: unknown,
  { token }: { token: string },
  ctx: GraphQLContext,
) => {
  const service = new AuthService(ctx.em);
  return service.confirmAccount(token);
}

 const login = async (
  _: unknown,
  { input }: { input: Parameters<AuthService['login']>[0] },
  ctx: GraphQLContext,
) => {
  const service = new AuthService(ctx.em);
  return service.login(input);
}

  const forgotPassword = async (
  _: unknown,
  { input }: { input: Parameters<AuthService['forgotPassword']>[0] },
  ctx: GraphQLContext,
) => {
  const service = new AuthService(ctx.em);
  return service.forgotPassword(input);
}

  const resetPassword = async (
  _: unknown,
  { input }: { input: Parameters<AuthService['resetPassword']>[0] },
  ctx: GraphQLContext,
) => {
  const service = new AuthService(ctx.em);
  return service.resetPassword(input);
}

  const changePassword = async (
  _: unknown,
  { input }: { input: Parameters<AuthService['changePassword']>[1] },
  ctx: GraphQLContext,
) => {
  const { sub } = requireAuth(ctx);
  const service = new AuthService(ctx.em);
  return service.changePassword(sub, input);
}

export const authResolvers = {
  Mutation: {
    register,
    confirmAccount,
    login,
    forgotPassword,
    resetPassword,
    changePassword
  },
};
