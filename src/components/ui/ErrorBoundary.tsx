'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Props for ErrorBoundary component
 */
interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;
  /** Custom fallback component */
  fallback?: ReactNode;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Whether to show error details (development mode) */
  showDetails?: boolean;
  /** Custom reset handler */
  onReset?: () => void;
}

/**
 * State for ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showStack: boolean;
}

/**
 * ErrorBoundary component
 * Catches JavaScript errors in child component tree and displays fallback UI
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   onError={(error, info) => logError(error, info)}
 *   showDetails={process.env.NODE_ENV === 'development'}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showStack: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showStack: false,
    });
    this.props.onReset?.();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  toggleStack = (): void => {
    this.setState((prev) => ({ showStack: !prev.showStack }));
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, showStack } = this.state;
    const { children, fallback, showDetails } = this.props;

    if (hasError) {
      // Custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div
          className="min-h-[400px] flex items-center justify-center p-6"
          role="alert"
          aria-live="assertive"
        >
          <div className="w-full max-w-lg">
            {/* Error icon and message */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                問題が発生しました
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                予期しないエラーが発生しました。再試行するか、ホームページに戻ってください。
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <button
                type="button"
                onClick={this.handleReset}
                className="
                  inline-flex items-center gap-2 px-4 py-2
                  bg-blue-600 hover:bg-blue-700
                  text-white font-medium rounded-lg
                  transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  dark:focus:ring-offset-gray-900
                "
              >
                <RefreshCw className="w-4 h-4" />
                再試行
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="
                  inline-flex items-center gap-2 px-4 py-2
                  bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800
                  text-gray-700 dark:text-gray-300
                  font-medium rounded-lg
                  border border-gray-300 dark:border-gray-600
                  transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                  dark:focus:ring-offset-gray-900
                "
              >
                <Home className="w-4 h-4" />
                ホームへ戻る
              </button>
            </div>

            {/* Error details (development mode) */}
            {showDetails && error && (
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 overflow-hidden">
                <button
                  type="button"
                  onClick={this.toggleStack}
                  className="
                    w-full flex items-center justify-between
                    px-4 py-3
                    text-left text-sm font-medium
                    text-red-800 dark:text-red-200
                    hover:bg-red-100 dark:hover:bg-red-900/50
                    transition-colors duration-200
                  "
                  aria-expanded={showStack}
                >
                  <span>エラー詳細</span>
                  {showStack ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {showStack && (
                  <div className="px-4 pb-4 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">
                        エラーメッセージ:
                      </p>
                      <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">
                        {error.message}
                      </pre>
                    </div>

                    {error.stack && (
                      <div>
                        <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">
                          スタックトレース:
                        </p>
                        <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap break-words max-h-48 overflow-auto">
                          {error.stack}
                        </pre>
                      </div>
                    )}

                    {errorInfo?.componentStack && (
                      <div>
                        <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">
                          コンポーネントスタック:
                        </p>
                        <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap break-words max-h-48 overflow-auto">
                          {errorInfo.componentStack}
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

    return children;
  }
}

/**
 * Props for withErrorBoundary HOC
 */
interface WithErrorBoundaryOptions {
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

/**
 * Higher-order component to wrap a component with ErrorBoundary
 *
 * @example
 * ```tsx
 * const SafeComponent = withErrorBoundary(MyComponent, {
 *   showDetails: true,
 *   onError: (error) => logError(error),
 * });
 * ```
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundary {...options}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}
