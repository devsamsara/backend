// src/services/storage.service.ts
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { s3Client, S3_BUCKET, S3_PUBLIC_URL } from '../config/aws.config';
import { LoggerUtils } from '../utils/logger.utils';

// Allowed MIME types for photo uploads
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

// Max file size: 20 MB
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

// Presigned URL TTL: 10 minutes (enough for the client to upload)
const PRESIGNED_URL_EXPIRES_IN = 600;

export interface PresignedUploadResult {
  /** PUT this URL from the client to upload the file directly to S3. */
  uploadUrl: string;
  /** The final public URL of the file once uploaded. Save this in the DB. */
  fileUrl: string;
  /** The S3 object key — keep it if you need to delete the file later. */
  key: string;
}

export class StorageService {
  /**
   * Generates a presigned PUT URL so the client can upload a file
   * directly to S3 without routing it through the server.
   *
   * @param folder   - S3 "folder" prefix, e.g. "projects/abc123/photos"
   * @param fileName - Original file name (used only to extract the extension)
   * @param mimeType - Must be one of the allowed image MIME types
   */
  async getPresignedUploadUrl(
    folder: string,
    fileName: string,
    mimeType: string,
  ): Promise<PresignedUploadResult> {
    if (!ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) {
      throw new Error(
        `Unsupported file type "${mimeType}". Allowed: ${[...ALLOWED_MIME_TYPES].join(', ')}`,
      );
    }

    const ext = fileName.split('.').pop()?.toLowerCase() ?? 'jpg';
    const key = `${folder}/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGNED_URL_EXPIRES_IN,
    });

    const fileUrl = `${S3_PUBLIC_URL}/${key}`;

    LoggerUtils.info(`Presigned URL generated: ${key}`);

    return { uploadUrl, fileUrl, key };
  }

  /**
   * Deletes an object from S3 by its key.
   * Used when a photo record is removed from the DB.
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await s3Client.send(
        new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }),
      );
      LoggerUtils.info(`S3 object deleted: ${key}`);
    } catch (err) {
      // Log but don't throw — a failed S3 delete should not block the DB operation
      LoggerUtils.error(`Failed to delete S3 object: ${key}`, { err });
    }
  }

  /**
   * Extracts the S3 key from a full file URL.
   * e.g. "https://bucket.s3.region.amazonaws.com/projects/abc/photo.jpg"
   *   →  "projects/abc/photo.jpg"
   */
  keyFromUrl(fileUrl: string): string {
    return fileUrl.replace(`${S3_PUBLIC_URL}/`, '');
  }
}

export const storageService = new StorageService();
