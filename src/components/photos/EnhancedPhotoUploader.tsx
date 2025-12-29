/**
 * Enhanced Photo Uploader Component
 * Complete upload interface with queue management, progress, retry, and duplicate detection
 * Issue #36: Photo Upload UI Improvement
 */

'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { EnhancedDropzone } from './EnhancedDropzone';
import { UploadQueueItem } from './UploadQueueItem';
import { UploadProgressBar } from './UploadProgressBar';
import { useUploadQueue } from '@/hooks/useUploadQueue';
import { UploadedPhoto } from '@/types/photo';
import { UploadQueueItem as UploadQueueItemType, DuplicateCheckResult } from '@/types/upload';

interface EnhancedPhotoUploaderProps {
  /** Callback when uploads complete */
  onUploadComplete?: (photos: UploadedPhoto[]) => void;
  /** Callback when upload fails */
  onUploadError?: (error: string) => void;
  /** Maximum files per upload session */
  maxFiles?: number;
  /** Maximum concurrent uploads */
  maxConcurrent?: number;
  /** Show photo preview thumbnails */
  showPreview?: boolean;
  /** Enable duplicate detection */
  enableDuplicateDetection?: boolean;
  /** Project ID for uploads */
  projectId?: string;
  /** Category ID for uploads */
  categoryId?: string;
  /** Additional CSS classes */
  className?: string;
}

type ViewMode = 'compact' | 'detailed';

