'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  Loader2,
  AlertCircle,
  Database,
  Check,
  CheckSquare,
  Square,
  Download,
  Play,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import type { LarkSyncStatus, BulkImportResult, SyncCheckResponse } from '@/lib/lark/types';

interface LarkBulkImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

type ViewMode = 'loading' | 'select' | 'preview' | 'importing' | 'result';

/**
 * Lark Base一括インポートダイアログ
 * 「◆工程写真」が「有」の案件を一括インポート
 */
export function LarkBulkImportDialog({
  isOpen,
  onClose,
  onImportComplete,
}: LarkBulkImportDialogProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('loading');
  const [syncData, setSyncData] = useState<SyncCheckResponse | null>(null);
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);

  // 新規レコードのみ抽出
  const newRecords = useMemo(() => {
    if (!syncData) return [];
    return syncData.items.filter((item) => item.syncStatus === 'new');
  }, [syncData]);

  // 既存レコード抽出
  const existingRecords = useMemo(() => {
    if (!syncData) return [];
    return syncData.items.filter((item) => item.syncStatus === 'exists');
  }, [syncData]);

  /**
   * 同期ステータスを取得
   */
  const fetchSyncStatus = useCallback(async () => {
    setViewMode('loading');
    setError(null);
    setSyncData(null);
    setSelectedRecordIds(new Set());

    try {
      const response = await fetch('/api/lark/sync');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '同期ステータスの取得に失敗しました');
      }

      setSyncData(result.data);

      // 新規レコードを自動選択
      const newIds = new Set<string>(
        result.data.items
          .filter((item: LarkSyncStatus) => item.syncStatus === 'new')
          .map((item: LarkSyncStatus) => item.record.recordId)
      );
      setSelectedRecordIds(newIds);

      setViewMode('select');
    } catch (err) {
      setError(err instanceof Error ? err.message : '同期ステータスの取得に失敗しました');
      setViewMode('select');
    }
  }, []);

  /**
   * ダイアログが開いたときに同期ステータスを取得
   */
  useEffect(() => {
    if (isOpen) {
      fetchSyncStatus();
    }
  }, [isOpen, fetchSyncStatus]);

  /**
   * ダイアログを閉じるときに状態をリセット
   */
  useEffect(() => {
    if (!isOpen) {
      setViewMode('loading');
      setSyncData(null);
      setSelectedRecordIds(new Set());
      setError(null);
      setImportResult(null);
    }
  }, [isOpen]);

  /**
   * チェックボックスの切り替え
   */
  const handleToggleSelect = useCallback((recordId: string) => {
    setSelectedRecordIds((prev) => {
      const next = new Set(prev);
      if (next.has(recordId)) {
        next.delete(recordId);
      } else {
        next.add(recordId);
      }
      return next;
    });
  }, []);

  /**
   * 全選択/全解除
   */
  const handleSelectAll = useCallback(() => {
    if (selectedRecordIds.size === newRecords.length) {
      // 全解除
      setSelectedRecordIds(new Set());
    } else {
      // 全選択
      setSelectedRecordIds(new Set(newRecords.map((r) => r.record.recordId)));
    }
  }, [selectedRecordIds.size, newRecords]);

  /**
   * ドライラン実行
   */
  const handleDryRun = useCallback(async () => {
    if (selectedRecordIds.size === 0) return;

    setViewMode('importing');
    setError(null);

    try {
      const response = await fetch('/api/lark/import-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordIds: Array.from(selectedRecordIds),
          dryRun: true,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'ドライランに失敗しました');
      }

      setImportResult(result.data);
      setViewMode('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ドライランに失敗しました');
      setViewMode('select');
    }
  }, [selectedRecordIds]);

  /**
   * 実際のインポート実行
   */
  const handleImport = useCallback(async () => {
    if (selectedRecordIds.size === 0) return;

    setViewMode('importing');
    setError(null);

    try {
      const response = await fetch('/api/lark/import-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordIds: Array.from(selectedRecordIds),
          dryRun: false,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'インポートに失敗しました');
      }

      setImportResult(result.data);
      setViewMode('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'インポートに失敗しました');
      setViewMode('select');
    }
  }, [selectedRecordIds]);

  /**
   * 結果画面から閉じる
   */
  const handleCloseAfterImport = useCallback(() => {
    onImportComplete();
    onClose();
  }, [onImportComplete, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Lark Base 一括インポート
                </h2>
                <p className="text-sm text-gray-500">
                  「工程写真」が「有」の案件を一括インポート
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="閉じる"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Loading State */}
          {viewMode === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
              <p className="text-gray-500">Lark Baseから工程写真案件を取得中...</p>
            </div>
          )}

          {/* Importing State */}
          {viewMode === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
              <p className="text-gray-500">インポート処理中...</p>
            </div>
          )}

          {/* Error State */}
          {error && viewMode === 'select' && (
            <div className="flex items-center gap-3 p-4 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
              <button
                onClick={fetchSyncStatus}
                className="ml-auto flex items-center gap-1 text-sm underline hover:no-underline"
              >
                <RefreshCw className="w-4 h-4" />
                再試行
              </button>
            </div>
          )}

          {/* Select Mode */}
          {viewMode === 'select' && syncData && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-700">{syncData.newCount}</div>
                  <div className="text-sm text-green-600">新規インポート可能</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-700">{syncData.existsCount}</div>
                  <div className="text-sm text-gray-600">インポート済み</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-700">{syncData.totalCount}</div>
                  <div className="text-sm text-blue-600">工程写真案件 合計</div>
                </div>
              </div>

              {/* New Records - Selectable */}
              {newRecords.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      新規インポート対象 ({newRecords.length}件)
                    </h3>
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      {selectedRecordIds.size === newRecords.length ? (
                        <>
                          <CheckSquare className="w-4 h-4" />
                          全て解除
                        </>
                      ) : (
                        <>
                          <Square className="w-4 h-4" />
                          全て選択
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {newRecords.map((item) => {
                      const isSelected = selectedRecordIds.has(item.record.recordId);
                      return (
                        <button
                          key={item.record.recordId}
                          onClick={() => handleToggleSelect(item.record.recordId)}
                          className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-600'
                                  : 'border-gray-300'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 truncate">
                                  {item.record.name}
                                </span>
                                {item.record.code && (
                                  <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                    {item.record.code}
                                  </span>
                                )}
                              </div>
                              {item.record.constructionName && (
                                <p className="text-sm text-gray-500 truncate">
                                  {item.record.constructionName}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Existing Records - Read Only */}
              {existingRecords.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    インポート済み ({existingRecords.length}件)
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {existingRecords.map((item) => (
                      <div
                        key={item.record.recordId}
                        className="p-3 rounded-lg border border-gray-200 bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-5 h-5 rounded bg-gray-300 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700 truncate">
                                {item.record.name}
                              </span>
                              {item.record.code && (
                                <span className="text-xs font-mono text-gray-400 bg-gray-200 px-2 py-0.5 rounded">
                                  {item.record.code}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">インポート済み</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {newRecords.length === 0 && existingRecords.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Database className="w-12 h-12 mb-3 text-gray-300" />
                  <p className="text-lg font-medium">工程写真案件が見つかりません</p>
                  <p className="text-sm mt-1">
                    Lark Baseに「工程写真」が「有」の案件が登録されていません
                  </p>
                </div>
              )}
            </>
          )}

          {/* Preview Mode (Dry Run Result) */}
          {viewMode === 'preview' && importResult && (
            <>
              <div className="flex items-center gap-3 p-4 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">プレビュー結果</p>
                  <p className="text-sm">
                    実際にインポートする場合は「インポート実行」をクリックしてください
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-700">{importResult.successCount}</div>
                  <div className="text-sm text-green-600">インポート可能</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-700">{importResult.skippedCount}</div>
                  <div className="text-sm text-yellow-600">スキップ（重複）</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-700">{importResult.errorCount}</div>
                  <div className="text-sm text-red-600">エラー</div>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {importResult.items.map((item) => (
                  <div
                    key={item.recordId}
                    className={`p-3 rounded-lg border ${
                      item.status === 'success'
                        ? 'border-green-200 bg-green-50'
                        : item.status === 'skipped'
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                          item.status === 'success'
                            ? 'bg-green-600'
                            : item.status === 'skipped'
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }`}
                      >
                        {item.status === 'success' && <Check className="w-3 h-3 text-white" />}
                        {item.status === 'skipped' && <AlertTriangle className="w-3 h-3 text-white" />}
                        {item.status === 'error' && <X className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">{item.name}</span>
                          {item.code && (
                            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {item.code}
                            </span>
                          )}
                        </div>
                        {item.message && (
                          <p className="text-sm text-gray-500">{item.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Result Mode (After Import) */}
          {viewMode === 'result' && importResult && (
            <>
              <div className="flex items-center gap-3 p-4 mb-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                <Check className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">インポート完了</p>
                  <p className="text-sm">
                    {importResult.successCount}件のプロジェクトをインポートしました
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-700">{importResult.successCount}</div>
                  <div className="text-sm text-green-600">成功</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-700">{importResult.skippedCount}</div>
                  <div className="text-sm text-yellow-600">スキップ</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-700">{importResult.errorCount}</div>
                  <div className="text-sm text-red-600">エラー</div>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {importResult.items.map((item) => (
                  <div
                    key={item.recordId}
                    className={`p-3 rounded-lg border ${
                      item.status === 'success'
                        ? 'border-green-200 bg-green-50'
                        : item.status === 'skipped'
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                          item.status === 'success'
                            ? 'bg-green-600'
                            : item.status === 'skipped'
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }`}
                      >
                        {item.status === 'success' && <Check className="w-3 h-3 text-white" />}
                        {item.status === 'skipped' && <AlertTriangle className="w-3 h-3 text-white" />}
                        {item.status === 'error' && <X className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">{item.name}</span>
                          {item.code && (
                            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {item.code}
                            </span>
                          )}
                        </div>
                        {item.message && (
                          <p className="text-sm text-gray-500">{item.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {viewMode === 'select' && selectedRecordIds.size > 0 && (
                <span>{selectedRecordIds.size}件を選択中</span>
              )}
              {viewMode === 'preview' && (
                <span>プレビュー結果を確認してください</span>
              )}
              {viewMode === 'result' && (
                <span>インポートが完了しました</span>
              )}
            </div>
            <div className="flex gap-3">
              {viewMode === 'select' && (
                <>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleDryRun}
                    disabled={selectedRecordIds.size === 0}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    プレビュー
                  </button>
                </>
              )}
              {viewMode === 'preview' && (
                <>
                  <button
                    onClick={() => setViewMode('select')}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    戻る
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importResult?.successCount === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    インポート実行
                  </button>
                </>
              )}
              {viewMode === 'result' && (
                <button
                  onClick={handleCloseAfterImport}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  閉じる
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LarkBulkImportDialog;
