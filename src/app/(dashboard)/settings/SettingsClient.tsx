'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Lock, Shield, Bell, Palette, AlertTriangle, ChevronRight } from 'lucide-react';
import {
  ProfileSection,
  PasswordSection,
  TwoFactorSection,
  NotificationSection,
  DisplaySection,
  DeleteAccountSection,
} from '@/components/settings';
import type { NotificationSettings, SettingsSection } from '@/types/user-settings';

interface SettingsClientProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    role: string;
    createdAt: Date;
  };
  notifications: NotificationSettings;
}

/**
 * Settings Client Component - Mobile Compact Design
 */
export function SettingsClient({ user, notifications }: SettingsClientProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection | null>(null);

  const navigationItems = [
    {
      id: 'profile' as const,
      label: 'プロフィール',
      icon: User,
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    },
    {
      id: 'password' as const,
      label: 'パスワード',
      icon: Lock,
      color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    },
    {
      id: 'security' as const,
      label: 'セキュリティ',
      icon: Shield,
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    },
    {
      id: 'notifications' as const,
      label: '通知設定',
      icon: Bell,
      color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    },
    {
      id: 'display' as const,
      label: '表示設定',
      icon: Palette,
      color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
    },
    {
      id: 'account' as const,
      label: 'アカウント削除',
      icon: AlertTriangle,
      color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <ProfileSection
            userId={user.id}
            initialName={user.name}
            initialImage={user.image}
            email={user.email}
          />
        );
      case 'password':
        return <PasswordSection />;
      case 'security':
        return <TwoFactorSection />;
      case 'notifications':
        return (
          <NotificationSection userId={user.id} initialSettings={notifications} />
        );
      case 'display':
        return <DisplaySection />;
      case 'account':
        return <DeleteAccountSection userId={user.id} userEmail={user.email} />;
      default:
        return null;
    }
  };

  // If a section is selected, show only that section
  if (activeSection) {
    const currentItem = navigationItems.find(item => item.id === activeSection);
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Section Header */}
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveSection(null)}
                className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors active:scale-95"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {currentItem?.label}
              </h1>
            </div>
          </div>
        </header>

        <main className="px-4 py-4 pb-24">
          {renderSection()}
        </main>
      </div>
    );
  }

  // Main settings list
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Compact Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">設定</h1>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 pb-24">
        {/* User Info Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              {user.image ? (
                <img src={user.image} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                {user.name || 'ユーザー'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Settings List */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          {navigationItems.map(({ id, label, icon: Icon, color }, index) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`w-full flex items-center gap-3 p-4 text-left active:bg-gray-50 dark:active:bg-gray-800 transition-colors
                ${index !== navigationItems.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`flex-1 text-sm font-medium ${id === 'account' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                {label}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          ))}
        </div>

        {/* Account Info */}
        <div className="mt-4 p-4 text-center text-xs text-gray-500 dark:text-gray-400">
          <p>登録日: {new Date(user.createdAt).toLocaleDateString('ja-JP')}</p>
        </div>
      </main>
    </div>
  );
}
