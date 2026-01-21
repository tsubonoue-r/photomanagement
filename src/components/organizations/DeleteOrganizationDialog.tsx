'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import type { OrganizationWithCounts } from '@/types/organization';

interface DeleteOrganizationDialogProps {
  organization: OrganizationWithCounts;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Delete Organization Dialog Component
 *
 * Confirmation dialog for deleting an organization with:
 * - Warning message about data loss
 * - Confirmation input (type organization name)
 * - Cancel and confirm buttons
 */
export function DeleteOrganizationDialog({
  organization,
  onConfirm,
  onCancel,
}: DeleteOrganizationDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmValid = confirmText === organization.name;

  const handleDelete = async () => {
    if (!isConfirmValid) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '組織の削除に失敗しました');
      }

      onConfirm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '組織の削除に失敗しました'
      );
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
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              組織を削除
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 px-4 py-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>警告:</strong> この操作は取り消せません。この組織を削除すると、以下のデータが完全に削除されます：
            </p>
            <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
              <li>全 {organization._count.projects} プロジェクト</li>
              <li>全ての写真とアルバム</li>
              <li>全てのメンバー関連付け</li>
              <li>全ての組織設定</li>
            </ul>
          </div>

          <p className="text-gray-600">
            確認のため、以下に{' '}
            <span className="font-semibold text-gray-900">
              {organization.name}
            </span>{' '}
            と入力してください：
          </p>

          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="組織名を入力して確認"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            disabled={loading}
          />

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
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={loading || !isConfirmValid}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              組織を削除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteOrganizationDialog;
