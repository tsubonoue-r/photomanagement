'use client';

import { useState } from 'react';
import {
  Building2,
  Settings,
  Users,
  Trash2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import type { OrganizationWithMembers } from '@/types/organization';
import type { OrganizationRole } from '@prisma/client';
import { PLAN_TYPE_CONFIG } from '@/types/organization';
import { useRouter } from 'next/navigation';

interface OrganizationSettingsProps {
  organization: OrganizationWithMembers;
  currentUserRole: OrganizationRole;
  onOrganizationUpdated: () => void;
}

/**
 * Organization Settings Component
 *
 * Settings page for organization with:
 * - General settings (name, slug)
 * - Plan information
 * - Danger zone (delete organization)
 */
export function OrganizationSettings({
  organization,
  currentUserRole,
  onOrganizationUpdated,
}: OrganizationSettingsProps) {
  const router = useRouter();
  const [name, setName] = useState(organization.name);
  const [slug, setSlug] = useState(organization.slug);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const canManage = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';
  const isOwner = currentUserRole === 'OWNER';
  const planConfig = PLAN_TYPE_CONFIG[organization.plan];

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('組織名は必須です');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '設定の保存に失敗しました');
      }

      setSuccess('設定を保存しました');
      onOrganizationUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : '設定の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrganization = async () => {
    if (deleteConfirmText !== organization.name) return;

    try {
      setDeleting(true);
      setError(null);

      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '組織の削除に失敗しました');
      }

      router.push('/organizations');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '組織の削除に失敗しました'
      );
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* General Settings */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              一般設定
            </h2>
          </div>
        </div>

        <form onSubmit={handleSaveGeneral} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              組織名
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              disabled={!canManage || saving}
              maxLength={200}
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
            <div className="flex items-center max-w-md">
              <span className="text-gray-500 text-sm mr-1">/</span>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, '')
                  )
                }
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                disabled={!canManage || saving}
                maxLength={100}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              小文字、数字、ハイフンのみ使用可能
            </p>
          </div>

          {canManage && (
            <div className="pt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={saving}
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                変更を保存
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Plan Information */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              プラン・お支払い
            </h2>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                現在のプラン
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {planConfig.description}
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-lg text-sm font-medium ${planConfig.color} ${planConfig.bgColor}`}
            >
              {planConfig.label}
            </span>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{organization._count.members}人のメンバー</span>
              </div>
              <div className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                <span>{organization._count.projects}件のプロジェクト</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              onClick={() => {
                // TODO: Implement billing/upgrade flow
                alert('お支払い管理機能は近日公開予定です');
              }}
            >
              お支払い管理
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      {isOwner && (
        <div className="bg-white rounded-lg border border-red-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-red-200 bg-red-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-semibold text-red-900">
                危険な操作
              </h2>
            </div>
          </div>

          <div className="p-6">
            {!showDeleteConfirm ? (
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    この組織を削除
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    削除すると、全てのプロジェクト、写真、データが完全に削除されます。
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  組織を削除
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 px-4 py-3 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>警告:</strong> この操作は取り消せません。全てのデータが完全に削除されます。
                  </p>
                </div>

                <p className="text-sm text-gray-600">
                  確認のため、以下に{' '}
                  <span className="font-semibold">{organization.name}</span>{' '}
                  と入力してください:
                </p>

                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="組織名を入力"
                  className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  disabled={deleting}
                />

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={deleting}
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleDeleteOrganization}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    disabled={
                      deleting || deleteConfirmText !== organization.name
                    }
                  >
                    {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                    完全に削除
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OrganizationSettings;
