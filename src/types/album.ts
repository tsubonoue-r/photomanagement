/**
 * Album related type definitions
 */

/**
 * Album paper size options
 */
export type PaperSize = 'A4' | 'A3';

/**
 * Layout options for photos per page
 */
export type PhotoLayout = 1 | 2 | 4;

/**
 * Export format types
 */
export type ExportFormat = 'pdf' | 'excel';

/**
 * Photo metadata for album
 */
export interface AlbumPhotoMetadata {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  exif: {
    make?: string;
    model?: string;
    dateTimeOriginal?: Date;
    latitude?: number;
    longitude?: number;
  };
  uploadedAt: Date;
}

/**
 * Uploaded photo for album
 */
export interface UploadedPhoto {
  id: string;
  originalUrl: string;
  thumbnailSmallUrl: string;
  thumbnailLargeUrl: string;
  metadata: AlbumPhotoMetadata;
}

/**
 * Photo entry in an album
 */
export interface AlbumPhoto {
  id: string;
  photoId: string;
  photo: UploadedPhoto;
  order: number;
  caption?: string;
  includeBlackboard: boolean;
  blackboardData?: BlackboardOverlay;
}

/**
 * Blackboard overlay data
 */
export interface BlackboardOverlay {
  projectName?: string;
  constructionType?: string;
  location?: string;
  date?: string;
  contractor?: string;
  memo?: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * Album cover configuration
 */
export interface AlbumCover {
  title: string;
  subtitle?: string;
  projectName?: string;
  date?: string;
  companyName?: string;
  logoUrl?: string;
  backgroundColor?: string;
}

/**
 * Table of contents entry
 */
export interface TocEntry {
  title: string;
  pageNumber: number;
  photoCount: number;
}

/**
 * Album export options
 */
export interface ExportOptions {
  format: ExportFormat;
  paperSize: PaperSize;
  layout: PhotoLayout;
  includeBlackboard: boolean;
  includeCover: boolean;
  includeToc: boolean;
  quality: 'standard' | 'high';
  orientation: 'portrait' | 'landscape';
}

/**
 * Album status
 */
export type AlbumStatus = 'draft' | 'ready' | 'exported';

/**
 * Album entity
 */
export interface Album {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  cover: AlbumCover;
  photos: AlbumPhoto[];
  status: AlbumStatus;
  exportOptions: ExportOptions;
  createdAt: Date;
  updatedAt: Date;
  lastExportedAt?: Date;
}

/**
 * Album creation request
 */
export interface CreateAlbumRequest {
  projectId: string;
  title: string;
  description?: string;
  cover?: Partial<AlbumCover>;
}

/**
 * Album update request
 */
export interface UpdateAlbumRequest {
  title?: string;
  description?: string;
  cover?: Partial<AlbumCover>;
  status?: AlbumStatus;
  exportOptions?: Partial<ExportOptions>;
}

/**
 * Add photos request
 */
export interface AddPhotosRequest {
  photoIds: string[];
  includeBlackboard?: boolean;
}

/**
 * Reorder photos request
 */
export interface ReorderPhotosRequest {
  photoOrders: { photoId: string; order: number }[];
}

/**
 * Export request
 */
export interface ExportAlbumRequest {
  options: ExportOptions;
}

/**
 * Export result
 */
export interface ExportResult {
  success: boolean;
  url?: string;
  filename?: string;
  size?: number;
  pageCount?: number;
  error?: string;
}

/**
 * Album list response
 */
export interface AlbumListResponse {
  albums: Album[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Default export options
 */
export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'pdf',
  paperSize: 'A4',
  layout: 2,
  includeBlackboard: true,
  includeCover: true,
  includeToc: true,
  quality: 'high',
  orientation: 'portrait',
};

/**
 * Paper dimensions in mm
 */
export const PAPER_DIMENSIONS = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
} as const;

/**
 * Photo area dimensions based on layout
 */
export const LAYOUT_DIMENSIONS = {
  1: { rows: 1, cols: 1 },
  2: { rows: 2, cols: 1 },
  4: { rows: 2, cols: 2 },
} as const;
