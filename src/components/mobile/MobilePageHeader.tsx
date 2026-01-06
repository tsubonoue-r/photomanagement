'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, MoreVertical } from 'lucide-react';
import { hapticLight } from '@/lib/capacitor/haptics';

interface MobilePageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  onMenuClick?: () => void;
  transparent?: boolean;
}

export function MobilePageHeader({
  title,
  subtitle,
  showBackButton = true,
  onBack,
  rightAction,
  onMenuClick,
  transparent = false,
}: MobilePageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    hapticLight();
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleMenu = () => {
    hapticLight();
    onMenuClick?.();
  };

  return (
    <header
      className={`sticky top-0 z-40 ${
        transparent
          ? 'bg-transparent'
          : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50'
      }`}
    >
      <div className="flex items-center justify-between h-14 px-4 pt-safe">
        {/* Left: Back button */}
        <div className="flex items-center min-w-[40px]">
          {showBackButton && (
            <button
              onClick={handleBack}
              aria-label="戻る"
              className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-90"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
          )}
        </div>

        {/* Center: Title */}
        <div className="flex-1 text-center mx-4">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right: Action */}
        <div className="flex items-center min-w-[40px] justify-end">
          {rightAction}
          {onMenuClick && !rightAction && (
            <button
              onClick={handleMenu}
              className="w-10 h-10 -mr-2 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-90"
            >
              <MoreVertical className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
