'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
}

// Route label mapping
const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  photos: 'Photos',
  albums: 'Albums',
  categories: 'Categories',
  blackboard: 'Blackboard',
  export: 'Export',
  settings: 'Settings',
  upload: 'Upload',
  edit: 'Edit',
  new: 'New',
};

export function Breadcrumb() {
  const pathname = usePathname();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    let currentPath = '';
    for (const path of paths) {
      currentPath += `/${path}`;

      // Skip dynamic route segments that are just IDs
      const isId = /^[0-9a-fA-F-]+$/.test(path) || /^\d+$/.test(path);

      breadcrumbs.push({
        label: isId ? 'Details' : (routeLabels[path] || path.charAt(0).toUpperCase() + path.slice(1)),
        href: currentPath,
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm">
      <ol className="flex items-center gap-1">
        <li>
          <Link
            href="/dashboard"
            className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>

        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <li key={item.href} className="flex items-center">
              <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-600 mx-1" />
              {isLast ? (
                <span className="font-medium text-gray-900 dark:text-white">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
