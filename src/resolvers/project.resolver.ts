import type { GraphQLContext } from '../middlewares/context';
import {
  CreateProjectInput,
  ProjectFiltersInput,
  ProjectService,
  UpdateProjectInput,
} from '../services/project.service';
import { ErrorUtils } from '../utils/error.utils';
import { PhotoService } from '../services/photo.service';

function requireAuth(context: GraphQLContext) {
  if (!context.user) throw ErrorUtils.unauthorized('You must be logged in');
  return context.user;
}

function requireAdminOrRoot(context: GraphQLContext) {
  const user = requireAuth(context);
  if (user.role === 'user') throw ErrorUtils.forbidden('Admin access required');
  return user;
}

const findProject = async (
  _: unknown,
  { id }: { id: string },
  ctx: GraphQLContext
) => {
  requireAuth(ctx);
  const service = new ProjectService(ctx.em);
  return service.findById(id);
};

const getProjects = async (
  _: unknown,
  { filters }: { filters?: Partial<ProjectFiltersInput> },
  ctx: GraphQLContext
) => {
  requireAuth(ctx);
  const service = new ProjectService(ctx.em);
  return service.getProjects(filters ?? {});
};

const getMyProjects = async (_: unknown, __: unknown, ctx: GraphQLContext) => {
  const { id } = requireAuth(ctx);
  const service = new ProjectService(ctx.em);
  return service.getMyProjects(id);
};

const getUploadUrl = async (
  _: unknown,
  {
    projectId,
    fileName,
    mimeType,
  }: { projectId: string; fileName: string; mimeType: string },
  ctx: GraphQLContext
) => {
  const { id } = requireAuth(ctx);
  const service = new PhotoService(ctx.em);
  return service.getUploadUrl({ projectId, fileName, mimeType }, id);
};

const createProject = async (
  _: unknown,
  { input }: { input: CreateProjectInput },
  ctx: GraphQLContext
) => {
  const { id } = requireAuth(ctx);
  const service = new ProjectService(ctx.em);
  return service.createProject(input, id);
};

const updateProject = async (
  _: unknown,
  { id, input }: { id: string; input: UpdateProjectInput },
  ctx: GraphQLContext
) => {
  const { id: userID, role } = requireAuth(ctx);
  const service = new ProjectService(ctx.em);
  return service.updateProject(id, input, userID, role);
};

const deleteProject = async (
  _: unknown,
  { id }: { id: string },
  ctx: GraphQLContext
) => {
  const { role } = requireAdminOrRoot(ctx);
  const service = new ProjectService(ctx.em);
  return service.deleteProject(id, role, ctx.user!.id);
};

const addProjectMember = async (
  _: unknown,
  { projectId, userId }: { projectId: string; userId: string },
  ctx: GraphQLContext
) => {
  const { role } = requireAdminOrRoot(ctx);
  const service = new ProjectService(ctx.em);
  return service.addMember(projectId, userId, role);
};

const removeProjectMember = async (
  _: unknown,
  { projectId, userId }: { projectId: string; userId: string },
  ctx: GraphQLContext
) => {
  const { role } = requireAdminOrRoot(ctx);
  const service = new ProjectService(ctx.em);
  return service.removeMember(projectId, userId, role);
};

const updateProjectProgress = async (
  _: unknown,
  { id, progress }: { id: string; progress: number },
  ctx: GraphQLContext
) => {
  const { id: userID, role } = requireAuth(ctx);
  const service = new ProjectService(ctx.em);
  return service.updateProgress(id, progress, userID, role);
};

const addPhoto = async (
  _: unknown,
  {
    projectId,
    url,
    caption,
    tags,
  }: {
    projectId: string;
    url: string;
    caption?: string;
    tags?: string[];
  },
  ctx: GraphQLContext
) => {
  const { id } = requireAuth(ctx);
  const service = new PhotoService(ctx.em);
  return service.addPhoto({ projectId, url, caption, tags }, id);
};
const updatePhoto = async (
  _: unknown,
  { id, url, caption, tags }: { id: string; url?: string; caption?: string; tags?: string[] },
  ctx: GraphQLContext,
) => {
  const { id: userId, role } = requireAuth(ctx);
  const service = new PhotoService(ctx.em);
  return service.updatePhoto(id, { url, caption, tags }, userId, role);
};


const deletePhoto = async (
  _: unknown,
  { id }: { id: string },
  ctx: GraphQLContext
) => {
  const { id: userId, role } = requireAuth(ctx);
  const service = new PhotoService(ctx.em);
  return service.deletePhoto(id, userId, role);
};


export const projectResolvers = {
  Query: {
    findProject,
    getProjects,
    getMyProjects,
    getUploadUrl
  },

  Mutation: {
    createProject,
    updateProject,
    deleteProject,
    removeProjectMember,
    addProjectMember,
    updateProjectProgress,
    addPhoto,
    deletePhoto,
    updatePhoto
  },
};
