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
import { hapticLight, hapticMedium } from '@/lib/capacitor/haptics';

interface TabItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isCamera?: boolean;
}

const tabItems: TabItem[] = [
  { href: '/dashboard', label: 'ホーム', icon: Home },
  { href: '/projects', label: 'プロジェクト', icon: FolderKanban },
  { href: '/camera', label: '撮影', icon: Camera, isCamera: true },
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

  const handleTabClick = (isCamera: boolean = false) => {
    if (isCamera) {
      hapticMedium();
    } else {
      hapticLight();
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50" />

      {/* Tab items */}
      <div className="relative flex items-end justify-around h-20 pb-safe">
        {tabItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          if (item.isCamera) {
            // Camera button - prominent center button with glow effect
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => handleTabClick(true)}
                className="relative -mt-4 flex flex-col items-center justify-center group"
              >
                {/* Glow effect */}
                <div className="absolute w-16 h-16 bg-blue-500/20 rounded-full blur-xl group-active:bg-blue-500/30 transition-all" />

                {/* Button */}
                <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all duration-200 active:scale-90 active:shadow-md">
                  <Icon className="h-8 w-8 text-white" />
                </div>

                {/* Label */}
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-1.5">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => handleTabClick(false)}
              className={`flex flex-col items-center justify-center min-w-[72px] py-2 transition-all duration-200 active:scale-90 ${
                active
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="relative">
                {/* Active indicator dot */}
                {active && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" />
                )}

                <Icon className={`h-6 w-6 transition-transform ${active ? 'scale-110' : ''}`} />

                {/* Badge for pending uploads on photos tab */}
                {item.href === '/photos' && pendingUploads > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                    {pendingUploads > 99 ? '99+' : pendingUploads}
                  </span>
                )}
              </div>

              <span className={`text-[11px] mt-1 transition-all ${active ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
