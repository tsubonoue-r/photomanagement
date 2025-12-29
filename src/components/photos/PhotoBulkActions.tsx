'use client';

import { memo, useCallback, useState } from 'react';
import type {
  BulkActionType,
  BulkActionRequest,
  BulkActionResponse,
  WorkType,
  PhotoCategory,
} from '@/types/photo';
import { WORK_TYPE_LABELS, PHOTO_CATEGORY_LABELS } from '@/types/photo';

interface PhotoBulkActionsProps {
  selectedCount: number;
  onBulkAction: (action: BulkActionRequest) => Promise<BulkActionResponse>;
  selectedIds: Set<string>;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  totalCount: number;
}

type ModalType = 'delete' | 'move' | 'workType' | 'category' | 'tags' | null;

export const PhotoBulkActions = memo<PhotoBulkActionsProps>(function PhotoBulkActions({
  selectedCount,
  onBulkAction,
  selectedIds,
  onSelectAll,
  onDeselectAll,
  totalCount,
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [targetProjectId, setTargetProjectId] = useState('');
  const [selectedWorkType, setSelectedWorkType] = useState<WorkType | ''>('');
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory | ''>('');
  const [tags, setTags] = useState('');

  const handleAction = useCallback(
    async (action: BulkActionType, payload?: BulkActionRequest['payload']) => {
      if (selectedCount === 0) return;

      setIsProcessing(true);
      try {
        const result = await onBulkAction({
          action,
          photoIds: Array.from(selectedIds),
          payload,
        });

        if (!result.success && result.errors && result.errors.length > 0) {
          console.error('Bulk action errors:', result.errors);
          alert(`一部の写真で処理に失敗しました: ${result.errors.length}件`);
        }
      } catch (error) {
        console.error('Bulk action error:', error);
        alert('処理中にエラーが発生しました');
      } finally {
        setIsProcessing(false);
        setModalType(null);
      }
    },
    [selectedCount, selectedIds, onBulkAction]
  );

  const handleDelete = useCallback(() => {
    handleAction('delete');
  }, [handleAction]);

  const handleMove = useCallback(() => {
    if (!targetProjectId) {
      alert('移動先のプロジェクトを選択してください');
      return;
    }
    handleAction('move', { targetProjectId });
    setTargetProjectId('');
  }, [handleAction, targetProjectId]);

  const handleUpdateWorkType = useCallback(() => {
    if (!selectedWorkType) {
      alert('工種を選択してください');
      return;
    }
    handleAction('updateWorkType', { workType: selectedWorkType });
    setSelectedWorkType('');
  }, [handleAction, selectedWorkType]);

  const handleUpdateCategory = useCallback(() => {
    if (!selectedCategory) {
      alert('種別を選択してください');
      return;
    }
    handleAction('updateCategory', { category: selectedCategory });
    setSelectedCategory('');
  }, [handleAction, selectedCategory]);

  const handleAddTags = useCallback(() => {
    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (tagList.length === 0) {
      alert('タグを入力してください');
      return;
    }
    handleAction('addTags', { tags: tagList });
    setTags('');
  }, [handleAction, tags]);

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      {/* Bulk actions bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between rounded-lg bg-blue-500 px-4 py-3 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={onDeselectAll}
            className="rounded-full p-1 hover:bg-white/20"
            aria-label="Clear selection"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <span className="font-medium">
            {selectedCount}件選択中
            {selectedCount < totalCount && (
              <button
                onClick={onSelectAll}
                className="ml-2 text-sm underline hover:no-underline"
              >
                (全{totalCount}件を選択)
              </button>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Work type button */}
          <button
            onClick={() => setModalType('workType')}
            disabled={isProcessing}
            className="flex items-center gap-1 rounded-lg bg-white/20 px-3 py-1.5 text-sm
              transition-colors hover:bg-white/30 disabled:opacity-50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            工種変更
          </button>

          {/* Category button */}
          <button
            onClick={() => setModalType('category')}
            disabled={isProcessing}
            className="flex items-center gap-1 rounded-lg bg-white/20 px-3 py-1.5 text-sm
              transition-colors hover:bg-white/30 disabled:opacity-50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            種別変更
          </button>

          {/* Tags button */}
          <button
            onClick={() => setModalType('tags')}
            disabled={isProcessing}
            className="flex items-center gap-1 rounded-lg bg-white/20 px-3 py-1.5 text-sm
              transition-colors hover:bg-white/30 disabled:opacity-50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            タグ追加
          </button>

          {/* Move button */}
          <button
            onClick={() => setModalType('move')}
            disabled={isProcessing}
            className="flex items-center gap-1 rounded-lg bg-white/20 px-3 py-1.5 text-sm
              transition-colors hover:bg-white/30 disabled:opacity-50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
            移動
          </button>

          {/* Delete button */}
          <button
            onClick={() => setModalType('delete')}
            disabled={isProcessing}
            className="flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-sm
              transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            削除
          </button>
        </div>
      </div>

      {/* Modal */}
      {modalType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setModalType(null)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            {modalType === 'delete' && (
              <>
                <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                  写真の削除
                </h3>
                <p className="mb-6 text-zinc-600 dark:text-zinc-400">
                  選択した{selectedCount}件の写真を削除しますか？この操作は取り消せません。
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setModalType(null)}
                    className="rounded-lg px-4 py-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isProcessing}
                    className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    {isProcessing ? '処理中...' : '削除する'}
                  </button>
                </div>
              </>
            )}

            {modalType === 'move' && (
              <>
                <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                  写真の移動
                </h3>
                <div className="mb-6">
                  <label className="mb-2 block text-sm text-zinc-600 dark:text-zinc-400">
                    移動先プロジェクト
                  </label>
                  <select
                    value={targetProjectId}
                    onChange={(e) => setTargetProjectId(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                  >
                    <option value="">選択してください</option>
                    <option value="project-1">プロジェクト1</option>
                    <option value="project-2">プロジェクト2</option>
                    <option value="project-3">プロジェクト3</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setModalType(null)}
                    className="rounded-lg px-4 py-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleMove}
                    disabled={isProcessing || !targetProjectId}
                    className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
                  >
                    {isProcessing ? '処理中...' : '移動する'}
                  </button>
                </div>
              </>
            )}

            {modalType === 'workType' && (
              <>
                <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                  工種の変更
                </h3>
                <div className="mb-6">
                  <label className="mb-2 block text-sm text-zinc-600 dark:text-zinc-400">
                    工種を選択
                  </label>
                  <select
                    value={selectedWorkType}
                    onChange={(e) => setSelectedWorkType(e.target.value as WorkType)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                  >
                    <option value="">選択してください</option>
                    {(Object.entries(WORK_TYPE_LABELS) as [WorkType, string][]).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setModalType(null)}
                    className="rounded-lg px-4 py-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleUpdateWorkType}
                    disabled={isProcessing || !selectedWorkType}
                    className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
                  >
                    {isProcessing ? '処理中...' : '変更する'}
                  </button>
                </div>
              </>
            )}

            {modalType === 'category' && (
              <>
                <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                  種別の変更
                </h3>
                <div className="mb-6">
                  <label className="mb-2 block text-sm text-zinc-600 dark:text-zinc-400">
                    種別を選択
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as PhotoCategory)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                  >
                    <option value="">選択してください</option>
                    {(Object.entries(PHOTO_CATEGORY_LABELS) as [PhotoCategory, string][]).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setModalType(null)}
                    className="rounded-lg px-4 py-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleUpdateCategory}
                    disabled={isProcessing || !selectedCategory}
                    className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
                  >
                    {isProcessing ? '処理中...' : '変更する'}
                  </button>
                </div>
              </>
            )}

            {modalType === 'tags' && (
              <>
                <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
                  タグの追加
                </h3>
                <div className="mb-6">
                  <label className="mb-2 block text-sm text-zinc-600 dark:text-zinc-400">
                    タグ（カンマ区切りで複数入力可能）
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="例: 完成写真, 外観"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setModalType(null)}
                    className="rounded-lg px-4 py-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleAddTags}
                    disabled={isProcessing || !tags.trim()}
                    className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
                  >
                    {isProcessing ? '処理中...' : '追加する'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
});

export default PhotoBulkActions;
