'use client';

import { ReactNode } from 'react';

/**
 * Props for base Skeleton component
 */
interface SkeletonProps {
  /** Additional CSS classes */
  className?: string;
  /** Width of the skeleton */
  width?: string | number;
  /** Height of the skeleton */
  height?: string | number;
  /** Whether to use rounded corners */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  /** Animation type */
  animation?: 'pulse' | 'shimmer' | 'none';
}

/**
 * Base Skeleton component for loading states
 * Displays an animated placeholder while content is loading
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Skeleton width={200} height={20} />
 *
 * // With custom styles
 * <Skeleton className="w-full h-12" rounded="lg" />
 * ```
 */
export function Skeleton({
  className = '',
  width,
  height,
  rounded = 'md',
  animation = 'pulse',
}: SkeletonProps) {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    shimmer: 'skeleton-shimmer',
    none: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`
        bg-gray-200 dark:bg-gray-700
        ${roundedClasses[rounded]}
        ${animationClasses[animation]}
        ${className}
      `}
      style={style}
    />
  );
}

/**
 * Skeleton for text lines
 */
interface SkeletonTextProps {
  /** Number of lines to render */
  lines?: number;
  /** Width of the last line (percentage) */
  lastLineWidth?: string;
  /** Gap between lines */
  gap?: 'sm' | 'md' | 'lg';
  /** Animation type */
  animation?: 'pulse' | 'shimmer' | 'none';
}

/**
 * SkeletonText component for text content placeholders
 *
 * @example
 * ```tsx
 * // Default 3 lines
 * <SkeletonText />
 *
 * // Custom lines with last line width
 * <SkeletonText lines={4} lastLineWidth="60%" />
 * ```
 */
export function SkeletonText({
  lines = 3,
  lastLineWidth = '75%',
  gap = 'md',
  animation = 'pulse',
}: SkeletonTextProps) {
  const gapClasses = {
    sm: 'space-y-1',
    md: 'space-y-2',
    lg: 'space-y-3',
  };

  return (
    <div className={gapClasses[gap]} role="status" aria-label="Loading text">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={16}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          animation={animation}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for avatar/profile images
 */
interface SkeletonAvatarProps {
  /** Size of the avatar */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Animation type */
  animation?: 'pulse' | 'shimmer' | 'none';
}

/**
 * SkeletonAvatar component for avatar placeholders
 *
 * @example
 * ```tsx
 * <SkeletonAvatar size="lg" />
 * ```
 */
export function SkeletonAvatar({ size = 'md', animation = 'pulse' }: SkeletonAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <Skeleton
      className={sizeClasses[size]}
      rounded="full"
      animation={animation}
    />
  );
}

/**
 * Skeleton for cards
 */
interface SkeletonCardProps {
  /** Whether to show an image placeholder */
  showImage?: boolean;
  /** Number of text lines */
  textLines?: number;
  /** Animation type */
  animation?: 'pulse' | 'shimmer' | 'none';
  /** Additional CSS classes */
  className?: string;
}

/**
 * SkeletonCard component for card content placeholders
 *
 * @example
 * ```tsx
 * <SkeletonCard showImage textLines={2} />
 * ```
 */
export function SkeletonCard({
  showImage = true,
  textLines = 3,
  animation = 'pulse',
  className = '',
}: SkeletonCardProps) {
  return (
    <div
      className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden ${className}`}
      role="status"
      aria-label="Loading card"
    >
      {showImage && (
        <Skeleton
          className="w-full aspect-video"
          rounded="none"
          animation={animation}
        />
      )}
      <div className="p-4 space-y-3">
        <Skeleton height={20} className="w-3/4" animation={animation} />
        <SkeletonText lines={textLines} animation={animation} />
      </div>
    </div>
  );
}

/**
 * Skeleton for photo grid items
 */
interface SkeletonPhotoGridProps {
  /** Number of items to show */
  count?: number;
  /** Number of columns */
  columns?: number;
  /** Animation type */
  animation?: 'pulse' | 'shimmer' | 'none';
}

/**
 * SkeletonPhotoGrid component for photo grid placeholders
 *
 * @example
 * ```tsx
 * <SkeletonPhotoGrid count={12} columns={4} />
 * ```
 */
export function SkeletonPhotoGrid({
  count = 8,
  columns = 4,
  animation = 'pulse',
}: SkeletonPhotoGridProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
  };

  return (
    <div
      className={`grid gap-4 ${gridClasses[columns as keyof typeof gridClasses] || gridClasses[4]}`}
      role="status"
      aria-label="Loading photo grid"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="relative aspect-square rounded-lg overflow-hidden"
        >
          <Skeleton
            className="absolute inset-0"
            rounded="lg"
            animation={animation}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for table rows
 */
interface SkeletonTableProps {
  /** Number of rows */
  rows?: number;
  /** Number of columns */
  columns?: number;
  /** Whether to show header */
  showHeader?: boolean;
  /** Animation type */
  animation?: 'pulse' | 'shimmer' | 'none';
}

/**
 * SkeletonTable component for table content placeholders
 *
 * @example
 * ```tsx
 * <SkeletonTable rows={5} columns={4} showHeader />
 * ```
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  showHeader = true,
  animation = 'pulse',
}: SkeletonTableProps) {
  return (
    <div
      className="w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
      role="status"
      aria-label="Loading table"
    >
      {showHeader && (
        <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton
              key={`header-${index}`}
              height={16}
              className="flex-1"
              animation={animation}
            />
          ))}
        </div>
      )}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex gap-4 p-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                height={16}
                className="flex-1"
                animation={animation}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * SkeletonWrapper for conditional loading
 */
interface SkeletonWrapperProps {
  /** Whether content is loading */
  isLoading: boolean;
  /** Skeleton to show while loading */
  skeleton: ReactNode;
  /** Content to show when loaded */
  children: ReactNode;
}

/**
 * SkeletonWrapper component for conditional rendering
 *
 * @example
 * ```tsx
 * <SkeletonWrapper
 *   isLoading={isLoading}
 *   skeleton={<SkeletonCard />}
 * >
 *   <Card data={data} />
 * </SkeletonWrapper>
 * ```
 */
export function SkeletonWrapper({ isLoading, skeleton, children }: SkeletonWrapperProps) {
  return <>{isLoading ? skeleton : children}</>;
}
