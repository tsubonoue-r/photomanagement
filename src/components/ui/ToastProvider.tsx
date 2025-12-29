'use client';

import { createContext, useContext, useCallback, useState, ReactNode } from 'react';
import { ToastContainer, ToastData, ToastType } from './Toast';

/**
 * Toast context type definition
 */
interface ToastContextType {
  /** Add a new toast notification */
  addToast: (toast: Omit<ToastData, 'id'>) => string;
  /** Remove a toast by ID */
  removeToast: (id: string) => void;
  /** Shorthand for success toast */
  success: (title: string, message?: string) => string;
  /** Shorthand for error toast */
  error: (title: string, message?: string) => string;
  /** Shorthand for warning toast */
  warning: (title: string, message?: string) => string;
  /** Shorthand for info toast */
  info: (title: string, message?: string) => string;
  /** Clear all toasts */
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Generate unique ID for toasts
 */
function generateId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Props for ToastProvider component
 */
interface ToastProviderProps {
  children: ReactNode;
  /** Maximum number of toasts to display at once */
  maxToasts?: number;
}

/**
 * ToastProvider component
 * Provides toast notification functionality throughout the application
 *
 * @example
 * ```tsx
 * // In your app layout
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 *
 * // In any component
 * const { success, error } = useToast();
 * success('Saved!', 'Your changes have been saved.');
 * error('Error', 'Something went wrong.');
 * ```
 */
export function ToastProvider({ children, maxToasts = 5 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastData, 'id'>): string => {
      const id = generateId();
      const newToast: ToastData = { ...toast, id };

      setToasts((prev) => {
        const updated = [...prev, newToast];
        // Remove oldest toasts if exceeding max
        if (updated.length > maxToasts) {
          return updated.slice(-maxToasts);
        }
        return updated;
      });

      return id;
    },
    [maxToasts]
  );

  const createShorthand = useCallback(
    (type: ToastType) =>
      (title: string, message?: string): string =>
        addToast({ type, title, message }),
    [addToast]
  );

  const success = useCallback(
    (title: string, message?: string) => createShorthand('success')(title, message),
    [createShorthand]
  );

  const error = useCallback(
    (title: string, message?: string) => createShorthand('error')(title, message),
    [createShorthand]
  );

  const warning = useCallback(
    (title: string, message?: string) => createShorthand('warning')(title, message),
    [createShorthand]
  );

  const info = useCallback(
    (title: string, message?: string) => createShorthand('info')(title, message),
    [createShorthand]
  );

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const value: ToastContextType = {
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clearAll,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Hook to access toast notification functionality
 * Must be used within a ToastProvider
 *
 * @returns Toast context with methods to show notifications
 * @throws Error if used outside of ToastProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { success, error, warning, info } = useToast();
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveData();
 *       success('Saved!', 'Your data has been saved.');
 *     } catch (e) {
 *       error('Error', 'Failed to save data.');
 *     }
 *   };
 *
 *   return <button onClick={handleSave}>Save</button>;
 * }
 * ```
 */
export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
