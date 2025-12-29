/**
 * Presigned URL API Endpoint
 * Generates presigned URLs for direct client-to-S3 uploads
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  getSignedUploadUrl,
  getSignedDownloadUrl,
  generatePhotoKey,
  getPublicUrl,
} from '@/lib/storage';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/types/photo';

// Route segment config for Next.js App Router
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Request body for generating upload presigned URL
 */
interface PresignedUploadRequest {
  filename: string;
  contentType: string;
  size: number;
}

/**
 * Response for presigned upload URL
 */
interface PresignedUploadResponse {
  photoId: string;
  uploadUrl: string;
  thumbnailSmallUploadUrl: string;
  thumbnailLargeUploadUrl: string;
  originalKey: string;
  thumbnailSmallKey: string;
  thumbnailLargeKey: string;
  publicUrl: string;
  expiresIn: number;
}

/**
 * POST /api/photos/presigned
 * Generate presigned URLs for direct S3 upload
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PresignedUploadRequest;
    const { filename, contentType, size } = body;

    // Validate request
    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'Missing required fields: filename, contentType' },
        { status: 400 }
      );
    }

    // Validate content type
    const normalizedMimeType = contentType.toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(normalizedMimeType as typeof ALLOWED_MIME_TYPES[number])) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${contentType}. Allowed types: JPEG, PNG, HEIC`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (size && size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024}MB)`,
        },
        { status: 400 }
      );
    }

    // Generate unique photo ID
    const photoId = uuidv4();

    // Determine file extension
    const extensionMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/heic': 'heic',
      'image/heif': 'heif',
    };
    const extension = extensionMap[normalizedMimeType] || 'jpg';

    // Generate storage keys
    const originalKey = generatePhotoKey(photoId, 'original', extension);
    const thumbnailSmallKey = generatePhotoKey(photoId, 'thumbnail-small', 'jpg');
    const thumbnailLargeKey = generatePhotoKey(photoId, 'thumbnail-large', 'jpg');

    // URL expiration time in seconds
    const expiresIn = 3600; // 1 hour

    // Generate presigned URLs for all uploads
    const [uploadUrl, thumbnailSmallUploadUrl, thumbnailLargeUploadUrl] =
      await Promise.all([
        getSignedUploadUrl(originalKey, normalizedMimeType, expiresIn),
        getSignedUploadUrl(thumbnailSmallKey, 'image/jpeg', expiresIn),
        getSignedUploadUrl(thumbnailLargeKey, 'image/jpeg', expiresIn),
      ]);

    const response: PresignedUploadResponse = {
      photoId,
      uploadUrl,
      thumbnailSmallUploadUrl,
      thumbnailLargeUploadUrl,
      originalKey,
      thumbnailSmallKey,
      thumbnailLargeKey,
      publicUrl: getPublicUrl(originalKey),
      expiresIn,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Presigned URL generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate presigned URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/photos/presigned
 * Generate presigned URL for downloading a file
 *
 * Query Parameters:
 * - key: string - Required. Storage key of the file
 * - expiresIn: number - Optional. URL expiration time in seconds (default: 3600, max: 604800)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');
    const expiresInParam = searchParams.get('expiresIn');

    if (!key) {
      return NextResponse.json(
        { error: 'Missing required parameter: key' },
        { status: 400 }
      );
    }

    const expiresIn = expiresInParam ? parseInt(expiresInParam, 10) : 3600;

    // Validate expiresIn (max 7 days)
    if (expiresIn < 1 || expiresIn > 604800) {
      return NextResponse.json(
        { error: 'expiresIn must be between 1 and 604800 seconds' },
        { status: 400 }
      );
    }

    const downloadUrl = await getSignedDownloadUrl(key, expiresIn);

    return NextResponse.json({
      downloadUrl,
      key,
      expiresIn,
    });
  } catch (error) {
    console.error('Presigned download URL generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate presigned download URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
