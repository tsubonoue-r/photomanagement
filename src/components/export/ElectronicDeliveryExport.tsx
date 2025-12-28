"use client";

/**
 * 電子納品エクスポートUIコンポーネント
 * 国土交通省 デジタル写真管理情報基準 準拠のエクスポート機能
 */

import React, { useState, useCallback } from "react";
import type {
  ExportConfig,
  ExportProgress,
  ExportResult,
  ProjectPhoto,
  ExportMetadata,
  PhotoCategory,
  PhotoMajorCategory,
} from "@/types/electronic-delivery";

/**
 * エクスポートUIのProps
 */
interface ElectronicDeliveryExportProps {
  /** プロジェクトID */
  projectId: string;
  /** プロジェクト写真一覧 */
  photos: ProjectPhoto[];
  /** プロジェクト情報 */
  projectInfo?: {
    constructionName: string;
    contractorName: string;
    ordererName?: string;
    startDate?: string;
    endDate?: string;
  };
  /** エクスポート完了時のコールバック */
  onExportComplete?: (result: ExportResult) => void;
  /** キャンセル時のコールバック */
  onCancel?: () => void;
}

/**
 * エクスポート設定フォームの状態
 */
interface ExportFormState {
  outputFormat: "zip" | "folder";
  standardVersion: string;
  constructionName: string;
  contractorName: string;
  ordererName: string;
  startDate: string;
  endDate: string;
  selectedPhotoIds: string[];
  jpegQuality: number;
  compressionEnabled: boolean;
}

/**
 * 利用可能な基準バージョン
 */
const STANDARD_VERSIONS = [
  { value: "令和5年3月", label: "令和5年3月版" },
  { value: "令和4年3月", label: "令和4年3月版" },
  { value: "令和3年3月", label: "令和3年3月版" },
  { value: "平成31年3月", label: "平成31年3月版" },
];

/**
 * 電子納品エクスポートコンポーネント
 */
