import { EntityManager } from '@mikro-orm/postgresql';
import { z } from 'zod';
import { Note } from '../entities/Note.entity';
import { Project } from '../entities/Project.entity';
import User, { UserRole } from '../entities/User.entity';
import { ErrorUtils } from '../utils/error.utils';
import { LoggerUtils } from '../utils/logger.utils';
import { persistTimelineEvent } from '../utils/timeline.util';
import { TimelineEventType } from '../entities/TimelineEvent.entity';
import { NotificationService } from './notification.service';

// ─── Validation Schemas ───────────────────────────────────────────────────────

const CreateNoteSchema = z.object({
  content: z.string().min(1).max(5000),
  projectId: z.string().uuid(),
  pinned: z.boolean().optional().default(false),
});

const UpdateNoteSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  pinned: z.boolean().optional(),
});

export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;
export type UpdateNoteInput = z.infer<typeof UpdateNoteSchema>;

// ─── Service ──────────────────────────────────────────────────────────────────

export class NoteService {
  private readonly notifications: NotificationService;

  constructor(private readonly em: EntityManager) {
    this.notifications = new NotificationService(em);
  }

  // ── Find by ID ──────────────────────────────────────────────────────────────
  async findById(id: string): Promise<Note> {
    const note = await this.em.findOne(
      Note,
      { id },
      { populate: ['author', 'project'] },
    );
    if (!note) throw ErrorUtils.notFound('Note');
    return note;
  }

  // ── All notes for a project ─────────────────────────────────────────────────
  async getNotesByProject(projectId: string): Promise<Note[]> {
    const project = await this.em.findOne(Project, { id: projectId });
    if (!project) throw ErrorUtils.notFound('Project');

    return this.em.find(
      Note,
      { project: { id: projectId } },
      {
        populate: ['author'],
        orderBy: [{ pinned: 'DESC' }, { createdAt: 'DESC' }],
      },
    );
  }

  // ── Only pinned notes for a project ────────────────────────────────────────
  async getPinnedNotes(projectId: string): Promise<Note[]> {
    const project = await this.em.findOne(Project, { id: projectId });
    if (!project) throw ErrorUtils.notFound('Project');

    return this.em.find(
      Note,
      { project: { id: projectId }, pinned: true },
      { populate: ['author'], orderBy: { createdAt: 'DESC' } },
    );
  }

  // ── Create ──────────────────────────────────────────────────────────────────
  async createNote(input: CreateNoteInput, currentUserId: string): Promise<Note> {
    const { content, projectId, pinned } = CreateNoteSchema.parse(input);

    const project = await this.em.findOne(
      Project,
      { id: projectId },
      { populate: ['members'] },
    );
    if (!project) throw ErrorUtils.notFound('Project');

    // Only project members can add notes
    const isMember = project.members.getItems().some(u => u.id === currentUserId);
    if (!isMember) throw ErrorUtils.forbidden('Only project members can add notes');

    const author = this.em.getReference(User, currentUserId);

    const note = this.em.create(Note, {
      content,
      pinned: pinned ?? false,
      author,
      project,
    });

    this.em.persist(note);

    persistTimelineEvent(
      this.em,
      project,
      TimelineEventType.NOTE,
      'Nueva nota añadida',
      content.length > 80 ? `${content.slice(0, 80)}…` : content
    );

    await this.em.flush();

    LoggerUtils.info(
      `Note created in project ${project.name} by user ${currentUserId}`
    );

    // Notify all project members except the author — fire and forget
    await this.notifications.notifyProjectMembers(
      project.id,
      `Nueva nota en ${project.name}`,
      content.length > 80 ? `${content.slice(0, 80)}…` : content,
      currentUserId,
      { type: 'NOTE_CREATED', projectId: project.id, noteId: note.id }
    );

    return note;
  }

  // ── Update ──────────────────────────────────────────────────────────────────
  async updateNote(
    id: string,
    input: UpdateNoteInput,
    currentUserId: string,
    currentRole: string,
  ): Promise<Note> {
    const data = UpdateNoteSchema.parse(input);
    const note = await this.findById(id);

    const isAuthor = note.author.id === currentUserId;
    const isAdmin = currentRole !== UserRole.USER;

    if (!isAuthor && !isAdmin) {
      throw ErrorUtils.forbidden('Only the author or an admin can edit this note');
    }

    this.em.assign(note, data);

    await this.em.populate(note, ['project']);

    persistTimelineEvent(
      this.em,
      note.project,
      TimelineEventType.NOTE,
      'Nota actualizada',
      note.content.length > 80
        ? `${note.content.slice(0, 80)}…`
        : note.content,
    );

    await this.em.flush();

    LoggerUtils.info(`Note ${id} updated`);

    // Notify all project members except the actor — fire and forget
    await this.notifications.notifyProjectMembers(
      note.project.id,
      `Nota actualizada en ${note.project.name}`,
      note.content.length > 80 ? `${note.content.slice(0, 80)}…` : note.content,
      currentUserId,
      { type: 'NOTE_UPDATED', projectId: note.project.id, noteId: note.id }
    );

    return note;
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async deleteNote(
    id: string,
    currentUserId: string,
    currentRole: string,
  ): Promise<boolean> {
    const note = await this.findById(id);
    const isAuthor = note.author.id === currentUserId;
    const isAdmin = currentRole !== UserRole.USER;

    if (!isAuthor && !isAdmin) {
      throw ErrorUtils.forbidden('Only the author or an admin can delete this note');
    }

    this.em.remove(note);

    await this.em.populate(note, ['project']);

    const preview = note.content.length > 80
      ? `Se eliminó: "${note.content.slice(0, 80)}…"`
      : `Se eliminó: "${note.content}"`;

    persistTimelineEvent(
      this.em,
      note.project,
      TimelineEventType.NOTE,
      'Nota eliminada',
      preview
    );

    await this.em.flush();
    LoggerUtils.info(`Note ${id} deleted`);

    // Notify all project members except the actor — fire and forget
    await this.notifications.notifyProjectMembers(
      note.project.id,
      `Nota eliminada en ${note.project.name}`,
      preview,
      currentUserId,
      { type: 'NOTE_DELETED', projectId: note.project.id }
    );

    return true;
  }

  // ── Toggle pin ──────────────────────────────────────────────────────────────
  async togglePin(
    id: string,
    currentUserId: string,
    currentRole: string,
  ): Promise<Note> {
    const note = await this.findById(id);

    const isAuthor = note.author.id === currentUserId;
    const isAdmin = currentRole !== UserRole.USER;

    if (!isAuthor && !isAdmin) {
      throw ErrorUtils.forbidden('Only the author or an admin can pin/unpin this note');
    }

    note.pinned = !note.pinned;
    await this.em.flush();

    LoggerUtils.info(`Note ${id} ${note.pinned ? 'pinned' : 'unpinned'}`);
    return note;
  }
}
