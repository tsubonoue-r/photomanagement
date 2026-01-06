'use client';

import { useState } from 'react';
import { X, Save, FolderOpen } from 'lucide-react';
import type { BlackboardFieldValue } from '@/types/blackboard';
import type { BlackboardOverlayState } from './BlackboardOverlay';
import type { SavedBlackboardInput } from '@/lib/blackboardStorage';

interface BlackboardSaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: SavedBlackboardInput) => Promise<void>;
  values: BlackboardFieldValue[];
  overlayState: BlackboardOverlayState;
  projectId?: string;
  projectName?: string;
  existingName?: string;
}

export function BlackboardSaveDialog({
  isOpen,
  onClose,
  onSave,
  values,
  overlayState,
  projectId,
  projectName,
  existingName,
}: BlackboardSaveDialogProps) {
  const [name, setName] = useState(existingName || '');
  const [saveToProject, setSaveToProject] = useState(!!projectId);
  const [isDefault, setIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      setError('黒板名を入力してください');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        projectId: saveToProject ? projectId : undefined,
        values,
        overlayState: {
          position: overlayState.position,
          customPosition: overlayState.customPosition,
          scale: overlayState.scale,
          opacity: overlayState.opacity,
        },
        isDefault,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Save className="w-5 h-5" />
            黒板を保存
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Name input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              黒板名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 基礎工事用黒板"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Project association */}
          {projectId && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToProject}
                  onChange={(e) => setSaveToProject(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  プロジェクトに紐付ける
                </span>
              </label>
              {saveToProject && (
                <div className="ml-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <FolderOpen className="w-4 h-4" />
                  {projectName || projectId}
                </div>
              )}
            </div>
          )}

          {/* Set as default */}
          {projectId && saveToProject && (
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  このプロジェクトのデフォルトにする
                </span>
              </label>
            </div>
          )}

          {/* Saved settings info */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">保存される設定:</p>
            <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
              <li>• 黒板の入力内容（工事名、工種など）</li>
              <li>• 黒板の位置、サイズ、透明度</li>
            </ul>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