export function ElectronicDeliveryExport({
  projectId,
  photos,
  projectInfo,
  onExportComplete,
  onCancel,
}: ElectronicDeliveryExportProps) {
  // フォーム状態
  const [formState, setFormState] = useState<ExportFormState>({
    outputFormat: "zip",
    standardVersion: "令和5年3月",
    constructionName: projectInfo?.constructionName || "",
    contractorName: projectInfo?.contractorName || "",
    ordererName: projectInfo?.ordererName || "",
    startDate: projectInfo?.startDate || "",
    endDate: projectInfo?.endDate || "",
    selectedPhotoIds: photos.map((p) => p.id),
    jpegQuality: 85,
    compressionEnabled: false,
  });

  // エクスポート状態
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExportResult | null>(null);

  /**
   * フォーム入力ハンドラー
   */
  const handleInputChange = useCallback(
    (field: keyof ExportFormState, value: string | number | boolean | string[]) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  /**
   * 写真選択ハンドラー
   */
  const handlePhotoSelection = useCallback(
    (photoId: string, selected: boolean) => {
      setFormState((prev) => ({
        ...prev,
        selectedPhotoIds: selected
          ? [...prev.selectedPhotoIds, photoId]
          : prev.selectedPhotoIds.filter((id) => id !== photoId),
      }));
    },
    []
  );

  /**
   * 全選択/全解除
   */
  const handleSelectAll = useCallback(
    (selectAll: boolean) => {
      setFormState((prev) => ({
        ...prev,
        selectedPhotoIds: selectAll ? photos.map((p) => p.id) : [],
      }));
    },
    [photos]
  );

  /**
   * エクスポート実行
   */
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setError(null);
    setProgress({
      currentStep: "preparing",
      totalSteps: 6,
      completedSteps: 0,
      progressPercent: 0,
      processedFiles: 0,
      totalFiles: formState.selectedPhotoIds.length,
    });

    try {
      const metadata: ExportMetadata = {
        constructionName: formState.constructionName,
        contractorName: formState.contractorName,
        ordererName: formState.ordererName || undefined,
        constructionStartDate: formState.startDate || undefined,
        constructionEndDate: formState.endDate || undefined,
      };

      const config: ExportConfig = {
        projectId,
        outputFormat: formState.outputFormat,
        standardVersion: formState.standardVersion,
        photoQuality: {
          jpegQuality: formState.jpegQuality,
          compressionEnabled: formState.compressionEnabled,
        },
        photoIds:
          formState.selectedPhotoIds.length === photos.length
            ? undefined
            : formState.selectedPhotoIds,
        metadata,
      };

      // API呼び出し
      const response = await fetch(
        `/api/projects/${projectId}/export/electronic-delivery`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            config: {
              outputFormat: config.outputFormat,
              standardVersion: config.standardVersion,
              photoQuality: config.photoQuality,
              photoIds: config.photoIds,
            },
            metadata,
            photos: photos.filter((p) =>
              formState.selectedPhotoIds.includes(p.id)
            ),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "エクスポートに失敗しました");
      }

      // 成功
      const exportResult: ExportResult = {
        success: true,
        validationResult: data.data.validationResult,
        processingTimeMs: data.processingTimeMs,
      };

      setResult(exportResult);
      setProgress({
        currentStep: "completed",
        totalSteps: 6,
        completedSteps: 6,
        progressPercent: 100,
        processedFiles: formState.selectedPhotoIds.length,
        totalFiles: formState.selectedPhotoIds.length,
      });

      if (onExportComplete) {
        onExportComplete(exportResult);
      }

      // ZIPダウンロード処理（クライアントサイド）
      if (formState.outputFormat === "zip") {
        await downloadAsZip(data.data, formState.constructionName);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "エクスポート中にエラーが発生しました";
      setError(errorMessage);
      setProgress({
        currentStep: "failed",
        totalSteps: 6,
        completedSteps: 0,
        progressPercent: 0,
        processedFiles: 0,
        totalFiles: formState.selectedPhotoIds.length,
      });
    } finally {
      setIsExporting(false);
    }
  }, [formState, projectId, photos, onExportComplete]);

  /**
   * ZIPダウンロード処理
   */
  const downloadAsZip = async (
    data: { photoXml: string; folderStructure: Record<string, unknown> },
    constructionName: string
  ) => {
    // PHOTO.XMLをダウンロード（簡易実装）
    const blob = new Blob([data.photoXml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${constructionName}_PHOTO.XML`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * 進捗表示テキスト
   */
  const getProgressText = (step: ExportProgress["currentStep"]): string => {
    const texts: Record<ExportProgress["currentStep"], string> = {
      preparing: "準備中...",
      "creating-folders": "フォルダ構成を作成中...",
      "copying-photos": "写真をコピー中...",
      "generating-xml": "PHOTO.XMLを生成中...",
      validating: "検証中...",
      "creating-archive": "アーカイブを作成中...",
      completed: "完了",
      failed: "失敗",
    };
    return texts[step] || step;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white dark:bg-zinc-900 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">
        電子納品エクスポート
      </h2>

      {/* エラー表示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* 進捗表示 */}
      {isExporting && progress && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-700 dark:text-blue-300">
              {getProgressText(progress.currentStep)}
            </span>
            <span className="text-blue-700 dark:text-blue-300">
              {progress.progressPercent}%
            </span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
            {progress.processedFiles} / {progress.totalFiles} ファイル処理済み
          </p>
        </div>
      )}

      {/* 成功表示 */}
      {result?.success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-green-700 dark:text-green-300">
            エクスポートが完了しました（処理時間: {result.processingTimeMs}ms）
          </p>
        </div>
      )}

      {/* 設定フォーム */}
      <div className="space-y-6">
        {/* 基本設定 */}
        <section>
          <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-200">
            基本設定
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                出力形式
              </label>
              <select
                value={formState.outputFormat}
                onChange={(e) =>
                  handleInputChange(
                    "outputFormat",
                    e.target.value as "zip" | "folder"
                  )
                }
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                disabled={isExporting}
              >
                <option value="zip">ZIP形式</option>
                <option value="folder">フォルダ形式</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                適用基準
              </label>
              <select
                value={formState.standardVersion}
                onChange={(e) =>
                  handleInputChange("standardVersion", e.target.value)
                }
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                disabled={isExporting}
              >
                {STANDARD_VERSIONS.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* メタデータ */}
        <section>
          <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-200">
            工事情報
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                工事名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formState.constructionName}
                onChange={(e) =>
                  handleInputChange("constructionName", e.target.value)
                }
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                disabled={isExporting}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                施工会社名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formState.contractorName}
                onChange={(e) =>
                  handleInputChange("contractorName", e.target.value)
                }
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                disabled={isExporting}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                発注者名
              </label>
              <input
                type="text"
                value={formState.ordererName}
                onChange={(e) =>
                  handleInputChange("ordererName", e.target.value)
                }
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                disabled={isExporting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                工期開始日
              </label>
              <input
                type="date"
                value={formState.startDate}
                onChange={(e) =>
                  handleInputChange("startDate", e.target.value)
                }
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                disabled={isExporting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                工期終了日
              </label>
              <input
                type="date"
                value={formState.endDate}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                disabled={isExporting}
              />
            </div>
          </div>
        </section>

        {/* 写真品質設定 */}
        <section>
          <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-200">
            写真品質設定
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                JPEG品質 ({formState.jpegQuality}%)
              </label>
              <input
                type="range"
                min="50"
                max="100"
                value={formState.jpegQuality}
                onChange={(e) =>
                  handleInputChange("jpegQuality", parseInt(e.target.value))
                }
                className="w-full"
                disabled={isExporting}
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="compressionEnabled"
                checked={formState.compressionEnabled}
                onChange={(e) =>
                  handleInputChange("compressionEnabled", e.target.checked)
                }
                className="mr-2"
                disabled={isExporting}
              />
              <label
                htmlFor="compressionEnabled"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                画像圧縮を有効にする
              </label>
            </div>
          </div>
        </section>

        {/* 写真選択 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
              写真選択 ({formState.selectedPhotoIds.length}/{photos.length})
            </h3>
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => handleSelectAll(true)}
                className="px-3 py-1 text-sm bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded"
                disabled={isExporting}
              >
                全選択
              </button>
              <button
                type="button"
                onClick={() => handleSelectAll(false)}
                className="px-3 py-1 text-sm bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded"
                disabled={isExporting}
              >
                全解除
              </button>
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-md">
            {photos.length === 0 ? (
              <p className="p-4 text-zinc-500 dark:text-zinc-400 text-center">
                写真がありません
              </p>
            ) : (
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {photos.map((photo) => (
                  <li
                    key={photo.id}
                    className="flex items-center p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <input
                      type="checkbox"
                      checked={formState.selectedPhotoIds.includes(photo.id)}
                      onChange={(e) =>
                        handlePhotoSelection(photo.id, e.target.checked)
                      }
                      className="mr-3"
                      disabled={isExporting}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {photo.title || photo.fileName}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {photo.category} |{" "}
                        {new Date(photo.shootingDate).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* アクションボタン */}
        <div className="flex justify-end space-x-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              disabled={isExporting}
            >
              キャンセル
            </button>
          )}
          <button
            type="button"
            onClick={handleExport}
            disabled={
              isExporting ||
              formState.selectedPhotoIds.length === 0 ||
              !formState.constructionName ||
              !formState.contractorName
            }
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? "エクスポート中..." : "エクスポート"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ElectronicDeliveryExport;
