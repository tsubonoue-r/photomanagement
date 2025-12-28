/**
 * Excel Generator for Photo Reports
 */

import { Album, ExportOptions, ExportResult } from '@/types/album';

interface ExcelWorksheet {
  name: string;
  columns: { key: string; header: string; width: number }[];
  rows: Record<string, string | number | undefined>[];
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

function generatePhotoListRows(album: Album, options: ExportOptions) {
  const sortedPhotos = [...album.photos].sort((a, b) => a.order - b.order);

  return sortedPhotos.map((photo) => ({
    order: photo.order + 1,
    photoId: photo.photoId,
    originalName: photo.photo.metadata.originalName || 'Unknown',
    caption: photo.caption || '',
    hasBlackboard: photo.includeBlackboard && options.includeBlackboard ? 'Yes' : 'No',
  }));
}

function generateWorkbook(album: Album, options: ExportOptions) {
  const worksheets: ExcelWorksheet[] = [];

  worksheets.push({
    name: 'Summary',
    columns: [
      { key: 'property', header: 'Property', width: 25 },
      { key: 'value', header: 'Value', width: 40 },
    ],
    rows: [
      { property: 'Album Title', value: album.title },
      { property: 'Description', value: album.description || '' },
      { property: 'Total Photos', value: album.photos.length },
      { property: 'Export Date', value: formatDate(new Date()) },
    ],
  });

  worksheets.push({
    name: 'Photo List',
    columns: [
      { key: 'order', header: 'No.', width: 8 },
      { key: 'photoId', header: 'Photo ID', width: 20 },
      { key: 'originalName', header: 'File Name', width: 30 },
      { key: 'caption', header: 'Caption', width: 40 },
      { key: 'hasBlackboard', header: 'Blackboard', width: 12 },
    ],
    rows: generatePhotoListRows(album, options),
  });

  return {
    worksheets,
    metadata: {
      title: album.title,
      author: album.cover.companyName || 'Photo Management System',
      createdAt: new Date(),
    },
  };
}

export async function generateExcelReport(
  album: Album,
  options: ExportOptions
): Promise<ExportResult> {
  try {
    const workbook = generateWorkbook(album, options);

    const safeTitle = album.title.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = safeTitle + '_' + Date.now() + '.xlsx';
    const estimatedSize = workbook.worksheets.reduce(
      (sum, ws) => sum + ws.rows.length * 100,
      0
    );

    console.log('Excel Generation complete:', {
      worksheets: workbook.worksheets.map(w => ({ name: w.name, rows: w.rows.length })),
    });

    return {
      success: true,
      url: '/api/exports/' + filename,
      filename,
      size: estimatedSize,
      pageCount: workbook.worksheets.length,
    };
  } catch (error) {
    console.error('Excel generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during Excel generation',
    };
  }
}

export async function generateExcelPreview(album: Album, options: ExportOptions) {
  const workbook = generateWorkbook(album, options);
  return {
    worksheets: workbook.worksheets.map(ws => ({
      name: ws.name,
      rowCount: ws.rows.length,
      preview: ws.rows.slice(0, 5),
    })),
  };
}
