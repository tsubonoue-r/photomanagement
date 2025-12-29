/**
 * Album Export API Route
 * POST /api/albums/[id]/export - Export album
 *
 * Issue #10: Album and Report Output
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAlbum, markAsExported } from '@/lib/album/album-service';
import { generatePDF } from '@/lib/export/pdf-generator';
import { generateExcel } from '@/lib/export/excel-generator';
import { generateZIP } from '@/lib/export/zip-generator';
import { ExportOptions, DEFAULT_EXPORT_OPTIONS } from '@/types/album';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/albums/[id]/export
 * Export album in specified format
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Get album
    const album = await getAlbum(id);
    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }

    // Validate album has photos
    if (album.photos.length === 0) {
      return NextResponse.json(
        { error: 'Album has no photos to export' },
        { status: 400 }
      );
    }

    // Merge options with defaults
    const options: ExportOptions = {
      ...DEFAULT_EXPORT_OPTIONS,
      ...body.options,
    };

    let buffer: Buffer;
    let filename: string;
    let contentType: string;
    let pageCount = 0;

    // Generate export based on format
    switch (options.format) {
      case 'pdf': {
        const result = await generatePDF(album, options);
        buffer = result.buffer;
        filename = result.filename;
        pageCount = result.pageCount;
        contentType = 'application/pdf';
        break;
      }

      case 'excel': {
        const result = await generateExcel(album, options);
        buffer = result.buffer;
        filename = result.filename;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      }

      case 'zip': {
        const result = await generateZIP(album, options);
        buffer = result.buffer;
        filename = result.filename;
        contentType = 'application/zip';
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid export format' },
          { status: 400 }
        );
    }

    // Mark album as exported
    await markAsExported(id);

    // Check if client wants download or metadata response
    const downloadMode = request.nextUrl.searchParams.get('download') === 'true';

    if (downloadMode) {
      // Return file directly for download
      const uint8Array = new Uint8Array(buffer);
      return new NextResponse(uint8Array, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': buffer.length.toString(),
        },
      });
    }

    // Return metadata response (for UI to display info before download)
    return NextResponse.json({
      success: true,
      filename,
      size: buffer.length,
      pageCount: pageCount || undefined,
      format: options.format,
      url: `/api/albums/${id}/export?download=true&format=${options.format}`,
    });
  } catch (error) {
    console.error('Failed to export album:', error);
    return NextResponse.json(
      { error: 'Failed to export album' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/albums/[id]/export
 * Download previously generated export
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const format = request.nextUrl.searchParams.get('format') || 'pdf';

    // Get album
    const album = await getAlbum(id);
    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      );
    }

    // Validate album has photos
    if (album.photos.length === 0) {
      return NextResponse.json(
        { error: 'Album has no photos to export' },
        { status: 400 }
      );
    }

    const options: ExportOptions = {
      ...DEFAULT_EXPORT_OPTIONS,
      format: format as 'pdf' | 'excel' | 'zip',
    };

    let buffer: Buffer;
    let filename: string;
    let contentType: string;

    switch (format) {
      case 'pdf': {
        const result = await generatePDF(album, options);
        buffer = result.buffer;
        filename = result.filename;
        contentType = 'application/pdf';
        break;
      }

      case 'excel': {
        const result = await generateExcel(album, options);
        buffer = result.buffer;
        filename = result.filename;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      }

      case 'zip': {
        const result = await generateZIP(album, options);
        buffer = result.buffer;
        filename = result.filename;
        contentType = 'application/zip';
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid export format' },
          { status: 400 }
        );
    }

    const uint8Array = new Uint8Array(buffer);
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Failed to download export:', error);
    return NextResponse.json(
      { error: 'Failed to download export' },
      { status: 500 }
    );
  }
}
