/**
 * Photo Uploader Component
 * Complete upload interface with dropzone, progress, and preview
 */

'use client';

import React, { useCallback } from 'react';
import { PhotoDropzone } from './PhotoDropzone';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { UploadProgress, UploadedPhoto } from '@/types/photo';

interface PhotoUploaderProps {
  onUploadComplete?: (photos: UploadedPhoto[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  showPreview?: boolean;
  className?: string;
}

export function PhotoUploader({
  onUploadComplete,
  onUploadError,
  maxFiles = 20,
  showPreview = true,
  className = '',
}: PhotoUploaderProps) {
  const {
    uploadFiles,
    cancelUpload,
    cancelAll,
    clearCompleted,
    progress,
    isUploading,
    uploadedPhotos,
  } = usePhotoUpload({
    onUploadComplete,
    onUploadError,
  });

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      uploadFiles(files);
    },
    [uploadFiles]
  );

  const hasProgress = progress.length > 0;
  const completedCount = progress.filter((p) => p.status === 'completed').length;
  const errorCount = progress.filter((p) => p.status === 'error').length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Dropzone */}
      <PhotoDropzone
        onFilesSelected={handleFilesSelected}
        disabled={isUploading}
        maxFiles={maxFiles}
        className="min-h-[200px]"
      />

      {/* Upload Progress */}
      {hasProgress && (
        <div className="space-y-2">
          {/* Summary Header */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {isUploading ? (
                <span>
                  Uploading... {completedCount}/{progress.length}
                </span>
              ) : (
                <span>
                  Completed: {completedCount}, Errors: {errorCount}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {isUploading && (
                <button
                  onClick={cancelAll}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-700
                           dark:text-red-400 dark:hover:text-red-300"
                >
                  Cancel All
                </button>
              )}
              {!isUploading && (completedCount > 0 || errorCount > 0) && (
                <button
                  onClick={clearCompleted}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700
                           dark:text-gray-400 dark:hover:text-gray-300"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Progress List */}
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {progress.map((item) => (
              <ProgressItem
                key={item.fileId}
                item={item}
                onCancel={() => cancelUpload(item.fileId)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Preview Grid */}
      {showPreview && uploadedPhotos.length > 0 && (
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
    </div>
  );
}

/**
 * Progress Item Component
 */
interface ProgressItemProps {
  item: UploadProgress;
  onCancel: () => void;
}

function ProgressItem({ item, onCancel }: ProgressItemProps) {
  const statusColors = {
    pending: 'bg-gray-200 dark:bg-gray-700',
    uploading: 'bg-blue-500',
    processing: 'bg-yellow-500',
    completed: 'bg-green-500',
    error: 'bg-red-500',
  };

  const statusIcons = {
    pending: (
      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    uploading: (
      <svg className="w-4 h-4 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    ),
    processing: (
      <svg className="w-4 h-4 text-yellow-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    completed: (
      <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
      {/* Status Icon */}
      <div className="flex-shrink-0">{statusIcons[item.status]}</div>

      {/* File Info & Progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
            {item.fileName}
          </p>
          {item.status === 'uploading' && (
            <span className="text-xs text-gray-500 ml-2">{item.progress}%</span>
          )}
        </div>

        {/* Progress Bar */}
        {(item.status === 'uploading' || item.status === 'pending') && (
          <div className="mt-1 w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${statusColors[item.status]}`}
              style={{ width: `${item.progress}%` }}
            />
          </div>
        )}

        {/* Error Message */}
        {item.status === 'error' && item.error && (
          <p className="mt-0.5 text-xs text-red-500 truncate">{item.error}</p>
        )}
      </div>

      {/* Cancel Button */}
      {(item.status === 'uploading' || item.status === 'pending') && (
        <button
          onClick={onCancel}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600
                   dark:hover:text-gray-300 transition-colors"
          aria-label="Cancel upload"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
