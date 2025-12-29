"use client";
import React, { useState } from "react";
import { Download, Check, AlertCircle, Loader2 } from "lucide-react";
import { standardCategories, getWorkTypes } from "@/data/standard-categories";

interface ImportStandardCategoriesProps {
  projectId: string;
  onImport: () => void;
  existingCodes?: Set<string>;
}

export function ImportStandardCategories({
  projectId,
  onImport,
  existingCodes = new Set(),
}: ImportStandardCategoriesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number } | null>(null);

  const workTypes = getWorkTypes();

  const handleToggleWorkType = (code: string) => {
    const newSelected = new Set(selectedWorkTypes);
    if (newSelected.has(code)) {
      newSelected.delete(code);
    } else {
      newSelected.add(code);
    }
    setSelectedWorkTypes(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedWorkTypes.size === workTypes.length) {
      setSelectedWorkTypes(new Set());
    } else {
      setSelectedWorkTypes(new Set(workTypes.map((w) => w.code)));
    }
  };

  const getCategoriesToImport = () => {
    return standardCategories.filter((cat) => {
      if (existingCodes.has(cat.code)) return false;
      if (cat.level === 1) return selectedWorkTypes.has(cat.code);
      if (cat.parentCode) {
        const rootCode = cat.parentCode.split("-")[0];
        return selectedWorkTypes.has(rootCode);
      }
      return false;
    });
  };

  const handleImport = async () => {
    if (selectedWorkTypes.size === 0) return;

    setIsImporting(true);
    setError(null);
    setImportResult(null);

    try {
      const response = await fetch(`/api/categories/import-standard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          workTypeCodes: Array.from(selectedWorkTypes),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "インポートに失敗しました");
      }

      const data = await response.json();
      setImportResult({ imported: data.imported });
      setSelectedWorkTypes(new Set());
      onImport();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsImporting(false);
    }
  };

  const categoriesToImport = getCategoriesToImport();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
      >
        <Download className="w-4 h-4" />
        標準カテゴリをインポート
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">標準カテゴリのインポート</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-gray-100"
            >
              <span className="sr-only">閉じる</span>
              &times;
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            <p className="text-sm text-gray-600 mb-4">
              国土交通省 電子納品要領に基づく標準カテゴリをインポートします。
              インポートする工種を選択してください。
            </p>

            <div className="mb-4">
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:underline"
              >
                {selectedWorkTypes.size === workTypes.length ? "すべて解除" : "すべて選択"}
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {workTypes.map((workType) => {
                const isExisting = existingCodes.has(workType.code);
                const isSelected = selectedWorkTypes.has(workType.code);

                return (
                  <label
                    key={workType.code}
                    className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer ${
                      isExisting
                        ? "bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed"
                        : isSelected
                        ? "bg-blue-50 border-blue-300"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => !isExisting && handleToggleWorkType(workType.code)}
                      disabled={isExisting}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gray-500">
                          {workType.code}
                        </span>
                        <span className="text-sm font-medium">{workType.name}</span>
                      </div>
                      {isExisting && (
                        <span className="text-xs text-gray-500">インポート済み</span>
                      )}
                    </div>
                    {isExisting && <Check className="w-4 h-4 text-green-500" />}
                  </label>
                );
              })}
            </div>

            {selectedWorkTypes.size > 0 && (
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  {categoriesToImport.length}件のカテゴリがインポートされます
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {importResult && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 mt-0.5" />
                <p className="text-sm text-green-600">
                  {importResult.imported}件のカテゴリをインポートしました
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
              disabled={isImporting}
            >
              キャンセル
            </button>
            <button
              onClick={handleImport}
              disabled={selectedWorkTypes.size === 0 || isImporting}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50"
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
    </>
  );
}
