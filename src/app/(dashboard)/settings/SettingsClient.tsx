'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Lock, Bell, Palette, AlertTriangle } from 'lucide-react';
import {
  ProfileSection,
  PasswordSection,
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
 * Settings Client Component
 *
 * Client-side settings interface with:
 * - Section navigation
 * - Responsive layout
 * - All settings sections rendered
 */
export function SettingsClient({ user, notifications }: SettingsClientProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

  const navigationItems = [
    {
      id: 'profile' as const,
      label: 'Profile',
      icon: User,
      description: 'Manage your profile information',
    },
    {
      id: 'password' as const,
      label: 'Password',
      icon: Lock,
      description: 'Change your password',
    },
    {
      id: 'notifications' as const,
      label: 'Notifications',
      icon: Bell,
      description: 'Configure email notifications',
    },
    {
      id: 'display' as const,
      label: 'Display',
      icon: Palette,
      description: 'Customize appearance',
    },
    {
      id: 'account' as const,
      label: 'Account',
      icon: AlertTriangle,
      description: 'Manage your account',
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Settings
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage your account settings and preferences
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <nav className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {navigationItems.map(({ id, label, icon: Icon, description }) => (
                  <li key={id}>
                    <button
                      onClick={() => setActiveSection(id)}
                      className={`w-full flex items-start gap-3 p-4 text-left transition-colors ${
                        activeSection === id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-transparent'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 mt-0.5 ${
                          activeSection === id
                            ? 'text-blue-600 dark:text-blue-400'
                            : id === 'account'
                            ? 'text-red-500 dark:text-red-400'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      />
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            activeSection === id
                              ? 'text-blue-600 dark:text-blue-400'
                              : id === 'account'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                          {description}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Account Info */}
            <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Signed in as
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Member since{' '}
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">{renderSection()}</div>
        </div>
      </main>
    </div>
  );
}
