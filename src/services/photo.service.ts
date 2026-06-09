// src/services/photo.service.ts
import { EntityManager } from '@mikro-orm/postgresql';
import { z } from 'zod';
import { PhotoEntity } from '../entities/Photo.entity';
import { Project } from '../entities/Project.entity';
import User from '../entities/User.entity';
import { ErrorUtils } from '../utils/error.utils';
import { LoggerUtils } from '../utils/logger.utils';
import { storageService } from './storage.service';
import { persistTimelineEvent } from '../utils/timeline.util';
import { TimelineEventType } from '../entities/TimelineEvent.entity';

// ─── Validation ───────────────────────────────────────────────────────────────

const AddPhotoSchema = z.object({
  projectId: z.string().uuid(),
  url:       z.string().url(),
  caption:   z.string().max(500).optional(),
  tags:      z.array(z.string()).max(20).optional(),
});

const GetUploadUrlSchema = z.object({
  projectId: z.string().uuid(),
  fileName:  z.string().min(1),
  mimeType:  z.string().min(1),
});

export type AddPhotoInput     = z.infer<typeof AddPhotoSchema>;
export type GetUploadUrlInput = z.infer<typeof GetUploadUrlSchema>;

// ─── Service ──────────────────────────────────────────────────────────────────

export class PhotoService {
  constructor(private readonly em: EntityManager) {}

  /**
   * Generates a presigned S3 URL so the client can upload a photo directly.
   * The caller must be a member of the project (or admin).
   */
  async getUploadUrl(input: GetUploadUrlInput, currentUserId: string) {
    const { projectId, fileName, mimeType } = GetUploadUrlSchema.parse(input);

    const project = await this.em.findOne(
      Project,
      { id: projectId },
      { populate: ['members'] }
    );
    if (!project) throw ErrorUtils.notFound('Project');

    const isMember = project.members
      .getItems()
      .some(u => u.id === currentUserId);
    if (!isMember) {
      throw ErrorUtils.forbidden('Only project members can upload photos');
    }

    return storageService.getPresignedUploadUrl(
      `projects/${projectId}/photos`,
      fileName,
      mimeType
    );
  }

  async addPhoto(
    input: AddPhotoInput,
    currentUserId: string
  ): Promise<PhotoEntity> {
    const { projectId, url, caption, tags } = AddPhotoSchema.parse(input);

    const project = await this.em.findOne(
      Project,
      { id: projectId },
      { populate: ['members'] }
    );
    if (!project) throw ErrorUtils.notFound('Project');

    const isMember = project.members
      .getItems()
      .some(u => u.id === currentUserId);
    if (!isMember) {
      throw ErrorUtils.forbidden('Only project members can add photos');
    }

    const uploader = this.em.getReference(User, currentUserId);

    const photo = this.em.create(PhotoEntity, {
      url,
      caption: caption ?? undefined,
      tags: tags ?? [],
      project,
      uploadedBy: uploader,
    });

    this.em.persist(photo);

    persistTimelineEvent(
      this.em,
      project,
      TimelineEventType.PHOTO,
      'Nueva foto añadida',
      `Se añadió una foto al proyecto`,
      url
    );
    await this.em.flush();

    LoggerUtils.info(`Photo added to project ${project.name}: ${url}`);
    return photo;
  }

  async updatePhoto(
    photoId: string,
    input: { url?: string; caption?: string; tags?: string[] },
    currentUserId: string,
    currentRole: string
  ): Promise<PhotoEntity> {
    const photo = await this.em.findOne(
      PhotoEntity,
      { id: photoId },
      { populate: ['uploadedBy', 'project'] }
    );
    if (!photo) throw ErrorUtils.notFound('Photo');

    const isUploader = photo.uploadedBy.id === currentUserId;
    const isAdmin = currentRole !== 'user';
    if (!isUploader && !isAdmin) {
      throw ErrorUtils.forbidden(
        'Only the uploader or an admin can edit this photo'
      );
    }

    if (input.url) photo.url = input.url;
    if (input.caption !== undefined) photo.caption = input.caption;
    if (input.tags) photo.tags = input.tags;

    await this.em.populate(photo, ['project']);

    persistTimelineEvent(
      this.em,
      photo.project,
      TimelineEventType.PHOTO,
      'Foto actualizada',
      `Se actualizó una foto del proyecto`,
      input.url ?? photo.url
    );

    await this.em.flush();
    return photo;
  }
  /**
   * Deletes a photo record from DB and its file from S3.
   * Only the uploader or an admin can delete.
   */
  async deletePhoto(
    photoId: string,
    currentUserId: string,
    currentRole: string
  ): Promise<boolean> {
    const photo = await this.em.findOne(
      PhotoEntity,
      { id: photoId },
      { populate: ['uploadedBy'] }
    );
    if (!photo) throw ErrorUtils.notFound('Photo');

    const isUploader = photo.uploadedBy.id === currentUserId;
    const isAdmin = currentRole !== 'user';

    if (!isUploader && !isAdmin) {
      throw ErrorUtils.forbidden(
        'Only the uploader or an admin can delete this photo'
      );
    }

    // Remove from S3 (non-blocking on failure)
    await storageService.deleteFile(storageService.keyFromUrl(photo.url));

    this.em.remove(photo);

    await this.em.populate(photo, ['project']);

    persistTimelineEvent(
      this.em,
      photo.project,
      TimelineEventType.PHOTO,
      'Foto eliminada',
      photo.caption
        ? `Se eliminó la foto "${photo.caption}"`
        : 'Se eliminó una foto del proyecto'
    );

    await this.em.flush();
    LoggerUtils.info(`Photo deleted: ${photoId}`);
    return true;
  }
}
