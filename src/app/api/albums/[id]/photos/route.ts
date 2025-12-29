/**
 * Album Photos API Routes
 * POST /api/albums/[id]/photos - Add photo to album
 * DELETE /api/albums/[id]/photos - Remove photo from album
 * PATCH /api/albums/[id]/photos - Reorder photos
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  addPhotoToAlbum,
  removePhotoFromAlbum,
  reorderPhotos,
} from '@/lib/album/album-service';
import type {
  AlbumApiResponse,
  AlbumPhoto,
  Album,
  ReorderPhotosInput,
} from '@/types/album';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface AddPhotoInput {
  photoUrl: string;
  title: string;
  description?: string;
}

interface RemovePhotoInput {
  photoId: string;
}

/**
 * POST /api/albums/[id]/photos
 * Add photo to album
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<AlbumApiResponse<AlbumPhoto>>> {
  try {
    const { id } = await params;
    const body = await request.json() as AddPhotoInput;

    if (!body.photoUrl || !body.title) {
      return NextResponse.json(
        {
          success: false,
          error: 'Photo URL and title are required',
        },
        { status: 400 }
      );
    }

    const photo = await addPhotoToAlbum(
      id,
      body.photoUrl,
      body.title,
      body.description
    );

    if (!photo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Album not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: photo,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding photo to album:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add photo',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/albums/[id]/photos
 * Remove photo from album
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<AlbumApiResponse<{ deleted: boolean }>>> {
  try {
    const { id } = await params;
    const body = await request.json() as RemovePhotoInput;

    if (!body.photoId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Photo ID is required',
        },
        { status: 400 }
      );
    }

    const deleted = await removePhotoFromAlbum(id, body.photoId);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Album or photo not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error removing photo from album:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to remove photo',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/albums/[id]/photos
 * Reorder photos in album
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<AlbumApiResponse<Album>>> {
  try {
    const { id } = await params;
    const body = await request.json() as ReorderPhotosInput;

    if (!body.photoIds || !Array.isArray(body.photoIds)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Photo IDs array is required',
        },
        { status: 400 }
      );
    }

    const album = await reorderPhotos(id, body);

    if (!album) {
      return NextResponse.json(
        {
          success: false,
          error: 'Album not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: album,
    });
  } catch (error) {
    console.error('Error reordering photos:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reorder photos',
      },
      { status: 500 }
    );
  }
}
