/**
 * Excel Generator for Album Export
 * Issue #10: Album and Report Output
 *
 * Generates Excel workbooks with:
 * - Album information sheet
 * - Photo list with details
 * - Summary statistics
 */

import * as XLSX from 'xlsx';
import { Album, ExportOptions } from '@/types/album';

interface ExcelGeneratorResult {
  buffer: Buffer;
  filename: string;
  sheetCount: number;
}

/**
 * Generate Excel workbook from album
 */
export async function generateExcel(
  album: Album,
  options: ExportOptions
): Promise<ExcelGeneratorResult> {
  const workbook = XLSX.utils.book_new();

  // Add Album Info sheet
  addAlbumInfoSheet(workbook, album);

  // Add Photos sheet
  addPhotosSheet(workbook, album, options);

  // Add Summary sheet
  addSummarySheet(workbook, album);

  // Generate buffer
  const buffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  }) as Buffer;

  const filename = `${album.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

  return {
    buffer,
    filename,
    sheetCount: workbook.SheetNames.length,
  };
}

/**
 * Add album information sheet
 */
function addAlbumInfoSheet(workbook: XLSX.WorkBook, album: Album): void {
  const data = [
    ['Album Information'],
    [],
    ['Title', album.title],
    ['Name', album.name],
    ['Description', album.description || '-'],
    ['Status', album.status],
    ['Photo Count', album.photos.length],
    [],
    ['Cover Information'],
    ['Cover Title', album.cover.title],
    ['Subtitle', album.cover.subtitle || '-'],
    ['Project Name', album.cover.projectName || '-'],
    ['Company Name', album.cover.companyName || '-'],
    ['Date', album.cover.date || '-'],
    [],
    ['Export Settings'],
    ['Format', album.exportOptions.format],
    ['Paper Size', album.exportOptions.paperSize],
    ['Layout', `${album.exportOptions.layout} photo(s) per page`],
    ['Orientation', album.exportOptions.orientation],
    ['Quality', album.exportOptions.quality],
    ['Include Blackboard', album.exportOptions.includeBlackboard ? 'Yes' : 'No'],
    ['Include Cover', album.exportOptions.includeCover ? 'Yes' : 'No'],
    ['Include TOC', album.exportOptions.includeToc ? 'Yes' : 'No'],
    [],
    ['Metadata'],
    ['Created At', formatDate(album.createdAt)],
    ['Updated At', formatDate(album.updatedAt)],
    ['Created By', album.createdBy],
    ['Last Exported At', album.lastExportedAt ? formatDate(album.lastExportedAt) : '-'],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  worksheet['!cols'] = [{ wch: 20 }, { wch: 50 }];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Album Info');
}

/**
 * Add photos list sheet
 */
function addPhotosSheet(
  workbook: XLSX.WorkBook,
  album: Album,
  options: ExportOptions
): void {
  // Headers
  const headers = [
    'No.',
    'Photo ID',
    'Title',
    'Description',
    'URL',
    'Location',
    'Taken At',
    'Order',
  ];

  // Add blackboard columns if enabled
  if (options.includeBlackboard) {
    headers.push(
      'BB: Project Name',
      'BB: Construction Type',
      'BB: Contractor',
      'BB: Photographer',
      'BB: Date',
      'BB: Memo'
    );
  }

  headers.push('Created At', 'Updated At');

  // Data rows
  const rows = album.photos.map((photo, index) => {
    const row: (string | number)[] = [
      index + 1,
      photo.id,
      photo.title,
      photo.description || '-',
      photo.url,
      photo.location || '-',
      photo.takenAt ? formatDate(photo.takenAt) : '-',
      photo.order,
    ];

    if (options.includeBlackboard) {
      const bb = photo.blackboardInfo;
      row.push(
        bb?.projectName || '-',
        bb?.constructionType || '-',
        bb?.contractor || '-',
        bb?.photographerName || '-',
        bb?.date ? formatDate(bb.date) : '-',
        bb?.memo || '-'
      );
    }

    row.push(formatDate(photo.createdAt), formatDate(photo.updatedAt));

    return row;
  });

  const data = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  const colWidths = headers.map((h) => ({ wch: Math.max(h.length, 15) }));
  worksheet['!cols'] = colWidths;

  // Auto-filter
  worksheet['!autofilter'] = { ref: `A1:${String.fromCharCode(64 + headers.length)}${rows.length + 1}` };

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Photos');
}

/**
 * Add summary statistics sheet
 */
function addSummarySheet(workbook: XLSX.WorkBook, album: Album): void {
  const photosWithBlackboard = album.photos.filter((p) => p.blackboardInfo);
  const photosWithLocation = album.photos.filter((p) => p.location);
  const photosWithDate = album.photos.filter((p) => p.takenAt);

  // Find date range
  const dates = album.photos
    .filter((p) => p.takenAt)
    .map((p) => new Date(p.takenAt!).getTime());

  const minDate = dates.length > 0 ? new Date(Math.min(...dates)) : null;
  const maxDate = dates.length > 0 ? new Date(Math.max(...dates)) : null;

  const data = [
    ['Album Summary Report'],
    [],
    ['Statistics'],
    ['Total Photos', album.photos.length],
    ['Photos with Blackboard', photosWithBlackboard.length],
    ['Photos with Location', photosWithLocation.length],
    ['Photos with Date', photosWithDate.length],
    [],
    ['Date Range'],
    ['Earliest Photo', minDate ? formatDate(minDate) : '-'],
    ['Latest Photo', maxDate ? formatDate(maxDate) : '-'],
    [],
    ['Completion Status'],
    ['Blackboard Coverage', `${Math.round((photosWithBlackboard.length / Math.max(album.photos.length, 1)) * 100)}%`],
    ['Location Coverage', `${Math.round((photosWithLocation.length / Math.max(album.photos.length, 1)) * 100)}%`],
    ['Date Coverage', `${Math.round((photosWithDate.length / Math.max(album.photos.length, 1)) * 100)}%`],
    [],
    ['Report Generated'],
    ['Generated At', formatDate(new Date())],
    ['Album Status', album.status],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  worksheet['!cols'] = [{ wch: 25 }, { wch: 30 }];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Summary');
}

/**
 * Format date for Excel
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default generateExcel;
