/**
 * Album Detail API Routes
 * GET /api/albums/[id] - Get album details
 * PATCH /api/albums/[id] - Update album
 * DELETE /api/albums/[id] - Delete album
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAlbumById, updateAlbum, deleteAlbum } from '@/lib/album/album-service';
import type { UpdateAlbumInput, AlbumApiResponse, Album } from '@/types/album';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/albums/[id]
 * Get album details
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<AlbumApiResponse<Album>>> {
  try {
    const { id } = await params;
    const album = await getAlbumById(id);

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
    console.error('Error fetching album:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch album',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/albums/[id]
 * Update album
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<AlbumApiResponse<Album>>> {
  try {
    const { id } = await params;
    const body = await request.json() as UpdateAlbumInput;

    const album = await updateAlbum(id, body);

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
    console.error('Error updating album:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update album',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/albums/[id]
 * Delete album
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<AlbumApiResponse<{ deleted: boolean }>>> {
  try {
    const { id } = await params;
    const deleted = await deleteAlbum(id);

    if (!deleted) {
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
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error deleting album:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete album',
      },
      { status: 500 }
    );
  }
}
