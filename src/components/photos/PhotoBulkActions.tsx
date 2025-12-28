'use client';

import { memo, useState, useCallback } from 'react';
import type { BulkActionRequest, BulkActionResponse, BulkActionType, WorkType, PhotoCategory } from '@/types/photo';
import { WORK_TYPE_LABELS, PHOTO_CATEGORY_LABELS } from '@/types/photo';

interface PhotoBulkActionsProps {
  selectedCount: number;
  onBulkAction: (action: BulkActionRequest) => Promise<BulkActionResponse>;
  selectedIds: Set<string>;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  totalCount: number;
}

export const PhotoBulkActions = memo<PhotoBulkActionsProps>(function PhotoBulkActions({
  selectedCount,
  onBulkAction,
  selectedIds,
  onSelectAll,
  onDeselectAll,
  totalCount,
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showWorkTypeDialog, setShowWorkTypeDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [selectedWorkType, setSelectedWorkType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [tagInput, setTagInput] = useState('');

  const handleAction = useCallback(
    async (action: BulkActionType, payload?: { workType?: WorkType; category?: PhotoCategory; tags?: string[] }) => {
      if (isProcessing) return;
      setIsProcessing(true);
      try {
        const request: BulkActionRequest = {
          action,
          photoIds: Array.from(selectedIds),
          payload,
        };
        await onBulkAction(request);
      } finally {
        setIsProcessing(false);
        setShowWorkTypeDialog(false);
        setShowCategoryDialog(false);
        setShowTagDialog(false);
      }
    },
    [isProcessing, onBulkAction, selectedIds]
  );

  const handleDelete = useCallback(async () => {
    if (confirm(`${selectedCount}枚の写真を削除しますか？この操作は取り消せません。`)) {
      await handleAction('delete');
    }
  }, [selectedCount, handleAction]);

  const handleWorkTypeUpdate = useCallback(async () => {
    if (selectedWorkType) {
      await handleAction('updateWorkType', { workType: selectedWorkType as WorkType });
    }
  }, [selectedWorkType, handleAction]);

  const handleCategoryUpdate = useCallback(async () => {
    if (selectedCategory) {
      await handleAction('updateCategory', { category: selectedCategory as PhotoCategory });
    }
  }, [selectedCategory, handleAction]);

  const handleAddTags = useCallback(async () => {
    const tags = tagInput.split(',').map((t) => t.trim()).filter(Boolean);
    if (tags.length > 0) {
      await handleAction('addTags', { tags });
      setTagInput('');
    }
  }, [tagInput, handleAction]);

  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3
      dark:border-blue-800 dark:bg-blue-900/20">
      {/* Selection info */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
          {selectedCount}枚を選択中
        </span>
        <button
          onClick={allSelected ? onDeselectAll : onSelectAll}
          className="text-sm text-blue-600 underline hover:no-underline dark:text-blue-400"
        >
          {allSelected ? 'すべて解除' : 'すべて選択'}
        </button>
        <button
          onClick={onDeselectAll}
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
        >
          選択解除
        </button>
      </div>

      <div className="mx-2 h-6 w-px bg-blue-200 dark:bg-blue-700" />

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Work type update */}
        <div className="relative">
          <button
            onClick={() => setShowWorkTypeDialog(!showWorkTypeDialog)}
            disabled={isProcessing}
            className="flex items-center gap-1 rounded-lg border border-blue-300 bg-white px-3 py-1.5
              text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100
              disabled:opacity-50 dark:border-blue-600 dark:bg-blue-800 dark:text-blue-300
              dark:hover:bg-blue-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
            </svg>
            工種変更
          </button>
          {showWorkTypeDialog && (
            <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-lg border border-zinc-200
              bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
              <select
                value={selectedWorkType}
                onChange={(e) => setSelectedWorkType(e.target.value)}
                className="mb-2 w-full rounded border border-zinc-300 px-2 py-1 text-sm
                  dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
              >
                <option value="">工種を選択</option>
                {Object.entries(WORK_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleWorkTypeUpdate}
                  disabled={!selectedWorkType}
                  className="flex-1 rounded bg-blue-500 px-2 py-1 text-sm text-white
                    hover:bg-blue-600 disabled:opacity-50"
                >
                  適用
                </button>
                <button
                  onClick={() => setShowWorkTypeDialog(false)}
                  className="rounded px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100
                    dark:text-zinc-400 dark:hover:bg-zinc-700"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Category update */}
        <div className="relative">
          <button
            onClick={() => setShowCategoryDialog(!showCategoryDialog)}
            disabled={isProcessing}
            className="flex items-center gap-1 rounded-lg border border-blue-300 bg-white px-3 py-1.5
              text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100
              disabled:opacity-50 dark:border-blue-600 dark:bg-blue-800 dark:text-blue-300
              dark:hover:bg-blue-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            種別変更
          </button>
          {showCategoryDialog && (
            <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-lg border border-zinc-200
              bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mb-2 w-full rounded border border-zinc-300 px-2 py-1 text-sm
                  dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
              >
                <option value="">種別を選択</option>
                {Object.entries(PHOTO_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleCategoryUpdate}
                  disabled={!selectedCategory}
                  className="flex-1 rounded bg-blue-500 px-2 py-1 text-sm text-white
                    hover:bg-blue-600 disabled:opacity-50"
                >
                  適用
                </button>
                <button
                  onClick={() => setShowCategoryDialog(false)}
                  className="rounded px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100
                    dark:text-zinc-400 dark:hover:bg-zinc-700"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add tags */}
        <div className="relative">
          <button
            onClick={() => setShowTagDialog(!showTagDialog)}
            disabled={isProcessing}
            className="flex items-center gap-1 rounded-lg border border-blue-300 bg-white px-3 py-1.5
              text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100
              disabled:opacity-50 dark:border-blue-600 dark:bg-blue-800 dark:text-blue-300
              dark:hover:bg-blue-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            タグ追加
          </button>
          {showTagDialog && (
            <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-lg border border-zinc-200
              bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="タグをカンマ区切りで入力"
                className="mb-2 w-full rounded border border-zinc-300 px-2 py-1 text-sm
                  dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddTags}
                  disabled={!tagInput.trim()}
                  className="flex-1 rounded bg-blue-500 px-2 py-1 text-sm text-white
                    hover:bg-blue-600 disabled:opacity-50"
                >
                  追加
                </button>
                <button
                  onClick={() => setShowTagDialog(false)}
                  className="rounded px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100
                    dark:text-zinc-400 dark:hover:bg-zinc-700"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={isProcessing}
          className="flex items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-1.5
            text-sm font-medium text-red-700 transition-colors hover:bg-red-50
            disabled:opacity-50 dark:border-red-600 dark:bg-red-800/20 dark:text-red-400
            dark:hover:bg-red-800/40"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          削除
        </button>
      </div>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          処理中...
        </div>
      )}
    </div>
  );
});

export default PhotoBulkActions;
