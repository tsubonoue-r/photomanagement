/**
 * 納品レポート生成モジュール
 * 国土交通省 デジタル写真管理情報基準 準拠
 *
 * 電子納品の内容を確認するためのレポートを生成します。
 */

import type {
  ElectronicDeliveryFolder,
  ExportMetadata,
  ValidationResult,
} from "@/types/electronic-delivery";
import { FOLDER_NAMES } from "./folder-structure";

/**
 * 納品レポート情報
 */
export interface DeliveryReport {
  /** レポート生成日時 */
  generatedAt: string;
  /** 工事情報 */
  constructionInfo: ConstructionInfo;
  /** ファイル統計 */
  fileStatistics: FileStatistics;
  /** フォルダ構造 */
  folderStructure: FolderStructureInfo;
  /** 検証結果 */
  validationSummary?: ValidationSummary;
  /** 写真一覧 */
  photoList: PhotoListItem[];
}

/**
 * 工事情報
 */
export interface ConstructionInfo {
  /** 工事件名 */
  constructionName: string;
  /** 受注者名 */
  contractorName: string;
  /** 発注者名 */
  ordererName?: string;
  /** 工期開始日 */
  startDate?: string;
  /** 工期終了日 */
  endDate?: string;
}

/**
 * ファイル統計
 */
export interface FileStatistics {
  /** 総ファイル数 */
  totalFiles: number;
  /** 写真ファイル数 */
  photoCount: number;
  /** 参考図ファイル数 */
  drawingCount: number;
  /** XMLファイル数 */
  xmlCount: number;
  /** 総ファイルサイズ (バイト) */
  totalSize: number;
  /** 総ファイルサイズ (フォーマット済み) */
  totalSizeFormatted: string;
  /** 代表写真数 */
  representativePhotoCount: number;
}

/**
 * フォルダ構造情報
 */
export interface FolderStructureInfo {
  /** ルートフォルダ名 */
  rootFolder: string;
  /** フォルダ一覧 */
  folders: string[];
  /** ファイル一覧 */
  files: FileInfo[];
}

/**
 * ファイル情報
 */
export interface FileInfo {
  /** ファイルパス */
  path: string;
  /** ファイル名 */
  name: string;
  /** ファイルサイズ */
  size: number;
  /** ファイルサイズ (フォーマット済み) */
  sizeFormatted: string;
}

/**
 * 検証結果サマリー
 */
export interface ValidationSummary {
  /** 検証結果 */
  isValid: boolean;
  /** エラー数 */
  errorCount: number;
  /** 警告数 */
  warningCount: number;
  /** エラーメッセージ一覧 */
  errors: string[];
  /** 警告メッセージ一覧 */
  warnings: string[];
}

/**
 * 写真一覧項目
 */
export interface PhotoListItem {
  /** 写真番号 */
  number: number;
  /** 納品ファイル名 */
  deliveryFileName: string;
  /** 元ファイル名 */
  originalFileName: string;
  /** 写真タイトル */
  title: string;
  /** 写真大分類 */
  majorCategory: string;
  /** 写真区分 */
  category: string;
  /** 撮影日 */
  shootingDate: string;
  /** 撮影箇所 */
  shootingLocation?: string;
  /** 代表写真フラグ */
  isRepresentative: boolean;
  /** ファイルサイズ */
  fileSize: number;
  /** ファイルサイズ (フォーマット済み) */
  fileSizeFormatted: string;
}

/**
 * 納品レポートを生成する
 * @param folder 電子納品フォルダ構造
 * @param metadata エクスポートメタデータ
 * @param validationResult 検証結果 (オプション)
 * @returns 納品レポート
 */
export function generateDeliveryReport(
  folder: ElectronicDeliveryFolder,
  metadata: ExportMetadata,
  validationResult?: ValidationResult
): DeliveryReport {
  const photoList = generatePhotoList(folder);
  const fileStatistics = calculateFileStatistics(folder);
  const folderStructure = generateFolderStructureInfo(folder);

  return {
    generatedAt: new Date().toISOString(),
    constructionInfo: {
      constructionName: metadata.constructionName,
      contractorName: metadata.contractorName,
      ordererName: metadata.ordererName,
      startDate: metadata.constructionStartDate,
      endDate: metadata.constructionEndDate,
    },
    fileStatistics,
    folderStructure,
    validationSummary: validationResult
      ? generateValidationSummary(validationResult)
      : undefined,
    photoList,
  };
}

/**
 * 写真一覧を生成する
 * @param folder 電子納品フォルダ構造
 * @returns 写真一覧項目の配列
 */
function generatePhotoList(folder: ElectronicDeliveryFolder): PhotoListItem[] {
  return folder.photoFiles.map((file) => ({
    number: file.photoInfo.photoNumber,
    deliveryFileName: file.deliveryFileName,
    originalFileName: file.originalFileName,
    title: file.photoInfo.photoTitle,
    majorCategory: file.photoInfo.photoMajorCategory,
    category: file.photoInfo.photoCategory,
    shootingDate: file.photoInfo.shootingDate,
    shootingLocation: file.photoInfo.shootingLocation,
    isRepresentative: file.photoInfo.isRepresentativePhoto,
    fileSize: file.fileSize,
    fileSizeFormatted: formatFileSize(file.fileSize),
  }));
}

