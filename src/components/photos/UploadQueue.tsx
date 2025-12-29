/**
 * Upload Queue Management Component
 * Comprehensive queue view with filtering, sorting, and batch actions
 * Issue #36: Photo Upload UI Improvement
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { UploadQueueItem as UploadQueueItemType, UploadQueueStats } from '@/types/upload';
import { UploadQueueItem } from './UploadQueueItem';
import { UploadProgressBar } from './UploadProgressBar';
import { RetryAllButton } from './RetryButton';
import { DuplicateBadge } from './DuplicateWarning';

type FilterStatus = 'all' | 'active' | 'completed' | 'failed' | 'duplicate';
type SortField = 'addedAt' | 'filename' | 'fileSize' | 'status';
type SortDirection = 'asc' | 'desc';

interface UploadQueueProps {
  /** Queue items */
  items: UploadQueueItemType[];
  /** Queue statistics */
  stats: UploadQueueStats;
  /** Whether queue is processing */
  isProcessing: boolean;
  /** Whether queue is paused */
  isPaused: boolean;
  /** Callback to pause queue */
  onPause: () => void;
  /** Callback to resume queue */
  onResume: () => void;
  /** Callback to cancel all */
  onCancelAll: () => void;
  /** Callback to clear completed */
  onClearCompleted: () => void;
  /** Callback to clear failed */
  onClearFailed: () => void;
  /** Callback to clear all */
  onClearAll: () => void;
  /** Callback to retry item */
  onRetryItem: (id: string) => void;
  /** Callback to retry all failed */
  onRetryAllFailed: () => void;
  /** Callback to cancel item */
  onCancelItem: (id: string) => void;
  /** Callback to remove item */
  onRemoveItem: (id: string) => void;
  /** Callback to skip duplicate */
  onSkipDuplicate: (id: string) => void;
  /** Callback to replace duplicate */
  onReplaceDuplicate: (id: string) => void;
  /** Show file previews */
  showPreview?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * UploadQueue - Complete queue management interface
 * Features filtering, sorting, batch actions, and detailed item views
 */
