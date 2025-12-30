'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  Photo,
  PhotoFilters,
  PhotoSort,
  PaginatedResponse,
  BulkActionRequest,
  BulkActionResponse,
  SearchResult,
} from '@/types/photo';

/**
 * Options for the infinite photos hook
 */
export interface UseInfinitePhotosOptions {
  projectId?: string;
  initialFilters?: PhotoFilters;
  initialSort?: PhotoSort;
  pageSize?: number;
  autoFetch?: boolean;
}

/**
 * Return type for the infinite photos hook
 */
export interface UseInfinitePhotosReturn {
  photos: Photo[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  filters: PhotoFilters;
  sort: PhotoSort;
  selectedIds: Set<string>;
  focusedIndex: number;
  fetchPhotos: () => Promise<void>;
  fetchMore: () => Promise<void>;
  setFilters: (filters: PhotoFilters) => void;
  setSort: (sort: PhotoSort) => void;
  setFocusedIndex: (index: number) => void;
  selectPhoto: (id: string) => void;
  deselectPhoto: (id: string) => void;
  togglePhotoSelection: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  selectRange: (startIndex: number, endIndex: number) => void;
  bulkAction: (action: BulkActionRequest) => Promise<BulkActionResponse>;
  reorderPhotos: (photos: Photo[]) => void;
  refresh: () => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook for infinite scrolling photo list with accumulation
 */
export function useInfinitePhotos(
  options: UseInfinitePhotosOptions = {}
): UseInfinitePhotosReturn {
  const {
    projectId,
    initialFilters = {},
    initialSort = { field: 'takenAt', direction: 'desc' },
    pageSize = 20,
    autoFetch = true,
  } = options;

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFiltersState] = useState<PhotoFilters>(initialFilters);
  const [sort, setSortState] = useState<PhotoSort>(initialSort);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Build query string for API request
   */
  const buildQueryString = useCallback(
    (page: number) => {
      const params = new URLSearchParams();

      if (projectId) params.set('projectId', projectId);
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      params.set('sortField', sort.field);
      params.set('sortOrder', sort.direction);

      if (filters.workType) {
        params.set(
          'workType',
          Array.isArray(filters.workType)
            ? filters.workType.join(',')
            : filters.workType
        );
      }
      if (filters.category) {
        params.set(
          'category',
          Array.isArray(filters.category)
            ? filters.category.join(',')
            : filters.category
        );
      }
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      if (filters.tags) params.set('tags', filters.tags.join(','));
      if (filters.hasBlackboard !== undefined) {
        params.set('hasBlackboard', String(filters.hasBlackboard));
      }

      return params.toString();
    },
    [projectId, pageSize, sort, filters]
  );

  /**
   * Fetch initial photos (reset and load first page)
   */
  const fetchPhotos = useCallback(async () => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    setCurrentPage(1);

    try {
      const queryString = buildQueryString(1);
      const response = await fetch(`/api/photos?${queryString}`, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PaginatedResponse<Photo> = await response.json();
      setPhotos(data.data);
      setTotalCount(data.pagination.total);
      setHasMore(data.pagination.hasNextPage);
      setCurrentPage(1);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Ignore aborted requests
      }
      const message = err instanceof Error ? err.message : 'Failed to fetch photos';
      setError(message);
      console.error('Error fetching photos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [buildQueryString]);

  /**
   * Fetch more photos (append to existing list)
   */
  const fetchMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    try {
      const nextPage = currentPage + 1;
      const queryString = buildQueryString(nextPage);
      const response = await fetch(`/api/photos?${queryString}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PaginatedResponse<Photo> = await response.json();

      setPhotos((prev) => {
        // Deduplicate photos by id
        const existingIds = new Set(prev.map((p) => p.id));
        const newPhotos = data.data.filter((p) => !existingIds.has(p.id));
        return [...prev, ...newPhotos];
      });

      setHasMore(data.pagination.hasNextPage);
      setCurrentPage(nextPage);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load more photos';
      setError(message);
      console.error('Error loading more photos:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [buildQueryString, currentPage, hasMore, isLoadingMore]);

  /**
   * Set filters and reset photos
   */
  const setFilters = useCallback((newFilters: PhotoFilters) => {
    setFiltersState(newFilters);
    setPhotos([]);
    setCurrentPage(1);
    setHasMore(true);
    setSelectedIds(new Set());
    setFocusedIndex(0);
  }, []);

  /**
   * Set sort and reset photos
   */
  const setSort = useCallback((newSort: PhotoSort) => {
    setSortState(newSort);
    setPhotos([]);
    setCurrentPage(1);
    setHasMore(true);
  }, []);

  /**
   * Selection handlers
   */
  const selectPhoto = useCallback((id: string) => {
    setSelectedIds((prev) => new Set(prev).add(id));
  }, []);

  const deselectPhoto = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  const togglePhotoSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(photos.map((p) => p.id)));
  }, [photos]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectRange = useCallback(
    (startIndex: number, endIndex: number) => {
      const minIndex = Math.min(startIndex, endIndex);
      const maxIndex = Math.max(startIndex, endIndex);
      const newSelected = new Set(selectedIds);

      for (let i = minIndex; i <= maxIndex; i++) {
        if (photos[i]) {
          newSelected.add(photos[i].id);
        }
      }

      setSelectedIds(newSelected);
    },
    [photos, selectedIds]
  );

  /**
   * Bulk action handler
   */
  const bulkAction = useCallback(
    async (action: BulkActionRequest): Promise<BulkActionResponse> => {
      try {
        const response = await fetch('/api/photos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(action),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: BulkActionResponse = await response.json();

        if (result.success) {
          setSelectedIds(new Set());
          // Refresh the photos list
          await fetchPhotos();
        }

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Bulk action failed';
        console.error('Bulk action error:', err);
        return {
          success: false,
          affectedCount: 0,
          errors: action.photoIds.map((id) => ({
            photoId: id,
            error: message,
          })),
        };
      }
    },
    [fetchPhotos]
  );

  /**
   * Reorder photos locally and persist to server
   */
  const reorderPhotos = useCallback(
    async (newPhotos: Photo[]) => {
      setPhotos(newPhotos);

      // Persist reorder to server
      if (projectId && newPhotos.length > 0) {
        try {
          const response = await fetch('/api/photos/reorder', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              projectId,
              photoIds: newPhotos.map((p) => p.id),
            }),
          });

          if (!response.ok) {
            console.error('Failed to persist photo reorder');
          }
        } catch (error) {
          console.error('Error persisting photo reorder:', error);
        }
      }
    },
    [projectId]
  );

  /**
   * Refresh the current photos list
   */
  const refresh = useCallback(async () => {
    await fetchPhotos();
  }, [fetchPhotos]);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    setPhotos([]);
    setIsLoading(false);
    setIsLoadingMore(false);
    setError(null);
    setHasMore(true);
    setTotalCount(0);
    setFiltersState(initialFilters);
    setSortState(initialSort);
    setSelectedIds(new Set());
    setFocusedIndex(0);
    setCurrentPage(1);
  }, [initialFilters, initialSort]);

  /**
   * Auto-fetch on mount and when filters/sort change
   */
  useEffect(() => {
    if (autoFetch) {
      fetchPhotos();
    }
  }, [autoFetch, filters, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
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
    fetchPhotos,
    fetchMore,
    setFilters,
    setSort,
    setFocusedIndex,
    selectPhoto,
    deselectPhoto,
    togglePhotoSelection,
    selectAll,
    deselectAll,
    selectRange,
    bulkAction,
    reorderPhotos,
    refresh,
    reset,
  };
}

/**
 * Infinite scroll search hook
 */
export interface UseInfinitePhotoSearchOptions {
  projectId?: string;
  debounceMs?: number;
  minQueryLength?: number;
  pageSize?: number;
}

export interface UseInfinitePhotoSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  isSearching: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  searchMore: () => Promise<void>;
  clearSearch: () => void;
}

/**
 * Custom hook for infinite scrolling search results
 */
export function useInfinitePhotoSearch(
  options: UseInfinitePhotoSearchOptions = {}
): UseInfinitePhotoSearchReturn {
  const {
    projectId,
    debounceMs = 300,
    minQueryLength = 2,
    pageSize = 20,
  } = options;

  const [query, setQueryState] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
    setCurrentPage(1);
    setResults([]);
  }, []);

  /**
   * Perform initial search
   */
  const search = useCallback(async () => {
    if (debouncedQuery.length < minQueryLength) {
      setResults([]);
      setHasMore(false);
      setTotalCount(0);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: debouncedQuery,
        page: '1',
        limit: String(pageSize),
      });

      if (projectId) {
        params.set('projectId', projectId);
      }

      const response = await fetch(`/api/photos/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PaginatedResponse<SearchResult> = await response.json();
      setResults(data.data);
      setHasMore(data.pagination.hasNextPage);
      setTotalCount(data.pagination.total);
      setCurrentPage(1);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, [debouncedQuery, projectId, minQueryLength, pageSize]);

  /**
   * Load more search results
   */
  const searchMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || debouncedQuery.length < minQueryLength) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const nextPage = currentPage + 1;
      const params = new URLSearchParams({
        q: debouncedQuery,
        page: String(nextPage),
        limit: String(pageSize),
      });

      if (projectId) {
        params.set('projectId', projectId);
      }

      const response = await fetch(`/api/photos/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PaginatedResponse<SearchResult> = await response.json();

      setResults((prev) => {
        const existingIds = new Set(prev.map((r) => r.photo.id));
        const newResults = data.data.filter((r) => !existingIds.has(r.photo.id));
        return [...prev, ...newResults];
      });

      setHasMore(data.pagination.hasNextPage);
      setCurrentPage(nextPage);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      console.error('Search error:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [debouncedQuery, currentPage, hasMore, isLoadingMore, projectId, minQueryLength, pageSize]);

  const clearSearch = useCallback(() => {
    setQueryState('');
    setDebouncedQuery('');
    setResults([]);
    setHasMore(false);
    setTotalCount(0);
    setCurrentPage(1);
    setError(null);
  }, []);

  // Auto-search when debounced query changes
  useEffect(() => {
    search();
  }, [debouncedQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    query,
    setQuery,
    results,
    isSearching,
    isLoadingMore,
    error,
    hasMore,
    totalCount,
    searchMore,
    clearSearch,
  };
}

export default useInfinitePhotos;
