'use client';

import { memo, useState, useCallback } from 'react';
import type { PhotoFilters as PhotoFiltersType } from '@/types/photo';
import { WORK_TYPE_LABELS, PHOTO_CATEGORY_LABELS } from '@/types/photo';

interface PhotoFiltersProps {
  filters: PhotoFiltersType;
  onFiltersChange: (filters: Partial<PhotoFiltersType>) => void;
  onSearch: (query: string) => void;
  searchQuery: string;
}

export const PhotoFilters = memo<PhotoFiltersProps>(function PhotoFilters({
  filters,
  onFiltersChange,
  onSearch,
  searchQuery,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearch(e.target.value);
    },
    [onSearch]
  );

  const handleWorkTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value || undefined;
      onFiltersChange({ workType: value as PhotoFiltersType['workType'] });
    },
    [onFiltersChange]
  );

  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value || undefined;
      onFiltersChange({ category: value as PhotoFiltersType['category'] });
    },
    [onFiltersChange]
  );

  const handleDateFromChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value || undefined;
      onFiltersChange({ dateFrom: value });
    },
    [onFiltersChange]
  );

  const handleDateToChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value || undefined;
      onFiltersChange({ dateTo: value });
    },
    [onFiltersChange]
  );

  const handleTagsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const tags = value
        ? value.split(',').map((t) => t.trim()).filter(Boolean)
        : undefined;
      onFiltersChange({ tags });
    },
    [onFiltersChange]
  );

  const handleClearFilters = useCallback(() => {
    onFiltersChange({
      workType: undefined,
      category: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      tags: undefined,
    });
    onSearch('');
  }, [onFiltersChange, onSearch]);

  const hasActiveFilters =
    filters.workType ||
    filters.category ||
    filters.dateFrom ||
    filters.dateTo ||
    (filters.tags && filters.tags.length > 0) ||
    searchQuery.length > 0;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
      {/* Search bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="写真を検索..."
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-10 pr-4
              text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
              dark:border-zinc-600 dark:bg-zinc-700 dark:text-white dark:placeholder-zinc-400"
          />
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium
            transition-colors ${
              isExpanded || hasActiveFilters
                ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700'
            }`}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          フィルター
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
              !
            </span>
          )}
        </button>
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="mt-4 grid gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-700 sm:grid-cols-2 lg:grid-cols-4">
          {/* Work type filter */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              工種
            </label>
            <select
              value={filters.workType || ''}
              onChange={handleWorkTypeChange}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm
                focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
            >
              <option value="">すべて</option>
              {Object.entries(WORK_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Category filter */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              種別
            </label>
            <select
              value={filters.category || ''}
              onChange={handleCategoryChange}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm
                focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
            >
              <option value="">すべて</option>
              {Object.entries(PHOTO_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Date from filter */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              撮影日（開始）
            </label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={handleDateFromChange}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm
                focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
            />
          </div>

          {/* Date to filter */}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              撮影日（終了）
            </label>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={handleDateToChange}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm
                focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
            />
          </div>

          {/* Tags filter */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              タグ（カンマ区切り）
            </label>
            <input
              type="text"
              value={filters.tags?.join(', ') || ''}
              onChange={handleTagsChange}
              placeholder="例: 基礎, コンクリート"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm
                focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                dark:border-zinc-600 dark:bg-zinc-700 dark:text-white dark:placeholder-zinc-400"
            />
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <div className="flex items-end sm:col-span-2 lg:col-span-2">
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700
                  dark:text-red-400 dark:hover:text-red-300"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                フィルターをクリア
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default PhotoFilters;
