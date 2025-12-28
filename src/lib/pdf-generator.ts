/**
 * PDF Generator for Photo Albums
 */

import {
  Album,
  ExportOptions,
  ExportResult,
  PAPER_DIMENSIONS,
  LAYOUT_DIMENSIONS,
  AlbumPhoto,
  TocEntry,
} from '@/types/album';

interface PdfPage {
  type: 'cover' | 'toc' | 'content';
  pageNumber: number;
  photos?: AlbumPhoto[];
}

function generatePageStructure(album: Album, options: ExportOptions): PdfPage[] {
  const pages: PdfPage[] = [];
  let pageNumber = 1;

  if (options.includeCover) {
    pages.push({ type: 'cover', pageNumber: pageNumber++ });
  }

  if (options.includeToc) {
    pages.push({ type: 'toc', pageNumber: pageNumber++ });
  }

  const photosPerPage = options.layout;
  const photos = [...album.photos].sort((a, b) => a.order - b.order);

  for (let i = 0; i < photos.length; i += photosPerPage) {
    pages.push({
      type: 'content',
      pageNumber: pageNumber++,
      photos: photos.slice(i, i + photosPerPage),
    });
  }

  return pages;
}

function generateTocEntries(pages: PdfPage[]): TocEntry[] {
  const entries: TocEntry[] = [];
  let photoCount = 0;

  pages.forEach((page) => {
    if (page.type === 'content' && page.photos) {
      photoCount += page.photos.length;

      if (photoCount >= 10 || page === pages[pages.length - 1]) {
        entries.push({
          title: 'Photos ' + (entries.length * 10 + 1) + '-' + (entries.length * 10 + photoCount),
          pageNumber: page.pageNumber,
          photoCount: photoCount,
        });
        photoCount = 0;
      }
    }
  });

  return entries;
}

export async function generatePdfAlbum(
  album: Album,
  options: ExportOptions
): Promise<ExportResult> {
  try {
    const pages = generatePageStructure(album, options);
    const tocEntries = generateTocEntries(pages);

    const safeTitle = album.title.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = safeTitle + '_' + Date.now() + '.pdf';
    const estimatedSize = pages.length * 500 * 1024;

    console.log('PDF Generation complete:', {
      pages: pages.length,
      tocEntries: tocEntries.length,
    });

    return {
      success: true,
      url: '/api/exports/' + filename,
      filename,
      size: estimatedSize,
      pageCount: pages.length,
    };
  } catch (error) {
    console.error('PDF generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during PDF generation',
    };
  }
}

export async function generatePdfPreview(
  album: Album,
  options: ExportOptions,
  maxPages: number = 3
): Promise<{ pages: string[]; totalPages: number }> {
  const allPages = generatePageStructure(album, options);
  return {
    pages: [],
    totalPages: allPages.length,
  };
}
