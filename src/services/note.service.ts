import { EntityManager } from '@mikro-orm/postgresql';
import { z } from 'zod';
import { Note } from '../entities/Note.entity';
import { Project } from '../entities/Project.entity';
import User, { UserRole } from '../entities/User.entity';
import { ErrorUtils } from '../utils/error.utils';
import { LoggerUtils } from '../utils/logger.utils';

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
  constructor(private readonly em: EntityManager) {}

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
    await this.em.flush();

    LoggerUtils.info(
      `Note created in project ${project.name} by user ${currentUserId}`
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

    await note.author.init();
    const isAuthor = note.author.id === currentUserId;
    const isAdmin = currentRole !== UserRole.USER;

    if (!isAuthor && !isAdmin) {
      throw ErrorUtils.forbidden('Only the author or an admin can edit this note');
    }

    this.em.assign(note, data);
    await this.em.flush();

    LoggerUtils.info(`Note ${id} updated`);
    return note;
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async deleteNote(
    id: string,
    currentUserId: string,
    currentRole: string,
  ): Promise<boolean> {
    const note = await this.findById(id);

    await note.author.init();
    const isAuthor = note.author.id === currentUserId;
    const isAdmin = currentRole !== UserRole.USER;

    if (!isAuthor && !isAdmin) {
      throw ErrorUtils.forbidden('Only the author or an admin can delete this note');
    }

    await this.em.removeAndFlush(note);
    LoggerUtils.info(`Note ${id} deleted`);
    return true;
  }

  // ── Toggle pin ──────────────────────────────────────────────────────────────
  async togglePin(
    id: string,
    currentUserId: string,
    currentRole: string,
  ): Promise<Note> {
    const note = await this.findById(id);

    await note.author.init();
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
