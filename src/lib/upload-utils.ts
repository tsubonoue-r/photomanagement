/**
 * Upload Utilities
 * Client-side utilities for file upload handling
 * Issue #36: Photo Upload UI Improvement
 */

import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/types/photo';

/**
 * Validation error type
 */
export interface FileValidationError {
  filename: string;
  code: 'FILE_TOO_LARGE' | 'INVALID_TYPE' | 'EMPTY_FILE' | 'UNKNOWN';
  message: string;
}

/**
 * Validation result
 */
export interface FileValidationResult {
  valid: boolean;
  file: File;
  error?: FileValidationError;
}

/**
 * Validate a single file for upload
 */
export function validateFile(file: File): FileValidationResult {
  // Check for empty file
  if (file.size === 0) {
    return {
      valid: false,
      file,
      error: {
        filename: file.name,
        code: 'EMPTY_FILE',
        message: 'File is empty',
      },
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      file,
      error: {
        filename: file.name,
        code: 'FILE_TOO_LARGE',
        message: `File exceeds maximum size of ${formatFileSize(MAX_FILE_SIZE)}`,
      },
    };
  }

  // Check file type
  const mimeType = file.type.toLowerCase();
  const isValidType = ALLOWED_MIME_TYPES.includes(
    mimeType as (typeof ALLOWED_MIME_TYPES)[number]
  );

  // Also check by extension for HEIC (sometimes browser doesn't recognize HEIC MIME type)
  const extension = file.name.split('.').pop()?.toLowerCase();
  const isHeicByExtension = extension === 'heic' || extension === 'heif';

  if (!isValidType && !isHeicByExtension) {
    return {
      valid: false,
      file,
      error: {
        filename: file.name,
        code: 'INVALID_TYPE',
        message: 'File type not supported. Allowed: JPEG, PNG, HEIC, HEIF',
      },
    };
  }

  return { valid: true, file };
}

/**
 * Validate multiple files for upload
 */
export function validateFiles(files: File[]): {
  valid: FileValidationResult[];
  invalid: FileValidationResult[];
} {
  const results = files.map(validateFile);
  return {
    valid: results.filter((r) => r.valid),
    invalid: results.filter((r) => !r.valid),
  };
}

/**
 * Check if file is HEIC/HEIF format
 */
export function isHeicFile(file: File): boolean {
  const mimeType = file.type.toLowerCase();
  const extension = file.name.split('.').pop()?.toLowerCase();
  return (
    mimeType === 'image/heic' ||
    mimeType === 'image/heif' ||
    extension === 'heic' ||
    extension === 'heif'
  );
}

/**
 * Get proper MIME type for file (handles HEIC files with missing type)
 */
export function getFileMimeType(file: File): string {
  if (file.type) {
    return file.type.toLowerCase();
  }

  // Fallback to extension-based detection
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    heic: 'image/heic',
    heif: 'image/heif',
  };

  return mimeTypes[extension || ''] || 'application/octet-stream';
}

/**
 * Create a preview URL for a file
 * Returns blob URL or null if preview isn't available
 */
export function createFilePreviewUrl(file: File): string | null {
  // Skip HEIC files as browsers typically can't display them directly
  if (isHeicFile(file)) {
    return null;
  }

  try {
    return URL.createObjectURL(file);
  } catch {
    return null;
  }
}

/**
 * Revoke a preview URL to free memory
 */
export function revokeFilePreviewUrl(url: string | null): void {
  if (url && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignore errors
    }
  }
}

/**
 * Calculate SHA-256 hash of a file for duplicate detection
 */
export async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Calculate a quick fingerprint for duplicate detection
 * Uses first 64KB + last 64KB + file size for faster comparison
 */
export async function calculateQuickFingerprint(file: File): Promise<string> {
  const CHUNK_SIZE = 64 * 1024; // 64KB

  // For small files, hash the entire file
  if (file.size <= CHUNK_SIZE * 2) {
    return calculateFileHash(file);
  }

  // For larger files, hash first chunk + last chunk + size
  const firstChunk = file.slice(0, CHUNK_SIZE);
  const lastChunk = file.slice(-CHUNK_SIZE);

  const [firstBuffer, lastBuffer] = await Promise.all([
    firstChunk.arrayBuffer(),
    lastChunk.arrayBuffer(),
  ]);

  // Combine buffers with size
  const sizeBuffer = new ArrayBuffer(8);
  const sizeView = new DataView(sizeBuffer);
  sizeView.setBigUint64(0, BigInt(file.size), true);

  const combined = new Uint8Array(
    firstBuffer.byteLength + lastBuffer.byteLength + sizeBuffer.byteLength
  );
  combined.set(new Uint8Array(firstBuffer), 0);
  combined.set(new Uint8Array(lastBuffer), firstBuffer.byteLength);
  combined.set(
    new Uint8Array(sizeBuffer),
    firstBuffer.byteLength + lastBuffer.byteLength
  );

  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  if (seconds < 1) return 'less than a second';
  if (seconds < 60) return `${Math.ceil(seconds)} second${seconds !== 1 ? 's' : ''}`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return `${mins}m ${secs}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

/**
 * Format upload speed for display
 */
export function formatUploadSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return '0 B/s';
  return `${formatFileSize(bytesPerSecond)}/s`;
}

/**
 * Estimate time remaining for upload
 */
export function estimateTimeRemaining(
  bytesRemaining: number,
  bytesPerSecond: number
): number | null {
  if (bytesPerSecond <= 0) return null;
  return bytesRemaining / bytesPerSecond;
}

/**
 * Group files by status for display
 */
export function groupFilesByExtension(
  files: File[]
): Record<string, { count: number; totalSize: number }> {
  return files.reduce(
    (acc, file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown';
      if (!acc[ext]) {
        acc[ext] = { count: 0, totalSize: 0 };
      }
      acc[ext].count++;
      acc[ext].totalSize += file.size;
      return acc;
    },
    {} as Record<string, { count: number; totalSize: number }>
  );
}

/**
 * Sort files for optimal upload order
 * Smaller files first for quicker feedback
 */
export function sortFilesForUpload(files: File[]): File[] {
  return [...files].sort((a, b) => a.size - b.size);
}

/**
 * Batch files into chunks for parallel upload
 */
export function batchFiles<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * Create FormData for file upload
 */
export function createUploadFormData(
  files: File[],
  options?: {
    projectId?: string;
    categoryId?: string;
  }
): FormData {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('files', file);
  });

  if (options?.projectId) {
    formData.append('projectId', options.projectId);
  }

  if (options?.categoryId) {
    formData.append('categoryId', options.categoryId);
  }

  return formData;
}

/**
 * Check if browser supports drag and drop
 */
export function supportsDragAndDrop(): boolean {
  if (typeof window === 'undefined') return false;

  const div = document.createElement('div');
  return (
    'draggable' in div ||
    ('ondragstart' in div && 'ondrop' in div)
  );
}

/**
 * Check if browser supports File API
 */
export function supportsFileAPI(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.File && window.FileReader && window.FileList && window.Blob);
}

/**
 * Get drop zone instructions based on browser capabilities
 */
export function getDropzoneInstructions(): string {
  if (!supportsFileAPI()) {
    return 'Your browser does not support file uploads';
  }

  if (supportsDragAndDrop()) {
    return 'Drag and drop photos here, or click to select';
  }

  return 'Click to select photos';
}
