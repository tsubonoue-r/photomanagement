'use client';

import { memo, useCallback, useState } from 'react';
import type {
  PhotoFilters as PhotoFiltersType,
  WorkType,
  PhotoCategory,
} from '@/types/photo';
import { WORK_TYPE_LABELS, PHOTO_CATEGORY_LABELS } from '@/types/photo';

interface PhotoFiltersProps {
  filters: PhotoFiltersType;
  onFiltersChange: (filters: PhotoFiltersType) => void;
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

export const PhotoFilters = memo<PhotoFiltersProps>(function PhotoFilters({
  filters,
  onFiltersChange,
  onSearch,
  searchQuery = '',
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  const workTypes = Object.entries(WORK_TYPE_LABELS) as [WorkType, string][];
  const categories = Object.entries(PHOTO_CATEGORY_LABELS) as [PhotoCategory, string][];

  const handleWorkTypeChange = useCallback(
    (workType: WorkType, checked: boolean) => {
      const currentWorkTypes = filters.workType
        ? Array.isArray(filters.workType)
          ? filters.workType
          : [filters.workType]
        : [];

      const newWorkTypes = checked
        ? [...currentWorkTypes, workType]
        : currentWorkTypes.filter((wt) => wt !== workType);

      onFiltersChange({
        ...filters,
        workType: newWorkTypes.length > 0 ? newWorkTypes : undefined,
      });
    },
    [filters, onFiltersChange]
  );

  const handleCategoryChange = useCallback(
    (category: PhotoCategory, checked: boolean) => {
      const currentCategories = filters.category
        ? Array.isArray(filters.category)
          ? filters.category
          : [filters.category]
        : [];

      const newCategories = checked
        ? [...currentCategories, category]
        : currentCategories.filter((c) => c !== category);

      onFiltersChange({
        ...filters,
        category: newCategories.length > 0 ? newCategories : undefined,
      });
    },
    [filters, onFiltersChange]
  );

  const handleDateFromChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFiltersChange({
        ...filters,
        dateFrom: e.target.value || undefined,
      });
    },
    [filters, onFiltersChange]
  );

  const handleDateToChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFiltersChange({
        ...filters,
        dateTo: e.target.value || undefined,
      });
    },
    [filters, onFiltersChange]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalSearchQuery(e.target.value);
    },
    []
  );

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearch?.(localSearchQuery);
    },
    [localSearchQuery, onSearch]
  );

  const handleClearFilters = useCallback(() => {
    onFiltersChange({});
    setLocalSearchQuery('');
    onSearch?.('');
  }, [onFiltersChange, onSearch]);

  const isWorkTypeSelected = (workType: WorkType): boolean => {
    if (!filters.workType) return false;
    return Array.isArray(filters.workType)
      ? filters.workType.includes(workType)
      : filters.workType === workType;
  };

  const isCategorySelected = (category: PhotoCategory): boolean => {
    if (!filters.category) return false;
    return Array.isArray(filters.category)
      ? filters.category.includes(category)
      : filters.category === category;
  };

  const hasActiveFilters =
    filters.workType ||
    filters.category ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.tags?.length ||
    localSearchQuery;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={localSearchQuery}
            onChange={handleSearchChange}
            placeholder="写真を検索..."
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-10 pr-4
              text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
              dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
          />
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
          {localSearchQuery && (
            <button
              type="button"
              onClick={() => {
                setLocalSearchQuery('');
                onSearch?.('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Filter toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mb-4 flex w-full items-center justify-between text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        <span className="flex items-center gap-2">
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
            <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
              ON
            </span>
          )}
        </span>
        <svg
          className={`h-5 w-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Work type filter */}
          <div>
            <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              工種
            </h4>
            <div className="flex flex-wrap gap-2">
              {workTypes.map(([value, label]) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-full px-3 py-1 text-sm transition-colors
                    ${isWorkTypeSelected(value)
                      ? 'bg-blue-500 text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={isWorkTypeSelected(value)}
                    onChange={(e) => handleWorkTypeChange(value, e.target.checked)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div>
            <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              種別
            </h4>
            <div className="flex flex-wrap gap-2">
              {categories.map(([value, label]) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-full px-3 py-1 text-sm transition-colors
                    ${isCategorySelected(value)
                      ? 'bg-blue-500 text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={isCategorySelected(value)}
                    onChange={(e) => handleCategoryChange(value, e.target.checked)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Date range filter */}
          <div>
            <h4 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              撮影日
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={handleDateFromChange}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm
                  focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                  dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
              />
              <span className="text-zinc-500">~</span>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={handleDateToChange}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm
                  focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                  dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
              />
            </div>
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400"
            >
              フィルターをクリア
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default PhotoFilters;
