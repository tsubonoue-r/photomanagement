/**
 * Photo related type definitions
 * Issue #9: Photo List and Search Functionality
 */

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
  foundation: 'kiso-kouji',
  framing: 'kutai-kouji',
  roofing: 'yane-kouji',
  exterior: 'gaisou-kouji',
  interior: 'naisou-kouji',
  electrical: 'denki-kouji',
  plumbing: 'haikan-kouji',
  finishing: 'shiage-kouji',
  inspection: 'kensa',
  other: 'sonota',
};

/**
 * Photo category labels in Japanese
 */
export const PHOTO_CATEGORY_LABELS: Record<PhotoCategory, string> = {
  before: 'chakkou-mae',
  during: 'sekou-chuu',
  after: 'kanryou',
  material: 'shizai',
  equipment: 'setsubi',
  defect: 'fuguai',
  other: 'sonota',
};

/**
 * Photo entity
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
 * Photo sort options
 */
export interface PhotoSort {
  field: 'takenAt' | 'uploadedAt' | 'filename' | 'size';
  direction: 'asc' | 'desc';
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
  affectedCount: number;
  errors?: { photoId: string; error: string }[];
}

/**
 * Upload constraints
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
] as const;

/**
 * Thumbnail sizes configuration
 */
export const THUMBNAIL_SIZES = {
  small: { width: 200, height: 200 },
  large: { width: 800, height: 800 },
} as const;

/**
 * EXIF data structure
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

/**
 * Uploaded photo metadata
 */
export interface UploadedPhoto {
  id: string;
  originalUrl: string;
  thumbnailSmallUrl: string;
  thumbnailLargeUrl: string;
  metadata: {
    originalName: string;
    mimeType: string;
    size: number;
    width: number;
    height: number;
    exif: ExifData;
  };
}

/**
 * Photo metadata for upload
 */
export interface PhotoMetadata {
  id?: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  exif: ExifData;
  uploadedAt?: Date;
}

/**
 * Single file upload result
 */
export interface SingleUploadResult {
  success: boolean;
  photo?: UploadedPhoto;
  error?: string;
  filename?: string;
}

/**
 * Upload result
 */
export interface UploadResult {
  success: boolean;
  photo?: UploadedPhoto;
  photos?: UploadedPhoto[];
  error?: string;
  errors?: {
    filename: string;
    error: string;
  }[];
  total?: number;
  uploaded?: number;
  failed?: number;
}

/**
 * Upload progress tracking
 */
export interface UploadProgress {
  fileId: string;
  filename: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}
