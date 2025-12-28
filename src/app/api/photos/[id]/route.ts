/**
 * Photo Detail API Endpoint
 * Handles GET (fetch), DELETE operations for individual photos
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  deleteFromStorage,
  existsInStorage,
  getSignedDownloadUrl,
  generatePhotoKey,
} from '@/lib/storage';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/photos/[id]
 * Get photo details and URLs
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    if (!id || !isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid photo ID' },
        { status: 400 }
      );
    }

    // Check if photo exists (try common extensions)
    const extensions = ['jpg', 'png'];
    let foundExtension: string | null = null;

    for (const ext of extensions) {
      const key = generatePhotoKey(id, 'original', ext);
      if (await existsInStorage(key)) {
        foundExtension = ext;
        break;
      }
    }

    if (!foundExtension) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Generate signed URLs for all versions
    const originalKey = generatePhotoKey(id, 'original', foundExtension);
    const thumbnailSmallKey = generatePhotoKey(id, 'thumbnail-small', 'jpg');
    const thumbnailLargeKey = generatePhotoKey(id, 'thumbnail-large', 'jpg');

    const [originalUrl, thumbnailSmallUrl, thumbnailLargeUrl] = await Promise.all([
      getSignedDownloadUrl(originalKey),
      getSignedDownloadUrl(thumbnailSmallKey),
      getSignedDownloadUrl(thumbnailLargeKey),
    ]);

    return NextResponse.json({
      id,
      originalUrl,
      thumbnailSmallUrl,
      thumbnailLargeUrl,
    });
  } catch (error) {
    console.error('Get photo error:', error);
    return NextResponse.json(
      { error: 'Failed to get photo' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/photos/[id]
 * Delete a photo and all its thumbnails
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    if (!id || !isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Invalid photo ID' },
        { status: 400 }
      );
    }

    // Find the photo extension
    const extensions = ['jpg', 'png'];
    let foundExtension: string | null = null;

    for (const ext of extensions) {
      const key = generatePhotoKey(id, 'original', ext);
      if (await existsInStorage(key)) {
        foundExtension = ext;
        break;
      }
    }

    if (!foundExtension) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Delete all versions
    const originalKey = generatePhotoKey(id, 'original', foundExtension);
    const thumbnailSmallKey = generatePhotoKey(id, 'thumbnail-small', 'jpg');
    const thumbnailLargeKey = generatePhotoKey(id, 'thumbnail-large', 'jpg');

    const deleteResults = await Promise.all([
      deleteFromStorage(originalKey),
      deleteFromStorage(thumbnailSmallKey),
      deleteFromStorage(thumbnailLargeKey),
    ]);

    const errors = deleteResults
      .filter((r) => !r.success)
      .map((r) => r.error);

    if (errors.length > 0) {
      console.warn('Some deletions failed:', errors);
    }

    return NextResponse.json({
      success: true,
      id,
      message: 'Photo deleted successfully',
    });
  } catch (error) {
    console.error('Delete photo error:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}

/**
 * Validate UUID format
 */
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
