'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast notification data structure
 */
export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

/**
 * Props for individual Toast component
 */
interface ToastProps {
  toast: ToastData;
  onClose: (id: string) => void;
}

/**
 * Icon mapping for toast types
 */
const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

/**
 * Style mapping for toast types
 */
const styleMap = {
  success: {
    container: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
    title: 'text-green-800 dark:text-green-200',
    message: 'text-green-700 dark:text-green-300',
  },
  error: {
    container: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-800 dark:text-red-200',
    message: 'text-red-700 dark:text-red-300',
  },
  warning: {
    container: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-600 dark:text-yellow-400',
    title: 'text-yellow-800 dark:text-yellow-200',
    message: 'text-yellow-700 dark:text-yellow-300',
  },
  info: {
    container: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-800 dark:text-blue-200',
    message: 'text-blue-700 dark:text-blue-300',
  },
};

/**
 * Individual Toast notification component
 * Displays a single toast with icon, title, optional message, and close button
 */
export function Toast({ toast, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const Icon = iconMap[toast.type];
  const styles = styleMap[toast.type];

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 200);
  }, [onClose, toast.id]);

  useEffect(() => {
    // Trigger enter animation
    const enterTimeout = setTimeout(() => setIsVisible(true), 10);

    // Auto dismiss after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      const dismissTimeout = setTimeout(handleClose, duration);
      return () => {
        clearTimeout(enterTimeout);
        clearTimeout(dismissTimeout);
      };
    }

    return () => clearTimeout(enterTimeout);
  }, [toast.duration, handleClose]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg
        transition-all duration-200 ease-out
        ${styles.container}
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={`h-5 w-5 ${styles.icon}`} aria-hidden="true" />
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className={`text-sm font-medium ${styles.title}`}>
              {toast.title}
            </p>
            {toast.message && (
              <p className={`mt-1 text-sm ${styles.message}`}>
                {toast.message}
              </p>
            )}
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className={`
                inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2
                ${styles.icon} hover:opacity-70 focus:ring-current
              `}
              aria-label="通知を閉じる"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Props for ToastContainer component
 */
interface ToastContainerProps {
  toasts: ToastData[];
  onClose: (id: string) => void;
}

/**
 * Container component that renders all active toasts
 * Positioned at the top-right corner of the viewport
 */
export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div
      aria-live="polite"
      aria-label="通知"
      className="pointer-events-none fixed inset-0 z-50 flex flex-col items-end justify-start gap-3 p-4 sm:p-6"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}
