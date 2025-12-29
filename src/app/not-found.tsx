import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';
import { GoBackButton } from '@/components/ui/GoBackButton';

/**
 * Metadata for 404 page
 */
export const metadata = {
  title: '404 - Page Not Found | Photo Management',
  description: 'The page you are looking for could not be found.',
};

/**
 * 404 Not Found page component
 * Displayed when a user navigates to a non-existent route
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center max-w-md">
        {/* Animated 404 icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-blue-100 dark:bg-blue-900/30 rounded-full animate-pulse" />
          </div>
          <div className="relative flex items-center justify-center">
            <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
              <FileQuestion className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Error code */}
        <h1 className="text-7xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          404
        </h1>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Page not found
        </h2>

        {/* Description */}
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Sorry, we could not find the page you are looking for. It might have been
          moved, deleted, or never existed.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="
              inline-flex items-center gap-2 px-6 py-3
              bg-blue-600 hover:bg-blue-700
              text-white font-medium rounded-lg
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              dark:focus:ring-offset-gray-900
            "
          >
            <Home className="w-5 h-5" />
            Go to home
          </Link>

          <GoBackButton />
        </div>

        {/* Helpful links */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Here are some helpful links:
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Dashboard
            </Link>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <Link
              href="/projects"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Projects
            </Link>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
