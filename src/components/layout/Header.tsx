'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Menu, LogOut, User, ChevronDown, Bell } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { hapticLight } from '@/lib/capacitor/haptics';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = () => {
    hapticLight();
    onMenuClick?.();
  };

  const handleUserMenuToggle = () => {
    hapticLight();
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleSignOut = async () => {
    hapticLight();
    await signOut({ callbackUrl: '/login' });
  };

  const userInitials = session?.user?.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="flex h-14 lg:h-16 items-center justify-between px-4 lg:px-6 pt-safe">
        {/* Left side - Mobile menu button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleMenuClick}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-90"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-1.5 lg:gap-2">
          {/* Notifications */}
          <button
            onClick={() => hapticLight()}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-90 relative"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            {/* Notification badge placeholder */}
            {/* <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" /> */}
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={handleUserMenuToggle}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                {userInitials}
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                {session?.user?.name || 'ユーザー'}
              </span>
              <ChevronDown className={`hidden md:block h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 py-1 z-50 animate-scale-in overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {session?.user?.name || 'ユーザー'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {session?.user?.email || ''}
                  </p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      hapticLight();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:bg-gray-200 dark:active:bg-gray-600"
                  >
                    <User className="h-4 w-4" />
                    プロフィール
                  </button>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 py-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors active:bg-red-100 dark:active:bg-red-900/30"
                  >
                    <LogOut className="h-4 w-4" />
                    ログアウト
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
