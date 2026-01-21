/**
 * Retry Button Component
 * Reusable retry button with loading state and customizable appearance
 * Issue #36: Photo Upload UI Improvement
 */

'use client';

import React, { useState, useCallback } from 'react';

interface RetryButtonProps {
  /** Callback function when retry is triggered */
  onRetry: () => void | Promise<void>;
  /** Button label */
  label?: string;
  /** Show loading spinner while retrying */
  showLoadingState?: boolean;
  /** Number of retry attempts made */
  retryCount?: number;
  /** Maximum retry attempts allowed */
  maxRetries?: number;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Disable the button */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show retry count badge */
  showRetryCount?: boolean;
}

/**
 * RetryButton - A reusable button component for retry actions
 * Includes loading state, retry count display, and customizable styling
 */
export function RetryButton({
  onRetry,
  label = '再試行',
  showLoadingState = true,
  retryCount = 0,
  maxRetries = 3,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  showRetryCount = true,
}: RetryButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (disabled || isLoading) return;

    if (showLoadingState) {
      setIsLoading(true);
    }

    try {
      await onRetry();
    } finally {
      setIsLoading(false);
    }
  }, [onRetry, disabled, isLoading, showLoadingState]);

  const isMaxRetriesReached = retryCount >= maxRetries;

  // Variant styles
  const variantStyles = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300',
    secondary:
      'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-300',
    outline:
      'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-500 disabled:border-gray-300 disabled:text-gray-300',
    ghost:
      'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-500 disabled:text-gray-300',
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-xs gap-1.5',
    md: 'px-3 py-2 text-sm gap-2',
    lg: 'px-4 py-2.5 text-base gap-2.5',
  };

  const iconSizeStyles = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading || isMaxRetriesReached}
      className={`
        inline-flex items-center justify-center
        font-medium rounded-lg
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      aria-label={`${label}${retryCount > 0 ? ` (attempt ${retryCount + 1})` : ''}`}
      aria-busy={isLoading}
    >
      {/* Loading Spinner */}
      {isLoading ? (
        <svg
          className={`animate-spin ${iconSizeStyles[size]}`}
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <svg
          className={iconSizeStyles[size]}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      )}

      {/* Label */}
      <span>{isLoading ? '再試行中...' : label}</span>

      {/* Retry Count Badge */}
      {showRetryCount && retryCount > 0 && !isLoading && (
        <span
          className={`
            inline-flex items-center justify-center
            rounded-full font-medium
            ${size === 'sm' ? 'text-[10px] min-w-[16px] h-4 px-1' : ''}
            ${size === 'md' ? 'text-xs min-w-[18px] h-[18px] px-1' : ''}
            ${size === 'lg' ? 'text-xs min-w-[20px] h-5 px-1.5' : ''}
            ${variant === 'primary' || variant === 'secondary'
              ? 'bg-white/20 text-white'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'}
          `}
          aria-label={`${retryCount} of ${maxRetries} retries`}
        >
          {retryCount}/{maxRetries}
        </span>
      )}
    </button>
  );
}

/**
 * RetryAllButton - A button to retry all failed items at once
 */
interface RetryAllButtonProps {
  /** Callback function when retry all is triggered */
  onRetryAll: () => void | Promise<void>;
  /** Number of failed items */
  failedCount: number;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Disable the button */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function RetryAllButton({
  onRetryAll,
  failedCount,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
}: RetryAllButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (disabled || isLoading || failedCount === 0) return;

    setIsLoading(true);
    try {
      await onRetryAll();
    } finally {
      setIsLoading(false);
    }
  }, [onRetryAll, disabled, isLoading, failedCount]);

  // Variant styles
  const variantStyles = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300',
    secondary:
      'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-300',
    outline:
      'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-500 disabled:border-gray-300 disabled:text-gray-300',
    ghost:
      'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-500 disabled:text-gray-300',
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-xs gap-1.5',
    md: 'px-3 py-2 text-sm gap-2',
    lg: 'px-4 py-2.5 text-base gap-2.5',
  };

  const iconSizeStyles = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (failedCount === 0) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center
        font-medium rounded-lg
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      aria-label={`失敗した${failedCount}件を全て再試行`}
      aria-busy={isLoading}
    >
      {/* Loading Spinner or Icon */}
      {isLoading ? (
        <svg
          className={`animate-spin ${iconSizeStyles[size]}`}
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <svg
          className={iconSizeStyles[size]}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      )}

      {/* Label */}
      <span>
        {isLoading ? '再試行中...' : `失敗を再試行 (${failedCount})`}
      </span>
    </button>
  );
}
