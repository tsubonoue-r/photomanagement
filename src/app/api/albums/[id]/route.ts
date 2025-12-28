import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { Album, AlbumPhoto, UpdateAlbumRequest, AddPhotosRequest, ReorderPhotosRequest } from '@/types/album';

const albumStore = new Map<string, Album>();

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const album = albumStore.get(id);

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    return NextResponse.json(album);
  } catch (error) {
    console.error('Error fetching album:', error);
    return NextResponse.json({ error: 'Failed to fetch album' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const album = albumStore.get(id);

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const body: UpdateAlbumRequest = await request.json();

    if (body.title !== undefined) {
      album.title = body.title.trim();
      album.cover.title = body.title.trim();
    }

    if (body.description !== undefined) {
      album.description = body.description.trim();
    }

    if (body.cover) {
      album.cover = { ...album.cover, ...body.cover };
    }

    if (body.status !== undefined) {
      album.status = body.status;
    }

    if (body.exportOptions) {
      album.exportOptions = { ...album.exportOptions, ...body.exportOptions };
    }

    album.updatedAt = new Date();
    albumStore.set(id, album);

    return NextResponse.json(album);
  } catch (error) {
    console.error('Error updating album:', error);
    return NextResponse.json({ error: 'Failed to update album' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const album = albumStore.get(id);

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    albumStore.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting album:', error);
    return NextResponse.json({ error: 'Failed to delete album' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const album = albumStore.get(id);

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'addPhotos': {
        const body: AddPhotosRequest = await request.json();

        if (!body.photoIds || body.photoIds.length === 0) {
          return NextResponse.json({ error: 'photoIds is required' }, { status: 400 });
        }

        const currentMaxOrder = album.photos.length > 0 ? Math.max(...album.photos.map(p => p.order)) : -1;

        const newPhotos: AlbumPhoto[] = body.photoIds.map((photoId, index) => ({
          id: uuidv4(),
          photoId,
          photo: {
            id: photoId,
            originalUrl: '',
            thumbnailSmallUrl: '',
            thumbnailLargeUrl: '',
            metadata: {
              id: photoId,
              originalName: '',
              mimeType: 'image/jpeg',
              size: 0,
              width: 0,
              height: 0,
              exif: {},
              uploadedAt: new Date(),
            },
          },
          order: currentMaxOrder + 1 + index,
          includeBlackboard: body.includeBlackboard ?? true,
        }));

        album.photos.push(...newPhotos);
        album.updatedAt = new Date();
        albumStore.set(id, album);

        return NextResponse.json(album);
      }

      case 'removePhotos': {
        const body: { photoIds: string[] } = await request.json();

        if (!body.photoIds || body.photoIds.length === 0) {
          return NextResponse.json({ error: 'photoIds is required' }, { status: 400 });
        }

        album.photos = album.photos.filter(p => !body.photoIds.includes(p.photoId));
        album.photos.forEach((photo, index) => { photo.order = index; });
        album.updatedAt = new Date();
        albumStore.set(id, album);

        return NextResponse.json(album);
      }

      case 'reorderPhotos': {
        const body: ReorderPhotosRequest = await request.json();

        if (!body.photoOrders || body.photoOrders.length === 0) {
          return NextResponse.json({ error: 'photoOrders is required' }, { status: 400 });
        }

        const orderMap = new Map(body.photoOrders.map(po => [po.photoId, po.order]));

        album.photos.forEach(photo => {
          const newOrder = orderMap.get(photo.photoId);
          if (newOrder !== undefined) {
            photo.order = newOrder;
          }
        });

        album.photos.sort((a, b) => a.order - b.order);
        album.updatedAt = new Date();
        albumStore.set(id, album);

        return NextResponse.json(album);
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error patching album:', error);
    return NextResponse.json({ error: 'Failed to update album' }, { status: 500 });
  }
}
