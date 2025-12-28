/**
 * Photo related type definitions
 */

export interface ExifData {
  make?: string;
  model?: string;
  dateTimeOriginal?: Date;
  exposureTime?: number;
  fNumber?: number;
  iso?: number;
  focalLength?: number;
  latitude?: number;
  longitude?: number;
  width?: number;
  height?: number;
}

export interface PhotoMetadata {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  exif: ExifData;
  uploadedAt: Date;
}

export interface UploadedPhoto {
  id: string;
  originalUrl: string;
  thumbnailSmallUrl: string;
  thumbnailLargeUrl: string;
  metadata: PhotoMetadata;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface UploadResult {
  success: boolean;
  photo?: UploadedPhoto;
  error?: string;
}

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
] as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const THUMBNAIL_SIZES = {
  small: { width: 200, height: 200 },
  large: { width: 800, height: 800 },
} as const;

export type ThumbnailSize = keyof typeof THUMBNAIL_SIZES;
