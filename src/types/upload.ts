/**
 * Upload Queue Type Definitions
 * Issue #36: Photo Upload UI Improvement
 */

import { UploadedPhoto } from './photo';

/**
 * Upload queue item status
 */
export type UploadQueueItemStatus =
  | 'queued'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'error'
  | 'cancelled'
  | 'duplicate';

/**
 * Upload queue item
 */
export interface UploadQueueItem {
  /** Unique identifier for the queue item */
  id: string;
  /** Original file reference */
  file: File;
  /** File name */
  filename: string;
  /** File size in bytes */
  fileSize: number;
  /** Current status */
  status: UploadQueueItemStatus;
  /** Upload progress (0-100) */
  progress: number;
  /** Error message if failed */
  error?: string;
  /** Number of retry attempts */
  retryCount: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Uploaded photo data if successful */
  uploadedPhoto?: UploadedPhoto;
  /** Hash for duplicate detection */
  fileHash?: string;
  /** Preview URL (blob URL) */
  previewUrl?: string;
  /** Timestamp when added to queue */
  addedAt: Date;
  /** Timestamp when upload started */
  startedAt?: Date;
  /** Timestamp when upload completed */
  completedAt?: Date;
  /** Duplicate of existing file ID */
  duplicateOfId?: string;
}

/**
 * Upload queue statistics
 */
export interface UploadQueueStats {
  /** Total items in queue */
  total: number;
  /** Items waiting in queue */
  queued: number;
  /** Currently uploading */
  uploading: number;
  /** Processing after upload */
  processing: number;
  /** Successfully completed */
  completed: number;
  /** Failed items */
  failed: number;
  /** Cancelled items */
  cancelled: number;
  /** Duplicate items detected */
  duplicates: number;
  /** Overall progress percentage */
  overallProgress: number;
  /** Total bytes to upload */
  totalBytes: number;
  /** Bytes uploaded so far */
  uploadedBytes: number;
  /** Estimated time remaining (seconds) */
  estimatedTimeRemaining?: number;
  /** Upload speed (bytes per second) */
  uploadSpeed?: number;
}

/**
 * Upload queue actions
 */
export interface UploadQueueActions {
  /** Add files to the queue */
  addFiles: (files: File[]) => void;
  /** Remove an item from the queue */
  removeItem: (id: string) => void;
  /** Retry a failed upload */
  retryItem: (id: string) => void;
  /** Retry all failed uploads */
  retryAllFailed: () => void;
  /** Cancel an upload in progress */
  cancelItem: (id: string) => void;
  /** Cancel all uploads */
  cancelAll: () => void;
  /** Clear completed items */
  clearCompleted: () => void;
  /** Clear failed items */
  clearFailed: () => void;
  /** Clear all items */
  clearAll: () => void;
  /** Pause queue processing */
  pauseQueue: () => void;
  /** Resume queue processing */
  resumeQueue: () => void;
  /** Skip duplicate and continue */
  skipDuplicate: (id: string) => void;
  /** Replace duplicate with new file */
  replaceDuplicate: (id: string) => void;
}

/**
 * Duplicate detection result
 */
export interface DuplicateCheckResult {
  /** Whether file is a duplicate */
  isDuplicate: boolean;
  /** ID of the original file if duplicate */
  originalId?: string;
  /** Original file name */
  originalFilename?: string;
  /** Match confidence (0-1) */
  confidence?: number;
}

/**
 * Upload queue configuration
 */
export interface UploadQueueConfig {
  /** Maximum concurrent uploads */
  maxConcurrent: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Retry delay in milliseconds */
  retryDelay: number;
  /** Enable duplicate detection */
  enableDuplicateDetection: boolean;
  /** Auto-retry on network error */
  autoRetryOnNetworkError: boolean;
  /** Maximum file size in bytes */
  maxFileSize: number;
  /** Allowed MIME types */
  allowedMimeTypes: string[];
}

/**
 * Default upload queue configuration
 */
export const DEFAULT_UPLOAD_QUEUE_CONFIG: UploadQueueConfig = {
  maxConcurrent: 3,
  maxRetries: 3,
  retryDelay: 2000,
  enableDuplicateDetection: true,
  autoRetryOnNetworkError: true,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/heic', 'image/heif'],
};

/**
 * Upload queue hook return type
 */
export interface UseUploadQueueReturn {
  /** Queue items */
  items: UploadQueueItem[];
  /** Queue statistics */
  stats: UploadQueueStats;
  /** Queue actions */
  actions: UploadQueueActions;
  /** Whether queue is processing */
  isProcessing: boolean;
  /** Whether queue is paused */
  isPaused: boolean;
  /** Successfully uploaded photos */
  uploadedPhotos: UploadedPhoto[];
}

/**
 * Upload queue event types
 */
export type UploadQueueEventType =
  | 'item-added'
  | 'item-started'
  | 'item-progress'
  | 'item-completed'
  | 'item-failed'
  | 'item-cancelled'
  | 'item-retry'
  | 'duplicate-detected'
  | 'queue-completed'
  | 'queue-paused'
  | 'queue-resumed';

/**
 * Upload queue event
 */
export interface UploadQueueEvent {
  type: UploadQueueEventType;
  item?: UploadQueueItem;
  timestamp: Date;
}
