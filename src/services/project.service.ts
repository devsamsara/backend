import { EntityManager } from '@mikro-orm/postgresql';
import { z } from 'zod';
import { Project, ProjectStatus } from '../entities/Project.entity';
import User, { UserRole } from '../entities/User.entity';
import { ErrorUtils } from '../utils/error.utils';
import { LoggerUtils } from '../utils/logger.utils';
import { persistTimelineEvent } from '../utils/timeline.util';
import { TimelineEventType } from '../entities/TimelineEvent.entity';
import { definedOnly } from '../utils/object.util';
import { storageService } from './storage.service';
import { NotificationService } from './notification.service';

// ─── Validation Schemas ───────────────────────────────────────────────────────

const CreateProjectSchema = z.object({
  name: z.string().min(2).max(200),
  location: z.string().min(2),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  thumbnail: z.string().url().optional(),
  description: z.string().optional(),
  tags: z.array(z.string().min(1).max(30)).max(20).optional(),
  startDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().date())
    .optional(),
  endDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().date())
    .optional(),
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
  tags: z.array(z.string().min(1).max(30)).max(20).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const ProjectFiltersSchema = z.object({
  query: z.string().optional(),
  status: z.string().optional(),
  tags: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type ProjectFiltersInput = z.infer<typeof ProjectFiltersSchema>;

// ─── Service ──────────────────────────────────────────────────────────────────

export class ProjectService {
  private readonly notifications: NotificationService;

  constructor(private readonly em: EntityManager) {
    this.notifications = new NotificationService(this.em);
  }

  // ── Find by ID ──────────────────────────────────────────────────────────────
  async findById(id: string): Promise<Project> {
    const project = await this.em.findOne(
      Project,
      { id },
      { populate: ['members', 'photos', 'notes', 'timeline'] }
    );
    if (!project) throw ErrorUtils.notFound('Project');
    return project;
  }

  // ── Get projects with filters ───────────────────────────────────────────────
  async getProjects(rawFilters: Partial<ProjectFiltersInput>): Promise<Project[]> {
    const filters = ProjectFiltersSchema.parse(rawFilters);
    const where: Record<string, any> = {};

    if (filters.query) {
      where.$or = [
        { name: { $like: `%${filters.query}%` } },
        { location: { $like: `%${filters.query}%` } },
      ];
    }
    if (filters.status) where.status = filters.status;
    if (filters.tags?.length) where.tags = { $contains: filters.tags };
    if (filters.startDate) where.startDate = { $gte: new Date(filters.startDate) };
    if (filters.endDate) where.endDate = { $lte: new Date(filters.endDate) };

    return this.em.find(Project, where, {
      populate: ['members', 'photos', 'notes', 'timeline'],
      orderBy: { createdAt: 'DESC' },
    });
  }

  // ── Get projects for a user ─────────────────────────────────────────────────
  async getMyProjects(userId: string): Promise<Project[]> {
    return this.em.find(
      Project,
      { members: { id: userId } },
      {
        populate: ['members', 'photos', 'notes', 'timeline'],
        orderBy: { createdAt: 'DESC' },
      }
    );
  }

  // ── Create ──────────────────────────────────────────────────────────────────
  async createProject(
    input: CreateProjectInput,
    currentUserId: string
  ): Promise<Project> {
    const { memberIds, ...rest } = CreateProjectSchema.parse(input);

    const creator = await this.em.findOne(User, { id: currentUserId });
    if (!creator) throw ErrorUtils.notFound('User');

    const project = this.em.create(Project, {
      ...rest,
      startDate: rest.startDate ? new Date(rest.startDate) : new Date(),
      endDate: rest.endDate ? new Date(rest.endDate) : undefined,
    });

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

    persistTimelineEvent(
      this.em,
      project,
      TimelineEventType.MILESTONE,
      'Proyecto creado',
      `El proyecto "${rest.name}" fue creado`
    );

    await this.em.flush();
    LoggerUtils.info(`Project created: ${project.name}`);

    // Notify all members except the creator — fire and forget
    await this.notifications.notifyProjectMembers(
      project.id,
      `Nuevo proyecto: ${project.name}`,
      `Has sido añadido al proyecto "${project.name}"`,
      currentUserId,
      { type: 'PROJECT_CREATED', projectId: project.id }
    );

    return project;
  }

  // ── Update ──────────────────────────────────────────────────────────────────
  async updateProject(
    id: string,
    input: UpdateProjectInput,
    currentUserId: string,
    currentRole: string
  ): Promise<Project> {
    const data = UpdateProjectSchema.parse(input);
    const project = await this.findById(id);

    await project.members.init();
    const isMember = project.members
      .getItems()
      .some(u => u.id === currentUserId);

    if (!isMember && currentRole === UserRole.USER) {
      throw ErrorUtils.forbidden(
        'Only project members or admins can update this project'
      );
    }

    if (
      data.progress !== undefined &&
      (data.progress < 0 || data.progress > 100)
    ) {
      throw ErrorUtils.badRequest('Progress must be between 0 and 100');
    }

    this.em.assign(
      project,
      definedOnly({
        ...data,
        status: data.status as ProjectStatus,
        startDate: data.startDate
          ? new Date(Number.parseInt(data.startDate))
          : undefined,
        endDate: data.endDate
          ? new Date(Number.parseInt(data.endDate))
          : undefined,
      })
    );

    const changes = Object.keys(data)
      .filter(k => k !== 'startDate' && k !== 'endDate')
      .map(k => k)
      .join(', ');

    persistTimelineEvent(
      this.em,
      project,
      TimelineEventType.MILESTONE,
      'Proyecto actualizado',
      'Hay novedades en tu proyecto'
    );

    await this.em.flush();
    LoggerUtils.info(`Project updated: ${project.name}`);

    // Notify all members except the actor — fire and forget
    await this.notifications.notifyProjectMembers(
      project.id,
      `Actualización en ${project.name}`,
      changes ? `Se actualizaron: ${changes}` : 'El proyecto fue actualizado',
      currentUserId,
      { type: 'PROJECT_UPDATED', projectId: project.id }
    );

    return project;
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async deleteProject(id: string, currentRole: string, currentUserId: string): Promise<boolean> {
    if (currentRole === UserRole.USER) {
      throw ErrorUtils.forbidden('Only admins can delete projects');
    }
    const project = await this.em.findOneOrFail(
      Project,
      { id },
      { populate: ['photos', 'members'] }
    );

    // Guard: solo el admin/root o miembro con permisos puede borrar
    const isMember = project.members
      .getItems()
      .some(m => m.id === currentUserId);
    if (!isMember) throw ErrorUtils.forbidden('Not a project member');

    // 1. Borrar archivos de S3 antes de tocar la BD
    const deletePromises = project.photos
      .getItems()
      .filter(p => !!p.url)
      .map(p =>
        storageService.deleteFile(p.url).catch(err => {
          LoggerUtils.warn(
            `Failed to delete S3 object for photo ${p.id}: ${err.message}`
          );
        })
      );

    await Promise.all(deletePromises);

    // 2. Borrar el proyecto — la BD se encarga del resto via ON DELETE CASCADE
    this.em.remove(project);
    await this.em.flush();

    return true;
  }

  // ── Add member ──────────────────────────────────────────────────────────────
  async addMember(
    projectId: string,
    userId: string,
    currentRole: string
  ): Promise<Project> {
    if (currentRole === UserRole.USER) {
      throw ErrorUtils.forbidden('Only admins can add members');
    }

    const project = await this.findById(projectId);
    await project.members.init();

    const alreadyMember = project.members.getItems().some(u => u.id === userId);
    if (alreadyMember)
      throw ErrorUtils.conflict('User is already a member of this project');

    const user = await this.em.findOne(User, { id: userId });
    if (!user) throw ErrorUtils.notFound('User');

    project.members.add(user);

    persistTimelineEvent(
      this.em,
      project,
      TimelineEventType.TEAM,
      'Nuevo miembro añadido',
      `${user.name} ${user.lastName ?? ''} se unió al proyecto`
    );

    await this.em.flush();
    LoggerUtils.info(`Member ${user.email} added to project ${project.name}`);

    // Notify all existing members (including the new one) — fire and forget
    // actorId is undefined here since addMember doesn't receive currentUserId
    await this.notifications.notifyProjectMembers(
      project.id,
      `Nuevo miembro en ${project.name}`,
      `${user.name} ${user.lastName ?? ''} se unió al proyecto`,
      undefined,
      { type: 'MEMBER_ADDED', projectId: project.id, userId }
    );

    return project;
  }

  // ── Remove member ───────────────────────────────────────────────────────────
  async removeMember(
    projectId: string,
    userId: string,
    currentRole: string
  ): Promise<Project> {
    if (currentRole === UserRole.USER) {
      throw ErrorUtils.forbidden('Only admins can remove members');
    }

    const project = await this.findById(projectId);
    await project.members.init();

    const user = project.members.getItems().find(u => u.id === userId);
    if (!user)
      throw ErrorUtils.notFound('User is not a member of this project');

    project.members.remove(user);

    persistTimelineEvent(
      this.em,
      project,
      TimelineEventType.TEAM,
      'Miembro eliminado',
      `${user.name} ${user.lastName ?? ''} fue eliminado del proyecto`
    );

    await this.em.flush();
    LoggerUtils.info(
      `Member ${user.email} removed from project ${project.name}`
    );

    // Notify remaining members — fire and forget
    await this.notifications.notifyProjectMembers(
      project.id,
      `Cambio de equipo en ${project.name}`,
      `${user.name} ${user.lastName ?? ''} fue eliminado del proyecto`,
      undefined,
      { type: 'MEMBER_REMOVED', projectId: project.id, userId }
    );

    return project;
  }

  // ── Update progress ─────────────────────────────────────────────────────────
  async updateProgress(
    id: string,
    progress: number,
    currentUserId: string,
    currentRole: string
  ): Promise<Project> {
    if (progress < 0 || progress > 100) {
      throw ErrorUtils.badRequest('Progress must be between 0 and 100');
    }

    const project = await this.findById(id);
    await project.members.init();

    const isMember = project.members
      .getItems()
      .some(u => u.id === currentUserId);
    if (!isMember && currentRole === UserRole.USER) {
      throw ErrorUtils.forbidden(
        'Only project members or admins can update progress'
      );
    }

    project.progress = progress;

    // Auto-set status based on progress
    if (progress === 100) project.status = ProjectStatus.COMPLETED;
    else if (progress > 0 && project.status === ProjectStatus.ACTIVE)
      project.status = ProjectStatus.ONGOING;

    const progressDescription =
      progress === 100
        ? 'El proyecto se marcó como completado'
        : `El progreso se actualizó al ${progress}%`;

    persistTimelineEvent(
      this.em,
      project,
      TimelineEventType.MILESTONE,
      `Progreso: ${progress}%`,
      progressDescription
    );

    await this.em.flush();

    // Notify all members except the actor — fire and forget
    await this.notifications.notifyProjectMembers(
      project.id,
      `Progreso actualizado en ${project.name}`,
      progressDescription,
      currentUserId,
      { type: 'PROGRESS_UPDATED', projectId: project.id, progress }
    );

    return project;
  }
}
