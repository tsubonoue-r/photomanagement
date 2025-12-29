/**
 * Albums API Routes
 * GET /api/albums - List albums
 * POST /api/albums - Create album
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAlbum, getAlbums } from '@/lib/album/album-service';
import { requireAuth, withProjectAccess } from '@/lib/authorization';
import type { CreateAlbumInput, AlbumApiResponse, Album, AlbumListResponse } from '@/types/album';

/**
 * GET /api/albums
 * List all albums for the current user
 * Requires: Authentication + Project VIEWER role
 */
export async function GET(request: NextRequest): Promise<NextResponse<AlbumApiResponse<AlbumListResponse>>> {
  try {
    // Check authentication
    const { session, error: authError } = await requireAuth();
    if (authError) return authError as unknown as NextResponse<AlbumApiResponse<AlbumListResponse>>;

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const projectId = searchParams.get('projectId');

    // Check project access if projectId is provided
    if (projectId) {
      const accessError = await withProjectAccess(projectId, 'VIEWER');
      if (accessError) return accessError as unknown as NextResponse<AlbumApiResponse<AlbumListResponse>>;
    }

    // Use authenticated user ID
    const userId = session.user.id;

    const result = await getAlbums(userId, page, pageSize);

    return NextResponse.json({
      success: true,
      data: {
        albums: result.albums,
        total: result.total,
        page,
        pageSize,
      },
    });
  } catch (error) {
    console.error('Error fetching albums:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch albums',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/albums
 * Create a new album
 * Requires: Authentication + Project MEMBER role
 */
export async function POST(request: NextRequest): Promise<NextResponse<AlbumApiResponse<Album>>> {
  try {
    // Check authentication
    const { session, error: authError } = await requireAuth();
    if (authError) return authError as unknown as NextResponse<AlbumApiResponse<Album>>;

    const body = await request.json() as CreateAlbumInput;

    if (!body.name && !body.title) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name or title is required',
        },
        { status: 400 }
      );
    }

    // Check project access if projectId is provided (MEMBER role for creating)
    if (body.projectId) {
      const accessError = await withProjectAccess(body.projectId, 'MEMBER');
      if (accessError) return accessError as unknown as NextResponse<AlbumApiResponse<Album>>;
    }

    // Use title as name if name not provided
    const input: CreateAlbumInput = {
      ...body,
      name: body.name || body.title,
      title: body.title || body.name,
    };

    // Use authenticated user ID
    const userId = session.user.id;

    const album = await createAlbum(input, userId);

    return NextResponse.json(
      {
        success: true,
        data: album,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating album:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create album',
      },
      { status: 500 }
    );
  }
}
