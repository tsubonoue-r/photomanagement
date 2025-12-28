/**
 * Photo Upload API Endpoint
 * Handles single and multiple file uploads with thumbnail generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  validateImage,
  processUploadedImage,
  getExtensionFromMimeType,
} from '@/lib/image';
import {
  uploadToStorage,
  generatePhotoKey,
  getPublicUrl,
} from '@/lib/storage';
import { UploadedPhoto, PhotoMetadata, UploadResult } from '@/types/photo';

// Route segment config for Next.js App Router
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Maximum number of files per request
const MAX_FILES_PER_REQUEST = 20;

/**
 * POST /api/photos/upload
 * Upload one or more photos
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES_PER_REQUEST} files per request` },
        { status: 400 }
      );
    }

    const results: UploadResult[] = [];

    for (const file of files) {
      const result = await processAndUploadFile(file);
      results.push(result);
    }

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    return NextResponse.json({
      success: failed.length === 0,
      uploaded: successful.length,
      failed: failed.length,
      results,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Process and upload a single file
 */
async function processAndUploadFile(file: File): Promise<UploadResult> {
  try {
    // Validate file
    const validation = validateImage({
      type: file.type,
      size: file.size,
      name: file.name,
    });

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Generate unique ID
    const photoId = uuidv4();

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process image
    const processed = await processUploadedImage(buffer, file.type);

    // Determine extension based on normalized mime type
    const extension = getExtensionFromMimeType(processed.normalizedMimeType);

    // Generate storage keys
    const originalKey = generatePhotoKey(photoId, 'original', extension);
    const thumbnailSmallKey = generatePhotoKey(photoId, 'thumbnail-small', 'jpg');
    const thumbnailLargeKey = generatePhotoKey(photoId, 'thumbnail-large', 'jpg');

    // Upload all versions in parallel
    const [originalUpload, smallUpload, largeUpload] = await Promise.all([
      uploadToStorage(originalKey, processed.original, processed.normalizedMimeType, {
        originalName: file.name,
        photoId,
      }),
      uploadToStorage(thumbnailSmallKey, processed.thumbnailSmall, 'image/jpeg', {
        photoId,
        thumbnailSize: 'small',
      }),
      uploadToStorage(thumbnailLargeKey, processed.thumbnailLarge, 'image/jpeg', {
        photoId,
        thumbnailSize: 'large',
      }),
    ]);

    // Check for upload errors
    if (!originalUpload.success || !smallUpload.success || !largeUpload.success) {
      const errors = [
        originalUpload.error,
        smallUpload.error,
        largeUpload.error,
      ].filter(Boolean);
      return {
        success: false,
        error: `Upload failed: ${errors.join(', ')}`,
      };
    }

    // Create metadata
    const metadata: PhotoMetadata = {
      id: photoId,
      originalName: file.name,
      mimeType: processed.normalizedMimeType,
      size: processed.original.length,
      width: processed.dimensions.width,
      height: processed.dimensions.height,
      exif: processed.exif,
      uploadedAt: new Date(),
    };

    // Create response
    const uploadedPhoto: UploadedPhoto = {
      id: photoId,
      originalUrl: getPublicUrl(originalKey),
      thumbnailSmallUrl: getPublicUrl(thumbnailSmallKey),
      thumbnailLargeUrl: getPublicUrl(thumbnailLargeKey),
      metadata,
    };

    return {
      success: true,
      photo: uploadedPhoto,
    };
  } catch (error) {
    console.error('File processing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Processing failed',
    };
  }
}
