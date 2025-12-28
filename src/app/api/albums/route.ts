import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  Album,
  AlbumListResponse,
  CreateAlbumRequest,
  DEFAULT_EXPORT_OPTIONS,
} from '@/types/album';

// In-memory storage for development
const albumStore = new Map<string, Album>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    let albums = Array.from(albumStore.values());

    if (projectId) {
      albums = albums.filter((album) => album.projectId === projectId);
    }

    albums.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const total = albums.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedAlbums = albums.slice(startIndex, startIndex + pageSize);

    const response: AlbumListResponse = {
      albums: paginatedAlbums,
      total,
      page,
      pageSize,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching albums:', error);
    return NextResponse.json(
      { error: 'Failed to fetch albums' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateAlbumRequest = await request.json();

    if (!body.projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    if (!body.title || body.title.trim() === '') {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const now = new Date();
    const album: Album = {
      id: uuidv4(),
      projectId: body.projectId,
      title: body.title.trim(),
      description: body.description?.trim(),
      cover: {
        title: body.title.trim(),
        subtitle: body.cover?.subtitle,
        projectName: body.cover?.projectName,
        date: body.cover?.date || now.toISOString().split('T')[0],
        companyName: body.cover?.companyName,
        logoUrl: body.cover?.logoUrl,
        backgroundColor: body.cover?.backgroundColor || '#ffffff',
      },
      photos: [],
      status: 'draft',
      exportOptions: { ...DEFAULT_EXPORT_OPTIONS },
      createdAt: now,
      updatedAt: now,
    };

    albumStore.set(album.id, album);

    return NextResponse.json(album, { status: 201 });
  } catch (error) {
    console.error('Error creating album:', error);
    return NextResponse.json({ error: 'Failed to create album' }, { status: 500 });
  }
}
