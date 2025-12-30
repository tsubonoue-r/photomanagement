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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/projects/${projectId}`}
                className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                戻る
              </Link>
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
                写真一覧
              </h1>
              {totalCount > 0 && (
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {totalCount}枚
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Keyboard shortcuts button */}
              <KeyboardShortcutsButton />

              {/* Reorder toggle */}
              <button
                onClick={() => setEnableReorder(!enableReorder)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors
                  ${enableReorder
                    ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'border-zinc-300 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-700'
                  }`}
                aria-pressed={enableReorder}
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
                    d="M4 8h16M4 16h16"
                  />
                </svg>
                並べ替え
              </button>

              {/* View mode toggle */}
              <div className="flex rounded-lg border border-zinc-300 dark:border-zinc-600">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${
                    viewMode === 'grid'
                      ? 'bg-zinc-100 dark:bg-zinc-700'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-700'
                  }`}
                  aria-label="Grid view"
                >
                  <svg
                    className="h-5 w-5 text-zinc-600 dark:text-zinc-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${
                    viewMode === 'list'
                      ? 'bg-zinc-100 dark:bg-zinc-700'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-700'
                  }`}
                  aria-label="List view"
                >
                  <svg
                    className="h-5 w-5 text-zinc-600 dark:text-zinc-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>

              {/* Grid column selector */}
              {viewMode === 'grid' && (
                <select
                  value={gridColumns}
                  onChange={(e) => setGridColumns(Number(e.target.value) as 2 | 3 | 4 | 5 | 6)}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm
                    dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                >
                  <option value={2}>2列</option>
                  <option value={3}>3列</option>
                  <option value={4}>4列</option>
                  <option value={5}>5列</option>
                  <option value={6}>6列</option>
                </select>
              )}

              {/* Upload button */}
              <Link
                href={`/projects/${projectId}/photos/upload`}
                className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium
                  text-white transition-colors hover:bg-blue-600"
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                アップロード
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Filters and sort */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <PhotoFilters
              filters={filters}
              onFiltersChange={setFilters}
              onSearch={handleSearch}
              searchQuery={query}
            />
          </div>
          <div className="flex-shrink-0">
            <PhotoSorter sort={sort} onSortChange={setSort} />
          </div>
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
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <p className="font-medium">エラーが発生しました</p>
            <p className="mt-1 text-sm">{error}</p>
            <button
              onClick={() => refresh()}
              className="mt-2 text-sm underline hover:no-underline"
            >
              再試行
            </button>
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
