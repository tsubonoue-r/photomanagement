/**
 * Upload Queue Item Component
 * Individual queue item with progress, status, and actions
 * Issue #36: Photo Upload UI Improvement
 */

'use client';

import React, { useMemo } from 'react';
import { UploadQueueItem as UploadQueueItemType } from '@/types/upload';

interface UploadQueueItemProps {
  item: UploadQueueItemType;
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
  onSkipDuplicate: (id: string) => void;
  onReplaceDuplicate: (id: string) => void;
  showPreview?: boolean;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadQueueItemComponent({
  item,
  onRetry,
  onCancel,
  onRemove,
  onSkipDuplicate,
  onReplaceDuplicate,
  showPreview = true,
}: UploadQueueItemProps) {
  const statusConfig = useMemo(() => {
    const configs = {
      queued: {
        icon: (
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
        label: 'Waiting',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        progressColor: 'bg-gray-300',
      },
      uploading: {
        icon: (
          <svg
            className="w-5 h-5 text-blue-500 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ),
        label: 'Uploading',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        progressColor: 'bg-blue-500',
      },
      processing: {
        icon: (
          <svg
            className="w-5 h-5 text-yellow-500 animate-pulse"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        ),
        label: 'Processing',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        progressColor: 'bg-yellow-500',
      },
      completed: {
        icon: (
          <svg
            className="w-5 h-5 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ),
        label: 'Completed',
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        progressColor: 'bg-green-500',
      },
      error: {
        icon: (
          <svg
            className="w-5 h-5 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
        label: 'Failed',
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        progressColor: 'bg-red-500',
      },
      cancelled: {
        icon: (
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ),
        label: 'Cancelled',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        progressColor: 'bg-gray-400',
      },
      duplicate: {
        icon: (
          <svg
            className="w-5 h-5 text-orange-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        ),
        label: 'Duplicate',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        progressColor: 'bg-orange-500',
      },
    };
    return configs[item.status];
  }, [item.status]);

  const canCancel = item.status === 'uploading' || item.status === 'queued';
  const canRetry = item.status === 'error' || item.status === 'cancelled';
  const canRemove =
    item.status === 'completed' ||
    item.status === 'error' ||
    item.status === 'cancelled';
  const isDuplicate = item.status === 'duplicate';

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg ${statusConfig.bgColor} transition-colors duration-200`}
      role="listitem"
      aria-label={`${item.filename}: ${statusConfig.label}`}
    >
      {/* Preview Thumbnail */}
      {showPreview && item.previewUrl && (
        <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
          <img
            src={item.previewUrl}
            alt={`Preview of ${item.filename}`}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Status Icon */}
      <div className="flex-shrink-0 mt-0.5" aria-hidden="true">
        {statusConfig.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* File Info */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {item.filename}
          </p>
          <span className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
            {formatFileSize(item.fileSize)}
          </span>
        </div>

        {/* Status & Progress */}
        <div className="mt-1">
          {item.status === 'uploading' && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${statusConfig.progressColor} transition-all duration-300 ease-out`}
                  style={{ width: `${item.progress}%` }}
                  role="progressbar"
                  aria-valuenow={item.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Upload progress: ${item.progress}%`}
                />
              </div>
              <span className="flex-shrink-0 text-xs font-medium text-blue-600 dark:text-blue-400 w-10 text-right">
                {item.progress}%
              </span>
            </div>
          )}

          {item.status === 'error' && item.error && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 truncate">
              {item.error}
              {item.retryCount > 0 && (
                <span className="ml-1">
                  (Retry {item.retryCount}/{item.maxRetries})
                </span>
              )}
            </p>
          )}

          {isDuplicate && (
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
              This file appears to be a duplicate
            </p>
          )}

          {item.status === 'queued' && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Waiting in queue...
            </p>
          )}

          {item.status === 'completed' && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
              Upload successful
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-1">
        {isDuplicate && (
          <>
            <button
              onClick={() => onSkipDuplicate(item.id)}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                       rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Skip duplicate"
              title="Skip"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <button
              onClick={() => onReplaceDuplicate(item.id)}
              className="p-1.5 text-orange-500 hover:text-orange-600 dark:hover:text-orange-400
                       rounded-md hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
              aria-label="Upload anyway"
              title="Upload Anyway"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </button>
          </>
        )}

        {canRetry && (
          <button
            onClick={() => onRetry(item.id)}
            className="p-1.5 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400
                     rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            aria-label="Retry upload"
            title="Retry"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        )}

        {canCancel && (
          <button
            onClick={() => onCancel(item.id)}
            className="p-1.5 text-red-400 hover:text-red-600 dark:hover:text-red-400
                     rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            aria-label="Cancel upload"
            title="Cancel"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {canRemove && (
          <button
            onClick={() => onRemove(item.id)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                     rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Remove from list"
            title="Remove"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export { UploadQueueItemComponent as UploadQueueItem };
