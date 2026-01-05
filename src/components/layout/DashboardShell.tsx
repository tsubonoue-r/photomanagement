'use client';

import { useState, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { BottomTabNavigator } from './BottomTabNavigator';
import { Breadcrumb } from './Breadcrumb';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMenuClick = useCallback(() => {
    setIsMobileMenuOpen(true);
  }, []);

  const handleMenuClose = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
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

        {/* Page Content - Added bottom padding for mobile tab bar */}
        <main className="p-4 lg:p-6 pb-24 lg:pb-6">
          {/* Breadcrumb */}
          <div className="mb-4">
            <Breadcrumb />
          </div>

          {/* Page Content */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
