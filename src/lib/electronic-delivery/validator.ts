/**
 * 納品物検証モジュール
 * 国土交通省 デジタル写真管理情報基準 準拠
 */

import type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationRule,
  PhotoInfoFile,
  ElectronicDeliveryFolder,
} from "@/types/electronic-delivery";
import { isValidPhotoFileName, isValidDrawingFileName } from "./file-naming";
import { isValidPhotoXml } from "./photo-xml";

export const ERROR_CODES = {
  MISSING_ROOT_FOLDER: "E001",
  MISSING_PHOTO_XML: "E002",
  MISSING_PIC_FOLDER: "E003",
  EMPTY_PHOTO_LIST: "E004",
  INVALID_PHOTO_FILE_NAME: "E101",
  INVALID_DRAWING_FILE_NAME: "E102",
  DUPLICATE_FILE_NAME: "E103",
  NON_SEQUENTIAL_NUMBER: "E104",
  MISSING_PHOTO_TITLE: "E201",
  MISSING_SHOOTING_DATE: "E202",
  MISSING_PHOTO_CATEGORY: "E203",
  INVALID_DATE_FORMAT: "E204",
  INVALID_XML_STRUCTURE: "E301",
  XML_ENCODING_ERROR: "E302",
} as const;

export const WARNING_CODES = {
  MISSING_SHOOTING_LOCATION: "W001",
  MISSING_CONSTRUCTION_TYPE: "W002",
  NO_REPRESENTATIVE_PHOTO: "W003",
  MISSING_LOCATION_INFO: "W004",
  LARGE_FILE_SIZE: "W005",
} as const;

export interface ValidatorConfig {
  strictMode: boolean;
  maxFileSizeMB: number;
  dateFormat: string;
}

const DEFAULT_CONFIG: ValidatorConfig = {
  strictMode: false,
  maxFileSizeMB: 10,
  dateFormat: "YYYY-MM-DD",
};

export class DeliveryValidator {
  private config: ValidatorConfig;
  private rules: ValidationRule[];

  constructor(config: Partial<ValidatorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.rules = this.initializeRules();
  }

  private initializeRules(): ValidationRule[] {
    return [
      this.createStructureRule(),
      this.createFileNamingRule(),
      this.createMetadataRule(),
      this.createSequenceRule(),
    ];
  }

  validate(
    folder: ElectronicDeliveryFolder,
    photoInfoFile?: PhotoInfoFile
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const rule of this.rules) {
      const ruleErrors = rule.validate(
        photoInfoFile || this.buildPhotoInfoFile(folder),
        folder
      );
      errors.push(...ruleErrors);
    }

