/**
 * Image Processing Utilities
 * Handles thumbnail generation, EXIF extraction, and image validation
 */

import sharp from 'sharp';
import exifr from 'exifr';
import { ExifData, THUMBNAIL_SIZES, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/types/photo';

/**
 * Validate image file
 */
export function validateImage(
  file: { type: string; size: number; name: string }
): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024}MB)`,
    };
  }

  // Check MIME type
  const mimeType = file.type.toLowerCase();
  if (!ALLOWED_MIME_TYPES.includes(mimeType as typeof ALLOWED_MIME_TYPES[number])) {
    return {
      valid: false,
      error: `File type "${file.type}" is not supported. Allowed types: JPEG, PNG, HEIC`,
    };
  }

  return { valid: true };
}

/**
 * Extract EXIF data from image buffer
 */
export async function extractExifData(buffer: Buffer): Promise<ExifData> {
  try {
    const exif = await exifr.parse(buffer, {
      pick: [
        'Make',
        'Model',
        'DateTimeOriginal',
        'ExposureTime',
        'FNumber',
        'ISO',
        'FocalLength',
        'GPSLatitude',
        'GPSLongitude',
        'ImageWidth',
        'ImageHeight',
        'ExifImageWidth',
        'ExifImageHeight',
      ],
      gps: true,
    });

    if (!exif) {
      // Get dimensions from sharp if EXIF is not available
      const metadata = await sharp(buffer).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
      };
    }

    return {
      make: exif.Make,
      model: exif.Model,
      dateTimeOriginal: exif.DateTimeOriginal,
      exposureTime: exif.ExposureTime,
      fNumber: exif.FNumber,
      iso: exif.ISO,
      focalLength: exif.FocalLength,
      latitude: exif.latitude,
      longitude: exif.longitude,
      width: exif.ExifImageWidth || exif.ImageWidth,
      height: exif.ExifImageHeight || exif.ImageHeight,
    };
  } catch (error) {
    console.error('EXIF extraction error:', error);
    // Fallback to sharp metadata
    try {
      const metadata = await sharp(buffer).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
      };
    } catch {
      return {};
    }
  }
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(
  buffer: Buffer
): Promise<{ width: number; height: number }> {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
  };
}

/**
 * Generate thumbnail
 */
export async function generateThumbnail(
  buffer: Buffer,
  size: 'small' | 'large'
): Promise<Buffer> {
  const dimensions = THUMBNAIL_SIZES[size];

  return sharp(buffer)
    .rotate() // Auto-rotate based on EXIF orientation
    .resize(dimensions.width, dimensions.height, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 85 })
    .toBuffer();
}

/**
 * Generate all thumbnails for a photo
 */
export async function generateAllThumbnails(
  buffer: Buffer
): Promise<{ small: Buffer; large: Buffer }> {
  const [small, large] = await Promise.all([
    generateThumbnail(buffer, 'small'),
    generateThumbnail(buffer, 'large'),
  ]);

  return { small, large };
}

/**
 * Convert HEIC to JPEG if needed
 */
export async function normalizeImage(
  buffer: Buffer,
  mimeType: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  // Convert HEIC/HEIF to JPEG
  if (mimeType === 'image/heic' || mimeType === 'image/heif') {
    const converted = await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF
      .jpeg({ quality: 95 })
      .toBuffer();
    return { buffer: converted, mimeType: 'image/jpeg' };
  }

  // For JPEG/PNG, just ensure proper rotation
  const rotated = await sharp(buffer).rotate().toBuffer();
  return { buffer: rotated, mimeType };
}

/**
 * Process uploaded image - full pipeline
 */
export async function processUploadedImage(
  buffer: Buffer,
  mimeType: string
): Promise<{
  original: Buffer;
  thumbnailSmall: Buffer;
  thumbnailLarge: Buffer;
  exif: ExifData;
  dimensions: { width: number; height: number };
  normalizedMimeType: string;
}> {
  // Extract EXIF before any processing (to preserve original data)
  const exif = await extractExifData(buffer);

  // Normalize image (convert HEIC, apply rotation)
  const normalized = await normalizeImage(buffer, mimeType);

  // Get dimensions from normalized image
  const dimensions = await getImageDimensions(normalized.buffer);

  // Generate thumbnails
  const thumbnails = await generateAllThumbnails(normalized.buffer);

  return {
    original: normalized.buffer,
    thumbnailSmall: thumbnails.small,
    thumbnailLarge: thumbnails.large,
    exif: {
      ...exif,
      width: dimensions.width,
      height: dimensions.height,
    },
    dimensions,
    normalizedMimeType: normalized.mimeType,
  };
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/heic': 'heic',
    'image/heif': 'heif',
  };
  return extensions[mimeType] || 'jpg';
}
