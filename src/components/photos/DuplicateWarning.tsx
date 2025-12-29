/**
 * Duplicate Warning Component
 * Alert and modal components for duplicate file detection
 * Issue #36: Photo Upload UI Improvement
 */

'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { DuplicateCheckResult, UploadQueueItem } from '@/types/upload';

/**
 * Props for the DuplicateWarning inline alert
 */
interface DuplicateWarningAlertProps {
  /** The duplicate queue item */
  item: UploadQueueItem;
  /** Duplicate check result with original file info */
  duplicateInfo?: DuplicateCheckResult;
  /** Callback to skip this duplicate */
  onSkip: (id: string) => void;
  /** Callback to upload anyway */
  onUploadAnyway: (id: string) => void;
  /** Show file preview */
  showPreview?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * DuplicateWarningAlert - Inline alert for duplicate detection
 * Shows a warning banner with options to skip or upload anyway
 */
export function DuplicateWarningAlert({
  item,
  duplicateInfo,
  onSkip,
  onUploadAnyway,
  showPreview = true,
  className = '',
}: DuplicateWarningAlertProps) {
  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg
        bg-orange-50 dark:bg-orange-900/20
        border border-orange-200 dark:border-orange-800
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Preview Thumbnail */}
      {showPreview && item.previewUrl && (
        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
          <img
            src={item.previewUrl}
            alt={`Preview of ${item.filename}`}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Warning Icon */}
      <div className="flex-shrink-0 mt-0.5">
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
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200">
          Duplicate File Detected
        </h4>
        <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
          <strong className="font-medium">{item.filename}</strong>
          {duplicateInfo?.originalFilename && (
            <>
              {' '}appears to match{' '}
              <strong className="font-medium">{duplicateInfo.originalFilename}</strong>
            </>
          )}
        </p>
        {duplicateInfo?.confidence && (
          <p className="mt-0.5 text-xs text-orange-600 dark:text-orange-400">
            Match confidence: {Math.round(duplicateInfo.confidence * 100)}%
          </p>
        )}

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => onSkip(item.id)}
            className="px-3 py-1.5 text-sm font-medium
                     text-orange-700 dark:text-orange-300
                     bg-orange-100 dark:bg-orange-900/50
                     hover:bg-orange-200 dark:hover:bg-orange-900/70
                     rounded-md transition-colors"
          >
            Skip
          </button>
          <button
            onClick={() => onUploadAnyway(item.id)}
            className="px-3 py-1.5 text-sm font-medium
                     text-white bg-orange-500
                     hover:bg-orange-600
                     rounded-md transition-colors"
          >
            Upload Anyway
          </button>
        </div>
      </div>

      {/* File size */}
      <div className="flex-shrink-0 text-xs text-orange-600 dark:text-orange-400">
        {formatFileSize(item.fileSize)}
      </div>
    </div>
  );
}

/**
 * Props for the DuplicateWarning modal
 */
interface DuplicateWarningModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** The duplicate queue item */
  item: UploadQueueItem | null;
  /** Duplicate check result with original file info */
  duplicateInfo?: DuplicateCheckResult;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback to skip this duplicate */
  onSkip: () => void;
  /** Callback to upload anyway */
  onUploadAnyway: () => void;
  /** Callback to skip all duplicates */
  onSkipAll?: () => void;
  /** Callback to upload all duplicates anyway */
  onUploadAllAnyway?: () => void;
  /** Number of remaining duplicates */
  remainingDuplicates?: number;
}

/**
 * DuplicateWarningModal - Modal dialog for duplicate confirmation
 * Provides detailed options including skip all / upload all
 */
