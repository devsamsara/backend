import { EntityManager } from '@mikro-orm/postgresql';
import { z } from 'zod';
import { TimelineEvent, TimelineEventType } from '../entities/TimelineEvent.entity';
import { Project } from '../entities/Project.entity';
import { UserRole } from '../entities/User.entity';
import { ErrorUtils } from '../utils/error.utils';
import { LoggerUtils } from '../utils/logger.utils';
import { NotificationService } from './notification.service';

// ─── Validation Schemas ───────────────────────────────────────────────────────

const CreateTimelineEventSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(1),
  type: z.nativeEnum(TimelineEventType),
  photoUrl: z.string().url().optional(),
  projectId: z.string().uuid(),
}).refine(
  data => data.type !== TimelineEventType.PHOTO || !!data.photoUrl,
  { message: 'photoUrl is required for events of type "photo"', path: ['photoUrl'] },
);

const UpdateTimelineEventSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().min(1).optional(),
  type: z.nativeEnum(TimelineEventType).optional(),
  photoUrl: z.string().url().optional(),
});

const TimelineFiltersSchema = z.object({
  type: z.nativeEnum(TimelineEventType).optional(),
});

export type CreateTimelineEventInput = z.infer<typeof CreateTimelineEventSchema>;
export type UpdateTimelineEventInput = z.infer<typeof UpdateTimelineEventSchema>;
export type TimelineFiltersInput = z.infer<typeof TimelineFiltersSchema>;

// ─── Service ──────────────────────────────────────────────────────────────────

export class TimelineService {
  constructor(private readonly em: EntityManager) {}

  // ── Find by ID ──────────────────────────────────────────────────────────────
  async findById(id: string): Promise<TimelineEvent> {
    const event = await this.em.findOne(
      TimelineEvent,
      { id },
      { populate: ['project'] },
    );
    if (!event) throw ErrorUtils.notFound('Timeline event');
    return event;
  }

  // ── All events for a project, optionally filtered by type ──────────────────
  async getProjectTimeline(
    projectId: string,
    rawFilters: Partial<TimelineFiltersInput> = {},
  ): Promise<TimelineEvent[]> {
    const { type } = TimelineFiltersSchema.parse(rawFilters);

    const project = await this.em.findOne(Project, { id: projectId });
    if (!project) throw ErrorUtils.notFound('Project');

    const where: Record<string, unknown> = { project: { id: projectId } };
    if (type) where.type = type;

    return this.em.find(
      TimelineEvent,
      where as never,
      { orderBy: { createdAt: 'DESC' } },
    );
  }

  // ── Create ──────────────────────────────────────────────────────────────────
  async createEvent(
    input: CreateTimelineEventInput,
    currentUserId: string,
    currentRole: string,
  ): Promise<TimelineEvent> {
    const data = CreateTimelineEventSchema.parse(input);

    const project = await this.em.findOne(
      Project,
      { id: data.projectId },
      { populate: ['members'] },
    );
    if (!project) throw ErrorUtils.notFound('Project');

    // Only project members or admins can add timeline events
    const isMember = project.members.getItems().some(u => u.id === currentUserId);
    if (!isMember && currentRole === UserRole.USER) {
      throw ErrorUtils.forbidden('Only project members can add timeline events');
    }

    const event = this.em.create(TimelineEvent, {
      title: data.title,
      description: data.description,
      type: data.type,
      photoUrl: data.photoUrl,
      project,
    });

    this.em.persist(event);
    await this.em.flush();

    LoggerUtils.info(
      `Timeline event "${event.title}" created in project ${project.name}`
    );

    // Notify all project members except the actor — fire and forget
    const notificationService = new NotificationService(this.em);
    notificationService.notifyProjectMembers(
      project.id,
      `Nuevo evento en ${project.name}`,
      event.title,
      currentUserId,
      { type: 'TIMELINE_EVENT', projectId: project.id, eventId: event.id }
    );

    return event;
  }

  // ── Update ──────────────────────────────────────────────────────────────────
  async updateEvent(
    id: string,
    input: UpdateTimelineEventInput,
    currentRole: string,
  ): Promise<TimelineEvent> {
    const data = UpdateTimelineEventSchema.parse(input);

    // Only admins/root can edit timeline events
    if (currentRole === UserRole.USER) {
      throw ErrorUtils.forbidden('Only admins can edit timeline events');
    }

    const event = await this.findById(id);

    // If changing type to photo, photoUrl is required
    const newType = data.type ?? event.type;
    if (newType === TimelineEventType.PHOTO && !data.photoUrl && !event.photoUrl) {
      throw ErrorUtils.badRequest('photoUrl is required for events of type "photo"');
    }

    this.em.assign(event, data);
    await this.em.flush();

    LoggerUtils.info(`Timeline event ${id} updated`);
    return event;
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async deleteEvent(id: string, currentRole: string): Promise<boolean> {
    if (currentRole === UserRole.USER) {
      throw ErrorUtils.forbidden('Only admins can delete timeline events');
    }

    const event = await this.findById(id);
    await this.em.removeAndFlush(event);

    LoggerUtils.info(`Timeline event ${id} deleted`);
    return true;
  }
}