    warnings.push(...this.checkWarnings(folder));

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validatedAt: new Date().toISOString(),
      targetFolder: folder.rootFolderName,
    };
  }

  validateXml(xmlString: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!isValidPhotoXml(xmlString)) {
      errors.push({
        code: ERROR_CODES.INVALID_XML_STRUCTURE,
        message: "XML構造が不正です",
        details: "必要な要素が不足しているか、構造が正しくありません",
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validatedAt: new Date().toISOString(),
      targetFolder: "",
    };
  }

  private checkWarnings(folder: ElectronicDeliveryFolder): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    const hasRepresentative = folder.photoFiles.some(
      (f) => f.photoInfo.isRepresentativePhoto
    );
    if (!hasRepresentative) {
      warnings.push({
        code: WARNING_CODES.NO_REPRESENTATIVE_PHOTO,
        message: "代表写真が設定されていません",
        details: "代表写真を1枚以上設定することを推奨します",
      });
    }

    for (const file of folder.photoFiles) {
      if (!file.photoInfo.shootingLocation) {
        warnings.push({
          code: WARNING_CODES.MISSING_SHOOTING_LOCATION,
          message: "撮影箇所が設定されていません",
          targetFile: file.deliveryFileName,
        });
      }

      if (!file.photoInfo.location) {
        warnings.push({
          code: WARNING_CODES.MISSING_LOCATION_INFO,
          message: "位置情報が設定されていません",
          targetFile: file.deliveryFileName,
        });
      }

      const fileSizeMB = file.fileSize / (1024 * 1024);
      if (fileSizeMB > this.config.maxFileSizeMB) {
        warnings.push({
          code: WARNING_CODES.LARGE_FILE_SIZE,
          message: "ファイルサイズが大きいです (" + fileSizeMB.toFixed(2) + "MB)",
          targetFile: file.deliveryFileName,
          details: "推奨: " + this.config.maxFileSizeMB + "MB以下",
        });
      }
    }

    return warnings;
  }

  private createStructureRule(): ValidationRule {
    return {
      id: "structure",
      name: "フォルダ構造検証",
      description: "電子納品フォルダ構造の妥当性を検証",
      required: true,
      validate: (_data, folder) => {
        const errors: ValidationError[] = [];

        if (!folder.rootFolderName) {
          errors.push({
            code: ERROR_CODES.MISSING_ROOT_FOLDER,
            message: "ルートフォルダが設定されていません",
          });
        }

        if (!folder.photoXmlPath) {
          errors.push({
            code: ERROR_CODES.MISSING_PHOTO_XML,
            message: "PHOTO.XMLパスが設定されていません",
          });
        }

        if (!folder.picFolderPath) {
          errors.push({
            code: ERROR_CODES.MISSING_PIC_FOLDER,
            message: "PICフォルダパスが設定されていません",
          });
        }

        if (folder.photoFiles.length === 0) {
          errors.push({
            code: ERROR_CODES.EMPTY_PHOTO_LIST,
            message: "写真ファイルが含まれていません",
          });
        }

        return errors;
      },
    };
  }

  private createFileNamingRule(): ValidationRule {
    return {
      id: "file-naming",
      name: "ファイル名規則検証",
      description: "ファイル名が電子納品規則に準拠しているか検証",
      required: true,
      validate: (_data, folder) => {
        const errors: ValidationError[] = [];
        const fileNames = new Set<string>();

        for (const file of folder.photoFiles) {
          if (!isValidPhotoFileName(file.deliveryFileName)) {
            errors.push({
              code: ERROR_CODES.INVALID_PHOTO_FILE_NAME,
              message: "ファイル名が規則に準拠していません",
              targetFile: file.deliveryFileName,
              details: "P + 7桁連番 + .JPG形式で指定してください",
            });
          }

          if (fileNames.has(file.deliveryFileName)) {
            errors.push({
              code: ERROR_CODES.DUPLICATE_FILE_NAME,
              message: "ファイル名が重複しています",
              targetFile: file.deliveryFileName,
            });
          }
          fileNames.add(file.deliveryFileName);
        }

        for (const file of folder.drawingFiles) {
          if (!isValidDrawingFileName(file.deliveryFileName)) {
            errors.push({
              code: ERROR_CODES.INVALID_DRAWING_FILE_NAME,
              message: "参考図ファイル名が規則に準拠していません",
              targetFile: file.deliveryFileName,
            });
          }
        }

        return errors;
      },
    };
  }

  private createMetadataRule(): ValidationRule {
    return {
      id: "metadata",
      name: "メタデータ検証",
      description: "必須メタデータが設定されているか検証",
      required: true,
      validate: (_data, folder) => {
        const errors: ValidationError[] = [];

        for (const file of folder.photoFiles) {
          const photo = file.photoInfo;

          if (!photo.photoTitle || photo.photoTitle.trim() === "") {
            errors.push({
              code: ERROR_CODES.MISSING_PHOTO_TITLE,
              message: "写真タイトルが設定されていません",
              targetFile: file.deliveryFileName,
              targetField: "photoTitle",
            });
          }

          if (!photo.shootingDate) {
            errors.push({
              code: ERROR_CODES.MISSING_SHOOTING_DATE,
              message: "撮影日が設定されていません",
              targetFile: file.deliveryFileName,
              targetField: "shootingDate",
            });
          } else if (!this.isValidDateFormat(photo.shootingDate)) {
            errors.push({
              code: ERROR_CODES.INVALID_DATE_FORMAT,
              message: "撮影日の形式が不正です",
              targetFile: file.deliveryFileName,
              targetField: "shootingDate",
              details: "YYYY-MM-DD形式で指定してください",
            });
          }

          if (!photo.photoCategory) {
            errors.push({
              code: ERROR_CODES.MISSING_PHOTO_CATEGORY,
              message: "写真区分が設定されていません",
              targetFile: file.deliveryFileName,
              targetField: "photoCategory",
            });
          }
        }

        return errors;
      },
    };
  }

  private createSequenceRule(): ValidationRule {
    return {
      id: "sequence",
      name: "連番検証",
      description: "写真番号が連続しているか検証",
      required: true,
      validate: (_data, folder) => {
        const errors: ValidationError[] = [];

        const numbers = folder.photoFiles
          .map((f) => f.photoInfo.photoNumber)
          .sort((a, b) => a - b);

        for (let i = 0; i < numbers.length; i++) {
          if (numbers[i] !== i + 1) {
            errors.push({
              code: ERROR_CODES.NON_SEQUENTIAL_NUMBER,
              message: "写真番号が連続していません",
              details: "番号 " + numbers[i] + " (期待値: " + (i + 1) + ")",
            });
            break;
          }
        }

        return errors;
      },
    };
  }

  private isValidDateFormat(dateString: string): boolean {
    const pattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!pattern.test(dateString)) {
      return false;
    }

    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  private buildPhotoInfoFile(folder: ElectronicDeliveryFolder): PhotoInfoFile {
    return {
      commonInfo: {
        applicableStandard: "",
        photoInfoFileName: "PHOTO.XML",
        photoFolderName: folder.rootFolderName,
        photoFileFolderName: "PIC",
        softwareName: "PhotoManagement",
        softwareVersion: "1.0.0",
      },
      photoInfoList: folder.photoFiles.map((f) => f.photoInfo),
    };
  }
}

export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  lines.push("=".repeat(60));
  lines.push("電子納品検証結果");
  lines.push("=".repeat(60));
  lines.push("検証日時: " + result.validatedAt);
  lines.push("対象フォルダ: " + result.targetFolder);
  lines.push("結果: " + (result.isValid ? "合格" : "不合格"));
  lines.push("");

  if (result.errors.length > 0) {
    lines.push("エラー (" + result.errors.length + "件):");
    lines.push("-".repeat(40));
    for (const error of result.errors) {
      lines.push("  [" + error.code + "] " + error.message);
      if (error.targetFile) {
        lines.push("    ファイル: " + error.targetFile);
      }
      if (error.targetField) {
        lines.push("    項目: " + error.targetField);
      }
      if (error.details) {
        lines.push("    詳細: " + error.details);
      }
    }
    lines.push("");
  }

  if (result.warnings.length > 0) {
    lines.push("警告 (" + result.warnings.length + "件):");
    lines.push("-".repeat(40));
    for (const warning of result.warnings) {
      lines.push("  [" + warning.code + "] " + warning.message);
      if (warning.targetFile) {
        lines.push("    ファイル: " + warning.targetFile);
      }
      if (warning.details) {
        lines.push("    詳細: " + warning.details);
      }
    }
  }

  lines.push("=".repeat(60));

  return lines.join("\n");
}

export function formatValidationResultAsJson(result: ValidationResult): string {
  return JSON.stringify(result, null, 2);
}
