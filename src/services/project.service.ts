import { EntityManager } from '@mikro-orm/postgresql';
import { z } from 'zod';
import { Project } from '../entities/Project.entity';
import User, { UserRole } from '../entities/User.entity';
import { ErrorUtils } from '../utils/error.utils';
import { LoggerUtils, loggerUtils } from '../utils/logger.utils';

// ─── Validation Schemas ───────────────────────────────────────────────────────

const CreateProjectSchema = z.object({
  name: z.string().min(2).max(200),
  location: z.string().min(2),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  thumbnail: z.string().url().optional(),
  description: z.string().min(10),
  startDate: z.string().datetime({ offset: true }).or(z.string().date()),
  endDate: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
  memberIds: z.array(z.string().uuid()).optional(),
});

const UpdateProjectSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  location: z.string().min(2).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  thumbnail: z.string().url().optional(),
  description: z.string().min(10).optional(),
  status: z.string().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const ProjectFiltersSchema = z.object({
  query: z.string().optional(),
  status: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type ProjectFiltersInput = z.infer<typeof ProjectFiltersSchema>;

// ─── Service ──────────────────────────────────────────────────────────────────

export class ProjectService {
  constructor(private readonly em: EntityManager) {}

  // ── Find by ID ──────────────────────────────────────────────────────────────
  async findById(id: string): Promise<Project> {
    const project = await this.em.findOne(
      Project,
      { id },
      { populate: ['members', 'photos', 'notes', 'timeline'] },
    );
    if (!project) throw ErrorUtils.notFound('Project');
    return project;
  }

  // ── Paginated list with filters ─────────────────────────────────────────────
  async getProjects(rawFilters: Partial<ProjectFiltersInput> = {}) {
    const { query, status, page, limit } = ProjectFiltersSchema.parse(rawFilters);
    const where: Record<string, unknown> = {};

    if (query) {
      where.$or = [
        { name: { $ilike: `%${query}%` } },
        { location: { $ilike: `%${query}%` } },
        { description: { $ilike: `%${query}%` } },
      ];
    }

    if (status) where.status = status;

    const offset = (page - 1) * limit;

    const [items, total] = await this.em.findAndCount(
      Project,
      where as never,
      {
        populate: ['members'],
        limit,
        offset,
        orderBy: { createdAt: 'DESC' },
      },
    );

    return { items, total, page, limit, hasNextPage: offset + items.length < total };
  }

  // ── Projects where current user is a member ─────────────────────────────────
  async getMyProjects(currentUserId: string): Promise<Project[]> {
    return this.em.find(
      Project,
      { members: { id: currentUserId } },
      { populate: ['members'], orderBy: { createdAt: 'DESC' } },
    );
  }

  // ── Create ──────────────────────────────────────────────────────────────────
  async createProject(
    input: CreateProjectInput,
    currentUserId: string,
  ): Promise<Project> {
    const data = CreateProjectSchema.parse(input);
    const { memberIds, startDate, endDate, ...rest } = data;

    const project = this.em.create(Project, {
      ...rest,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
    });

    // Add creator as member automatically
    const creator = this.em.getReference(User, currentUserId);
    project.members.add(creator);

    // Add extra members if provided
    if (memberIds?.length) {
      const users = await this.em.find(User, { id: { $in: memberIds } });
      if (users.length !== memberIds.length) {
        throw ErrorUtils.badRequest('One or more member IDs are invalid');
      }
      users.forEach(u => project.members.add(u));
    }

    this.em.persist(project);
    await this.em.flush();
    LoggerUtils.info(`Project created: ${project.name}`);
    return project;
  }

  // ── Update ──────────────────────────────────────────────────────────────────
  async updateProject(
    id: string,
    input: UpdateProjectInput,
    currentUserId: string,
    currentRole: string,
  ): Promise<Project> {
    const data = UpdateProjectSchema.parse(input);
    const project = await this.findById(id);

    await project.members.init();
    const isMember = project.members.getItems().some(u => u.id === currentUserId);

    if (!isMember && currentRole === UserRole.USER) {
      throw ErrorUtils.forbidden('Only project members or admins can update this project');
    }

    if (data.progress !== undefined && (data.progress < 0 || data.progress > 100)) {
      throw ErrorUtils.badRequest('Progress must be between 0 and 100');
    }

    this.em.assign(project, {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    });

    await this.em.flush();
    LoggerUtils.info(`Project updated: ${project.name}`);
    return project;
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async deleteProject(id: string, currentRole: string): Promise<boolean> {
    if (currentRole === UserRole.USER) {
      throw ErrorUtils.forbidden('Only admins can delete projects');
    }

    const project = await this.findById(id);
    await this.em.removeAndFlush(project);
    LoggerUtils.info(`Project deleted: ${project.name}`);
    return true;
  }

  // ── Add member ──────────────────────────────────────────────────────────────
  async addMember(
    projectId: string,
    userId: string,
    currentRole: string,
  ): Promise<Project> {
    if (currentRole === UserRole.USER) {
      throw ErrorUtils.forbidden('Only admins can add members');
    }

    const project = await this.findById(projectId);
    await project.members.init();

    const alreadyMember = project.members.getItems().some(u => u.id === userId);
    if (alreadyMember) throw ErrorUtils.conflict('User is already a member of this project');

    const user = await this.em.findOne(User, { id: userId });
    if (!user) throw ErrorUtils.notFound('User');

    project.members.add(user);
    await this.em.flush();

    LoggerUtils.info(`Member ${user.email} added to project ${project.name}`);
    return project;
  }

  // ── Remove member ───────────────────────────────────────────────────────────
  async removeMember(
    projectId: string,
    userId: string,
    currentRole: string,
  ): Promise<Project> {
    if (currentRole === UserRole.USER) {
      throw ErrorUtils.forbidden('Only admins can remove members');
    }

    const project = await this.findById(projectId);
    await project.members.init();

    const user = project.members.getItems().find(u => u.id === userId);
    if (!user) throw ErrorUtils.notFound('User is not a member of this project');

    project.members.remove(user);
    await this.em.flush();

    LoggerUtils.info(
      `Member ${user.email} removed from project ${project.name}`
    );
    return project;
  }

  // ── Update progress ─────────────────────────────────────────────────────────
  async updateProgress(
    id: string,
    progress: number,
    currentUserId: string,
    currentRole: string,
  ): Promise<Project> {
    if (progress < 0 || progress > 100) {
      throw ErrorUtils.badRequest('Progress must be between 0 and 100');
    }

    const project = await this.findById(id);
    await project.members.init();

    const isMember = project.members.getItems().some(u => u.id === currentUserId);
    if (!isMember && currentRole === UserRole.USER) {
      throw ErrorUtils.forbidden('Only project members or admins can update progress');
    }

    project.progress = progress;

    // Auto-set status based on progress
    if (progress === 100) project.status = 'completed';
    else if (progress > 0 && project.status === 'active') project.status = 'in_progress';

    await this.em.flush();
    return project;
  }
}
