"use client";

/**
 * 電子納品エクスポートUIコンポーネント
 * 国土交通省 デジタル写真管理情報基準 準拠
 */

import React, { useState, useCallback } from "react";
import type {
  ExportConfig,
  ExportProgress,
  ExportResult,
  ProjectPhoto,
  ExportMetadata,
  ValidationResult,
} from "@/types/electronic-delivery";
import type { DeliveryReport } from "@/lib/electronic-delivery";

interface ElectronicDeliveryExportProps {
  projectId: string;
  photos: ProjectPhoto[];
  projectInfo?: {
    constructionName: string;
    contractorName: string;
    ordererName?: string;
    startDate?: string;
    endDate?: string;
  };
  /** 写真URLからBase64データを取得する関数 */
  getPhotoData?: (photoUrl: string) => Promise<string>;
  onExportComplete?: (result: ExportResult) => void;
  onCancel?: () => void;
}

interface ExportFormState {
  outputFormat: "zip" | "folder" | "preview";
  standardVersion: string;
  constructionName: string;
  contractorName: string;
  ordererName: string;
  startDate: string;
  endDate: string;
  selectedPhotoIds: string[];
  jpegQuality: number;
  compressionEnabled: boolean;
  includeReport: boolean;
}

interface ExportPreviewData {
  folderStructure: {
    rootFolderName: string;
    picFolderPath: string;
    draFolderPath?: string;
    photoFiles: Array<{
      deliveryFileName: string;
      originalFileName: string;
    }>;
  };
  photoXml: string;
  indexDXml: string;
  validationResult: ValidationResult;
  validationReport: string;
  deliveryReport?: DeliveryReport;
  reportText?: string;
}

const STANDARD_VERSIONS = [
  { value: "令和5年3月", label: "令和5年3月版" },
  { value: "令和4年3月", label: "令和4年3月版" },
];

