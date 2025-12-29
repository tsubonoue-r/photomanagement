/**
 * Album Detail API Route
 * GET /api/albums/[id] - Get album
 * PUT /api/albums/[id] - Update album
 * PATCH /api/albums/[id] - Partial operations (add/remove/reorder photos)
 * DELETE /api/albums/[id] - Delete album
 *
 * Issue #10: Album and Report Output
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAlbum,
  updateAlbum,
  deleteAlbum,
  addPhotosToAlbum,
  removePhotosFromAlbum,
  reorderPhotos,
} from '@/lib/album/album-service';
import { UpdateAlbumInput } from '@/types/album';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/albums/[id]
 * Get a single album by ID
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const album = await getAlbum(id);

    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(album);
  } catch (error) {
    console.error('Failed to fetch album:', error);
    return NextResponse.json(
      { error: 'Failed to fetch album' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/albums/[id]
 * Update album metadata
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const input: UpdateAlbumInput = {
      name: body.name,
      title: body.title,
      description: body.description,
      coverPhotoId: body.coverPhotoId,
      cover: body.cover,
      status: body.status,
      exportOptions: body.exportOptions,
    };

    const album = await updateAlbum(id, input);

    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(album);
  } catch (error) {
    console.error('Failed to update album:', error);
    return NextResponse.json(
      { error: 'Failed to update album' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/albums/[id]
 * Perform partial operations on album
 *
 * Actions:
 * - addPhotos: Add photos to album
 * - removePhotos: Remove photos from album
 * - reorderPhotos: Reorder photos in album
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const action = request.nextUrl.searchParams.get('action');
    const body = await request.json();

    let album;

    switch (action) {
      case 'addPhotos':
        if (!body.photos || !Array.isArray(body.photos)) {
          return NextResponse.json(
            { error: 'Photos array is required' },
            { status: 400 }
          );
        }
        album = await addPhotosToAlbum(id, body.photos);
        break;

      case 'removePhotos':
        if (!body.photoIds || !Array.isArray(body.photoIds)) {
          return NextResponse.json(
            { error: 'Photo IDs array is required' },
            { status: 400 }
          );
        }
        album = await removePhotosFromAlbum(id, body.photoIds);
        break;

      case 'reorderPhotos':
        if (!body.photoOrders || !Array.isArray(body.photoOrders)) {
          return NextResponse.json(
            { error: 'Photo orders array is required' },
            { status: 400 }
          );
        }
        album = await reorderPhotos(id, body.photoOrders);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Valid actions: addPhotos, removePhotos, reorderPhotos' },
          { status: 400 }
        );
    }

    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(album);
  } catch (error) {
    console.error('Failed to perform album action:', error);
    return NextResponse.json(
      { error: 'Failed to perform album action' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/albums/[id]
 * Delete an album
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const success = await deleteAlbum(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete album:', error);
    return NextResponse.json(
      { error: 'Failed to delete album' },
      { status: 500 }
    );
  }
}
