'use client';

import { useState, useCallback, useEffect } from 'react';
import type {
  Photo,
  PhotoFilters,
  PhotoSort,
  PaginatedResponse,
  BulkActionRequest,
  BulkActionResponse,
  SearchResult,
} from '@/types/photo';

interface UsePhotosOptions {
  projectId?: string;
  initialFilters?: PhotoFilters;
  initialSort?: PhotoSort;
  initialLimit?: number;
  autoFetch?: boolean;
}

interface UsePhotosReturn {
  photos: Photo[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginatedResponse<Photo>['pagination'] | null;
  filters: PhotoFilters;
  sort: PhotoSort;
  selectedIds: Set<string>;
  fetchPhotos: (page?: number) => Promise<void>;
  setFilters: (filters: PhotoFilters) => void;
  setSort: (sort: PhotoSort) => void;
  selectPhoto: (id: string) => void;
  deselectPhoto: (id: string) => void;
  togglePhotoSelection: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  bulkAction: (action: BulkActionRequest) => Promise<BulkActionResponse>;
  refresh: () => Promise<void>;
}

export function usePhotos(options: UsePhotosOptions = {}): UsePhotosReturn {
  const {
    projectId,
    initialFilters = {},
    initialSort = { field: 'takenAt', direction: 'desc' },
    initialLimit = 20,
    autoFetch = true,
  } = options;

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginatedResponse<Photo>['pagination'] | null>(null);
  const [filters, setFiltersState] = useState<PhotoFilters>(initialFilters);
  const [sort, setSortState] = useState<PhotoSort>(initialSort);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();

    if (projectId) params.set('projectId', projectId);
    params.set('page', String(currentPage));
    params.set('limit', String(initialLimit));
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
  }, [projectId, currentPage, initialLimit, sort, filters]);

  const fetchPhotos = useCallback(async (page?: number) => {
    if (page !== undefined) {
      setCurrentPage(page);
    }

    setIsLoading(true);
    setError(null);

    try {
      const queryString = buildQueryString();
      const response = await fetch(`/api/photos?${queryString}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PaginatedResponse<Photo> = await response.json();
      setPhotos(data.data);
      setPagination(data.pagination);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch photos';
      setError(message);
      console.error('Error fetching photos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [buildQueryString]);

  const setFilters = useCallback((newFilters: PhotoFilters) => {
    setFiltersState(newFilters);
    setCurrentPage(1);
  }, []);

  const setSort = useCallback((newSort: PhotoSort) => {
    setSortState(newSort);
    setCurrentPage(1);
  }, []);

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

  const bulkAction = useCallback(async (action: BulkActionRequest): Promise<BulkActionResponse> => {
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
  }, [fetchPhotos]);

  const refresh = useCallback(async () => {
    await fetchPhotos(currentPage);
  }, [fetchPhotos, currentPage]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchPhotos();
    }
  }, [autoFetch, buildQueryString]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
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
    selectPhoto,
    deselectPhoto,
    togglePhotoSelection,
    selectAll,
    deselectAll,
    bulkAction,
    refresh,
  };
}

// Search hook
interface UsePhotoSearchOptions {
  projectId?: string;
  debounceMs?: number;
  minQueryLength?: number;
}

interface UsePhotoSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  isSearching: boolean;
  error: string | null;
  pagination: PaginatedResponse<SearchResult>['pagination'] | null;
  search: (page?: number) => Promise<void>;
  clearSearch: () => void;
}

export function usePhotoSearch(options: UsePhotoSearchOptions = {}): UsePhotoSearchReturn {
  const { projectId, debounceMs = 300, minQueryLength = 2 } = options;

  const [query, setQueryState] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginatedResponse<SearchResult>['pagination'] | null>(null);
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
  }, []);

  const search = useCallback(async (page?: number) => {
    if (page !== undefined) {
      setCurrentPage(page);
    }

    if (debouncedQuery.length < minQueryLength) {
      setResults([]);
      setPagination(null);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: debouncedQuery,
        page: String(page ?? currentPage),
        limit: '20',
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
      setPagination(data.pagination);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, [debouncedQuery, currentPage, projectId, minQueryLength]);

  const clearSearch = useCallback(() => {
    setQueryState('');
    setDebouncedQuery('');
    setResults([]);
    setPagination(null);
    setCurrentPage(1);
    setError(null);
  }, []);

  // Auto-search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= minQueryLength) {
      search();
    } else {
      setResults([]);
      setPagination(null);
    }
  }, [debouncedQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    query,
    setQuery,
    results,
    isSearching,
    error,
    pagination,
    search,
    clearSearch,
  };
}
