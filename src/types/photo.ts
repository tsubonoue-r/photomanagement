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

// Work type (construction type)
export type WorkType =
  | 'foundation'      // 基礎工事
  | 'framing'         // 骨組み工事
  | 'roofing'         // 屋根工事
  | 'exterior'        // 外装工事
  | 'interior'        // 内装工事
  | 'electrical'      // 電気工事
  | 'plumbing'        // 配管工事
  | 'finishing'       // 仕上げ工事
  | 'inspection'      // 検査
  | 'other';          // その他

// Photo category
export type PhotoCategory =
  | 'before'          // 着工前
  | 'during'          // 施工中
  | 'after'           // 完了後
  | 'material'        // 資材
  | 'equipment'       // 設備
  | 'defect'          // 不具合
  | 'other';          // その他

// Sort field options
export type SortField = 'date' | 'name' | 'createdAt' | 'updatedAt';

// Sort order options
export type SortOrder = 'asc' | 'desc';

// Extended Photo entity for list/search
export interface Photo {
  id: string;
  projectId: string;
  filename: string;
  originalFilename: string;
  url: string;
  thumbnailUrl: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  takenAt: string | null;      // EXIF date
  workType: WorkType | null;
  category: PhotoCategory | null;
  description: string | null;
  location: string | null;
  tags: string[];
  metadata: PhotoMetadata;
  createdAt: string;
  updatedAt: string;
}

// Photo filter options
export interface PhotoFilters {
  workType?: WorkType | WorkType[];
  category?: PhotoCategory | PhotoCategory[];
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  hasBlackboard?: boolean;
}

// Photo sort options
export interface PhotoSort {
  field: SortField;
  order: SortOrder;
}

// Pagination options
export interface PaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextCursor?: string;
  };
}

// Search query
export interface SearchQuery {
  q: string;
  projectId?: string;
  filters?: PhotoFilters;
  sort?: PhotoSort;
  pagination?: PaginationOptions;
}

// Search result with highlights
export interface SearchResult {
  photo: Photo;
  score: number;
  highlights: {
    field: string;
    snippet: string;
  }[];
}

// Bulk action types
export type BulkActionType =
  | 'delete'
  | 'move'
  | 'updateWorkType'
  | 'updateCategory'
  | 'addTags'
  | 'removeTags';

// Bulk action request
export interface BulkActionRequest {
  action: BulkActionType;
  photoIds: string[];
  payload?: {
    targetProjectId?: string;
    workType?: WorkType;
    category?: PhotoCategory;
    tags?: string[];
  };
}

// Bulk action response
export interface BulkActionResponse {
  success: boolean;
  processed: number;
  failed: number;
  errors?: {
    photoId: string;
    error: string;
  }[];
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Work type labels (Japanese)
export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  foundation: '基礎工事',
  framing: '骨組み工事',
  roofing: '屋根工事',
  exterior: '外装工事',
  interior: '内装工事',
  electrical: '電気工事',
  plumbing: '配管工事',
  finishing: '仕上げ工事',
  inspection: '検査',
  other: 'その他',
};

// Photo category labels (Japanese)
export const PHOTO_CATEGORY_LABELS: Record<PhotoCategory, string> = {
  before: '着工前',
  during: '施工中',
  after: '完了後',
  material: '資材',
  equipment: '設備',
  defect: '不具合',
  other: 'その他',
};