export function ElectronicDeliveryExport({
  projectId,
  photos,
  projectInfo,
  getPhotoData,
  onExportComplete,
  onCancel,
}: ElectronicDeliveryExportProps) {
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
    includeReport: true,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [previewData, setPreviewData] = useState<ExportPreviewData | null>(null);
  const [activeTab, setActiveTab] = useState<"settings" | "preview" | "report">("settings");

  const handleInputChange = useCallback(
    (field: keyof ExportFormState, value: string | number | boolean | string[]) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

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

  const handleSelectAll = useCallback(
    (selectAll: boolean) => {
      setFormState((prev) => ({
        ...prev,
        selectedPhotoIds: selectAll ? photos.map((p) => p.id) : [],
      }));
    },
    [photos]
  );

  /** プレビューを生成する */
  const handlePreview = useCallback(async () => {
    setIsExporting(true);
    setError(null);

    try {
      const metadata: ExportMetadata = {
        constructionName: formState.constructionName,
        contractorName: formState.contractorName,
        ordererName: formState.ordererName || undefined,
        constructionStartDate: formState.startDate || undefined,
        constructionEndDate: formState.endDate || undefined,
      };

      const selectedPhotos = photos.filter((p) =>
        formState.selectedPhotoIds.includes(p.id)
      );

      const response = await fetch(
        `/api/projects/${projectId}/export/electronic-delivery`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            config: {
              outputFormat: "preview",
              standardVersion: formState.standardVersion,
              includeReport: true,
            },
            metadata,
            photos: selectedPhotos,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "プレビュー生成に失敗しました");
      }

      setPreviewData(data.data);
      setActiveTab("preview");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "プレビュー生成中にエラーが発生しました";
      setError(errorMessage);
    } finally {
      setIsExporting(false);
    }
  }, [formState, projectId, photos]);

  /** ZIPエクスポートを実行する */
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

      const selectedPhotos = photos.filter((p) =>
        formState.selectedPhotoIds.includes(p.id)
      );

      // 写真データを収集（ZIPエクスポート用）
      let photoData: Record<string, string> | undefined;

      if (formState.outputFormat === "zip" && getPhotoData) {
        setProgress((prev) => prev ? {
          ...prev,
          currentStep: "copying-photos",
          completedSteps: 1,
          progressPercent: 16,
        } : null);

        photoData = {};
        for (let i = 0; i < selectedPhotos.length; i++) {
          const photo = selectedPhotos[i];
          try {
            const base64 = await getPhotoData(photo.filePath);
            photoData[photo.fileName] = base64;
          } catch (e) {
            console.warn(`Failed to load photo: ${photo.fileName}`, e);
          }

          setProgress((prev) => prev ? {
            ...prev,
            processedFiles: i + 1,
            progressPercent: Math.round(16 + (i + 1) / selectedPhotos.length * 34),
          } : null);
        }
      }

      setProgress((prev) => prev ? {
        ...prev,
        currentStep: "generating-xml",
        completedSteps: 3,
        progressPercent: 50,
      } : null);

      const response = await fetch(
        `/api/projects/${projectId}/export/electronic-delivery`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            config: {
              outputFormat: formState.outputFormat,
              standardVersion: formState.standardVersion,
              photoQuality: {
                jpegQuality: formState.jpegQuality,
                compressionEnabled: formState.compressionEnabled,
              },
              photoIds: formState.selectedPhotoIds.length === photos.length
                ? undefined
                : formState.selectedPhotoIds,
              includeReport: formState.includeReport,
            },
            metadata,
            photos: selectedPhotos,
            photoData,
          }),
        }
      );

      // ZIPダウンロードの場合
      if (formState.outputFormat === "zip" && response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType === "application/zip") {
          const blob = await response.blob();
          const fileName = response.headers.get("content-disposition")
            ?.match(/filename="(.+)"/)?.[1] || `electronic_delivery_${projectId}.zip`;

          // ダウンロードを開始
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          const exportResult: ExportResult = {
            success: true,
            fileSize: blob.size,
            processingTimeMs: parseInt(
              response.headers.get("x-processing-time-ms") || "0"
            ),
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
          return;
        }
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "エクスポートに失敗しました");
      }

      const exportResult: ExportResult = {
        success: true,
        validationResult: data.data.validationResult,
        processingTimeMs: data.processingTimeMs,
      };

      setResult(exportResult);
      setPreviewData(data.data);
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
  }, [formState, projectId, photos, getPhotoData, onExportComplete]);

  const getProgressText = (step: ExportProgress["currentStep"]): string => {
    const texts: Record<ExportProgress["currentStep"], string> = {
      preparing: "準備中...",
      "creating-folders": "フォルダ構成を作成中...",
      "copying-photos": "写真を読み込み中...",
      "generating-xml": "XMLを生成中...",
      validating: "検証中...",
      "creating-archive": "アーカイブを作成中...",
      completed: "完了",
      failed: "失敗",
    };
    return texts[step] || step;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const base = 1024;
    const unitIndex = Math.floor(Math.log(bytes) / Math.log(base));
    const size = bytes / Math.pow(base, unitIndex);
    return `${size.toFixed(unitIndex > 0 ? 2 : 0)} ${units[unitIndex]}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white dark:bg-zinc-900 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">
        電子納品エクスポート
      </h2>

      {/* タブナビゲーション */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-700 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 font-medium ${
            activeTab === "settings"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          設定
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={`px-4 py-2 font-medium ${
            activeTab === "preview"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
          disabled={!previewData}
        >
          プレビュー
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("report")}
          className={`px-4 py-2 font-medium ${
            activeTab === "report"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
          disabled={!previewData?.deliveryReport}
        >
          レポート
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

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
              style={{ width: progress.progressPercent + "%" }}
            />
          </div>
          {progress.currentStep === "copying-photos" && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {progress.processedFiles}/{progress.totalFiles} ファイル処理中
            </p>
          )}
        </div>
      )}

      {result?.success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-green-700 dark:text-green-300">
            エクスポートが完了しました
            {result.fileSize && ` (ファイルサイズ: ${formatFileSize(result.fileSize)})`}
            （処理時間: {result.processingTimeMs}ms）
          </p>
        </div>
      )}

      {/* 設定タブ */}
      {activeTab === "settings" && (
        <div className="space-y-6">
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
                    handleInputChange("outputFormat", e.target.value as "zip" | "folder" | "preview")
                  }
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  disabled={isExporting}
                >
                  <option value="zip">ZIP形式（ダウンロード）</option>
                  <option value="preview">プレビュー（確認のみ）</option>
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
                  onChange={(e) =>
                    handleInputChange("endDate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  disabled={isExporting}
                />
              </div>
            </div>
          </section>

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

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formState.includeReport}
                onChange={(e) =>
                  handleInputChange("includeReport", e.target.checked)
                }
                disabled={isExporting}
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                納品レポートを含める
              </span>
            </label>
          </div>
        </div>
      )}

      {/* プレビュータブ */}
      {activeTab === "preview" && previewData && (
        <div className="space-y-6">
          {/* フォルダ構造 */}
          <section>
            <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-200">
              フォルダ構造
            </h3>
            <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-md font-mono text-sm">
              <div>{previewData.folderStructure.rootFolderName}/</div>
              <div className="ml-4">INDEX_D.XML</div>
              <div className="ml-4">PHOTO.XML</div>
              <div className="ml-4">PIC/</div>
              {previewData.folderStructure.photoFiles.slice(0, 5).map((file, i) => (
                <div key={i} className="ml-8 text-zinc-600 dark:text-zinc-400">
                  {file.deliveryFileName}
                </div>
              ))}
              {previewData.folderStructure.photoFiles.length > 5 && (
                <div className="ml-8 text-zinc-500">
                  ... 他 {previewData.folderStructure.photoFiles.length - 5} ファイル
                </div>
              )}
            </div>
          </section>

          {/* バリデーション結果 */}
          <section>
            <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-200">
              検証結果
            </h3>
            <div className={`p-4 rounded-md ${
              previewData.validationResult.isValid
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            }`}>
              <p className={previewData.validationResult.isValid
                ? "text-green-700 dark:text-green-300"
                : "text-red-700 dark:text-red-300"
              }>
                {previewData.validationResult.isValid ? "検証に合格しました" : "検証エラーがあります"}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                エラー: {previewData.validationResult.errors.length}件 /
                警告: {previewData.validationResult.warnings.length}件
              </p>
            </div>

            {previewData.validationResult.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">エラー</h4>
                <ul className="space-y-1">
                  {previewData.validationResult.errors.map((err, i) => (
                    <li key={i} className="text-sm text-red-600 dark:text-red-400">
                      [{err.code}] {err.message}
                      {err.targetFile && ` (${err.targetFile})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {previewData.validationResult.warnings.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-yellow-700 dark:text-yellow-300 mb-2">警告</h4>
                <ul className="space-y-1">
                  {previewData.validationResult.warnings.map((warn, i) => (
                    <li key={i} className="text-sm text-yellow-600 dark:text-yellow-400">
                      [{warn.code}] {warn.message}
                      {warn.targetFile && ` (${warn.targetFile})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* XMLプレビュー */}
          <section>
            <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-200">
              PHOTO.XML プレビュー
            </h3>
            <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-md overflow-x-auto">
              <pre className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {previewData.photoXml.slice(0, 2000)}
                {previewData.photoXml.length > 2000 && "\n... (省略)"}
              </pre>
            </div>
          </section>
        </div>
      )}

      {/* レポートタブ */}
      {activeTab === "report" && previewData?.reportText && (
        <div className="space-y-4">
          <section>
            <h3 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-200">
              納品レポート
            </h3>
            <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-md overflow-x-auto">
              <pre className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-mono">
                {previewData.reportText}
              </pre>
            </div>
          </section>
        </div>
      )}

      {/* アクションボタン */}
      <div className="flex justify-end space-x-4 pt-4 border-t border-zinc-200 dark:border-zinc-700 mt-6">
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
          onClick={handlePreview}
          disabled={
            isExporting ||
            formState.selectedPhotoIds.length === 0 ||
            !formState.constructionName ||
            !formState.contractorName
          }
          className="px-6 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          プレビュー
        </button>
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
  );
}

export default ElectronicDeliveryExport;
