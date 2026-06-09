// src/utils/timeline.util.ts
import { EntityManager } from '@mikro-orm/core';
import { TimelineEvent, TimelineEventType } from '../entities/TimelineEvent.entity';
import { Project } from '../entities/Project.entity';

/**
 * Crea un TimelineEvent en memoria y lo persiste en el unit of work.
 * NO llama a em.flush() — el servicio que lo invoca es responsable del flush,
 * de forma que el evento y la acción principal se guardan en la misma transacción.
 *
 * Uso:
 *   persistTimelineEvent(this.em, project, TimelineEventType.PHOTO, 'Foto añadida', '...');
 *   await this.em.flush(); // guarda photo + timeline en una sola query
 */
export function persistTimelineEvent(
  em: EntityManager,
  project: Project,
  type: TimelineEventType,
  title: string,
  description: string,
  photoUrl?: string,
): void {
  const event = em.create(TimelineEvent, {
    title,
    description,
    type,
    project,
    ...(photoUrl ? { photoUrl } : {}),
  });
  em.persist(event);
}
