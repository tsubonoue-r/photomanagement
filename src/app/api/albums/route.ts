/**
 * Albums API Routes
 * GET /api/albums - List albums
 * POST /api/albums - Create album
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAlbum, getAlbums } from '@/lib/album/album-service';
import type { CreateAlbumInput, AlbumApiResponse, Album, AlbumListResponse } from '@/types/album';

/**
 * GET /api/albums
 * List all albums for the current user
 */
export async function GET(request: NextRequest): Promise<NextResponse<AlbumApiResponse<AlbumListResponse>>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    // TODO: Get userId from session
    const userId = 'default-user';

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
 */
export async function POST(request: NextRequest): Promise<NextResponse<AlbumApiResponse<Album>>> {
  try {
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

    // Use title as name if name not provided
    const input: CreateAlbumInput = {
      ...body,
      name: body.name || body.title,
      title: body.title || body.name,
    };

    // TODO: Get userId from session
    const userId = 'default-user';

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
