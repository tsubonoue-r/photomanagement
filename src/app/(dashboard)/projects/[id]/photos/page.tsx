'use client';

import { useState, useCallback, use } from 'react';
import Link from 'next/link';
import { useInfinitePhotos, useInfinitePhotoSearch } from '@/hooks/useInfinitePhotos';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import {
  PhotoGrid,
  SortablePhotoGrid,
  PhotoLightbox,
  PhotoFilters,
  PhotoSorter,
  PhotoBulkActions,
  KeyboardShortcutsButton,
} from '@/components/photos';
import type { Photo } from '@/types/photo';

interface ProjectPhotosPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ProjectPhotosPage({ params }: ProjectPhotosPageProps) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  // Photo list state with infinite loading
  const {
    photos,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    totalCount,
    filters,
    sort,
    selectedIds,
    focusedIndex,
    fetchMore,
    setFilters,
    setSort,
    setFocusedIndex,
    togglePhotoSelection,
    selectAll,
    deselectAll,
    bulkAction,
    reorderPhotos,
    refresh,
  } = useInfinitePhotos({
    projectId,
    autoFetch: true,
  });

  // Search state with infinite loading
  const {
    query,
    setQuery,
    results,
    isSearching,
    isLoadingMore: isSearchLoadingMore,
    hasMore: searchHasMore,
    searchMore,
  } = useInfinitePhotoSearch({
    projectId,
  });

  // Lightbox state
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);

  // View mode state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4 | 5 | 6>(4);
  const [enableReorder, setEnableReorder] = useState(false);

  // Keyboard shortcuts help modal
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Determine which photos to display
  const isSearchMode = query.length >= 2;
  const displayPhotos = isSearchMode ? results.map((r) => r.photo) : photos;
  const displayHasMore = isSearchMode ? searchHasMore : hasMore;
  const displayIsLoadingMore = isSearchMode ? isSearchLoadingMore : isLoadingMore;

  // Infinite scroll integration
  const { sentinelRef } = useInfiniteScroll(
    async () => {
      if (isSearchMode) {
        await searchMore();
      } else {
        await fetchMore();
      }
    },
    {
      enabled: !isLoading && !isSearching && displayHasMore,
    }
  );

  // Handle photo click for lightbox
  const handlePhotoClick = useCallback((photo: Photo) => {
    setLightboxPhoto(photo);
  }, []);

  // Handle lightbox navigation
  const handleLightboxNavigate = useCallback((photo: Photo) => {
    setLightboxPhoto(photo);
  }, []);

  // Handle lightbox close
  const handleLightboxClose = useCallback(() => {
    setLightboxPhoto(null);
  }, []);

  // Handle search
  const handleSearch = useCallback(
    (searchQuery: string) => {
      setQuery(searchQuery);
    },
    [setQuery]
  );

  // Handle photo reorder (drag and drop)
  // Note: reorderPhotos now automatically persists to server via /api/photos/reorder
  const handleReorder = useCallback(
    (newPhotos: Photo[]) => {
      reorderPhotos(newPhotos);
    },
    [reorderPhotos]
  );

  // Keyboard shortcuts
  const shortcuts = [
    {
      key: '?',
      handler: () => setShowShortcutsHelp(true),
      description: 'Show shortcuts help',
    },
    {
      key: 'Escape',
      handler: () => {
        if (lightboxPhoto) {
          handleLightboxClose();
        } else if (showShortcutsHelp) {
          setShowShortcutsHelp(false);
        } else {
          deselectAll();
        }
      },
      description: 'Close modal or deselect all',
    },
    {
      key: 'ArrowLeft',
      handler: () => {
        if (!lightboxPhoto) {
          setFocusedIndex(Math.max(0, focusedIndex - 1));
        }
      },
      description: 'Move focus left',
      enabled: !lightboxPhoto,
    },
    {
      key: 'ArrowRight',
      handler: () => {
        if (!lightboxPhoto) {
          setFocusedIndex(Math.min(displayPhotos.length - 1, focusedIndex + 1));
        }
      },
      description: 'Move focus right',
      enabled: !lightboxPhoto,
    },
    {
      key: 'ArrowUp',
      handler: () => {
        if (!lightboxPhoto) {
          setFocusedIndex(Math.max(0, focusedIndex - gridColumns));
        }
      },
      description: 'Move focus up',
      enabled: !lightboxPhoto,
    },
    {
      key: 'ArrowDown',
      handler: () => {
        if (!lightboxPhoto) {
          setFocusedIndex(Math.min(displayPhotos.length - 1, focusedIndex + gridColumns));
        }
      },
      description: 'Move focus down',
      enabled: !lightboxPhoto,
    },
    {
      key: ' ',
      handler: () => {
        if (!lightboxPhoto && displayPhotos[focusedIndex]) {
          togglePhotoSelection(displayPhotos[focusedIndex].id);
        }
      },
      description: 'Toggle selection',
      enabled: !lightboxPhoto,
    },
    {
      key: 'Enter',
      handler: () => {
        if (!lightboxPhoto && displayPhotos[focusedIndex]) {
          setLightboxPhoto(displayPhotos[focusedIndex]);
        }
      },
      description: 'Open in lightbox',
      enabled: !lightboxPhoto,
    },
    {
      key: 'a',
      ctrl: true,
      handler: selectAll,
      description: 'Select all',
    },
  ];

  useKeyboardShortcuts(shortcuts, {
    enabled: true,
    ignoreInputs: true,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Compact Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href={`/projects/${projectId}`}
                className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors active:scale-95 flex-shrink-0"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">写真一覧</h1>
                {totalCount > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{totalCount}枚</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Grid toggle - mobile simplified */}
              <select
                value={gridColumns}
                onChange={(e) => setGridColumns(Number(e.target.value) as 2 | 3 | 4 | 5 | 6)}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs
                  text-gray-700 dark:text-gray-300"
              >
                <option value={2}>2列</option>
                <option value={3}>3列</option>
                <option value={4}>4列</option>
              </select>

              {/* Upload button - compact */}
              <Link
                href={`/projects/${projectId}/photos/upload`}
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 text-white active:scale-95 transition-transform"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 py-4 pb-24">
        {/* Filters - compact */}
        <div className="mb-4">
          <PhotoFilters
            filters={filters}
            onFiltersChange={setFilters}
            onSearch={handleSearch}
            searchQuery={query}
          />
        </div>

        {/* Bulk actions bar */}
        {selectedIds.size > 0 && (
          <div className="mb-4">
            <PhotoBulkActions
              selectedCount={selectedIds.size}
              onBulkAction={bulkAction}
              selectedIds={selectedIds}
              onSelectAll={selectAll}
              onDeselectAll={deselectAll}
              totalCount={totalCount}
            />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-red-700 dark:text-red-400">
            <p className="text-sm font-medium">エラーが発生しました</p>
            <p className="mt-1 text-xs">{error}</p>
            <button onClick={() => refresh()} className="mt-2 text-xs underline">再試行</button>
          </div>
        )}

        {/* Search indicator */}
        {isSearching && (
          <div className="mb-4 flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            検索中...
          </div>
        )}

        {/* Photo grid - use SortablePhotoGrid when reorder is enabled */}
        {enableReorder && !isSearchMode ? (
          <SortablePhotoGrid
            photos={displayPhotos}
            selectedIds={selectedIds}
            onPhotoClick={handlePhotoClick}
            onPhotoSelect={togglePhotoSelection}
            onReorder={handleReorder}
            isLoading={isLoading || isSearching}
            columns={gridColumns}
          />
        ) : (
          <PhotoGrid
            photos={displayPhotos}
            selectedIds={selectedIds}
            onPhotoClick={handlePhotoClick}
            onPhotoSelect={togglePhotoSelection}
            isLoading={isLoading || isSearching}
            columns={gridColumns}
          />
        )}

        {/* Infinite scroll sentinel */}
        {displayHasMore && (
          <div
            ref={sentinelRef}
            className="flex h-20 items-center justify-center"
          >
            {displayIsLoadingMore && (
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-500 dark:border-zinc-700" />
            )}
          </div>
        )}

        {/* End of list message */}
        {!displayHasMore && displayPhotos.length > 0 && (
          <div className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            全{isSearchMode ? results.length : totalCount}件の写真を表示しました
          </div>
        )}
      </main>

      {/* Lightbox */}
      <PhotoLightbox
        photo={lightboxPhoto}
        photos={displayPhotos}
        onClose={handleLightboxClose}
        onNavigate={handleLightboxNavigate}
      />
    </div>
  );
}
