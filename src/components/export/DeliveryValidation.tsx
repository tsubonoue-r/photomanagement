"use client";

/**
 * 納品物検証UIコンポーネント
 * 電子納品データの検証結果を表示
 */

import React, { useState, useCallback } from "react";
import type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ProjectPhoto,
} from "@/types/electronic-delivery";

/**
 * 検証UIのProps
 */
interface DeliveryValidationProps {
  /** プロジェクトID */
  projectId: string;
  /** プロジェクト写真一覧 */
  photos: ProjectPhoto[];
  /** 検証完了時のコールバック */
  onValidationComplete?: (result: ValidationResult) => void;
}

/**
 * 検証ステータス
 */
type ValidationStatus = "idle" | "validating" | "completed" | "failed";

/**
 * エラー/警告アイコンコンポーネント
 */
function ErrorIcon() {
  return (
    <svg
      className="w-5 h-5 text-red-500"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      className="w-5 h-5 text-yellow-500"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SuccessIcon() {
  return (
    <svg
      className="w-5 h-5 text-green-500"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * 納品物検証コンポーネント
 */
export function DeliveryValidation({
  projectId,
  photos,
  onValidationComplete,
}: DeliveryValidationProps) {
  const [status, setStatus] = useState<ValidationStatus>("idle");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{
    errors: boolean;
    warnings: boolean;
  }>({
    errors: true,
    warnings: true,
  });

  /**
   * 検証実行
   */
  const handleValidate = useCallback(async () => {
    setStatus("validating");
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/export/electronic-delivery`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ photos }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "検証に失敗しました");
      }

      const validationResult = data.data.validationResult as ValidationResult;
      setResult(validationResult);
      setStatus("completed");

      if (onValidationComplete) {
        onValidationComplete(validationResult);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "検証中にエラーが発生しました";
      setError(errorMessage);
      setStatus("failed");
    }
  }, [projectId, photos, onValidationComplete]);

  /**
   * セクション展開/折りたたみ
   */
  const toggleSection = (section: "errors" | "warnings") => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  /**
   * エラー/警告の件数サマリー
   */
  const getSummaryText = (): string => {
    if (!result) return "";
    const errorCount = result.errors.length;
    const warningCount = result.warnings.length;
    if (result.isValid && warningCount === 0) {
      return "全ての検証に合格しました";
    }
    const parts: string[] = [];
    if (errorCount > 0) {
      parts.push(`エラー ${errorCount}件`);
    }
    if (warningCount > 0) {
      parts.push(`警告 ${warningCount}件`);
    }
    return parts.join("、");
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white dark:bg-zinc-900 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">
        納品物検証
      </h2>

      {/* 検証ボタン */}
      <div className="mb-6">
        <button
          onClick={handleValidate}
          disabled={status === "validating" || photos.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "validating" ? "検証中..." : "検証を実行"}
        </button>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          写真数: {photos.length}件
        </p>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-center">
            <ErrorIcon />
            <p className="ml-2 text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* 検証結果 */}
      {result && (
        <div className="space-y-6">
          {/* サマリー */}
          <div
            className={`p-4 rounded-md border ${
              result.isValid
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            }`}
          >
            <div className="flex items-center">
              {result.isValid ? <SuccessIcon /> : <ErrorIcon />}
              <div className="ml-3">
                <h3
                  className={`text-lg font-semibold ${
                    result.isValid
                      ? "text-green-700 dark:text-green-300"
                      : "text-red-700 dark:text-red-300"
                  }`}
                >
                  {result.isValid ? "検証合格" : "検証不合格"}
                </h3>
                <p
                  className={`text-sm ${
                    result.isValid
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {getSummaryText()}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              検証日時: {new Date(result.validatedAt).toLocaleString("ja-JP")}
            </p>
          </div>

          {/* エラー一覧 */}
          {result.errors.length > 0 && (
            <div className="border border-red-200 dark:border-red-800 rounded-md overflow-hidden">
              <button
                onClick={() => toggleSection("errors")}
                className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30"
              >
                <div className="flex items-center">
                  <ErrorIcon />
                  <span className="ml-2 font-semibold text-red-700 dark:text-red-300">
                    エラー ({result.errors.length}件)
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 text-red-500 transition-transform ${
                    expandedSections.errors ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {expandedSections.errors && (
                <ul className="divide-y divide-red-100 dark:divide-red-800">
                  {result.errors.map((err: ValidationError, index: number) => (
                    <ValidationErrorItem key={index} error={err} />
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* 警告一覧 */}
          {result.warnings.length > 0 && (
            <div className="border border-yellow-200 dark:border-yellow-800 rounded-md overflow-hidden">
              <button
                onClick={() => toggleSection("warnings")}
                className="w-full flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
              >
                <div className="flex items-center">
                  <WarningIcon />
                  <span className="ml-2 font-semibold text-yellow-700 dark:text-yellow-300">
                    警告 ({result.warnings.length}件)
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 text-yellow-500 transition-transform ${
                    expandedSections.warnings ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {expandedSections.warnings && (
                <ul className="divide-y divide-yellow-100 dark:divide-yellow-800">
                  {result.warnings.map((warning: ValidationWarning, index: number) => (
                    <ValidationWarningItem key={index} warning={warning} />
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* 全て合格の場合 */}
          {result.isValid && result.warnings.length === 0 && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <div className="flex items-center">
                <SuccessIcon />
                <p className="ml-2 text-green-700 dark:text-green-300">
                  全ての検証項目に合格しました。電子納品データとして出力可能です。
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 検証対象がない場合 */}
      {photos.length === 0 && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md">
          <p className="text-zinc-500 dark:text-zinc-400 text-center">
            検証対象の写真がありません
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * エラー項目コンポーネント
 */
function ValidationErrorItem({ error }: { error: ValidationError }) {
  return (
    <li className="p-4 bg-white dark:bg-zinc-900">
      <div className="flex items-start">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
          {error.code}
        </span>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {error.message}
          </p>
          {error.targetFile && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              ファイル: {error.targetFile}
            </p>
          )}
          {error.targetField && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              項目: {error.targetField}
            </p>
          )}
          {error.details && (
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
              {error.details}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

/**
 * 警告項目コンポーネント
 */
function ValidationWarningItem({ warning }: { warning: ValidationWarning }) {
  return (
    <li className="p-4 bg-white dark:bg-zinc-900">
      <div className="flex items-start">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
          {warning.code}
        </span>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {warning.message}
          </p>
          {warning.targetFile && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              ファイル: {warning.targetFile}
            </p>
          )}
          {warning.details && (
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
              {warning.details}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

export default DeliveryValidation;
