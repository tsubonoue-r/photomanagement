/**
 * Album Detail API Routes
 * GET /api/albums/[id] - Get album details
 * PATCH /api/albums/[id] - Update album
 * DELETE /api/albums/[id] - Delete album
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAlbum, updateAlbum, deleteAlbum } from '@/lib/album/album-service';
import { requireAuth, withResourceAccess } from '@/lib/authorization';
import type { UpdateAlbumInput, AlbumApiResponse, Album } from '@/types/album';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/albums/[id]
 * Get album details
 * Requires: Authentication + Project VIEWER role
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<AlbumApiResponse<Album>>> {
  try {
    // Check authentication
    const { session, error: authError } = await requireAuth();
    if (authError) return authError as unknown as NextResponse<AlbumApiResponse<Album>>;

    const { id } = await params;

    // Check resource access (album -> project -> VIEWER role)
    const accessError = await withResourceAccess('album', id, 'VIEWER');
    if (accessError) return accessError as unknown as NextResponse<AlbumApiResponse<Album>>;

    const album = await getAlbum(id);

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
 * Requires: Authentication + Project MEMBER role
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<AlbumApiResponse<Album>>> {
  try {
    // Check authentication
    const { session, error: authError } = await requireAuth();
    if (authError) return authError as unknown as NextResponse<AlbumApiResponse<Album>>;

    const { id } = await params;

    // Check resource access (album -> project -> MEMBER role for updates)
    const accessError = await withResourceAccess('album', id, 'MEMBER');
    if (accessError) return accessError as unknown as NextResponse<AlbumApiResponse<Album>>;

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
 * Requires: Authentication + Project MANAGER role
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<AlbumApiResponse<{ deleted: boolean }>>> {
  try {
    // Check authentication
    const { session, error: authError } = await requireAuth();
    if (authError) return authError as unknown as NextResponse<AlbumApiResponse<{ deleted: boolean }>>;

    const { id } = await params;

    // Check resource access (album -> project -> MANAGER role for delete)
    const accessError = await withResourceAccess('album', id, 'MANAGER');
    if (accessError) return accessError as unknown as NextResponse<AlbumApiResponse<{ deleted: boolean }>>;

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
