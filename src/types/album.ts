/**
 * Album Types and Interfaces
 * Issue #10: Album and Report Output
 */

// Photo item within an album
export interface AlbumPhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  title: string;
  description?: string;
  takenAt?: Date;
  location?: string;
  blackboardInfo?: BlackboardInfo;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Blackboard information for construction photos
export interface BlackboardInfo {
  projectName?: string;
  constructionType?: string;
  contractor?: string;
  photographerName?: string;
  date?: Date;
  memo?: string;
}

// Album cover configuration
export interface AlbumCover {
  title: string;
  subtitle?: string;
  projectName?: string;
  companyName?: string;
  date?: string;
  backgroundColor?: string;
  logoUrl?: string;
}

// Album status
export type AlbumStatus = 'draft' | 'ready' | 'exported' | 'active' | 'archived';

// Paper size options
export type PaperSize = 'A4' | 'A3';

// Photo layout (photos per page)
export type PhotoLayout = 1 | 2 | 4;

// Export format types
export type ExportFormat = 'pdf' | 'excel' | 'zip';

// Export options
export interface ExportOptions {
  format: ExportFormat;
  paperSize: PaperSize;
  layout: PhotoLayout;
  orientation: 'portrait' | 'landscape';
  quality: 'standard' | 'high';
  includeBlackboard: boolean;
  includeCover: boolean;
  includeToc: boolean;
}

// Default export options
export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'pdf',
  paperSize: 'A4',
  layout: 2,
  orientation: 'portrait',
  quality: 'standard',
  includeBlackboard: true,
  includeCover: true,
  includeToc: true,
};

// Album entity
export interface Album {
  id: string;
  title: string;
  name: string;
  description?: string;
  coverPhotoId?: string;
  projectId?: string;
  photos: AlbumPhoto[];
  cover: AlbumCover;
  status: AlbumStatus;
  exportOptions: ExportOptions;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastExportedAt?: Date;
}

// Album creation input
export interface CreateAlbumInput {
  name: string;
  title: string;
  description?: string;
  projectId?: string;
  cover?: Partial<AlbumCover>;
}

// API request for creating album (used by frontend)
export interface CreateAlbumRequest {
  projectId: string;
  title: string;
  description?: string;
  cover?: Partial<AlbumCover>;
}

// Album update input
export interface UpdateAlbumInput {
  name?: string;
  title?: string;
  description?: string;
  coverPhotoId?: string;
  cover?: Partial<AlbumCover>;
  status?: AlbumStatus;
  exportOptions?: Partial<ExportOptions>;
}

// Photo reorder input
export interface ReorderPhotosInput {
  photoIds: string[];
}

// Export template
export interface ExportTemplate {
  id: string;
  name: string;
  format: ExportFormat;
  paperSize: PaperSize;
  layout: PhotoLayout;
  headerText?: string;
  footerText?: string;
  logoUrl?: string;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Export result
export interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

// Album list response
export interface AlbumListResponse {
  albums: Album[];
  total: number;
  page: number;
  pageSize: number;
}

// Album API response wrapper
export interface AlbumApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Export job status
export type ExportJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Export job
export interface ExportJob {
  id: string;
  albumId: string;
  format: ExportFormat;
  options: ExportOptions;
  status: ExportJobStatus;
  progress: number;
  resultUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}
