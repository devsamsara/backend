import type { GraphQLContext } from '../middlewares/context';
import { NoteService, CreateNoteInput, UpdateNoteInput } from '../services/note.service';
import { ErrorUtils } from '../utils/error.utils';

// ─── Guards ───────────────────────────────────────────────────────────────────

function requireAuth(context: GraphQLContext) {
  if (!context.user) throw ErrorUtils.unauthorized('You must be logged in');
  return context.user;
}

// ─── Resolver ────────────────────────────────────────────────────────────────

export const noteResolvers = {
  Query: {
    /**
     * Protected — find a single note by ID.
     */
    findNote: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      const service = new NoteService(ctx.em);
      return service.findById(id);
    },

    /**
     * Protected — all notes for a project, pinned first then newest.
     */
    getNotesByProject: async (
      _: unknown,
      { projectId }: { projectId: string },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      const service = new NoteService(ctx.em);
      return service.getNotesByProject(projectId);
    },

    /**
     * Protected — only pinned notes for a project.
     */
    getPinnedNotes: async (
      _: unknown,
      { projectId }: { projectId: string },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      const service = new NoteService(ctx.em);
      return service.getPinnedNotes(projectId);
    },
  },

  Mutation: {
    /**
     * Protected — creates a note in a project.
     * Only members of the project can add notes.
     */
    createNote: async (
      _: unknown,
      { input }: { input: CreateNoteInput },
      ctx: GraphQLContext,
    ) => {
      const { id } = requireAuth(ctx);
      const service = new NoteService(ctx.em);
      return service.createNote(input, id);
    },

    /**
     * Protected — updates content or pinned state.
     * Only the author or an admin can edit.
     */
    updateNote: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateNoteInput },
      ctx: GraphQLContext,
    ) => {
      const { id: idUser, role } = requireAuth(ctx);
      const service = new NoteService(ctx.em);
      return service.updateNote(id, input, idUser, role);
    },

    /**
     * Protected — deletes a note.
     * Only the author or an admin can delete.
     */
    deleteNote: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      const { id: idUser, role } = requireAuth(ctx);
      const service = new NoteService(ctx.em);
      return service.deleteNote(id, idUser, role);
    },

    /**
     * Protected — flips the pinned state of a note.
     * Only the author or an admin can pin/unpin.
     */
    togglePinNote: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      const { id:idUser, role } = requireAuth(ctx);
      const service = new NoteService(ctx.em);
      return service.togglePin(id, idUser, role);
    },
  },
};
