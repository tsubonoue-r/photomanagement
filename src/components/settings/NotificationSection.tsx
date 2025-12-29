'use client';

import { useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import type { NotificationSettings } from '@/types/user-settings';

interface NotificationSectionProps {
  userId: string;
  initialSettings: NotificationSettings;
}

/**
 * Notification Section Component
 *
 * Allows users to configure email notification preferences:
 * - General email notifications toggle
 * - Project update notifications
 * - Album sharing notifications
 * - Weekly digest emails
 */
export function NotificationSection({
  userId,
  initialSettings,
}: NotificationSectionProps) {
  const [settings, setSettings] = useState<NotificationSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(false);

    try {
      setSaving(true);

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'notifications',
          data: settings,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update notification settings');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update notification settings'
      );
    } finally {
      setSaving(false);
    }
  };

  const notificationOptions = [
    {
      key: 'emailNotifications' as const,
      label: 'Email Notifications',
      description: 'Receive email notifications for important updates',
    },
    {
      key: 'projectUpdates' as const,
      label: 'Project Updates',
      description: 'Get notified when projects you are a member of are updated',
    },
    {
      key: 'albumSharing' as const,
      label: 'Album Sharing',
      description: 'Receive notifications when albums are shared with you',
    },
    {
      key: 'weeklyDigest' as const,
      label: 'Weekly Digest',
      description: 'Receive a weekly summary of activity',
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Notification Settings
        </h2>
      </div>

      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-sm text-green-600 dark:text-green-400">
              Notification settings updated successfully!
            </p>
          </div>
        )}

        {/* Notification Toggles */}
        <div className="space-y-4">
          {notificationOptions.map(({ key, label, description }) => (
            <div
              key={key}
              className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {label}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle(key)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings[key] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
                role="switch"
                aria-checked={settings[key]}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings[key] ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
