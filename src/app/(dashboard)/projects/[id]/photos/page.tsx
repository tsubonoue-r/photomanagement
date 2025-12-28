'use client';

import { useState, useCallback, useEffect, use } from 'react';
import Link from 'next/link';
import { usePhotos, usePhotoSearch } from '@/hooks/usePhotos';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import {
  PhotoGrid,
  PhotoLightbox,
  PhotoFilters,
  PhotoSorter,
  PhotoBulkActions,
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

  // Photo list state
  const {
    photos,
    isLoading,
    error,
    pagination,
    filters,
    sort,
    selectedIds,
    fetchPhotos,
    setFilters,
    setSort,
    togglePhotoSelection,
    selectAll,
    deselectAll,
    bulkAction,
  } = usePhotos({
    projectId,
    autoFetch: true,
  });

  // Search state
  const { query, setQuery, results, isSearching } = usePhotoSearch({
    projectId,
  });

  // Lightbox state
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);

  // View mode state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4 | 5 | 6>(4);

  // Infinite scroll
  const { sentinelRef, isLoadingMore, hasMore, setHasMore } = useInfiniteScroll(
    async () => {
      if (pagination && pagination.hasNextPage) {
        await fetchPhotos(pagination.page + 1);
      }
    },
    { enabled: !isLoading && !!pagination?.hasNextPage }
  );

  // Update hasMore when pagination changes
  useEffect(() => {
    if (pagination) {
      setHasMore(pagination.hasNextPage);
    }
  }, [pagination, setHasMore]);

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

  // Determine which photos to display
  const displayPhotos = query.length >= 2 ? results.map((r) => r.photo) : photos;

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
              {pagination && (
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {pagination.total}枚
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
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
              totalCount={pagination?.total ?? photos.length}
            />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <p className="font-medium">エラーが発生しました</p>
            <p className="mt-1 text-sm">{error}</p>
            <button
              onClick={() => fetchPhotos()}
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

        {/* Photo grid */}
        <PhotoGrid
          photos={displayPhotos}
          selectedIds={selectedIds}
          onPhotoClick={handlePhotoClick}
          onPhotoSelect={togglePhotoSelection}
          isLoading={isLoading || isSearching}
          columns={gridColumns}
        />

        {/* Infinite scroll sentinel */}
        {hasMore && (
          <div
            ref={sentinelRef}
            className="flex h-20 items-center justify-center"
          >
            {isLoadingMore && (
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-500 dark:border-zinc-700" />
            )}
          </div>
        )}

        {/* Pagination info */}
        {pagination && !hasMore && photos.length > 0 && (
          <div className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            全{pagination.total}件の写真を表示しました
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
