'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { hapticLight, hapticMedium } from '@/lib/capacitor/haptics';

export interface UsePullToRefreshOptions {
  /** リフレッシュのコールバック */
  onRefresh: () => Promise<void>;
  /** 引っ張る閾値（px） */
  threshold?: number;
  /** 最大引っ張り距離（px） */
  maxPull?: number;
  /** 無効化 */
  disabled?: boolean;
}

export interface UsePullToRefreshReturn {
  /** コンテナにアタッチするref */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** 現在の引っ張り距離 */
  pullDistance: number;
  /** リフレッシュ中かどうか */
  isRefreshing: boolean;
  /** 閾値に達したかどうか */
  isPulledEnough: boolean;
  /** インジケーターのスタイル */
  indicatorStyle: React.CSSProperties;
}

export function usePullToRefresh(options: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const {
    onRefresh,
    threshold = 80,
    maxPull = 120,
    disabled = false,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulledEnough, setIsPulledEnough] = useState(false);

  const startY = useRef(0);
  const currentY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;

    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;

    startY.current = e.touches[0].clientY;
    isPulling.current = true;
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current || disabled || isRefreshing) return;

    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      isPulling.current = false;
      setPullDistance(0);
      return;
    }

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    if (diff > 0) {
      // Apply resistance
      const resistance = 0.5;
      const adjustedDiff = Math.min(diff * resistance, maxPull);
      setPullDistance(adjustedDiff);

      // Check if threshold reached
      const reachedThreshold = adjustedDiff >= threshold;
      if (reachedThreshold && !isPulledEnough) {
        hapticLight();
        setIsPulledEnough(true);
      } else if (!reachedThreshold && isPulledEnough) {
        setIsPulledEnough(false);
      }

      // Prevent default scroll
      if (diff > 10) {
        e.preventDefault();
      }
    }
  }, [disabled, isRefreshing, threshold, maxPull, isPulledEnough]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current || disabled) return;

    isPulling.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      hapticMedium();

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        setIsPulledEnough(false);
      }
    } else {
      setPullDistance(0);
      setIsPulledEnough(false);
    }
  }, [disabled, pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const indicatorStyle: React.CSSProperties = {
    transform: `translateY(${pullDistance}px)`,
    transition: isPulling.current ? 'none' : 'transform 0.3s ease-out',
  };

  return {
    containerRef,
    pullDistance,
    isRefreshing,
    isPulledEnough,
    indicatorStyle,
  };
}