/**
 * ファイル統計を計算する
 * @param folder 電子納品フォルダ構造
 * @returns ファイル統計
 */
function calculateFileStatistics(folder: ElectronicDeliveryFolder): FileStatistics {
  const photoCount = folder.photoFiles.length;
  const drawingCount = folder.drawingFiles.length;
  const xmlCount = 2; // PHOTO.XML + INDEX_D.XML

  const totalSize =
    folder.photoFiles.reduce((sum, f) => sum + f.fileSize, 0) +
    folder.drawingFiles.reduce((sum, f) => sum + f.fileSize, 0);

  const representativePhotoCount = folder.photoFiles.filter(
    (f) => f.photoInfo.isRepresentativePhoto
  ).length;

  return {
    totalFiles: photoCount + drawingCount + xmlCount,
    photoCount,
    drawingCount,
    xmlCount,
    totalSize,
    totalSizeFormatted: formatFileSize(totalSize),
    representativePhotoCount,
  };
}

/**
 * フォルダ構造情報を生成する
 * @param folder 電子納品フォルダ構造
 * @returns フォルダ構造情報
 */
function generateFolderStructureInfo(
  folder: ElectronicDeliveryFolder
): FolderStructureInfo {
  const folders: string[] = [
    folder.rootFolderName,
    `${folder.rootFolderName}/${FOLDER_NAMES.PIC}`,
  ];

  if (folder.draFolderPath) {
    folders.push(`${folder.rootFolderName}/${FOLDER_NAMES.DRA}`);
  }

  const files: FileInfo[] = [];

  // INDEX_D.XML
  files.push({
    path: "INDEX_D.XML",
    name: "INDEX_D.XML",
    size: 0, // サイズは生成時に計算
    sizeFormatted: "-",
  });

  // PHOTO.XML
  files.push({
    path: `${folder.rootFolderName}/${FOLDER_NAMES.PHOTO_XML}`,
    name: FOLDER_NAMES.PHOTO_XML,
    size: 0,
    sizeFormatted: "-",
  });

  // 写真ファイル
  for (const photoFile of folder.photoFiles) {
    files.push({
      path: `${folder.rootFolderName}/${FOLDER_NAMES.PIC}/${photoFile.deliveryFileName}`,
      name: photoFile.deliveryFileName,
      size: photoFile.fileSize,
      sizeFormatted: formatFileSize(photoFile.fileSize),
    });
  }

  // 参考図ファイル
  for (const drawingFile of folder.drawingFiles) {
    files.push({
      path: `${folder.rootFolderName}/${FOLDER_NAMES.DRA}/${drawingFile.deliveryFileName}`,
      name: drawingFile.deliveryFileName,
      size: drawingFile.fileSize,
      sizeFormatted: formatFileSize(drawingFile.fileSize),
    });
  }

  return {
    rootFolder: folder.rootFolderName,
    folders,
    files,
  };
}

/**
 * 検証結果サマリーを生成する
 * @param result 検証結果
 * @returns 検証結果サマリー
 */
function generateValidationSummary(result: ValidationResult): ValidationSummary {
  return {
    isValid: result.isValid,
    errorCount: result.errors.length,
    warningCount: result.warnings.length,
    errors: result.errors.map(
      (e) => `[${e.code}] ${e.message}${e.targetFile ? ` (${e.targetFile})` : ""}`
    ),
    warnings: result.warnings.map(
      (w) => `[${w.code}] ${w.message}${w.targetFile ? ` (${w.targetFile})` : ""}`
    ),
  };
}

/**
 * ファイルサイズをフォーマットする
 * @param bytes バイト数
 * @returns フォーマット済み文字列
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const base = 1024;
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(base));
  const size = bytes / Math.pow(base, unitIndex);

  return `${size.toFixed(unitIndex > 0 ? 2 : 0)} ${units[unitIndex]}`;
}

/**
 * 納品レポートをテキスト形式で出力する
 * @param report 納品レポート
 * @returns テキスト形式のレポート
 */
