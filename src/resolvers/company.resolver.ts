import type { GraphQLContext } from '../middlewares/context';
import {
  CompanyFiltersInput,
  CompanyService,
  CreateCompanyInput,
  UpdateCompanyInput,
} from '../services/company.service';
import { ErrorUtils } from '../utils/error.utils';

// ─── Guards ───────────────────────────────────────────────────────────────────

function requireAuth(context: GraphQLContext) {
  if (!context.user) throw ErrorUtils.unauthorized('You must be logged in');
  return context.user;
}

function requireAdminOrRoot(context: GraphQLContext) {
  const user = requireAuth(context);
  if (user.role === 'user') throw ErrorUtils.forbidden('Admin access required');
  return user;
}

const findCompany = async (
  _: unknown,
  { id }: { id: string },
  ctx: GraphQLContext
) => {
  requireAuth(ctx);
  const service = new CompanyService(ctx.em);
  return service.findById(id);
};

const getCompanies = async (
  _: unknown,
  { filters }: { filters?: Partial<CompanyFiltersInput> },
  ctx: GraphQLContext
) => {
  requireAuth(ctx);
  const service = new CompanyService(ctx.em);
  return service.getCompanies(filters ?? {});
};

const createCompany = async (
  _: unknown,
  { input }: { input: CreateCompanyInput },
  ctx: GraphQLContext
) => {
  const service = new CompanyService(ctx.em);
  return service.createCompany(input);
};

const confirmCompany = async (
  _: unknown,
  { token }: { token: string },
  ctx: GraphQLContext
) => {
  const service = new CompanyService(ctx.em);
  return service.confirmCompany(token);
};

const updateCompany = async (
  _: unknown,
  { id, input }: { id: string; input: UpdateCompanyInput },
  ctx: GraphQLContext
) => {
  const { role } = requireAdminOrRoot(ctx);
  const service = new CompanyService(ctx.em);
  return service.updateCompany(id, input, role);
};

const deleteCompany = async (
  _: unknown,
  { id }: { id: string },
  ctx: GraphQLContext
) => {
  const { role } = requireAdminOrRoot(ctx);
  const service = new CompanyService(ctx.em);
  return service.deleteCompany(id, role);
};

export const companyResolvers = {
  Query: {
    findCompany,
    getCompanies,
  },
  Mutation: {
    createCompany,
    confirmCompany,
    updateCompany,
    deleteCompany,
  },
};
