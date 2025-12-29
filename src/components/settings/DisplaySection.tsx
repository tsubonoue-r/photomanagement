'use client';

import { useState } from 'react';
import { Moon, Sun, Monitor, Palette, Languages, Loader2 } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';

type Theme = 'light' | 'dark' | 'system';
type Language = 'en' | 'ja';

interface LanguageOption {
  value: Language;
  label: string;
  nativeLabel: string;
}

/**
 * Display Section Component
 *
 * Allows users to configure display preferences:
 * - Theme selection (Light/Dark/System)
 * - Language selection (English/Japanese)
 *
 * Uses the existing ThemeProvider for theme state management
 */
export function DisplaySection() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [language, setLanguage] = useState<Language>('en');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const themeOptions: { value: Theme; label: string; description: string; icon: typeof Sun }[] = [
    {
      value: 'light',
      label: 'Light',
      description: 'Use light theme',
      icon: Sun,
    },
    {
      value: 'dark',
      label: 'Dark',
      description: 'Use dark theme',
      icon: Moon,
    },
    {
      value: 'system',
      label: 'System',
      description: 'Match system preference',
      icon: Monitor,
    },
  ];

  const languageOptions: LanguageOption[] = [
    {
      value: 'en',
      label: 'English',
      nativeLabel: 'English',
    },
    {
      value: 'ja',
      label: 'Japanese',
      nativeLabel: '\u65e5\u672c\u8a9e',
    },
  ];

  const handleLanguageChange = async (newLanguage: Language) => {
    setLanguage(newLanguage);
    setSaving(true);
    setSuccess(false);

    try {
      // In a production app, this would save to the backend
      // For now, we simulate the save and store in localStorage
      localStorage.setItem('preferred-language', newLanguage);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-6">
        <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Display Settings
        </h2>
      </div>

      <div className="space-y-6">
        {/* Theme Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Theme
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {themeOptions.map(({ value, label, description, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={`relative flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                  theme === value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon
                  className={`w-6 h-6 mb-2 ${
                    theme === value
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    theme === value
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                  {description}
                </span>
                {theme === value && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Current Theme Info */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Current appearance:</span>{' '}
            {resolvedTheme === 'dark' ? 'Dark mode' : 'Light mode'}
            {theme === 'system' && ' (following system preference)'}
          </p>
        </div>

        {/* Divider */}
        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Language Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Language
              </label>
            </div>
            {saving && (
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-xs">Saving...</span>
              </div>
            )}
            {success && !saving && (
              <span className="text-xs text-green-600 dark:text-green-400">
                Saved
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {languageOptions.map(({ value, label, nativeLabel }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleLanguageChange(value)}
                disabled={saving}
                className={`relative flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  language === value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex flex-col items-start">
                  <span
                    className={`text-sm font-medium ${
                      language === value
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {label}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {nativeLabel}
                  </span>
                </div>
                {language === value && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Select your preferred language for the interface.
          </p>
        </div>
      </div>
    </div>
  );
}
