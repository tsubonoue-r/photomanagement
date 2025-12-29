'use client';

import { memo, useCallback } from 'react';
import type { PhotoSort } from '@/types/photo';

type SortField = PhotoSort['field'];
type SortDirection = PhotoSort['direction'];

interface PhotoSorterProps {
  sort: PhotoSort;
  onSortChange: (sort: PhotoSort) => void;
}

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: 'takenAt', label: '撮影日' },
  { field: 'filename', label: 'ファイル名' },
  { field: 'uploadedAt', label: 'アップロード日' },
  { field: 'size', label: 'サイズ' },
];

export const PhotoSorter = memo<PhotoSorterProps>(function PhotoSorter({
  sort,
  onSortChange,
}) {
  const handleFieldChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onSortChange({
        ...sort,
        field: e.target.value as SortField,
      });
    },
    [sort, onSortChange]
  );

  const handleOrderToggle = useCallback(() => {
    onSortChange({
      ...sort,
      direction: sort.direction === 'asc' ? 'desc' : 'asc',
    });
  }, [sort, onSortChange]);

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-zinc-600 dark:text-zinc-400">並び替え:</label>
      <select
        value={sort.field}
        onChange={handleFieldChange}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm
          focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
          dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.field} value={option.field}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        onClick={handleOrderToggle}
        className="flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5
          text-sm transition-colors hover:bg-zinc-50 focus:border-blue-500 focus:outline-none
          focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white
          dark:hover:bg-zinc-600"
        aria-label={sort.direction === 'asc' ? 'Sort descending' : 'Sort ascending'}
      >
        {sort.direction === 'asc' ? (
          <>
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
                d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
              />
            </svg>
            昇順
          </>
        ) : (
          <>
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
                d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
              />
            </svg>
            降順
          </>
        )}
      </button>
    </div>
  );
});

export default PhotoSorter;
