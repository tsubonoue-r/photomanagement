/**
 * PDF Generator for Album Export
 * Issue #10: Album and Report Output
 *
 * Generates PDF documents with:
 * - Cover page
 * - Table of contents
 * - Photo pages (1, 2, or 4 photos per page)
 * - Blackboard information overlay
 */

import { jsPDF } from 'jspdf';
import { Album, ExportOptions, AlbumPhoto } from '@/types/album';

// Paper dimensions in mm
const PAPER_SIZES = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
};

// Margins in mm
const MARGINS = {
  top: 15,
  bottom: 15,
  left: 15,
  right: 15,
};

interface PDFGeneratorResult {
  buffer: Buffer;
  pageCount: number;
  filename: string;
}

/**
 * Generate PDF from album
 */
export async function generatePDF(
  album: Album,
  options: ExportOptions
): Promise<PDFGeneratorResult> {
  const paperSize = PAPER_SIZES[options.paperSize];
  const isLandscape = options.orientation === 'landscape';

  const width = isLandscape ? paperSize.height : paperSize.width;
  const height = isLandscape ? paperSize.width : paperSize.height;

  const doc = new jsPDF({
    orientation: options.orientation,
    unit: 'mm',
    format: options.paperSize.toLowerCase() as 'a4' | 'a3',
  });

  let pageCount = 0;

  // Add cover page
  if (options.includeCover) {
    addCoverPage(doc, album, width, height);
    pageCount++;
  }

  // Add table of contents
  if (options.includeToc && album.photos.length > 0) {
    doc.addPage();
    addTableOfContents(doc, album, width, height);
    pageCount++;
  }

  // Add photo pages
  const photoPages = generatePhotoPages(album.photos, options.layout);
  for (let i = 0; i < photoPages.length; i++) {
    doc.addPage();
    addPhotoPage(doc, photoPages[i], options, width, height, i + 1);
    pageCount++;
  }

  // Generate buffer
  const arrayBuffer = doc.output('arraybuffer');
  const buffer = Buffer.from(arrayBuffer);

  const filename = `${album.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

  return {
    buffer,
    pageCount,
    filename,
  };
}

/**
 * Add cover page to PDF
 */
function addCoverPage(
  doc: jsPDF,
  album: Album,
  width: number,
  height: number
): void {
  const cover = album.cover;
  const centerX = width / 2;

  // Background color
  if (cover.backgroundColor) {
    doc.setFillColor(cover.backgroundColor);
    doc.rect(0, 0, width, height, 'F');
  }

  // Title
  doc.setFontSize(28);
  doc.setTextColor(33, 33, 33);
  doc.text(cover.title, centerX, height * 0.35, { align: 'center' });

  // Subtitle
  if (cover.subtitle) {
    doc.setFontSize(16);
    doc.setTextColor(100, 100, 100);
    doc.text(cover.subtitle, centerX, height * 0.42, { align: 'center' });
  }

  // Project name
  if (cover.projectName) {
    doc.setFontSize(14);
    doc.setTextColor(66, 66, 66);
    doc.text(cover.projectName, centerX, height * 0.55, { align: 'center' });
  }

  // Company name
  if (cover.companyName) {
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(cover.companyName, centerX, height * 0.85, { align: 'center' });
  }

  // Date
  const dateStr = cover.date || new Date().toLocaleDateString('ja-JP');
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text(dateStr, centerX, height * 0.9, { align: 'center' });
}

/**
 * Add table of contents page
 */
function addTableOfContents(
  doc: jsPDF,
  album: Album,
  width: number,
  height: number
): void {
  const contentWidth = width - MARGINS.left - MARGINS.right;

  // Title
  doc.setFontSize(20);
  doc.setTextColor(33, 33, 33);
  doc.text('Table of Contents', width / 2, MARGINS.top + 10, {
    align: 'center',
  });

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(
    MARGINS.left,
    MARGINS.top + 18,
    width - MARGINS.right,
    MARGINS.top + 18
  );

  // Photo list
  doc.setFontSize(11);
  let y = MARGINS.top + 30;
  const lineHeight = 8;

  album.photos.forEach((photo, index) => {
    if (y > height - MARGINS.bottom - 20) {
      doc.addPage();
      y = MARGINS.top + 20;
    }

    const pageNum = Math.floor(index / 2) + 3; // Assuming 2 photos per page, after cover and TOC

    doc.setTextColor(66, 66, 66);
    doc.text(`${index + 1}. ${photo.title}`, MARGINS.left, y);

    // Page number with dots
    const pageNumStr = `${pageNum}`;
    const pageNumWidth = doc.getTextWidth(pageNumStr);
    doc.text(pageNumStr, width - MARGINS.right - pageNumWidth, y);

    // Dotted line
    const titleWidth = doc.getTextWidth(`${index + 1}. ${photo.title}`);
    const dotsStart = MARGINS.left + titleWidth + 5;
    const dotsEnd = width - MARGINS.right - pageNumWidth - 5;

    doc.setLineDashPattern([1, 2], 0);
    doc.line(dotsStart, y, dotsEnd, y);
    doc.setLineDashPattern([], 0);

    y += lineHeight;
  });
}

/**
 * Group photos into pages based on layout
 */
function generatePhotoPages(
  photos: AlbumPhoto[],
  layout: 1 | 2 | 4
): AlbumPhoto[][] {
  const pages: AlbumPhoto[][] = [];

  for (let i = 0; i < photos.length; i += layout) {
    pages.push(photos.slice(i, i + layout));
  }

  return pages;
}

/**
 * Add photo page to PDF
 */
function addPhotoPage(
  doc: jsPDF,
  photos: AlbumPhoto[],
  options: ExportOptions,
  width: number,
  height: number,
  pageNumber: number
): void {
  const contentWidth = width - MARGINS.left - MARGINS.right;
  const contentHeight = height - MARGINS.top - MARGINS.bottom - 10; // Reserve space for page number

  // Calculate photo positions based on layout
  const positions = getPhotoPositions(
    options.layout,
    contentWidth,
    contentHeight
  );

  photos.forEach((photo, index) => {
    if (index >= positions.length) return;

    const pos = positions[index];

    // Photo placeholder (border)
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(245, 245, 245);
    doc.rect(
      MARGINS.left + pos.x,
      MARGINS.top + pos.y,
      pos.width,
      pos.height,
      'FD'
    );

    // Photo title
    doc.setFontSize(9);
    doc.setTextColor(66, 66, 66);
    const titleY = MARGINS.top + pos.y + pos.height + 5;
    doc.text(photo.title, MARGINS.left + pos.x, titleY, {
      maxWidth: pos.width,
    });

    // Blackboard info if enabled
    if (options.includeBlackboard && photo.blackboardInfo) {
      const infoY = titleY + 5;
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);

      const infoLines: string[] = [];
      if (photo.blackboardInfo.projectName) {
        infoLines.push(`Project: ${photo.blackboardInfo.projectName}`);
      }
      if (photo.blackboardInfo.constructionType) {
        infoLines.push(`Type: ${photo.blackboardInfo.constructionType}`);
      }
      if (photo.blackboardInfo.date) {
        infoLines.push(
          `Date: ${new Date(photo.blackboardInfo.date).toLocaleDateString('ja-JP')}`
        );
      }

      infoLines.forEach((line, lineIndex) => {
        doc.text(line, MARGINS.left + pos.x, infoY + lineIndex * 4, {
          maxWidth: pos.width,
        });
      });
    }
  });

  // Page number footer
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text(`Page ${pageNumber}`, width / 2, height - 10, { align: 'center' });
}

/**
 * Get photo positions for each layout
 */
function getPhotoPositions(
  layout: 1 | 2 | 4,
  contentWidth: number,
  contentHeight: number
): { x: number; y: number; width: number; height: number }[] {
  const gap = 10;
  const captionSpace = 20;

  switch (layout) {
    case 1:
      return [
        {
          x: 0,
          y: 0,
          width: contentWidth,
          height: contentHeight - captionSpace,
        },
      ];

    case 2:
      const halfHeight = (contentHeight - gap - captionSpace * 2) / 2;
      return [
        { x: 0, y: 0, width: contentWidth, height: halfHeight },
        {
          x: 0,
          y: halfHeight + gap + captionSpace,
          width: contentWidth,
          height: halfHeight,
        },
      ];

    case 4:
      const halfWidth = (contentWidth - gap) / 2;
      const quarterHeight = (contentHeight - gap - captionSpace * 2) / 2;
      return [
        { x: 0, y: 0, width: halfWidth, height: quarterHeight },
        { x: halfWidth + gap, y: 0, width: halfWidth, height: quarterHeight },
        {
          x: 0,
          y: quarterHeight + gap + captionSpace,
          width: halfWidth,
          height: quarterHeight,
        },
        {
          x: halfWidth + gap,
          y: quarterHeight + gap + captionSpace,
          width: halfWidth,
          height: quarterHeight,
        },
      ];

    default:
      return [];
  }
}

export default generatePDF;
