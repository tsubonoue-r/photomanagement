/**
 * Upload Progress Bar Component
 * Enhanced progress visualization with statistics
 * Issue #36: Photo Upload UI Improvement
 */

'use client';

import React, { useMemo } from 'react';
import { UploadQueueStats } from '@/types/upload';

interface UploadProgressBarProps {
  stats: UploadQueueStats;
  showDetails?: boolean;
  className?: string;
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Format time remaining
 */
function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return `${mins}m ${secs}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

export function UploadProgressBar({
  stats,
  showDetails = true,
  className = '',
}: UploadProgressBarProps) {
  const {
    total,
    completed,
    failed,
    uploading,
    queued,
    duplicates,
    totalBytes,
    uploadedBytes,
    uploadSpeed,
    estimatedTimeRemaining,
  } = stats;

  // Calculate progress percentage based on bytes
  const bytesProgress = useMemo(() => {
    if (totalBytes === 0) return 0;
    return Math.round((uploadedBytes / totalBytes) * 100);
  }, [uploadedBytes, totalBytes]);

  // Calculate segment widths for multi-colored progress bar
  const segments = useMemo(() => {
    if (total === 0) return { completed: 0, uploading: 0, failed: 0, duplicate: 0 };
    return {
      completed: (completed / total) * 100,
      uploading: (uploading / total) * 100,
      failed: (failed / total) * 100,
      duplicate: (duplicates / total) * 100,
    };
  }, [total, completed, uploading, failed, duplicates]);

  const isActive = uploading > 0 || queued > 0;
  const isComplete = total > 0 && queued === 0 && uploading === 0;
  const hasErrors = failed > 0;

  if (total === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header with counts */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          {isActive && (
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <svg
                className="w-4 h-4 animate-spin"
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
              Uploading...
            </span>
          )}
          {isComplete && !hasErrors && (
            <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
              <svg
                className="w-4 h-4"
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
              Complete
            </span>
          )}
          {isComplete && hasErrors && (
            <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
              <svg
                className="w-4 h-4"
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
              Completed with errors
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <span>
            {completed}/{total}
          </span>
          {failed > 0 && (
            <span className="text-red-500">({failed} failed)</span>
          )}
        </div>
      </div>

      {/* Multi-segment Progress Bar */}
      <div
        className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={bytesProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Upload progress: ${bytesProgress}%`}
      >
        {/* Completed segment */}
        <div
          className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
          style={{ width: `${segments.completed}%` }}
        />

        {/* Uploading segment (with animation) */}
        <div
          className="absolute top-0 h-full bg-blue-500 transition-all duration-300"
          style={{
            left: `${segments.completed}%`,
            width: `${segments.uploading}%`,
          }}
        >
          {isActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          )}
        </div>

        {/* Failed segment */}
        {segments.failed > 0 && (
          <div
            className="absolute top-0 h-full bg-red-500 transition-all duration-300"
            style={{
              left: `${segments.completed + segments.uploading}%`,
              width: `${segments.failed}%`,
            }}
          />
        )}

        {/* Duplicate segment */}
        {segments.duplicate > 0 && (
          <div
            className="absolute top-0 h-full bg-orange-500 transition-all duration-300"
            style={{
              left: `${segments.completed + segments.uploading + segments.failed}%`,
              width: `${segments.duplicate}%`,
            }}
          />
        )}
      </div>

      {/* Details */}
      {showDetails && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
          {/* Left side: Status counts */}
          <div className="flex items-center gap-3">
            {completed > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
                {completed} completed
              </span>
            )}
            {uploading > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" aria-hidden="true" />
                {uploading} uploading
              </span>
            )}
            {queued > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-400" aria-hidden="true" />
                {queued} queued
              </span>
            )}
            {failed > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />
                {failed} failed
              </span>
            )}
            {duplicates > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500" aria-hidden="true" />
                {duplicates} duplicate
              </span>
            )}
          </div>

          {/* Right side: Transfer stats */}
          <div className="flex items-center gap-3">
            {/* Bytes transferred */}
            <span>
              {formatBytes(uploadedBytes)} / {formatBytes(totalBytes)}
            </span>

            {/* Upload speed */}
            {isActive && uploadSpeed && uploadSpeed > 0 && (
              <span className="flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                {formatBytes(uploadSpeed)}/s
              </span>
            )}

            {/* Time remaining */}
            {isActive && estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
              <span className="flex items-center gap-1">
                <svg
                  className="w-3 h-3"
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
                ~{formatTimeRemaining(estimatedTimeRemaining)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* CSS for shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
}
