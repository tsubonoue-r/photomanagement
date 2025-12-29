"use client";

import React, { useState, useEffect } from "react";
import { Download, Check, X, Loader2 } from "lucide-react";

interface WorkType {
  code: string;
  name: string;
  isImported: boolean;
  subTypesCount: number;
  totalCount: number;
}

interface ImportStandardCategoriesProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export function ImportStandardCategories({
  projectId,
  isOpen,
  onClose,
  onImportComplete,
}: ImportStandardCategoriesProps) {
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    imported: number;
    message: string;
  } | null>(null);

  // 工種一覧を取得
  useEffect(() => {
    if (isOpen) {
      fetchWorkTypes();
    }
  }, [isOpen, projectId]);

  const fetchWorkTypes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/categories/import-standard?projectId=${projectId}`
      );
      if (!response.ok) {
        throw new Error("工種一覧の取得に失敗しました");
      }
      const data = await response.json();
      setWorkTypes(data.workTypes);

      // 未インポートの工種をデフォルトで選択
      const unimported = data.workTypes
        .filter((wt: WorkType) => !wt.isImported)
        .map((wt: WorkType) => wt.code);
      setSelectedCodes(new Set(unimported));
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (code: string) => {
    const newSelected = new Set(selectedCodes);
    if (newSelected.has(code)) {
      newSelected.delete(code);
    } else {
      newSelected.add(code);
    }
    setSelectedCodes(newSelected);
  };

  const handleSelectAll = () => {
    const allCodes = workTypes
      .filter((wt) => !wt.isImported)
      .map((wt) => wt.code);
    setSelectedCodes(new Set(allCodes));
  };

  const handleDeselectAll = () => {
    setSelectedCodes(new Set());
  };

  const handleImport = async () => {
    if (selectedCodes.size === 0) return;

    setIsImporting(true);
    setError(null);
    setImportResult(null);

    try {
      const response = await fetch("/api/categories/import-standard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          workTypeCodes: Array.from(selectedCodes),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "インポートに失敗しました");
      }

      const data = await response.json();
      setImportResult({
        imported: data.imported,
        message: data.message,
      });

      // 工種一覧を再取得
      await fetchWorkTypes();
      onImportComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  const totalSelected = Array.from(selectedCodes).reduce((sum, code) => {
    const wt = workTypes.find((w) => w.code === code);
    return sum + (wt?.totalCount ?? 0);
  }, 0);

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* モーダル */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
          {/* ヘッダー */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                国交省標準カテゴリをインポート
              </h2>
            </div>
            <button
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={onClose}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* コンテンツ */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  インポートする工種を選択してください。各工種には種別・細別が含まれます。
                </p>

                {/* 一括選択ボタン */}
                <div className="flex gap-2 mb-4">
                  <button
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                    onClick={handleSelectAll}
                  >
                    すべて選択
                  </button>
                  <button
                    className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    onClick={handleDeselectAll}
                  >
                    選択解除
                  </button>
                </div>

                {/* 工種一覧 */}
                <div className="space-y-2">
                  {workTypes.map((wt) => (
                    <label
                      key={wt.code}
                      className={`
                        flex items-center gap-3 p-3 rounded-md border cursor-pointer
                        ${
                          wt.isImported
                            ? "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60"
                            : selectedCodes.has(wt.code)
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300"
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={wt.isImported || selectedCodes.has(wt.code)}
                        onChange={() => !wt.isImported && handleToggle(wt.code)}
                        disabled={wt.isImported}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {wt.name}
                          </span>
                          <span className="text-xs text-gray-500 font-mono">
                            ({wt.code})
                          </span>
                          {wt.isImported && (
                            <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                              <Check className="w-3 h-3" />
                              インポート済み
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {wt.subTypesCount}種別, {wt.totalCount}カテゴリ
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* インポート結果 */}
                {importResult && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                    <p className="text-green-700 dark:text-green-400">
                      {importResult.message}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* フッター */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-500">
              {selectedCodes.size > 0
                ? `${selectedCodes.size}件の工種を選択中 (計${totalSelected}カテゴリ)`
                : "工種を選択してください"}
            </span>
            <div className="flex gap-3">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                         bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600
                         rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                onClick={onClose}
                disabled={isImporting}
              >
                閉じる
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white
                         bg-blue-600 hover:bg-blue-700 rounded-md
                         disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleImport}
                disabled={isImporting || selectedCodes.size === 0}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    インポート中...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    インポート
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
