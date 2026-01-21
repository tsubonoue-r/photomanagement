'use client';

import { useState } from 'react';
import { X, Loader2, Building2 } from 'lucide-react';
import type { OrganizationWithCounts } from '@/types/organization';
import type { PlanType } from '@prisma/client';

interface OrganizationFormProps {
  organization?: OrganizationWithCounts;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * Organization Form Component
 *
 * Modal form for creating or editing organizations with:
 * - Name input
 * - Slug input (auto-generated from name if not provided)
 * - Plan selection (for display only, actual plan changes via billing)
 */
export function OrganizationForm({
  organization,
  onSave,
  onCancel,
}: OrganizationFormProps) {
  const isEditing = !!organization;

  const [name, setName] = useState(organization?.name || '');
  const [slug, setSlug] = useState(organization?.slug || '');
  const [plan] = useState<PlanType>(organization?.plan || 'FREE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched && !isEditing) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 100);
      setSlug(generatedSlug);
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugTouched(true);
    // Only allow valid slug characters
    const cleanSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 100);
    setSlug(cleanSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('組織名は必須です');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const url = isEditing
        ? `/api/organizations/${organization.id}`
        : '/api/organizations';
      const method = isEditing ? 'PUT' : 'POST';

      const body: Record<string, string> = { name: name.trim() };
      if (slug.trim()) {
        body.slug = slug.trim();
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '組織の保存に失敗しました');
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : '組織の保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditing ? '組織を編集' : '組織を作成'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              組織名 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="組織名を入力"
              maxLength={200}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Slug */}
          <div>
            <label
              htmlFor="slug"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              URLスラッグ
            </label>
            <div className="flex items-center">
              <span className="text-gray-500 text-sm mr-1">/</span>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="my-organization"
                maxLength={100}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              小文字、数字、ハイフンのみ使用可能
            </p>
          </div>

          {/* Plan Display (read-only) */}
          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                現在のプラン
              </label>
              <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                {plan}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                プランの変更は請求設定から行えます
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={loading || !name.trim()}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? '変更を保存' : '組織を作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default OrganizationForm;
