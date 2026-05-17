import type { GraphQLContext } from '../middlewares/context';
import {
  TimelineService,
  CreateTimelineEventInput,
  UpdateTimelineEventInput,
  TimelineFiltersInput,
} from '../services/timeline.service';
import { ErrorUtils } from '../utils/error.utils';

// ─── Guards ───────────────────────────────────────────────────────────────────

function requireAuth(context: GraphQLContext) {
  if (!context.user) throw ErrorUtils.unauthorized('You must be logged in');
  return context.user;
}

// ─── Resolver ────────────────────────────────────────────────────────────────

export const timelineResolvers = {
  Query: {
    /**
     * Protected — find a single timeline event by ID.
     */
    findTimelineEvent: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      const service = new TimelineService(ctx.em);
      return service.findById(id);
    },

    /**
     * Protected — all timeline events for a project, newest first.
     * Optionally filtered by type (photo | note | milestone | team).
     */
    getProjectTimeline: async (
      _: unknown,
      { projectId, filters }: { projectId: string; filters?: Partial<TimelineFiltersInput> },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx);
      const service = new TimelineService(ctx.em);
      return service.getProjectTimeline(projectId, filters ?? {});
    },
  },

  Mutation: {
    /**
     * Protected — creates a timeline event in a project.
     * Only project members or admins can create.
     * Events of type "photo" require a photoUrl.
     */
    createTimelineEvent: async (
      _: unknown,
      { input }: { input: CreateTimelineEventInput },
      ctx: GraphQLContext,
    ) => {
      const { sub, role } = requireAuth(ctx);
      const service = new TimelineService(ctx.em);
      return service.createEvent(input, sub, role);
    },

    /**
     * Admin/Root only — updates a timeline event.
     * Validates that photoUrl is present when type is "photo".
     */
    updateTimelineEvent: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateTimelineEventInput },
      ctx: GraphQLContext,
    ) => {
      const { role } = requireAuth(ctx);
      const service = new TimelineService(ctx.em);
      return service.updateEvent(id, input, role);
    },

    /**
     * Admin/Root only — permanently deletes a timeline event.
     */
    deleteTimelineEvent: async (
      _: unknown,
      { id }: { id: string },
      ctx: GraphQLContext,
    ) => {
      const { role } = requireAuth(ctx);
      const service = new TimelineService(ctx.em);
      return service.deleteEvent(id, role);
    },
  },
};