export function EnhancedPhotoUploader({
  onUploadComplete,
  onUploadError,
  maxFiles = 50,
  maxConcurrent = 3,
  showPreview = true,
  enableDuplicateDetection = true,
  projectId,
  categoryId,
  className = '',
}: EnhancedPhotoUploaderProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('detailed');
  const [showDuplicateWarning, setShowDuplicateWarning] = useState<{
    item: UploadQueueItemType;
    original: DuplicateCheckResult;
  } | null>(null);

  // Handle duplicate detection callback
  const handleDuplicateDetected = useCallback(
    (item: UploadQueueItemType, original: DuplicateCheckResult) => {
      setShowDuplicateWarning({ item, original });
    },
    []
  );

  const {
    items,
    stats,
    actions,
    isProcessing,
    isPaused,
    uploadedPhotos,
  } = useUploadQueue({
    config: {
      maxConcurrent,
      enableDuplicateDetection,
    },
    onUploadComplete,
    onUploadError: (error) => onUploadError?.(error),
    onDuplicateDetected: handleDuplicateDetected,
    projectId,
    categoryId,
  });

  // Filter items by status for display
  const activeItems = useMemo(
    () =>
      items.filter(
        (item) =>
          item.status === 'uploading' ||
          item.status === 'queued' ||
          item.status === 'processing'
      ),
    [items]
  );

  const completedItems = useMemo(
    () => items.filter((item) => item.status === 'completed'),
    [items]
  );

  const errorItems = useMemo(
    () =>
      items.filter(
        (item) => item.status === 'error' || item.status === 'cancelled'
      ),
    [items]
  );

  const duplicateItems = useMemo(
    () => items.filter((item) => item.status === 'duplicate'),
    [items]
  );

  const hasItems = items.length > 0;
  const hasErrors = stats.failed > 0;
  const hasDuplicates = stats.duplicates > 0;

  // Handle files from dropzone
  const handleFilesSelected = useCallback(
    (files: File[]) => {
      actions.addFiles(files);
    },
    [actions]
  );

  // Handle duplicate warning actions
  const handleSkipDuplicate = useCallback(() => {
    if (showDuplicateWarning) {
      actions.skipDuplicate(showDuplicateWarning.item.id);
      setShowDuplicateWarning(null);
    }
  }, [showDuplicateWarning, actions]);

  const handleReplaceDuplicate = useCallback(() => {
    if (showDuplicateWarning) {
      actions.replaceDuplicate(showDuplicateWarning.item.id);
      setShowDuplicateWarning(null);
    }
  }, [showDuplicateWarning, actions]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Dropzone */}
      <EnhancedDropzone
        onFilesSelected={handleFilesSelected}
        disabled={isProcessing && !isPaused}
        maxFiles={maxFiles}
        className="min-h-[200px]"
      />

      {/* Queue Controls & Progress */}
      {hasItems && (
        <div className="space-y-3">
          {/* Progress Bar */}
          <UploadProgressBar stats={stats} showDetails />

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Pause/Resume */}
              {isProcessing && (
                <button
                  onClick={isPaused ? actions.resumeQueue : actions.pauseQueue}
                  className={`
                    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                    transition-colors duration-150
                    ${
                      isPaused
                        ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50'
                    }
                  `}
                  aria-label={isPaused ? 'Resume uploads' : 'Pause uploads'}
                >
                  {isPaused ? (
                    <>
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
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Resume
                    </>
                  ) : (
                    <>
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
                          d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Pause
                    </>
                  )}
                </button>
              )}

              {/* Cancel All */}
              {isProcessing && (
                <button
                  onClick={actions.cancelAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                           bg-red-100 text-red-700 hover:bg-red-200
                           dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50
                           transition-colors duration-150"
                  aria-label="Cancel all uploads"
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
                  Cancel All
                </button>
              )}

              {/* Retry All Failed */}
              {hasErrors && !isProcessing && (
                <button
                  onClick={actions.retryAllFailed}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                           bg-blue-100 text-blue-700 hover:bg-blue-200
                           dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50
                           transition-colors duration-150"
                  aria-label="Retry all failed uploads"
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
                  Retry Failed ({stats.failed})
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  onClick={() => setViewMode('detailed')}
                  className={`px-2 py-1 text-sm ${
                    viewMode === 'detailed'
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                  aria-label="Detailed view"
                  aria-pressed={viewMode === 'detailed'}
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
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`px-2 py-1 text-sm ${
                    viewMode === 'compact'
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                  aria-label="Compact view"
                  aria-pressed={viewMode === 'compact'}
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
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </button>
              </div>

              {/* Clear Actions */}
              {!isProcessing && (stats.completed > 0 || stats.failed > 0) && (
                <div className="flex items-center gap-1">
                  {stats.completed > 0 && (
                    <button
                      onClick={actions.clearCompleted}
                      className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700
                               dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Clear completed
                    </button>
                  )}
                  {stats.failed > 0 && (
                    <button
                      onClick={actions.clearFailed}
                      className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700
                               dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Clear failed
                    </button>
                  )}
                  <button
                    onClick={actions.clearAll}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700
                             dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Queue Items List */}
          {viewMode === 'detailed' && (
            <div className="space-y-4">
              {/* Duplicates Section */}
              {hasDuplicates && duplicateItems.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400 flex items-center gap-2">
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
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    Duplicates Detected ({duplicateItems.length})
                  </h3>
                  <div className="space-y-1.5" role="list" aria-label="Duplicate files">
                    {duplicateItems.map((item) => (
                      <UploadQueueItem
                        key={item.id}
                        item={item}
                        onRetry={actions.retryItem}
                        onCancel={actions.cancelItem}
                        onRemove={actions.removeItem}
                        onSkipDuplicate={actions.skipDuplicate}
                        onReplaceDuplicate={actions.replaceDuplicate}
                        showPreview={showPreview}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Active Uploads Section */}
              {activeItems.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Uploading ({activeItems.length})
                  </h3>
                  <div className="space-y-1.5" role="list" aria-label="Uploading files">
                    {activeItems.map((item) => (
                      <UploadQueueItem
                        key={item.id}
                        item={item}
                        onRetry={actions.retryItem}
                        onCancel={actions.cancelItem}
                        onRemove={actions.removeItem}
                        onSkipDuplicate={actions.skipDuplicate}
                        onReplaceDuplicate={actions.replaceDuplicate}
                        showPreview={showPreview}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Failed Section */}
              {errorItems.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
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
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Failed ({errorItems.length})
                  </h3>
                  <div className="space-y-1.5" role="list" aria-label="Failed uploads">
                    {errorItems.map((item) => (
                      <UploadQueueItem
                        key={item.id}
                        item={item}
                        onRetry={actions.retryItem}
                        onCancel={actions.cancelItem}
                        onRemove={actions.removeItem}
                        onSkipDuplicate={actions.skipDuplicate}
                        onReplaceDuplicate={actions.replaceDuplicate}
                        showPreview={showPreview}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Section */}
              {completedItems.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Completed ({completedItems.length})
                  </h3>
                  <div className="space-y-1.5" role="list" aria-label="Completed uploads">
                    {completedItems.slice(0, 5).map((item) => (
                      <UploadQueueItem
                        key={item.id}
                        item={item}
                        onRetry={actions.retryItem}
                        onCancel={actions.cancelItem}
                        onRemove={actions.removeItem}
                        onSkipDuplicate={actions.skipDuplicate}
                        onReplaceDuplicate={actions.replaceDuplicate}
                        showPreview={showPreview}
                      />
                    ))}
                    {completedItems.length > 5 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                        ...and {completedItems.length - 5} more completed
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Compact View - Grid of Thumbnails */}
          {viewMode === 'compact' && items.length > 0 && (
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`
                    relative aspect-square rounded-lg overflow-hidden
                    ${
                      item.status === 'completed'
                        ? 'ring-2 ring-green-500'
                        : item.status === 'error'
                        ? 'ring-2 ring-red-500'
                        : item.status === 'duplicate'
                        ? 'ring-2 ring-orange-500'
                        : item.status === 'uploading'
                        ? 'ring-2 ring-blue-500'
                        : 'ring-1 ring-gray-300 dark:ring-gray-600'
                    }
                  `}
                  title={`${item.filename} - ${item.status}`}
                >
                  {item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt={item.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700" />
                  )}

                  {/* Status Overlay */}
                  {item.status === 'uploading' && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {item.status === 'error' && (
                    <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
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
                    </div>
                  )}
                  {item.status === 'duplicate' && (
                    <div className="absolute inset-0 bg-orange-500/50 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview Grid for Uploaded Photos */}
      {showPreview && uploadedPhotos.length > 0 && !hasItems && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Uploaded Photos ({uploadedPhotos.length})
          </h3>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
            {uploadedPhotos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
              >
                <img
                  src={photo.thumbnailSmallUrl}
                  alt={photo.metadata.originalName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Duplicate Warning Modal */}
      {showDuplicateWarning && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="duplicate-warning-title"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                <svg
                  className="w-6 h-6 text-orange-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2
                id="duplicate-warning-title"
                className="text-lg font-semibold text-gray-900 dark:text-gray-100"
              >
                Duplicate File Detected
              </h2>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              The file <strong>{showDuplicateWarning.item.filename}</strong> appears
              to be a duplicate of an existing file
              {showDuplicateWarning.original.originalFilename && (
                <>
                  : <strong>{showDuplicateWarning.original.originalFilename}</strong>
                </>
              )}
              .
            </p>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={handleSkipDuplicate}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                         bg-gray-100 dark:bg-gray-700 rounded-lg
                         hover:bg-gray-200 dark:hover:bg-gray-600
                         transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleReplaceDuplicate}
                className="px-4 py-2 text-sm font-medium text-white
                         bg-orange-500 rounded-lg hover:bg-orange-600
                         transition-colors"
              >
                Upload Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
