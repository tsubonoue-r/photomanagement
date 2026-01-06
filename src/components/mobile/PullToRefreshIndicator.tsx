'use client';

import { Loader2 } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  isPulledEnough: boolean;
  threshold?: number;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  isPulledEnough,
  threshold = 80,
}: PullToRefreshIndicatorProps) {
  if (pullDistance === 0 && !isRefreshing) return null;

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 360;

  return (
    <div
      className="absolute left-0 right-0 flex justify-center pointer-events-none z-10"
      style={{
        top: -40,
        transform: `translateY(${pullDistance}px)`,
        opacity: progress,
      }}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          isPulledEnough || isRefreshing
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
        }`}
        style={{
          transform: isRefreshing ? 'none' : `rotate(${rotation}deg)`,
        }}
      >
        <Loader2
          className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
        />
      </div>
    </div>
  );
}
