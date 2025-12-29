/**
 * S3/R2 Storage Client Configuration
 * Supports both AWS S3 and Cloudflare R2 (S3-compatible)
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Environment variables for storage configuration
const STORAGE_ENDPOINT = process.env.STORAGE_ENDPOINT;
const STORAGE_REGION = process.env.STORAGE_REGION || 'auto';
const STORAGE_ACCESS_KEY_ID = process.env.STORAGE_ACCESS_KEY_ID || '';
const STORAGE_SECRET_ACCESS_KEY = process.env.STORAGE_SECRET_ACCESS_KEY || '';
const STORAGE_BUCKET = process.env.STORAGE_BUCKET || 'photos';
const STORAGE_PUBLIC_URL = process.env.STORAGE_PUBLIC_URL || '';

/**
 * S3 Client instance
 * Configured for both AWS S3 and Cloudflare R2 compatibility
 */
export const s3Client = new S3Client({
  region: STORAGE_REGION,
  endpoint: STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: STORAGE_ACCESS_KEY_ID,
    secretAccessKey: STORAGE_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // Required for R2 compatibility
});

/**
 * Storage path prefixes
 */
export const STORAGE_PATHS = {
  originals: 'photos/originals',
  thumbnailsSmall: 'photos/thumbnails/small',
  thumbnailsLarge: 'photos/thumbnails/large',
} as const;

/**
 * Upload a file to storage
 */
export async function uploadToStorage(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
  metadata?: Record<string, string>
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const command = new PutObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: metadata,
    });

    await s3Client.send(command);

    const url = getPublicUrl(key);
    return { success: true, url };
  } catch (error) {
    console.error('Storage upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Get a file from storage
 */
export async function getFromStorage(
  key: string
): Promise<{ success: boolean; body?: Uint8Array; contentType?: string; error?: string }> {
  try {
    const command = new GetObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: key,
    });

    const response = await s3Client.send(command);
    const body = await response.Body?.transformToByteArray();

    return {
      success: true,
      body,
      contentType: response.ContentType,
    };
  } catch (error) {
    console.error('Storage get error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Get failed',
    };
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFromStorage(
  key: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: key,
    });

    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    console.error('Storage delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

/**
 * Check if a file exists in storage
 */
export async function existsInStorage(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a signed URL for temporary access
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: STORAGE_BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate a signed URL for upload
 */
export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: STORAGE_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Get public URL for a storage key
 */
export function getPublicUrl(key: string): string {
  if (STORAGE_PUBLIC_URL) {
    return `${STORAGE_PUBLIC_URL}/${key}`;
  }
  // Fallback to S3-style URL
  return `https://${STORAGE_BUCKET}.s3.${STORAGE_REGION}.amazonaws.com/${key}`;
}

/**
 * Generate storage key for a photo
 */
export function generatePhotoKey(
  photoId: string,
  type: 'original' | 'thumbnail-small' | 'thumbnail-large',
  extension: string
): string {
  const basePath = {
    original: STORAGE_PATHS.originals,
    'thumbnail-small': STORAGE_PATHS.thumbnailsSmall,
    'thumbnail-large': STORAGE_PATHS.thumbnailsLarge,
  }[type];

  return `${basePath}/${photoId}.${extension}`;
}
