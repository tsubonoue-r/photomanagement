'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileQuestion,
  Home,
  ArrowLeft,
  Search,
  FolderOpen,
  Settings,
  Building2,
  Camera,
} from 'lucide-react';

/**
 * 404 Not Found page component
 * Displayed when a user navigates to a non-existent route
 *
 * Features:
 * - Animated 404 display
 * - Search functionality
 * - Quick navigation links
 * - Dark mode support
 * - Responsive design
 * - Accessibility support
 */
export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to dashboard with search query
      router.push(`/dashboard?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const quickLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/organizations', label: 'Organizations', icon: Building2 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4 py-16">
      <div className="text-center max-w-lg w-full">
        {/* Animated 404 illustration */}
        <div className="relative mb-8">
          {/* Background glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 bg-blue-200/50 dark:bg-blue-900/30 rounded-full blur-3xl animate-pulse" />
          </div>

          {/* 404 Number with icon */}
          <div className="relative flex items-center justify-center gap-2">
            <span className="text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 select-none">
              4
            </span>
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-full flex items-center justify-center shadow-lg">
                <FileQuestion className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 dark:text-blue-400 animate-bounce" />
              </div>
              {/* Decorative ring */}
              <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-800 animate-ping opacity-20" />
            </div>
            <span className="text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400 select-none">
              4
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          Page Not Found
        </h1>

        {/* Description */}
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Try searching or use the links below.
        </p>

        {/* Search box */}
        <form onSubmit={handleSearch} className="mb-8 max-w-sm mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for photos, projects..."
              className="
                w-full pl-12 pr-4 py-3
                bg-white dark:bg-gray-800
                border border-gray-200 dark:border-gray-700
                rounded-xl shadow-sm
                text-gray-900 dark:text-gray-100
                placeholder-gray-400 dark:placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition-all duration-200
              "
              aria-label="Search"
            />
            <button
              type="submit"
              className="
                absolute right-2 top-1/2 -translate-y-1/2
                px-4 py-1.5
                bg-blue-600 hover:bg-blue-700
                text-white text-sm font-medium
                rounded-lg
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              "
            >
              Search
            </button>
          </div>
        </form>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <Link
            href="/"
            className="
              inline-flex items-center gap-2 px-6 py-3 w-full sm:w-auto
              bg-blue-600 hover:bg-blue-700
              text-white font-medium rounded-xl
              shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              dark:focus:ring-offset-gray-900
              justify-center
            "
          >
            <Home className="w-5 h-5" />
            Go to Home
          </Link>

          <button
            onClick={handleGoBack}
            className="
              inline-flex items-center gap-2 px-6 py-3 w-full sm:w-auto
              bg-white dark:bg-gray-800
              text-gray-700 dark:text-gray-300
              font-medium rounded-xl
              border border-gray-200 dark:border-gray-700
              shadow-sm hover:shadow-md
              hover:bg-gray-50 dark:hover:bg-gray-700
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
              dark:focus:ring-offset-gray-900
              justify-center
            "
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-10">
          {quickLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="
                flex flex-col items-center gap-2 p-4
                bg-white dark:bg-gray-800
                border border-gray-200 dark:border-gray-700
                rounded-xl
                hover:border-blue-300 dark:hover:border-blue-700
                hover:shadow-md
                transition-all duration-200
                group
              "
            >
              <Icon className="w-6 h-6 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                {label}
              </span>
            </Link>
          ))}
        </div>

        {/* Additional helpful links */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Or try these pages:
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
            >
              Register
            </Link>
          </div>
        </div>

        {/* Decorative dots */}
        <div className="mt-12 flex justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 dark:bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-indigo-400 dark:bg-indigo-600 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-blue-400 dark:bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
