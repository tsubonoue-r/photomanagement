'use client';

import { ReactNode } from 'react';
import {
  FileQuestion,
  Image,
  FolderOpen,
  Search,
  Users,
  AlertCircle,
  Plus,
  LucideIcon,
} from 'lucide-react';

/**
 * Preset empty state types
 */
export type EmptyStateType =
  | 'no-data'
  | 'no-photos'
  | 'no-projects'
  | 'no-results'
  | 'no-members'
  | 'error'
  | 'custom';

/**
 * Props for EmptyState component
 */
interface EmptyStateProps {
  /** Type of empty state (determines icon and default text) */
  type?: EmptyStateType;
  /** Custom icon component */
  icon?: LucideIcon;
  /** Main title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Custom content to render */
  children?: ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Preset configurations for empty state types
 */
const presets: Record<
  Exclude<EmptyStateType, 'custom'>,
  { icon: LucideIcon; title: string; description: string }
> = {
  'no-data': {
    icon: FileQuestion,
    title: 'No data available',
    description: 'There is no data to display at this time.',
  },
  'no-photos': {
    icon: Image,
    title: 'No photos yet',
    description: 'Upload your first photo to get started.',
  },
  'no-projects': {
    icon: FolderOpen,
    title: 'No projects found',
    description: 'Create a new project to organize your photos.',
  },
  'no-results': {
    icon: Search,
    title: 'No results found',
    description: 'Try adjusting your search or filters.',
  },
  'no-members': {
    icon: Users,
    title: 'No team members',
    description: 'Invite team members to collaborate on this project.',
  },
  error: {
    icon: AlertCircle,
    title: 'Something went wrong',
    description: 'An error occurred while loading data. Please try again.',
  },
};

/**
 * Size configurations
 */
const sizeConfig = {
  sm: {
    container: 'py-8 px-4',
    icon: 'w-12 h-12',
    title: 'text-base font-medium',
    description: 'text-sm',
    button: 'px-3 py-1.5 text-sm',
  },
  md: {
    container: 'py-12 px-6',
    icon: 'w-16 h-16',
    title: 'text-lg font-semibold',
    description: 'text-base',
    button: 'px-4 py-2 text-sm',
  },
  lg: {
    container: 'py-16 px-8',
    icon: 'w-20 h-20',
    title: 'text-xl font-bold',
    description: 'text-lg',
    button: 'px-6 py-3 text-base',
  },
};

/**
 * EmptyState component
 * Displays a placeholder when there is no content to show
 *
 * @example
 * ```tsx
 * // Using preset type
 * <EmptyState
 *   type="no-photos"
 *   action={{
 *     label: 'Upload Photos',
 *     onClick: () => openUploader(),
 *     icon: Plus,
 *   }}
 * />
 *
 * // Custom empty state
 * <EmptyState
 *   type="custom"
 *   icon={Calendar}
 *   title="No events scheduled"
 *   description="Create an event to get started."
 *   action={{
 *     label: 'Create Event',
 *     onClick: handleCreate,
 *   }}
 * />
 * ```
 */
export function EmptyState({
  type = 'no-data',
  icon,
  title,
  description,
  action,
  secondaryAction,
  children,
  size = 'md',
  className = '',
}: EmptyStateProps) {
  const preset = type !== 'custom' ? presets[type] : null;
  const Icon = icon || preset?.icon || FileQuestion;
  const displayTitle = title || preset?.title || 'No data';
  const displayDescription = description || preset?.description || '';
  const config = sizeConfig[size];

  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center
        ${config.container}
        ${className}
      `}
      role="status"
      aria-label={displayTitle}
    >
      {/* Icon with animated entrance */}
      <div className="relative mb-4 animate-fade-in">
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-full scale-150 opacity-50" />
        <div className="relative p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
          <Icon
            className={`
              ${config.icon}
              text-gray-400 dark:text-gray-500
            `}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Title */}
      <h3
        className={`
          ${config.title}
          text-gray-900 dark:text-gray-100
          mb-2
        `}
      >
        {displayTitle}
      </h3>

      {/* Description */}
      {displayDescription && (
        <p
          className={`
            ${config.description}
            text-gray-500 dark:text-gray-400
            max-w-md mb-6
          `}
        >
          {displayDescription}
        </p>
      )}

      {/* Custom content */}
      {children && <div className="mb-6">{children}</div>}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className={`
                inline-flex items-center gap-2
                ${config.button}
                bg-blue-600 hover:bg-blue-700
                text-white font-medium
                rounded-lg
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                dark:focus:ring-offset-gray-900
              `}
            >
              {action.icon ? (
                <action.icon className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Plus className="w-4 h-4" aria-hidden="true" />
              )}
              {action.label}
            </button>
          )}

          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className={`
                inline-flex items-center gap-2
                ${config.button}
                bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800
                text-gray-700 dark:text-gray-300
                font-medium
                rounded-lg
                border border-gray-300 dark:border-gray-600
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                dark:focus:ring-offset-gray-900
              `}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * EmptyStateSearch - Specialized empty state for search results
 */
interface EmptyStateSearchProps {
  /** Search query that yielded no results */
  query?: string;
  /** Callback to clear search */
  onClear?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * EmptyStateSearch component
 * Specialized empty state for when search yields no results
 *
 * @example
 * ```tsx
 * <EmptyStateSearch
 *   query={searchQuery}
 *   onClear={() => setSearchQuery('')}
 * />
 * ```
 */
export function EmptyStateSearch({
  query,
  onClear,
  className = '',
}: EmptyStateSearchProps) {
  return (
    <EmptyState
      type="no-results"
      title={query ? `No results for "${query}"` : 'No results found'}
      description="Try different keywords or remove some filters."
      secondaryAction={
        onClear
          ? {
              label: 'Clear search',
              onClick: onClear,
            }
          : undefined
      }
      className={className}
    />
  );
}

/**
 * EmptyStateError - Specialized empty state for errors
 */
interface EmptyStateErrorProps {
  /** Error message to display */
  message?: string;
  /** Callback to retry the failed action */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * EmptyStateError component
 * Specialized empty state for error conditions
 *
 * @example
 * ```tsx
 * <EmptyStateError
 *   message="Failed to load photos"
 *   onRetry={() => refetch()}
 * />
 * ```
 */
export function EmptyStateError({
  message,
  onRetry,
  className = '',
}: EmptyStateErrorProps) {
  return (
    <EmptyState
      type="error"
      description={message || 'An error occurred while loading data.'}
      action={
        onRetry
          ? {
              label: 'Try again',
              onClick: onRetry,
            }
          : undefined
      }
      className={className}
    />
  );
}
