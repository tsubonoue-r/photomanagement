'use client';

import { memo, useCallback } from 'react';
import Image from 'next/image';
import type { Photo } from '@/types/photo';

interface PhotoGridProps {
  photos: Photo[];
  selectedIds: Set<string>;
  onPhotoClick: (photo: Photo) => void;
  onPhotoSelect: (id: string) => void;
  isLoading?: boolean;
  columns?: 2 | 3 | 4 | 5 | 6;
}

interface PhotoCardProps {
  photo: Photo;
  isSelected: boolean;
  onPhotoClick: (photo: Photo) => void;
  onSelect: (id: string) => void;
}

const PhotoCard = memo<PhotoCardProps>(function PhotoCard({
  photo,
  isSelected,
  onPhotoClick,
  onSelect,
}) {
  const handleClick = useCallback(() => {
    onPhotoClick(photo);
  }, [photo, onPhotoClick]);

  const handleSelect = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(photo.id);
    },
    [photo.id, onSelect]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onPhotoClick(photo);
      }
    },
    [photo, onPhotoClick]
  );

  return (
    <div
      className={`
        group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-lg
        bg-zinc-100 transition-all duration-200
        hover:ring-2 hover:ring-blue-500 hover:ring-offset-2
        dark:bg-zinc-800
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View photo ${photo.filename}`}
      aria-selected={isSelected}
    >
      {/* Selection checkbox */}
      <div
        className={`
          absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center
          rounded border-2 bg-white/90 transition-all duration-200
          ${isSelected
            ? 'border-blue-500 bg-blue-500'
            : 'border-zinc-300 opacity-0 group-hover:opacity-100'
          }
        `}
        onClick={handleSelect}
        role="checkbox"
        aria-checked={isSelected}
      >
        {isSelected && (
          <svg
            className="h-4 w-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>

      {/* Photo image */}
      <Image
        src={photo.thumbnailUrl}
        alt={photo.description || photo.filename}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        className="object-cover transition-transform duration-200 group-hover:scale-105"
        loading="lazy"
      />

      {/* Overlay with info */}
      <div
        className="
          absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent
          p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100
        "
      >
        <p className="truncate text-sm font-medium text-white">
          {photo.filename}
        </p>
        {photo.takenAt && (
          <p className="text-xs text-zinc-300">
            {new Date(photo.takenAt).toLocaleDateString('ja-JP')}
          </p>
        )}
      </div>

      {/* Work type badge */}
      {photo.workType && (
        <div className="absolute right-2 top-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
          {photo.workType}
        </div>
      )}
    </div>
  );
});

// Loading skeleton
function PhotoSkeleton() {
  return (
    <div className="aspect-[4/3] animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
  );
}

export const PhotoGrid = memo<PhotoGridProps>(function PhotoGrid({
  photos,
  selectedIds,
  onPhotoClick,
  onPhotoSelect,
  isLoading = false,
  columns = 4,
}) {
  const gridColsClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
  }[columns];

  if (isLoading && photos.length === 0) {
    return (
      <div className={`grid gap-4 ${gridColsClass}`}>
        {Array.from({ length: 12 }).map((_, i) => (
          <PhotoSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg
          className="mb-4 h-16 w-16 text-zinc-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          No photos
        </h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Upload photos to get started
        </p>
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${gridColsClass}`}>
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          isSelected={selectedIds.has(photo.id)}
          onPhotoClick={onPhotoClick}
          onSelect={onPhotoSelect}
        />
      ))}
      {isLoading &&
        Array.from({ length: 4 }).map((_, i) => (
          <PhotoSkeleton key={`skeleton-${i}`} />
        ))}
    </div>
  );
});

export default PhotoGrid;
