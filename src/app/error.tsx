'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

/**
 * Props for the Error component
 */
interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error page component
 * Displayed when an error occurs in a route segment
 * This is a client component that can attempt to recover from errors
 */
export default function Error({ error, reset }: ErrorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error caught by error boundary:', error);
  }, [error]);

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-lg">
        {/* Error icon with animation */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-red-100 dark:bg-red-900/30 rounded-full animate-pulse" />
          </div>
          <div className="relative flex items-center justify-center">
            <div className="w-24 h-24 bg-red-50 dark:bg-red-900/50 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Something went wrong
        </h1>

        {/* Description */}
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
          We encountered an unexpected error while loading this page.
          Please try again, or return to the home page.
        </p>

        {/* Error digest (for error tracking) */}
        {error.digest && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 font-mono">
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
              dark:focus:ring-offset-gray-900
            "
          >
            <RefreshCw className="w-5 h-5" />
            Try again
          </button>

          <button
            type="button"
            onClick={handleGoHome}
            className="
              inline-flex items-center gap-2 px-6 py-3
              bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800
              text-gray-700 dark:text-gray-300
              font-medium rounded-lg
              border border-gray-300 dark:border-gray-600
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
              dark:focus:ring-offset-gray-900
            "
          >
            <Home className="w-5 h-5" />
            Go to home
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
      </div>
    </div>
  );
}
