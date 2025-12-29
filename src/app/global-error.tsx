'use client';

import { useEffect, useState } from 'react';
import { AlertOctagon, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Props for the GlobalError component
 */
interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global Error page component
 * This is the root error boundary for the entire application.
 * It catches errors that occur in the root layout.
 *
 * Note: This component must include its own <html> and <body> tags
 * since it replaces the root layout when an error occurs.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error caught:', error);
  }, [error]);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-lg">
            {/* Critical error icon */}
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 bg-red-100 dark:bg-red-900/30 rounded-full animate-pulse" />
              </div>
              <div className="relative flex items-center justify-center">
                <div className="w-28 h-28 bg-red-50 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                  <AlertOctagon className="w-14 h-14 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>

            {/* Error code */}
            <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              500
            </h1>

            {/* Title */}
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Critical Error
            </h2>

            {/* Description */}
            <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">
              A critical error occurred while loading the application.
              This may be a temporary issue. Please try refreshing the page.
            </p>

            {/* Error digest (for error tracking) */}
            {error.digest && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-8 font-mono">
                Error ID: {error.digest}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <button
                type="button"
                onClick={reset}
                className="
                  inline-flex items-center gap-2 px-6 py-3
                  bg-blue-600 hover:bg-blue-700
                  text-white font-medium rounded-lg
                  transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                "
              >
                <RefreshCw className="w-5 h-5" />
                Try again
              </button>

              <button
                type="button"
                onClick={handleRefresh}
                className="
                  inline-flex items-center gap-2 px-6 py-3
                  bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800
                  text-gray-700 dark:text-gray-300
                  font-medium rounded-lg
                  border border-gray-300 dark:border-gray-600
                  transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                "
              >
                Refresh page
              </button>
            </div>

            {/* Error details (development mode) */}
            {isDevelopment && (
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 overflow-hidden text-left">
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="
                    w-full flex items-center justify-between
                    px-4 py-3
                    text-left text-sm font-medium
                    text-red-800 dark:text-red-200
                    hover:bg-red-100 dark:hover:bg-red-900/50
                    transition-colors duration-200
                  "
                  aria-expanded={showDetails}
                >
                  <span>Error details (development only)</span>
                  {showDetails ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {showDetails && (
                  <div className="px-4 pb-4 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">
                        Error name:
                      </p>
                      <pre className="text-xs text-red-600 dark:text-red-400">
                        {error.name}
                      </pre>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">
                        Error message:
                      </p>
                      <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">
                        {error.message}
                      </pre>
                    </div>

                    {error.stack && (
                      <div>
                        <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">
                          Stack trace:
                        </p>
                        <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap break-words max-h-48 overflow-auto">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Support information */}
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                If this problem persists, please contact support or try again later.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
