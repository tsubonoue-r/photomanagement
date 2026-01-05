'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FolderKanban,
  Camera,
  Image,
  Settings,
} from 'lucide-react';

interface TabItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isCamera?: boolean;
}

const tabItems: TabItem[] = [
  { href: '/dashboard', label: 'ホーム', icon: Home },
  { href: '/projects', label: 'プロジェクト', icon: FolderKanban },
  { href: '/camera', label: 'カメラ', icon: Camera, isCamera: true },
  { href: '/photos', label: '写真', icon: Image },
  { href: '/settings', label: '設定', icon: Settings },
];

interface BottomTabNavigatorProps {
  pendingUploads?: number;
}

export function BottomTabNavigator({ pendingUploads = 0 }: BottomTabNavigatorProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe">
      <div className="flex items-center justify-around h-16">
        {tabItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          if (item.isCamera) {
            // Camera button - prominent center button
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -mt-6 flex flex-col items-center justify-center"
              >
                <div className="w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg transition-colors active:scale-95">
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[64px] py-2 transition-colors active:opacity-70 ${
                active
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <div className="relative">
                <Icon className={`h-6 w-6 ${active ? '' : ''}`} />
                {/* Badge for pending uploads on photos tab */}
                {item.href === '/photos' && pendingUploads > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {pendingUploads > 99 ? '99+' : pendingUploads}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium mt-1 ${active ? '' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
