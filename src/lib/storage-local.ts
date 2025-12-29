/**
 * Local File System Storage Implementation
 * Stores files in public/uploads/ directory for development and testing
 *
 * Issue #28: Local storage mock for full functionality testing
 */

import { promises as fs } from 'node:fs';
import * as path from 'node:path';

// Local storage base path (relative to project root)
const LOCAL_STORAGE_BASE = path.join(process.cwd(), 'public', 'uploads');

/**
 * Storage path prefixes (same as S3)
 */
export const STORAGE_PATHS = {
  originals: 'photos/originals',
  thumbnailsSmall: 'photos/thumbnails/small',
  thumbnailsLarge: 'photos/thumbnails/large',
} as const;

/**
 * Ensure directory exists
 */
async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    // Directory might already exist, which is fine
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Get full local path for a storage key
 */
function getLocalPath(key: string): string {
  return path.join(LOCAL_STORAGE_BASE, key);
}

/**
 * Upload a file to local storage
 */
export async function uploadToStorage(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
  metadata?: Record<string, string>
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const filePath = getLocalPath(key);
    const dirPath = path.dirname(filePath);

    // Ensure directory exists
    await ensureDirectory(dirPath);

    // Write the file
    await fs.writeFile(filePath, body);

    // Optionally save metadata as a sidecar JSON file
    if (metadata && Object.keys(metadata).length > 0) {
      const metadataPath = `${filePath}.meta.json`;
      await fs.writeFile(metadataPath, JSON.stringify({ contentType, ...metadata }, null, 2));
    }

    const url = getPublicUrl(key);
    return { success: true, url };
  } catch (error) {
    console.error('Local storage upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Get a file from local storage
 */
export async function getFromStorage(
  key: string
): Promise<{ success: boolean; body?: Uint8Array; contentType?: string; error?: string }> {
  try {
    const filePath = getLocalPath(key);
    const body = await fs.readFile(filePath);

    // Try to read content type from metadata file
    let contentType: string | undefined;
    try {
      const metadataPath = `${filePath}.meta.json`;
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(metadataContent);
      contentType = metadata.contentType;
    } catch {
      // Metadata file doesn't exist, infer from extension
      const ext = path.extname(key).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.heic': 'image/heic',
        '.heif': 'image/heif',
      };
      contentType = mimeTypes[ext] || 'application/octet-stream';
    }

    return {
      success: true,
      body: new Uint8Array(body),
      contentType,
    };
  } catch (error) {
    console.error('Local storage get error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Get failed',
    };
  }
}

/**
 * Delete a file from local storage
 */
export async function deleteFromStorage(
  key: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const filePath = getLocalPath(key);
    await fs.unlink(filePath);

    // Also try to delete metadata file if it exists
    try {
      const metadataPath = `${filePath}.meta.json`;
      await fs.unlink(metadataPath);
    } catch {
      // Metadata file might not exist, which is fine
    }

    return { success: true };
  } catch (error) {
    console.error('Local storage delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

/**
 * Check if a file exists in local storage
 */
export async function existsInStorage(key: string): Promise<boolean> {
  try {
    const filePath = getLocalPath(key);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a signed URL for download (local mode returns direct path)
 * In local mode, no signing is needed - we just return the public URL
 */
export async function getSignedDownloadUrl(
  key: string,
  _expiresIn: number = 3600
): Promise<string> {
  // For local storage, just return the public URL
  return getPublicUrl(key);
}

/**
 * Generate a signed URL for upload (local mode doesn't support presigned uploads)
 * Returns a special URL that indicates local upload should be used
 */
export async function getSignedUploadUrl(
  key: string,
  _contentType: string,
  _expiresIn: number = 3600
): Promise<string> {
  // For local storage, we don't use presigned URLs
  // Return a marker that tells the client to use direct upload
  return `/api/photos/upload-local?key=${encodeURIComponent(key)}`;
}

/**
 * Get public URL for a storage key
 * In local mode, files are served from /uploads/ directory
 */
export function getPublicUrl(key: string): string {
  // Files are served from Next.js public directory
  return `/uploads/${key}`;
}

/**
 * Generate storage key for a photo (same logic as S3)
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

/**
 * Initialize local storage directories
 * Call this on application startup in local mode
 */
export async function initializeLocalStorage(): Promise<void> {
  await ensureDirectory(path.join(LOCAL_STORAGE_BASE, STORAGE_PATHS.originals));
  await ensureDirectory(path.join(LOCAL_STORAGE_BASE, STORAGE_PATHS.thumbnailsSmall));
  await ensureDirectory(path.join(LOCAL_STORAGE_BASE, STORAGE_PATHS.thumbnailsLarge));
  console.log('[LocalStorage] Initialized directories at:', LOCAL_STORAGE_BASE);
}

/**
 * Get storage statistics (useful for debugging)
 */
export async function getStorageStats(): Promise<{
  originalsCount: number;
  thumbnailsSmallCount: number;
  thumbnailsLargeCount: number;
  totalSize: number;
}> {
  async function countFiles(dirPath: string): Promise<{ count: number; size: number }> {
    try {
      const fullPath = path.join(LOCAL_STORAGE_BASE, dirPath);
      const files = await fs.readdir(fullPath);
      let size = 0;
      let count = 0;

      for (const file of files) {
        if (!file.endsWith('.meta.json')) {
          const filePath = path.join(fullPath, file);
          const stat = await fs.stat(filePath);
          size += stat.size;
          count++;
        }
      }

      return { count, size };
    } catch {
      return { count: 0, size: 0 };
    }
  }

  const [originals, thumbnailsSmall, thumbnailsLarge] = await Promise.all([
    countFiles(STORAGE_PATHS.originals),
    countFiles(STORAGE_PATHS.thumbnailsSmall),
    countFiles(STORAGE_PATHS.thumbnailsLarge),
  ]);

  return {
    originalsCount: originals.count,
    thumbnailsSmallCount: thumbnailsSmall.count,
    thumbnailsLargeCount: thumbnailsLarge.count,
    totalSize: originals.size + thumbnailsSmall.size + thumbnailsLarge.size,
  };
}
