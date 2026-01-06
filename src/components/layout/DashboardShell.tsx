'use client';

import { useState, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { BottomTabNavigator } from './BottomTabNavigator';
import { Breadcrumb } from './Breadcrumb';
import { isNativeApp } from '@/lib/capacitor';

interface DashboardShellProps {
  children: React.ReactNode;
  /** 背景を透明にする（フルブリードコンテンツ用） */
  transparentBackground?: boolean;
  /** カード型コンテナを無効にする */
  noCard?: boolean;
  /** ブレッドクラムを非表示 */
  hideBreadcrumb?: boolean;
}

export function DashboardShell({
  children,
  transparentBackground = false,
  noCard = false,
  hideBreadcrumb = false,
}: DashboardShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isNative = isNativeApp();

  const handleMenuClick = useCallback(() => {
    setIsMobileMenuOpen(true);
  }, []);

  const handleMenuClose = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <div className={`min-h-screen ${transparentBackground ? '' : 'bg-gray-50 dark:bg-gray-950'}`}>
      {/* Desktop Sidebar */}
      <Sidebar className="hidden lg:block" />

      {/* Mobile Navigation Drawer */}
      <MobileNav isOpen={isMobileMenuOpen} onClose={handleMenuClose} />

      {/* Mobile Bottom Tab Navigator */}
      <BottomTabNavigator />

      {/* Main Content Area */}
      <div className="lg:ml-64">
        {/* Header */}
        <Header onMenuClick={handleMenuClick} />

        {/* Page Content */}
        <main className={`p-4 lg:p-6 pb-28 lg:pb-6 ${isNative ? 'min-h-[calc(100vh-56px)]' : ''}`}>
          {/* Breadcrumb */}
          {!hideBreadcrumb && (
            <div className="mb-4 hidden lg:block">
              <Breadcrumb />
            </div>
          )}

          {/* Page Content */}
          {noCard ? (
            children
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-800/50 p-4 lg:p-6 transition-all">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
