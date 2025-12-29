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
  ERROR_CODES,
  WARNING_CODES,
  DeliveryValidator,
  formatValidationResult,
  formatValidationResultAsJson,
} from "./validator";
export type { ValidatorConfig } from "./validator";

import type {
  ProjectPhoto,
  ExportConfig,
  ExportResult,
  ExportProgress,
  ExportMetadata,
  ElectronicDeliveryFolder,
} from "@/types/electronic-delivery";
import { generateFolderStructure } from "./folder-structure";
import { generatePhotoXml } from "./photo-xml";
import { DeliveryValidator, formatValidationResult } from "./validator";

export class ElectronicDeliveryExporter {
  private validator: DeliveryValidator;
  private progressCallback?: (progress: ExportProgress) => void;

  constructor() {
    this.validator = new DeliveryValidator();
  }

  onProgress(callback: (progress: ExportProgress) => void): void {
    this.progressCallback = callback;
  }

  async export(
    photos: ProjectPhoto[],
    config: ExportConfig
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

      generatePhotoXml(folder, config.metadata);

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

  generateFolder(photos: ProjectPhoto[]): ElectronicDeliveryFolder {
    return generateFolderStructure(photos);
  }

  generateXml(folder: ElectronicDeliveryFolder, metadata: ExportMetadata): string {
    return generatePhotoXml(folder, metadata);
  }

  validate(folder: ElectronicDeliveryFolder): string {
    const result = this.validator.validate(folder);
    return formatValidationResult(result);
  }

  private updateProgress(progress: ExportProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }
}

export const defaultExporter = new ElectronicDeliveryExporter();
