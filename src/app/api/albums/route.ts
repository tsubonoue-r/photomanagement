/**
 * Albums API Route
 * GET /api/albums - List albums
 * POST /api/albums - Create album
 *
 * Issue #10: Album and Report Output
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAlbums,
  createAlbum,
} from '@/lib/album/album-service';
import { CreateAlbumInput } from '@/types/album';

/**
 * GET /api/albums
 * List all albums, optionally filtered by project
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const result = await getAlbums(projectId, page, pageSize);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch albums:', error);
    return NextResponse.json(
      { error: 'Failed to fetch albums' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/albums
 * Create a new album
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const input: CreateAlbumInput = {
      name: body.name || body.title,
      title: body.title,
      description: body.description,
      projectId: body.projectId,
      cover: body.cover,
    };

    // Use a placeholder user ID for now
    const userId = body.userId || 'user_demo';

    const album = await createAlbum(input, userId);

    return NextResponse.json(album, { status: 201 });
  } catch (error) {
    console.error('Failed to create album:', error);
    return NextResponse.json(
      { error: 'Failed to create album' },
      { status: 500 }
    );
  }
}
