'use client';

import { memo, useCallback } from 'react';
import type { PhotoSort } from '@/types/photo';

interface PhotoSorterProps {
  sort: PhotoSort;
  onSortChange: (sort: PhotoSort) => void;
}

const SORT_OPTIONS: { field: PhotoSort['field']; label: string }[] = [
  { field: 'takenAt', label: '撮影日' },
  { field: 'uploadedAt', label: 'アップロード日' },
  { field: 'filename', label: 'ファイル名' },
  { field: 'size', label: 'ファイルサイズ' },
];

export const PhotoSorter = memo<PhotoSorterProps>(function PhotoSorter({
  sort,
  onSortChange,
}) {
  const handleFieldChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onSortChange({
        ...sort,
        field: e.target.value as PhotoSort['field'],
      });
    },
    [sort, onSortChange]
  );

  const handleDirectionToggle = useCallback(() => {
    onSortChange({
      ...sort,
      direction: sort.direction === 'asc' ? 'desc' : 'asc',
    });
  }, [sort, onSortChange]);

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        並び替え:
      </label>
      <select
        value={sort.field}
        onChange={handleFieldChange}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm
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
        onClick={handleDirectionToggle}
        className="flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-2
          text-sm text-zinc-700 transition-colors hover:bg-zinc-50
          dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
        aria-label={sort.direction === 'asc' ? '昇順' : '降順'}
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
