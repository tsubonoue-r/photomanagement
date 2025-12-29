/**
 * 電子納品コアモジュール
 * 国土交通省 デジタル写真管理情報基準 準拠
 */

export type {
  PhotoCategory,
  PhotoMajorCategory,
  PhotoFileFormat,
  DrawingFileFormat,
  PhotoInfoFile,
  PhotoCommonInfo,
  PhotoInfo,
  PhotoLocation,
  ElectronicDeliveryFolder,
  PhotoFileEntry,
  DrawingFileEntry,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationRule,
  ExportConfig,
  PhotoQualityConfig,
  ExportMetadata,
  ExportProgress,
  ExportStep,
  ExportResult,
  ProjectPhoto,
  Project,
} from "@/types/electronic-delivery";

export {
  generatePhotoFileName,
  generateDrawingFileName,
  extractSequenceNumber,
  isValidPhotoFileName,
  isValidDrawingFileName,
  isValidDeliveryFileName,
  normalizeExtension,
  getExtension,
  isSupportedExtension,
  isSupportedPhotoExtension,
  isSupportedDrawingExtension,
  FileNameGenerator,
} from "./file-naming";

export {
  FOLDER_NAMES,
  generateFolderPaths,
  generateFolderStructure,
  convertToPhotoInfo,
  validateFolderStructure,
  getFolderTreeString,
} from "./folder-structure";
export type { FolderStructureOptions, FolderPaths } from "./folder-structure";

export {
  generatePhotoXml,
  buildPhotoInfoFile,
  serializeToXml,
  parsePhotoXml,
  isValidPhotoXml,
} from "./photo-xml";
export type { XmlGeneratorConfig } from "./photo-xml";

export {
  generateIndexDXml,
  buildIndexDInfo,
  serializeIndexDToXml,
  isValidIndexDXml,
} from "./index-xml";
export type { IndexDInfo, IndexDGeneratorConfig } from "./index-xml";

export {
  ERROR_CODES,
  WARNING_CODES,
  DeliveryValidator,
  formatValidationResult,
  formatValidationResultAsJson,
} from "./validator";
export type { ValidatorConfig } from "./validator";

export {
  createDeliveryArchive,
  createZipArchive,
  createZipArchiveStream,
  getDirectoryEntries,
  getArchiveFileList,
  estimateArchiveSize,
} from "./archive";
export type {
  ArchiveConfig,
  ArchiveProgress,
  ArchiveResult,
  FileInput,
} from "./archive";

export {
  generateDeliveryReport,
  formatReportAsText,
  formatReportAsJson,
  formatPhotoListAsCsv,
} from "./report";
export type {
  DeliveryReport,
  ConstructionInfo,
  FileStatistics,
  FolderStructureInfo,
  FileInfo,
  ValidationSummary,
  PhotoListItem,
} from "./report";

import type {
  ProjectPhoto,
  ExportConfig,
  ExportResult,
  ExportProgress,
  ExportMetadata,
  ElectronicDeliveryFolder,
  ValidationResult,
} from "@/types/electronic-delivery";
import { generateFolderStructure } from "./folder-structure";
import { generatePhotoXml } from "./photo-xml";
import { generateIndexDXml } from "./index-xml";
import { DeliveryValidator, formatValidationResult } from "./validator";
import { createDeliveryArchive, type ArchiveResult } from "./archive";
import { generateDeliveryReport, formatReportAsText, type DeliveryReport } from "./report";

/**
 * 電子納品エクスポーター
 * 写真データを電子納品形式に変換し、ZIPアーカイブを生成します。
 */
export class ElectronicDeliveryExporter {
  private validator: DeliveryValidator;
  private progressCallback?: (progress: ExportProgress) => void;

  constructor() {
    this.validator = new DeliveryValidator();
  }

  /**
   * 進捗コールバックを設定する
   * @param callback 進捗コールバック関数
   */
  onProgress(callback: (progress: ExportProgress) => void): void {
    this.progressCallback = callback;
  }