export function DuplicateWarningModal({
  isOpen,
  item,
  duplicateInfo,
  onClose,
  onSkip,
  onUploadAnyway,
  onSkipAll,
  onUploadAllAnyway,
  remainingDuplicates = 0,
}: DuplicateWarningModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else {
      previousActiveElement.current?.focus();
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !item) {
    return null;
  }

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="duplicate-warning-title"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-6 pb-0">
          <div className="flex-shrink-0 p-3 rounded-full bg-orange-100 dark:bg-orange-900/30">
            <svg
              className="w-6 h-6 text-orange-500"
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
          </div>
          <div className="flex-1 min-w-0">
            <h2
              id="duplicate-warning-title"
              className="text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              Duplicate File Detected
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This file appears to already exist in your library.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600
                     dark:hover:text-gray-300 rounded-md transition-colors"
            aria-label="Close dialog"
          >
            <svg
              className="w-5 h-5"
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
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* File Comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* New File */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                New File
              </p>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                {item.previewUrl ? (
                  <img
                    src={item.previewUrl}
                    alt={`Preview of ${item.filename}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-gray-300 dark:text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {item.filename}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(item.fileSize)}
                </p>
              </div>
            </div>

            {/* Original File */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Existing File
              </p>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                <div className="w-full h-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-gray-300 dark:text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {duplicateInfo?.originalFilename || 'Unknown'}
                </p>
                {duplicateInfo?.confidence && (
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    {Math.round(duplicateInfo.confidence * 100)}% match
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Remaining count notice */}
          {remainingDuplicates > 0 && (
            <div className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong className="font-medium">{remainingDuplicates}</strong> more
                duplicate{remainingDuplicates !== 1 ? 's' : ''} detected in this upload.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 p-6 pt-0">
          {/* Primary Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onSkip}
              className="flex-1 px-4 py-2.5 text-sm font-medium
                       text-gray-700 dark:text-gray-300
                       bg-gray-100 dark:bg-gray-700
                       hover:bg-gray-200 dark:hover:bg-gray-600
                       rounded-lg transition-colors"
            >
              Skip This File
            </button>
            <button
              onClick={onUploadAnyway}
              className="flex-1 px-4 py-2.5 text-sm font-medium
                       text-white bg-orange-500
                       hover:bg-orange-600
                       rounded-lg transition-colors"
            >
              Upload Anyway
            </button>
          </div>

          {/* Bulk Actions (if multiple duplicates) */}
          {remainingDuplicates > 0 && (onSkipAll || onUploadAllAnyway) && (
            <div className="flex items-center gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              {onSkipAll && (
                <button
                  onClick={onSkipAll}
                  className="flex-1 px-3 py-2 text-xs font-medium
                           text-gray-500 dark:text-gray-400
                           hover:text-gray-700 dark:hover:text-gray-200
                           hover:bg-gray-100 dark:hover:bg-gray-700/50
                           rounded-md transition-colors"
                >
                  Skip All Duplicates
                </button>
              )}
              {onUploadAllAnyway && (
                <button
                  onClick={onUploadAllAnyway}
                  className="flex-1 px-3 py-2 text-xs font-medium
                           text-orange-500 dark:text-orange-400
                           hover:text-orange-600 dark:hover:text-orange-300
                           hover:bg-orange-50 dark:hover:bg-orange-900/30
                           rounded-md transition-colors"
                >
                  Upload All Anyway
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Props for the DuplicateBadge component
 */
interface DuplicateBadgeProps {
  /** Number of duplicates */
  count: number;
  /** Badge size */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

/**
 * DuplicateBadge - Small badge showing duplicate count
 */
export function DuplicateBadge({
  count,
  size = 'md',
  className = '',
}: DuplicateBadgeProps) {
  if (count === 0) {
    return null;
  }

  const sizeStyles = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 font-medium rounded-full
        bg-orange-100 text-orange-700
        dark:bg-orange-900/50 dark:text-orange-300
        ${sizeStyles[size]}
        ${className}
      `}
      aria-label={`${count} duplicate${count !== 1 ? 's' : ''} detected`}
    >
      <svg
        className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`}
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
      {count} duplicate{count !== 1 ? 's' : ''}
    </span>
  );
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
