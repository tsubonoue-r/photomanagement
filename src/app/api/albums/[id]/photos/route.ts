/**
 * Album Photos API Route
 * GET /api/albums/[id]/photos - Get available photos for album
 *
 * Issue #10: Album and Report Output
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAlbum, getAvailablePhotos } from '@/lib/album/album-service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/albums/[id]/photos
 * Get photos available to add to this album
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    // Get album to find project ID
    const album = await getAlbum(id);
    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    if (!album.projectId) {
      return NextResponse.json({
        photos: [],
        total: 0,
        message: 'Album is not associated with a project',
      });
    }

    const result = await getAvailablePhotos(album.projectId, id, page, pageSize);

    return NextResponse.json({
      photos: result.photos,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize),
    });
  } catch (error) {
    console.error('Failed to fetch available photos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available photos' },
      { status: 500 }
    );
  }
}