  /**
   * 電子納品エクスポートを実行する
   * @param photos 写真データ配列
   * @param config エクスポート設定
   * @param fileContents ファイル内容のマップ (オプション)
   * @returns エクスポート結果
   */
  async export(
    photos: ProjectPhoto[],
    config: ExportConfig,
    fileContents?: Map<string, Buffer>
  ): Promise<ExportResult> {
    const startTime = Date.now();

    try {
      this.updateProgress({
        currentStep: "preparing",
        totalSteps: 6,
        completedSteps: 0,
        progressPercent: 0,
        processedFiles: 0,
        totalFiles: photos.length,
      });

      const targetPhotos = config.photoIds
        ? photos.filter((p) => config.photoIds!.includes(p.id))
        : photos;

      if (targetPhotos.length === 0) {
        return {
          success: false,
          error: "エクスポート対象の写真がありません",
          processingTimeMs: Date.now() - startTime,
        };
      }

      this.updateProgress({
        currentStep: "creating-folders",
        totalSteps: 6,
        completedSteps: 1,
        progressPercent: 16,
        processedFiles: 0,
        totalFiles: targetPhotos.length,
      });

      const folder = generateFolderStructure(targetPhotos);

      this.updateProgress({
        currentStep: "copying-photos",
        totalSteps: 6,
        completedSteps: 2,
        progressPercent: 33,
        processedFiles: 0,
        totalFiles: targetPhotos.length,
      });

      this.updateProgress({
        currentStep: "generating-xml",
        totalSteps: 6,
        completedSteps: 3,
        progressPercent: 50,
        processedFiles: targetPhotos.length,
        totalFiles: targetPhotos.length,
      });

      // PHOTO.XMLとINDEX_D.XMLを生成
      generatePhotoXml(folder, config.metadata);
      generateIndexDXml(config.metadata);

      this.updateProgress({
        currentStep: "validating",
        totalSteps: 6,
        completedSteps: 4,
        progressPercent: 66,
        processedFiles: targetPhotos.length,
        totalFiles: targetPhotos.length,
      });

      const validationResult = this.validator.validate(folder);

      if (!validationResult.isValid) {
        return {
          success: false,
          error: "検証エラーが発生しました",
          validationResult,
          processingTimeMs: Date.now() - startTime,
        };
      }

      this.updateProgress({
        currentStep: "creating-archive",
        totalSteps: 6,
        completedSteps: 5,
        progressPercent: 83,
        processedFiles: targetPhotos.length,
        totalFiles: targetPhotos.length,
      });

      // ZIPアーカイブを生成
      let archiveResult: ArchiveResult | undefined;
      if (config.outputFormat === "zip" && fileContents) {
        archiveResult = await createDeliveryArchive(
          folder,
          config.metadata,
          fileContents
        );

        if (!archiveResult.success) {
          return {
            success: false,
            error: archiveResult.error || "アーカイブ生成に失敗しました",
            validationResult,
            processingTimeMs: Date.now() - startTime,
          };
        }
      }

      this.updateProgress({
        currentStep: "completed",
        totalSteps: 6,
        completedSteps: 6,
        progressPercent: 100,
        processedFiles: targetPhotos.length,
        totalFiles: targetPhotos.length,
      });

      return {
        success: true,
        fileSize: archiveResult?.fileSize,
        validationResult,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      this.updateProgress({
        currentStep: "failed",
        totalSteps: 6,
        completedSteps: 0,
        progressPercent: 0,
        processedFiles: 0,
        totalFiles: photos.length,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "不明なエラー",
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * ZIPアーカイブを生成して返す
   * @param photos 写真データ配列
   * @param config エクスポート設定
   * @param fileContents ファイル内容のマップ
   * @returns ZIPアーカイブのBuffer
   */
  async exportToZip(
    photos: ProjectPhoto[],
    config: ExportConfig,
    fileContents: Map<string, Buffer>
  ): Promise<{ buffer: Buffer; result: ExportResult }> {
    const startTime = Date.now();

    const targetPhotos = config.photoIds
      ? photos.filter((p) => config.photoIds!.includes(p.id))
      : photos;

    if (targetPhotos.length === 0) {
      throw new Error("エクスポート対象の写真がありません");
    }

    const folder = generateFolderStructure(targetPhotos);
    const validationResult = this.validator.validate(folder);

    if (!validationResult.isValid) {
      throw new Error("検証エラー: " + validationResult.errors.map(e => e.message).join(", "));
    }

    const archiveResult = await createDeliveryArchive(
      folder,
      config.metadata,
      fileContents
    );

    if (!archiveResult.success || !archiveResult.buffer) {
      throw new Error(archiveResult.error || "アーカイブ生成に失敗しました");
    }

    return {
      buffer: archiveResult.buffer,
      result: {
        success: true,
        fileSize: archiveResult.fileSize,
        validationResult,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  /**
   * フォルダ構造を生成する
   * @param photos 写真データ配列
   * @returns 電子納品フォルダ構造
   */
  generateFolder(photos: ProjectPhoto[]): ElectronicDeliveryFolder {
    return generateFolderStructure(photos);
  }

  /**
   * PHOTO.XMLを生成する
   * @param folder 電子納品フォルダ構造
   * @param metadata エクスポートメタデータ
   * @returns XML文字列
   */
  generatePhotoXml(folder: ElectronicDeliveryFolder, metadata: ExportMetadata): string {
    return generatePhotoXml(folder, metadata);
  }

  /**
   * INDEX_D.XMLを生成する
   * @param metadata エクスポートメタデータ
   * @returns XML文字列
   */
  generateIndexDXml(metadata: ExportMetadata): string {
    return generateIndexDXml(metadata);
  }

  /**
   * バリデーションを実行する
   * @param folder 電子納品フォルダ構造
   * @returns バリデーション結果（テキスト形式）
   */
  validate(folder: ElectronicDeliveryFolder): string {
    const result = this.validator.validate(folder);
    return formatValidationResult(result);
  }

  /**
   * バリデーション結果オブジェクトを取得する
   * @param folder 電子納品フォルダ構造
   * @returns バリデーション結果
   */
  validateWithResult(folder: ElectronicDeliveryFolder): ValidationResult {
    return this.validator.validate(folder);
  }

  /**
   * 納品レポートを生成する
   * @param folder 電子納品フォルダ構造
   * @param metadata エクスポートメタデータ
   * @param validationResult バリデーション結果（オプション）
   * @returns 納品レポート
   */
  generateReport(
    folder: ElectronicDeliveryFolder,
    metadata: ExportMetadata,
    validationResult?: ValidationResult
  ): DeliveryReport {
    return generateDeliveryReport(folder, metadata, validationResult);
  }

  /**
   * 納品レポートをテキスト形式で取得する
   * @param folder 電子納品フォルダ構造
   * @param metadata エクスポートメタデータ
   * @param validationResult バリデーション結果（オプション）
   * @returns テキスト形式のレポート
   */
  getReportText(
    folder: ElectronicDeliveryFolder,
    metadata: ExportMetadata,
    validationResult?: ValidationResult
  ): string {
    const report = this.generateReport(folder, metadata, validationResult);
    return formatReportAsText(report);
  }

  /**
   * 進捗を更新する
   * @param progress 進捗情報
   */
  private updateProgress(progress: ExportProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }
}

/**
 * デフォルトのエクスポーターインスタンス
 */
export const defaultExporter = new ElectronicDeliveryExporter();
