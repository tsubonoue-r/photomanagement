'use client';

import { useState } from 'react';
import { User, Camera, Loader2 } from 'lucide-react';
import type { ProfileUpdateInput } from '@/types/user-settings';

interface ProfileSectionProps {
  userId: string;
  initialName: string | null;
  initialImage: string | null;
  email: string;
}

/**
 * Profile Section Component
 *
 * Allows users to edit their profile information:
 * - Display name
 * - Avatar image (URL)
 */
export function ProfileSection({
  userId,
  initialName,
  initialImage,
  email,
}: ProfileSectionProps) {
  const [name, setName] = useState(initialName || '');
  const [image, setImage] = useState(initialImage || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!name.trim()) {
      setError('名前を入力してください');
      return;
    }

    try {
      setSaving(true);

      const payload: { type: string; data: ProfileUpdateInput } = {
        type: 'profile',
        data: {
          name: name.trim(),
          image: image.trim() || null,
        },
      };

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'プロフィールの更新に失敗しました');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プロフィールの更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-6">
        <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          プロフィール情報
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Preview */}
        <div className="flex items-center gap-6">
          <div className="relative">
            {image ? (
              <img
                src={image}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="absolute bottom-0 right-0 p-1 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
              <Camera className="w-4 h-4 text-gray-500" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              プロフィール写真
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              下記に画像URLを入力してください
            </p>
          </div>
        </div>

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
              プロフィールを更新しました
            </p>
          </div>
        )}

        {/* Email (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            メールアドレスは変更できません
          </p>
        </div>

        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            表示名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="名前を入力"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Image URL */}
        <div>
          <label
            htmlFor="image"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            アバターURL
          </label>
          <input
            type="url"
            id="image"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://example.com/avatar.jpg"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? '保存中...' : '変更を保存'}
          </button>
        </div>
      </form>
    </div>
  );
}
