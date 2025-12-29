/**
 * 電子納品関連の型定義
 * 国土交通省 デジタル写真管理情報基準 準拠
 */

export type PhotoCategory =
  | "工事" | "着工前" | "完成" | "施工状況" | "安全管理"
  | "使用材料" | "品質管理" | "出来形管理" | "その他";

export type PhotoMajorCategory = "工事写真" | "完成写真" | "その他写真";
export type PhotoFileFormat = "JPEG" | "TIFF";
export type DrawingFileFormat = "JPEG" | "TIFF" | "PDF";

export interface PhotoInfoFile {
  commonInfo: PhotoCommonInfo;
  photoInfoList: PhotoInfo[];
}

export interface PhotoCommonInfo {
  applicableStandard: string;
  photoInfoFileName: string;
  photoFolderName: string;
  photoFileFolderName: string;
  drawingFolderName?: string;
  softwareName: string;
  softwareVersion: string;
}

export interface PhotoInfo {
  photoNumber: number;
  photoFileName: string;
  photoFileJapaneseName?: string;
  mediaNumber?: number;
  photoMajorCategory: PhotoMajorCategory;
  photoCategory: PhotoCategory;
  constructionType?: string;
  workType?: string;
  detailType?: string;
  photoTitle: string;
  shootingLocation?: string;
  shootingDate: string;
  isRepresentativePhoto: boolean;
  isSubmissionFrequencyPhoto: boolean;
  constructionManagementValue?: string;
  contractorDescription?: string;
  hasDrawing: boolean;
  drawingFileName?: string;
  drawingFileJapaneseName?: string;
  drawingTitle?: string;
  remarks?: string;
  photographerName?: string;
  location?: PhotoLocation;
}

export interface PhotoLocation {
  geodeticSystem: "JGD2011" | "JGD2000" | "Tokyo";
  latitude?: string;
  longitude?: string;
}

export interface ElectronicDeliveryFolder {
  rootFolderName: string;
  photoXmlPath: string;
  picFolderPath: string;
  draFolderPath?: string;
  photoFiles: PhotoFileEntry[];
  drawingFiles: DrawingFileEntry[];
}

export interface PhotoFileEntry {
  originalFileName: string;
  deliveryFileName: string;
  filePath: string;
  fileSize: number;
  photoInfo: PhotoInfo;
}

export interface DrawingFileEntry {
  originalFileName: string;
  deliveryFileName: string;
  filePath: string;
  fileSize: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  validatedAt: string;
  targetFolder: string;
}

export interface ValidationError {
  code: string;
  message: string;
  targetFile?: string;
  targetField?: string;
  details?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  targetFile?: string;
  details?: string;
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  required: boolean;
  validate: (data: PhotoInfoFile, folder: ElectronicDeliveryFolder) => ValidationError[];
}

export interface ExportConfig {
  projectId: string;
  outputFormat: "zip" | "folder";
  standardVersion: string;
  photoQuality: PhotoQualityConfig;
  photoIds?: string[];
  metadata: ExportMetadata;
}

export interface PhotoQualityConfig {
  maxWidth?: number;
  maxHeight?: number;
  jpegQuality: number;
  compressionEnabled: boolean;
}

export interface ExportMetadata {
  constructionName: string;
  contractorName: string;
  ordererName?: string;
  constructionStartDate?: string;
  constructionEndDate?: string;
}

export interface ExportProgress {
  currentStep: ExportStep;
  totalSteps: number;
  completedSteps: number;
  progressPercent: number;
  currentFile?: string;
  processedFiles: number;
  totalFiles: number;
}

export type ExportStep =
  | "preparing" | "creating-folders" | "copying-photos"
  | "generating-xml" | "validating" | "creating-archive"
  | "completed" | "failed";

export interface ExportResult {
  success: boolean;
  outputPath?: string;
  downloadUrl?: string;
  fileSize?: number;
  validationResult?: ValidationResult;
  error?: string;
  processingTimeMs: number;
}

export interface ProjectPhoto {
  id: string;
  projectId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  majorCategory: PhotoMajorCategory;
  category: PhotoCategory;
  title: string;
  shootingLocation?: string;
  shootingDate: Date;
  constructionType?: string;
  workType?: string;
  detailType?: string;
  isRepresentative: boolean;
  remarks?: string;
  location?: { latitude: number; longitude: number };
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  constructionName: string;
  contractorName: string;
  ordererName?: string;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