export function UploadQueue({
  items,
  stats,
  isProcessing,
  isPaused,
  onPause,
  onResume,
  onCancelAll,
  onClearCompleted,
  onClearFailed,
  onClearAll,
  onRetryItem,
  onRetryAllFailed,
  onCancelItem,
  onRemoveItem,
  onSkipDuplicate,
  onReplaceDuplicate,
  showPreview = true,
  className = '',
}: UploadQueueProps) {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('addedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isExpanded, setIsExpanded] = useState(true);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      switch (filter) {
        case 'active':
          return ['queued', 'uploading', 'processing'].includes(item.status);
        case 'completed':
          return item.status === 'completed';
        case 'failed':
          return item.status === 'error' || item.status === 'cancelled';
        case 'duplicate':
          return item.status === 'duplicate';
        default:
          return true;
      }
    });
  }, [items, filter]);

  // Sort items
  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'filename':
          comparison = a.filename.localeCompare(b.filename);
          break;
        case 'fileSize':
          comparison = a.fileSize - b.fileSize;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'addedAt':
        default:
          comparison = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredItems, sortField, sortDirection]);

  // Toggle sort
  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDirection('desc');
      }
    },
    [sortField]
  );

  // Filter counts
  const filterCounts = useMemo(
    () => ({
      all: items.length,
      active: items.filter((i) =>
        ['queued', 'uploading', 'processing'].includes(i.status)
      ).length,
      completed: items.filter((i) => i.status === 'completed').length,
      failed: items.filter((i) =>
        ['error', 'cancelled'].includes(i.status)
      ).length,
      duplicate: items.filter((i) => i.status === 'duplicate').length,
    }),
    [items]
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className={`
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        rounded-xl shadow-sm overflow-hidden
        ${className}
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-left"
            aria-expanded={isExpanded}
            aria-controls="upload-queue-content"
          >
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Upload Queue
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({items.length} {items.length === 1 ? 'file' : 'files'})
            </span>
            {stats.duplicates > 0 && (
              <DuplicateBadge count={stats.duplicates} size="sm" />
            )}
          </button>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {isProcessing && (
              <button
                onClick={isPaused ? onResume : onPause}
                className={`
                  p-2 rounded-lg transition-colors
                  ${
                    isPaused
                      ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
                      : 'text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'
                  }
                `}
                aria-label={isPaused ? 'Resume uploads' : 'Pause uploads'}
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? (
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
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ) : (
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
                      d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </button>
            )}

            {isProcessing && (
              <button
                onClick={onCancelAll}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30
                         rounded-lg transition-colors"
                aria-label="Cancel all uploads"
                title="Cancel All"
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
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {isExpanded && <UploadProgressBar stats={stats} showDetails className="mt-4" />}
      </div>

      {/* Content */}
      {isExpanded && (
        <div id="upload-queue-content">
          {/* Filter & Sort Controls */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-700 rounded-lg">
                {(
                  [
                    { key: 'all', label: 'All' },
                    { key: 'active', label: 'Active' },
                    { key: 'completed', label: 'Done' },
                    { key: 'failed', label: 'Failed' },
                    { key: 'duplicate', label: 'Duplicates' },
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`
                      px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                      ${
                        filter === key
                          ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                      }
                    `}
                    aria-pressed={filter === key}
                  >
                    {label}
                    {filterCounts[key] > 0 && (
                      <span className="ml-1.5 opacity-75">({filterCounts[key]})</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Sort Controls */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Sort by:</span>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="text-xs px-2 py-1.5 rounded-md border border-gray-200 dark:border-gray-600
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="addedAt">Date Added</option>
                  <option value="filename">Filename</option>
                  <option value="fileSize">Size</option>
                  <option value="status">Status</option>
                </select>
                <button
                  onClick={() => handleSort(sortField)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                           rounded-md transition-colors"
                  aria-label={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      sortDirection === 'desc' ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Batch Actions */}
          {!isProcessing && (stats.failed > 0 || stats.completed > 0) && (
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex flex-wrap items-center gap-2">
                {stats.failed > 0 && (
                  <RetryAllButton
                    onRetryAll={onRetryAllFailed}
                    failedCount={stats.failed}
                    variant="outline"
                    size="sm"
                  />
                )}
                {stats.completed > 0 && (
                  <button
                    onClick={onClearCompleted}
                    className="px-3 py-1.5 text-xs font-medium
                             text-gray-600 dark:text-gray-400
                             hover:text-gray-800 dark:hover:text-gray-200
                             hover:bg-gray-100 dark:hover:bg-gray-700
                             rounded-md transition-colors"
                  >
                    Clear Completed
                  </button>
                )}
                {stats.failed > 0 && (
                  <button
                    onClick={onClearFailed}
                    className="px-3 py-1.5 text-xs font-medium
                             text-gray-600 dark:text-gray-400
                             hover:text-gray-800 dark:hover:text-gray-200
                             hover:bg-gray-100 dark:hover:bg-gray-700
                             rounded-md transition-colors"
                  >
                    Clear Failed
                  </button>
                )}
                <button
                  onClick={onClearAll}
                  className="px-3 py-1.5 text-xs font-medium
                           text-red-500 dark:text-red-400
                           hover:text-red-700 dark:hover:text-red-300
                           hover:bg-red-50 dark:hover:bg-red-900/20
                           rounded-md transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}

          {/* Queue Items List */}
          <div className="max-h-96 overflow-y-auto">
            {sortedItems.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {sortedItems.map((item) => (
                  <div key={item.id} className="p-2">
                    <UploadQueueItem
                      item={item}
                      onRetry={onRetryItem}
                      onCancel={onCancelItem}
                      onRemove={onRemoveItem}
                      onSkipDuplicate={onSkipDuplicate}
                      onReplaceDuplicate={onReplaceDuplicate}
                      showPreview={showPreview}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                <svg
                  className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p className="text-sm">No items match the current filter</p>
              </div>
            )}
          </div>

          {/* Summary Footer */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>
                Showing {sortedItems.length} of {items.length} items
              </span>
              <span>
                {formatBytes(stats.uploadedBytes)} / {formatBytes(stats.totalBytes)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact Upload Queue Summary
 * Shows a minimal progress indicator with expand option
 */
interface UploadQueueSummaryProps {
  /** Queue statistics */
  stats: UploadQueueStats;
  /** Whether queue is processing */
  isProcessing: boolean;
  /** Callback to view full queue */
  onViewQueue: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function UploadQueueSummary({
  stats,
  isProcessing,
  onViewQueue,
  className = '',
}: UploadQueueSummaryProps) {
  if (stats.total === 0) {
    return null;
  }

  const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <button
      onClick={onViewQueue}
      className={`
        flex items-center gap-3 p-3 w-full
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        rounded-lg shadow-sm hover:shadow-md
        transition-shadow
        ${className}
      `}
      aria-label="View upload queue"
    >
      {/* Progress Circle */}
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
          <circle
            className="text-gray-200 dark:text-gray-700"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            cx="18"
            cy="18"
            r="16"
          />
          <circle
            className={isProcessing ? 'text-blue-500' : 'text-green-500'}
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${progress}, 100`}
            fill="none"
            cx="18"
            cy="18"
            r="16"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {progress}%
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {isProcessing ? 'Uploading...' : 'Upload Complete'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {stats.completed}/{stats.total} files
          {stats.failed > 0 && (
            <span className="text-red-500 ml-2">({stats.failed} failed)</span>
          )}
        </p>
      </div>

      {/* Arrow */}
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
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
  );
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
