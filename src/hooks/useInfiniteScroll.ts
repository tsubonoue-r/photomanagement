'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

interface UseInfiniteScrollReturn {
  sentinelRef: (node: HTMLElement | null) => void;
  isLoadingMore: boolean;
  hasMore: boolean;
  setHasMore: (value: boolean) => void;
  reset: () => void;
}

export function useInfiniteScroll(
  onLoadMore: () => Promise<void>,
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn {
  const { threshold = 0, rootMargin = '100px', enabled = true } = options;

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelNodeRef = useRef<HTMLElement | null>(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore || !enabled) {
      return;
    }

    loadingRef.current = true;
    setIsLoadingMore(true);

    try {
      await onLoadMore();
    } catch (error) {
      console.error('Error loading more items:', error);
    } finally {
      loadingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [onLoadMore, hasMore, enabled]);

  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (!node || !enabled) {
        sentinelNodeRef.current = null;
        return;
      }

      sentinelNodeRef.current = node;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting && hasMore && !loadingRef.current) {
            loadMore();
          }
        },
        {
          threshold,
          rootMargin,
        }
      );

      observerRef.current.observe(node);
    },
    [enabled, hasMore, loadMore, threshold, rootMargin]
  );

  const reset = useCallback(() => {
    setHasMore(true);
    setIsLoadingMore(false);
    loadingRef.current = false;
  }, []);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    sentinelRef,
    isLoadingMore,
    hasMore,
    setHasMore,
    reset,
  };
}
