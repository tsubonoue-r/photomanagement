'use client';

import { memo, useCallback, useState } from 'react';
import Image from 'next/image';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Photo } from '@/types/photo';

interface SortablePhotoGridProps {
  photos: Photo[];
  selectedIds: Set<string>;
  onPhotoClick: (photo: Photo) => void;
  onPhotoSelect: (id: string) => void;
  onReorder: (photos: Photo[]) => void;
  isLoading?: boolean;
  columns?: 2 | 3 | 4 | 5 | 6;
  disabled?: boolean;
}

interface SortablePhotoCardProps {
  photo: Photo;
  isSelected: boolean;
  onPhotoClick: (photo: Photo) => void;
  onSelect: (id: string) => void;
  isDragging?: boolean;
}

/**
 * Sortable photo card component with drag handle
 */
const SortablePhotoCard = memo<SortablePhotoCardProps>(function SortablePhotoCard({
  photo,
  isSelected,
  onPhotoClick,
  onSelect,
  isDragging = false,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const handleClick = useCallback(() => {
      // Prevent click during drag
      if (isDragging) return;
      onPhotoClick(photo);
    },
    [photo, onPhotoClick, isDragging]
  );

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
      ref={setNodeRef}
      style={style}
      className={`
        group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-lg
        bg-zinc-100 transition-all duration-200
        hover:ring-2 hover:ring-blue-500 hover:ring-offset-2
        dark:bg-zinc-800
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${isSortableDragging ? 'z-50 shadow-2xl' : ''}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View photo ${photo.filename}`}
      data-selected={isSelected}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-2 z-20 cursor-grab rounded bg-black/60 p-1.5
          opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
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
            d="M4 8h16M4 16h16"
          />
        </svg>
      </div>

      {/* Selection checkbox */}
      <div
        className={`
          absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center
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
        draggable={false}
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
        <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
          {photo.workType}
        </div>
      )}
    </div>
  );
});

/**
 * Drag overlay component for visual feedback
 */
function DragOverlayContent({ photo }: { photo: Photo }) {
  return (
    <div className="aspect-[4/3] w-48 overflow-hidden rounded-lg bg-zinc-100 shadow-2xl ring-2 ring-blue-500">
      <Image
        src={photo.thumbnailUrl}
        alt={photo.description || photo.filename}
        fill
        sizes="200px"
        className="object-cover"
        draggable={false}
      />
    </div>
  );
}

/**
 * Loading skeleton component
 */
function PhotoSkeleton() {
  return (
    <div className="aspect-[4/3] animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
  );
}

/**
 * Sortable photo grid component with drag and drop support
 */
export const SortablePhotoGrid = memo<SortablePhotoGridProps>(function SortablePhotoGrid({
  photos,
  selectedIds,
  onPhotoClick,
  onPhotoSelect,
  onReorder,
  isLoading = false,
  columns = 4,
  disabled = false,
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const gridColsClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
  }[columns];

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setIsDragging(false);

      if (over && active.id !== over.id) {
        const oldIndex = photos.findIndex((p) => p.id === active.id);
        const newIndex = photos.findIndex((p) => p.id === over.id);
        const newPhotos = arrayMove(photos, oldIndex, newIndex);
        onReorder(newPhotos);
      }
    },
    [photos, onReorder]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setIsDragging(false);
  }, []);

  const activePhoto = activeId ? photos.find((p) => p.id === activeId) : null;

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
          写真がありません
        </h3>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          写真をアップロードして始めましょう
        </p>
      </div>
    );
  }

  if (disabled) {
    // Render without DnD when disabled
    return (
      <div className={`grid gap-4 ${gridColsClass}`}>
        {photos.map((photo) => (
          <SortablePhotoCard
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
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
        <div className={`grid gap-4 ${gridColsClass}`}>
          {photos.map((photo) => (
            <SortablePhotoCard
              key={photo.id}
              photo={photo}
              isSelected={selectedIds.has(photo.id)}
              onPhotoClick={onPhotoClick}
              onSelect={onPhotoSelect}
              isDragging={isDragging}
            />
          ))}
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <PhotoSkeleton key={`skeleton-${i}`} />
            ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activePhoto && <DragOverlayContent photo={activePhoto} />}
      </DragOverlay>
    </DndContext>
  );
});

export default SortablePhotoGrid;