export function formatReportAsText(report: DeliveryReport): string {
  const lines: string[] = [];
  const divider = "=".repeat(70);
  const subDivider = "-".repeat(70);

  lines.push(divider);
  lines.push("電子納品レポート");
  lines.push(divider);
  lines.push("");

  // 生成日時
  lines.push(`生成日時: ${formatDateTime(report.generatedAt)}`);
  lines.push("");

  // 工事情報
  lines.push(subDivider);
  lines.push("工事情報");
  lines.push(subDivider);
  lines.push(`工事件名: ${report.constructionInfo.constructionName}`);
  lines.push(`受注者名: ${report.constructionInfo.contractorName}`);
  if (report.constructionInfo.ordererName) {
    lines.push(`発注者名: ${report.constructionInfo.ordererName}`);
  }
  if (report.constructionInfo.startDate) {
    lines.push(`工期開始日: ${report.constructionInfo.startDate}`);
  }
  if (report.constructionInfo.endDate) {
    lines.push(`工期終了日: ${report.constructionInfo.endDate}`);
  }
  lines.push("");

  // ファイル統計
  lines.push(subDivider);
  lines.push("ファイル統計");
  lines.push(subDivider);
  lines.push(`総ファイル数: ${report.fileStatistics.totalFiles}`);
  lines.push(`  - 写真ファイル: ${report.fileStatistics.photoCount}`);
  lines.push(`  - 参考図ファイル: ${report.fileStatistics.drawingCount}`);
  lines.push(`  - XMLファイル: ${report.fileStatistics.xmlCount}`);
  lines.push(`総ファイルサイズ: ${report.fileStatistics.totalSizeFormatted}`);
  lines.push(`代表写真数: ${report.fileStatistics.representativePhotoCount}`);
  lines.push("");

  // フォルダ構造
  lines.push(subDivider);
  lines.push("フォルダ構造");
  lines.push(subDivider);
  for (const folder of report.folderStructure.folders) {
    lines.push(`  ${folder}/`);
  }
  lines.push("");

  // 検証結果
  if (report.validationSummary) {
    lines.push(subDivider);
    lines.push("検証結果");
    lines.push(subDivider);
    lines.push(`結果: ${report.validationSummary.isValid ? "合格" : "不合格"}`);
    lines.push(`エラー: ${report.validationSummary.errorCount}件`);
    lines.push(`警告: ${report.validationSummary.warningCount}件`);

    if (report.validationSummary.errors.length > 0) {
      lines.push("");
      lines.push("エラー一覧:");
      for (const error of report.validationSummary.errors) {
        lines.push(`  - ${error}`);
      }
    }

    if (report.validationSummary.warnings.length > 0) {
      lines.push("");
      lines.push("警告一覧:");
      for (const warning of report.validationSummary.warnings) {
        lines.push(`  - ${warning}`);
      }
    }
    lines.push("");
  }

  // 写真一覧
  lines.push(subDivider);
  lines.push("写真一覧");
  lines.push(subDivider);
  lines.push("");
  lines.push(
    padRight("No.", 6) +
      padRight("ファイル名", 16) +
      padRight("タイトル", 30) +
      padRight("撮影日", 12) +
      "サイズ"
  );
  lines.push("-".repeat(80));

  for (const photo of report.photoList) {
    const representative = photo.isRepresentative ? "*" : " ";
    lines.push(
      padRight(`${photo.number}${representative}`, 6) +
        padRight(photo.deliveryFileName, 16) +
        padRight(truncate(photo.title, 28), 30) +
        padRight(photo.shootingDate, 12) +
        photo.fileSizeFormatted
    );
  }

  lines.push("");
  lines.push("* = 代表写真");
  lines.push("");
  lines.push(divider);

  return lines.join("\n");
}

/**
 * 納品レポートをJSON形式で出力する
 * @param report 納品レポート
 * @returns JSON文字列
 */
export function formatReportAsJson(report: DeliveryReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * 納品レポートをCSV形式で出力する (写真一覧)
 * @param report 納品レポート
 * @returns CSV文字列
 */
export function formatPhotoListAsCsv(report: DeliveryReport): string {
  const headers = [
    "番号",
    "納品ファイル名",
    "元ファイル名",
    "タイトル",
    "大分類",
    "区分",
    "撮影日",
    "撮影箇所",
    "代表写真",
    "ファイルサイズ",
  ];

  const rows = report.photoList.map((photo) => [
    String(photo.number),
    photo.deliveryFileName,
    photo.originalFileName,
    `"${photo.title.replace(/"/g, '""')}"`,
    photo.majorCategory,
    photo.category,
    photo.shootingDate,
    photo.shootingLocation || "",
    photo.isRepresentative ? "Yes" : "No",
    photo.fileSizeFormatted,
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

/**
 * 日時をフォーマットする
 * @param isoString ISO形式の日時文字列
 * @returns フォーマット済み文字列
 */
function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 文字列を右側にパディングする
 * @param str 文字列
 * @param length 目標の長さ
 * @returns パディング済み文字列
 */
function padRight(str: string, length: number): string {
  // 全角文字を考慮した長さ計算
  let displayLength = 0;
  for (const char of str) {
    displayLength += char.charCodeAt(0) > 255 ? 2 : 1;
  }
  const padding = Math.max(0, length - displayLength);
  return str + " ".repeat(padding);
}

/**
 * 文字列を切り詰める
 * @param str 文字列
 * @param maxLength 最大長
 * @returns 切り詰め済み文字列
 */
function truncate(str: string, maxLength: number): string {
  let displayLength = 0;
  let result = "";

  for (const char of str) {
    const charWidth = char.charCodeAt(0) > 255 ? 2 : 1;
    if (displayLength + charWidth > maxLength - 3) {
      return result + "...";
    }
    displayLength += charWidth;
    result += char;
  }

  return result;
}
