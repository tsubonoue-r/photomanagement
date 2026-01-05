'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import type { ProjectWithCounts } from '@/types/project';

interface DeleteProjectDialogProps {
  project: ProjectWithCounts;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Delete Project Dialog Component
 *
 * Displays a confirmation dialog before deleting a project.
 * Shows warning about associated data (photos, albums, etc.)
 */
export function DeleteProjectDialog({
  project,
  onConfirm,
  onCancel,
}: DeleteProjectDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const hasAssociatedData =
    project._count.photos > 0 ||
    project._count.albums > 0 ||
    project._count.members > 0;

  const handleDelete = async () => {
    if (hasAssociatedData && confirmText !== project.name) {
      setError('削除を確認するためにプロジェクト名を入力してください');
      return;
    }

    try {
      setDeleting(true);
      setError(null);

      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'プロジェクトの削除に失敗しました');
      }

      onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プロジェクトの削除に失敗しました');
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">プロジェクトを削除</h2>
            </div>
            <button
              onClick={onCancel}
              className="p-1 rounded hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4">
            <p className="text-gray-700">
              <span className="font-semibold">{project.name}</span> を削除してもよろしいですか？
            </p>

            {/* Warning about associated data */}
            {hasAssociatedData && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 font-medium mb-2">
                  このプロジェクトには以下が含まれています:
                </p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {project._count.photos > 0 && (
                    <li>- {project._count.photos} 枚の写真</li>
                  )}
                  {project._count.albums > 0 && (
                    <li>- {project._count.albums} 件のアルバム</li>
                  )}
                  {project._count.members > 0 && (
                    <li>- {project._count.members} 人のメンバー</li>
                  )}
                </ul>
                <p className="text-sm text-yellow-800 mt-2">
                  関連するすべてのデータが完全に削除されます。
                </p>
              </div>
            )}

            {/* Confirmation input for projects with data */}
            {hasAssociatedData && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  削除を確認するには <span className="font-semibold">{project.name}</span> と入力してください:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="プロジェクト名"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-lg">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
              disabled={deleting}
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              disabled={deleting || (hasAssociatedData && confirmText !== project.name)}
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              {deleting ? '削除中...' : '削除'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default DeleteProjectDialog;
