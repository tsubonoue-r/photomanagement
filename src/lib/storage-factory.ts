/**
 * Storage Factory
 * Provides unified interface for S3 and Local storage based on STORAGE_TYPE env var
 *
 * Issue #28: Environment-based storage switching
 *
 * Usage:
 *   STORAGE_TYPE=local  -> Uses local file system (public/uploads/)
 *   STORAGE_TYPE=s3     -> Uses S3/R2 (default)
 */

import * as s3Storage from './storage';
import * as localStorage from './storage-local';

export type StorageType = 'local' | 's3';

/**
 * Get the configured storage type
 */
export function getStorageType(): StorageType {
  const type = process.env.STORAGE_TYPE?.toLowerCase();
  if (type === 'local') {
    return 'local';
  }
  return 's3';
}

/**
 * Check if local storage mode is enabled
 */
export function isLocalStorageMode(): boolean {
  return getStorageType() === 'local';
}

/**
 * Storage interface - unified API for both storage types
 */
export interface StorageInterface {
  uploadToStorage: typeof s3Storage.uploadToStorage;
  getFromStorage: typeof s3Storage.getFromStorage;
  deleteFromStorage: typeof s3Storage.deleteFromStorage;
  existsInStorage: typeof s3Storage.existsInStorage;
  getSignedDownloadUrl: typeof s3Storage.getSignedDownloadUrl;
  getSignedUploadUrl: typeof s3Storage.getSignedUploadUrl;
  getPublicUrl: typeof s3Storage.getPublicUrl;
  generatePhotoKey: typeof s3Storage.generatePhotoKey;
  STORAGE_PATHS: typeof s3Storage.STORAGE_PATHS;
}

/**
 * Get the appropriate storage module based on environment
 */
export function getStorage(): StorageInterface {
  if (isLocalStorageMode()) {
    return {
      uploadToStorage: localStorage.uploadToStorage,
      getFromStorage: localStorage.getFromStorage,
      deleteFromStorage: localStorage.deleteFromStorage,
      existsInStorage: localStorage.existsInStorage,
      getSignedDownloadUrl: localStorage.getSignedDownloadUrl,
      getSignedUploadUrl: localStorage.getSignedUploadUrl,
      getPublicUrl: localStorage.getPublicUrl,
      generatePhotoKey: localStorage.generatePhotoKey,
      STORAGE_PATHS: localStorage.STORAGE_PATHS,
    };
  }

  return {
    uploadToStorage: s3Storage.uploadToStorage,
    getFromStorage: s3Storage.getFromStorage,
    deleteFromStorage: s3Storage.deleteFromStorage,
    existsInStorage: s3Storage.existsInStorage,
    getSignedDownloadUrl: s3Storage.getSignedDownloadUrl,
    getSignedUploadUrl: s3Storage.getSignedUploadUrl,
    getPublicUrl: s3Storage.getPublicUrl,
    generatePhotoKey: s3Storage.generatePhotoKey,
    STORAGE_PATHS: s3Storage.STORAGE_PATHS,
  };
}

// Re-export convenience functions that use the factory

/**
 * Upload to storage (automatically selects S3 or local)
 */
export async function uploadToStorage(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
  metadata?: Record<string, string>
): Promise<{ success: boolean; url?: string; error?: string }> {
  return getStorage().uploadToStorage(key, body, contentType, metadata);
}

/**
 * Get from storage (automatically selects S3 or local)
 */
export async function getFromStorage(
  key: string
): Promise<{ success: boolean; body?: Uint8Array; contentType?: string; error?: string }> {
  return getStorage().getFromStorage(key);
}

/**
 * Delete from storage (automatically selects S3 or local)
 */
export async function deleteFromStorage(
  key: string
): Promise<{ success: boolean; error?: string }> {
  return getStorage().deleteFromStorage(key);
}

/**
 * Check if exists in storage (automatically selects S3 or local)
 */
export async function existsInStorage(key: string): Promise<boolean> {
  return getStorage().existsInStorage(key);
}

/**
 * Get signed download URL (automatically selects S3 or local)
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  return getStorage().getSignedDownloadUrl(key, expiresIn);
}

/**
 * Get signed upload URL (automatically selects S3 or local)
 */
export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  return getStorage().getSignedUploadUrl(key, contentType, expiresIn);
}

/**
 * Get public URL (automatically selects S3 or local)
 */
export function getPublicUrl(key: string): string {
  return getStorage().getPublicUrl(key);
}

/**
 * Generate photo key (same for both storage types)
 */
export function generatePhotoKey(
  photoId: string,
  type: 'original' | 'thumbnail-small' | 'thumbnail-large',
  extension: string
): string {
  return getStorage().generatePhotoKey(photoId, type, extension);
}

/**
 * Storage paths constant
 */
export const STORAGE_PATHS = s3Storage.STORAGE_PATHS;

/**
 * Initialize storage (only needed for local mode)
 */
export async function initializeStorage(): Promise<void> {
  if (isLocalStorageMode()) {
    await localStorage.initializeLocalStorage();
  }
  console.log(`[Storage] Using ${getStorageType()} storage mode`);
}
