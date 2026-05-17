import type { GraphQLContext } from '../middlewares/context';
import {
  ProjectService,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectFiltersInput,
} from '../services/project.service';
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

// ─── Resolver ────────────────────────────────────────────────────────────────

export const projectResolvers = {
  Query: {
    /**
     * Protected — find a single project by ID with all relations populated.
     */
    findProject: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      const service = new ProjectService(ctx.em);
      return service.findById(id);
    },

    /**
     * Protected — paginated list with optional filters (name, location, status).
     */
    getProjects: async (
      _: unknown,
      { filters }: { filters?: Partial<ProjectFiltersInput> },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      const service = new ProjectService(ctx.em);
      return service.getProjects(filters ?? {});
    },

    /**
     * Protected — returns all projects where the current user is a member.
     */
    getMyProjects: async (
      _: unknown,
      __: unknown,
      ctx: GraphQLContext,
    ) => {
      const { sub } = requireAuth(ctx);
      const service = new ProjectService(ctx.em);
      return service.getMyProjects(sub);
    },
  },

  Mutation: {
    /**
     * Protected — creates a project and automatically adds the creator as member.
     */
    createProject: async (
      _: unknown,
      { input }: { input: CreateProjectInput },
      ctx: GraphQLContext,
    ) => {
      const { sub } = requireAuth(ctx);
      const service = new ProjectService(ctx.em);
      return service.createProject(input, sub);
    },

    /**
     * Protected — members and admins can update. Only admins can change status.
     */
    updateProject: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateProjectInput },
      ctx: GraphQLContext,
    ) => {
      const { sub, role } = requireAuth(ctx);
      const service = new ProjectService(ctx.em);
      return service.updateProject(id, input, sub, role);
    },

    /**
     * Admin/Root only — permanently deletes a project and its relations.
     */
    deleteProject: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      const { role } = requireAdminOrRoot(ctx);
      const service = new ProjectService(ctx.em);
      return service.deleteProject(id, role);
    },

    /**
     * Admin/Root only — adds a user to the project's member list.
     */
    addProjectMember: async (
      _: unknown,
      { projectId, userId }: { projectId: string; userId: string },
      ctx: GraphQLContext,
    ) => {
      const { role } = requireAdminOrRoot(ctx);
      const service = new ProjectService(ctx.em);
      return service.addMember(projectId, userId, role);
    },

    /**
     * Admin/Root only — removes a user from the project's member list.
     */
    removeProjectMember: async (
      _: unknown,
      { projectId, userId }: { projectId: string; userId: string },
      ctx: GraphQLContext,
    ) => {
      const { role } = requireAdminOrRoot(ctx);
      const service = new ProjectService(ctx.em);
      return service.removeMember(projectId, userId, role);
    },

    /**
     * Protected — members and admins can update progress (0–100).
     * Auto-sets status to "completed" at 100 and "in_progress" above 0.
     */
    updateProjectProgress: async (
      _: unknown,
      { id, progress }: { id: string; progress: number },
      ctx: GraphQLContext,
    ) => {
      const { sub, role } = requireAuth(ctx);
      const service = new ProjectService(ctx.em);
      return service.updateProgress(id, progress, sub, role);
    },
  },
};
