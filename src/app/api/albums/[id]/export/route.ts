import { NextRequest, NextResponse } from 'next/server';
import { Album, ExportAlbumRequest, ExportOptions, DEFAULT_EXPORT_OPTIONS } from '@/types/album';
import { generatePdfAlbum } from '@/lib/pdf-generator';
import { generateExcelReport } from '@/lib/excel-generator';

const albumStore = new Map<string, Album>();

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const album = albumStore.get(id);

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    if (album.photos.length === 0) {
      return NextResponse.json({ error: 'Album has no photos to export' }, { status: 400 });
    }

    const body: ExportAlbumRequest = await request.json();
    const options: ExportOptions = { ...DEFAULT_EXPORT_OPTIONS, ...body.options };

    let result;

    if (options.format === 'pdf') {
      result = await generatePdfAlbum(album, options);
    } else if (options.format === 'excel') {
      result = await generateExcelReport(album, options);
    } else {
      return NextResponse.json({ error: 'Unsupported export format' }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Export failed' }, { status: 500 });
    }

    album.lastExportedAt = new Date();
    album.exportOptions = options;
    album.status = 'exported';
    album.updatedAt = new Date();
    albumStore.set(id, album);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error exporting album:', error);
    return NextResponse.json({ error: 'Failed to export album' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const album = albumStore.get(id);

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'pdf';
    const layout = parseInt(searchParams.get('layout') || '2', 10) as 1 | 2 | 4;

    const photosPerPage = layout;
    const photoCount = album.photos.length;
    const contentPages = Math.ceil(photoCount / photosPerPage);
    const hasCover = album.exportOptions.includeCover;
    const hasToc = album.exportOptions.includeToc;

    const totalPages = contentPages + (hasCover ? 1 : 0) + (hasToc ? 1 : 0);

    const preview = {
      albumId: album.id,
      title: album.title,
      photoCount,
      estimatedPages: totalPages,
      currentOptions: album.exportOptions,
      estimatedFileSize: format === 'pdf'
        ? `${Math.round(photoCount * 0.5 + 1)} MB`
        : `${Math.round(photoCount * 0.1 + 0.5)} MB`,
      lastExportedAt: album.lastExportedAt,
    };

    return NextResponse.json(preview);
  } catch (error) {
    console.error('Error getting export preview:', error);
    return NextResponse.json({ error: 'Failed to get export preview' }, { status: 500 });
  }
}
