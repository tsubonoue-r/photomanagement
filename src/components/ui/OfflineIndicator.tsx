'use client';

import { useEffect, useState, useCallback } from 'react';
import { Wifi, WifiOff, RefreshCw, X } from 'lucide-react';

/**
 * Props for OfflineIndicator component
 */
interface OfflineIndicatorProps {
  /** Position of the indicator */
  position?: 'top' | 'bottom';
  /** Whether to auto-hide when back online */
  autoHide?: boolean;
  /** Duration to show the "back online" message (in ms) */
  autoHideDuration?: number;
  /** Custom class name for additional styling */
  className?: string;
}

/**
 * OfflineIndicator component
 * Displays a banner when the user loses internet connection
 * and notifies when the connection is restored.
 *
 * Features:
 * - Real-time network status detection
 * - Animated transitions
 * - Manual retry option
 * - Auto-hide when back online
 * - Dark mode support
 * - Accessible with ARIA labels
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * <OfflineIndicator position="bottom" autoHide />
 * ```
 */
export function OfflineIndicator({
  position = 'bottom',
  autoHide = true,
  autoHideDuration = 3000,
  className = '',
}: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    if (wasOffline) {
      // Show "back online" message briefly
      setShowBanner(true);
      if (autoHide) {
        setTimeout(() => {
          setShowBanner(false);
          setWasOffline(false);
        }, autoHideDuration);
      }
    }
  }, [wasOffline, autoHide, autoHideDuration]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(true);
    setShowBanner(true);
  }, []);

  const handleRetry = useCallback(() => {
    // Trigger a simple fetch to check connectivity
    fetch('/api/health', { method: 'HEAD' })
      .then(() => {
        handleOnline();
      })
      .catch(() => {
        // Still offline
      });
  }, [handleOnline]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
  }, []);

  useEffect(() => {
    // Set initial state
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
      if (!navigator.onLine) {
        setShowBanner(true);
        setWasOffline(true);
      }
    }

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  // Don't render if online and banner should not be shown
  if (!showBanner) {
    return null;
  }

  const positionClasses = position === 'top'
    ? 'top-0'
    : 'bottom-0';

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`
        fixed left-0 right-0 z-50
        ${positionClasses}
        transform transition-transform duration-300 ease-out
        ${showBanner ? 'translate-y-0' : position === 'top' ? '-translate-y-full' : 'translate-y-full'}
        ${className}
      `}
    >
      <div
        className={`
          flex items-center justify-between gap-4 px-4 py-3 mx-auto
          ${isOnline
            ? 'bg-green-600 dark:bg-green-700'
            : 'bg-amber-600 dark:bg-amber-700'
          }
          text-white shadow-lg
        `}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          {isOnline ? (
            <Wifi className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          ) : (
            <WifiOff className="w-5 h-5 flex-shrink-0 animate-pulse" aria-hidden="true" />
          )}

          {/* Message */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-medium">
              {isOnline ? 'オンラインに復帰' : 'オフラインです'}
            </span>
            <span className="text-sm opacity-90">
              {isOnline
                ? '接続が復元されました。'
                : 'インターネット接続を確認してください。'
              }
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!isOnline && (
            <button
              type="button"
              onClick={handleRetry}
              className="
                inline-flex items-center gap-1 px-3 py-1.5
                bg-white/20 hover:bg-white/30
                text-white text-sm font-medium rounded-md
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-amber-600
              "
              aria-label="接続を再試行"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">再試行</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            className="
              p-1.5
              hover:bg-white/20
              rounded-md
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-white
            "
            aria-label="通知を閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to check online status
 * Useful for conditionally rendering content based on network state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isOnline = useOnlineStatus();
 *
 *   if (!isOnline) {
 *     return <p>You are offline. Some features may be unavailable.</p>;
 *   }
 *
 *   return <DataFetcher />;
 * }
 * ```
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
