/**
 * Photo related type definitions
 */

export interface ExifData {
  make?: string;
  model?: string;
  dateTimeOriginal?: Date;
  exposureTime?: number;
  fNumber?: number;
  iso?: number;
  focalLength?: number;
  latitude?: number;
  longitude?: number;
  width?: number;
  height?: number;
}

export interface PhotoMetadata {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  exif: ExifData;
  uploadedAt: Date;
}

export interface UploadedPhoto {
  id: string;
  originalUrl: string;
  thumbnailSmallUrl: string;
  thumbnailLargeUrl: string;
  metadata: PhotoMetadata;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface UploadResult {
  success: boolean;
  photo?: UploadedPhoto;
  error?: string;
}

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
] as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const THUMBNAIL_SIZES = {
  small: { width: 200, height: 200 },
  large: { width: 800, height: 800 },
} as const;

export type ThumbnailSize = keyof typeof THUMBNAIL_SIZES;

/**
 * Work types for construction photos
 */
export type WorkType =
  | 'foundation'
  | 'framing'
  | 'roofing'
  | 'exterior'
  | 'interior'
  | 'electrical'
  | 'plumbing'
  | 'finishing'
  | 'inspection'
  | 'other';

/**
 * Photo category types
 */
export type PhotoCategory =
  | 'before'
  | 'during'
  | 'after'
  | 'material'
  | 'equipment'
  | 'defect'
  | 'other';

/**
 * Work type labels in Japanese
 */
export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  foundation: '基礎工事',
  framing: '躯体工事',
  roofing: '屋根工事',
  exterior: '外装工事',
  interior: '内装工事',
  electrical: '電気工事',
  plumbing: '配管工事',
  finishing: '仕上工事',
  inspection: '検査',
  other: 'その他',
};

/**
 * Photo category labels in Japanese
 */
export const PHOTO_CATEGORY_LABELS: Record<PhotoCategory, string> = {
  before: '着手前',
  during: '施工中',
  after: '完成',
  material: '材料',
  equipment: '機材',
  defect: '不具合',
  other: 'その他',
};

/**
 * Photo entity for list/search
 */
export interface Photo {
  id: string;
  projectId: string;
  filename: string;
  description?: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  size: number;
  mimeType: string;
  workType?: WorkType;
  category?: PhotoCategory;
  location?: string;
  takenAt?: string;
  uploadedAt: string;
  tags: string[];
  exif?: {
    make?: string;
    model?: string;
    exposureTime?: string;
    fNumber?: number;
    iso?: number;
    focalLength?: number;
    latitude?: number;
    longitude?: number;
  };
}

/**
 * Photo filters for list/search
 */
export interface PhotoFilters {
  workType?: WorkType | WorkType[];
  category?: PhotoCategory | PhotoCategory[];
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  hasBlackboard?: boolean;
}

/**
 * Sort field options
 */
export type SortField = 'date' | 'name' | 'createdAt' | 'updatedAt';

/**
 * Sort order options
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Photo sort options
 */
export interface PhotoSort {
  field: SortField;
  order: SortOrder;
}

/**
 * Pagination info
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

/**
 * Search result with highlights
 */
export interface SearchResult {
  photo: Photo;
  score: number;
  highlights: {
    field: string;
    matches: string[];
  }[];
}

/**
 * Bulk action types
 */
export type BulkActionType =
  | 'delete'
  | 'move'
  | 'updateWorkType'
  | 'updateCategory'
  | 'addTags'
  | 'removeTags';

/**
 * Bulk action request
 */
export interface BulkActionRequest {
  action: BulkActionType;
  photoIds: string[];
  payload?: {
    projectId?: string;
    targetProjectId?: string;
    workType?: WorkType;
    category?: PhotoCategory;
    tags?: string[];
  };
}

/**
 * Bulk action response
 */
export interface BulkActionResponse {
  success: boolean;
  processed: number;
  failed: number;
  affectedCount?: number;
  errors?: { photoId: string; error: string }[];
}
