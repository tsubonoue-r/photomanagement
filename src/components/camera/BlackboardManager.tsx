'use client';

import { useState } from 'react';
import {
  X,
  FolderOpen,
  Trash2,
  Star,
  StarOff,
  Clock,
  ChevronRight,
  Loader2,
  FileText,
} from 'lucide-react';
import type { SavedBlackboard } from '@/lib/blackboardStorage';
import { useSavedBlackboards } from '@/hooks/useSavedBlackboards';

interface BlackboardManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (blackboard: SavedBlackboard) => void;
  projectId?: string;
  projectName?: string;
}

export function BlackboardManager({
  isOpen,
  onClose,
  onSelect,
  projectId,
  projectName,
}: BlackboardManagerProps) {
  const { blackboards, isLoading, error, remove, setAsDefault } = useSavedBlackboards({
    projectId,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'project' | 'global'>('project');

  if (!isOpen) return null;

  const projectBlackboards = blackboards.filter((b) => b.projectId === projectId);
  const globalBlackboards = blackboards.filter((b) => !b.projectId);
  const currentBlackboards = activeTab === 'project' ? projectBlackboards : globalBlackboards;

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      setDeleteConfirm(null);
    } catch {
      // Error is handled by hook
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setAsDefault(id);
    } catch {
      // Error is handled by hook
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            保存済み黒板
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        {projectId && (
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('project')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'project'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <FolderOpen className="w-4 h-4" />
                {projectName || 'プロジェクト'}
                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {projectBlackboards.length}
                </span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('global')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'global'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                共通テンプレート
                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {globalBlackboards.length}
                </span>
              </span>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : currentBlackboards.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {activeTab === 'project'
                  ? 'このプロジェクトに保存された黒板はありません'
                  : '共通テンプレートはありません'}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                カメラ画面で黒板を保存すると、ここに表示されます
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentBlackboards.map((blackboard) => (
                <div
                  key={blackboard.id}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-hidden"
                >
                  {deleteConfirm === blackboard.id ? (
                    // Delete confirmation
                    <div className="p-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                        「{blackboard.name}」を削除しますか？
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="flex-1 px-3 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          キャンセル
                        </button>
                        <button
                          onClick={() => handleDelete(blackboard.id)}
                          className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Normal view
                    <div className="flex items-center">
                      <button
                        onClick={() => onSelect(blackboard)}
                        className="flex-1 p-4 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {blackboard.name}
                              </span>
                              {blackboard.isDefault && (
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(blackboard.updatedAt)}
                              </span>
                              <span>{blackboard.values.length}項目</span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </button>

                      {/* Actions */}
                      <div className="flex items-center gap-1 pr-2">
                        {projectId && activeTab === 'project' && !blackboard.isDefault && (
                          <button
                            onClick={() => handleSetDefault(blackboard.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-yellow-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title="デフォルトに設定"
                          >
                            <StarOff className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteConfirm(blackboard.id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          title="削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
