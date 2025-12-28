/**
 * 電子納品関連の型定義
 * 国土交通省 デジタル写真管理情報基準 準拠
 */

// =============================================================================
// 基本型定義
// =============================================================================

/**
 * 写真区分
 */
export type PhotoCategory =
  | "工事"
  | "着工前"
  | "完成"
  | "施工状況"
  | "安全管理"
  | "使用材料"
  | "品質管理"
  | "出来形管理"
  | "その他";

/**
 * 写真大分類
 */
export type PhotoMajorCategory =
  | "工事写真"
  | "完成写真"
  | "その他写真";

/**
 * 写真ファイル形式
 */
export type PhotoFileFormat = "JPEG" | "TIFF";

/**
 * 参考図ファイル形式
 */
export type DrawingFileFormat = "JPEG" | "TIFF" | "PDF";

// =============================================================================
// PHOTO.XML スキーマ型定義
// =============================================================================

/**
 * 写真情報ファイルのルート要素
 */
export interface PhotoInfoFile {
  /** 共通情報 */
  commonInfo: PhotoCommonInfo;
  /** 写真情報 */
  photoInfoList: PhotoInfo[];
}

/**
 * 共通情報
 */
export interface PhotoCommonInfo {
  /** 適用要領基準 */
  applicableStandard: string;
  /** 写真情報ファイル名 */
  photoInfoFileName: string;
  /** 写真フォルダ名 */
  photoFolderName: string;
  /** 写真ファイルフォルダ名 */
  photoFileFolderName: string;
  /** 参考図フォルダ名 */
  drawingFolderName?: string;
  /** ソフトウェア名 */
  softwareName: string;
  /** ソフトウェアバージョン */
  softwareVersion: string;
}

/**
 * 写真情報
 */
export interface PhotoInfo {
  /** 写真番号（連番） */
  photoNumber: number;
  /** 写真ファイル名 */
  photoFileName: string;
  /** 写真ファイル日本語名 */
  photoFileJapaneseName?: string;
  /** メディア番号 */
  mediaNumber?: number;
  /** 写真大分類 */
  photoMajorCategory: PhotoMajorCategory;
  /** 写真区分 */
  photoCategory: PhotoCategory;
  /** 工種 */
  constructionType?: string;
  /** 種別 */
  workType?: string;
  /** 細別 */
  detailType?: string;
  /** 写真タイトル */
  photoTitle: string;
  /** 撮影箇所 */
  shootingLocation?: string;
  /** 撮影年月日 */
  shootingDate: string;
  /** 代表写真フラグ */
  isRepresentativePhoto: boolean;
  /** 提出頻度写真フラグ */
  isSubmissionFrequencyPhoto: boolean;
  /** 施工管理値 */
  constructionManagementValue?: string;
  /** 請負者説明文 */
  contractorDescription?: string;
  /** 参考図有無 */
  hasDrawing: boolean;
  /** 参考図ファイル名 */
  drawingFileName?: string;
  /** 参考図ファイル日本語名 */
  drawingFileJapaneseName?: string;
  /** 参考図タイトル */
  drawingTitle?: string;
  /** 備考 */
  remarks?: string;
  /** 撮影者名 */
  photographerName?: string;
  /** 位置情報 */
  location?: PhotoLocation;
}

/**
 * 位置情報
 */
export interface PhotoLocation {
  /** 測地系 */
  geodeticSystem: "JGD2011" | "JGD2000" | "Tokyo";
  /** 緯度（度分秒形式） */
  latitude?: string;
  /** 経度（度分秒形式） */
  longitude?: string;
}

// =============================================================================
// フォルダ構成型定義
// =============================================================================

/**
 * 電子納品フォルダ構成
 */
export interface ElectronicDeliveryFolder {
  /** ルートフォルダ名 */
  rootFolderName: string;
  /** PHOTO.XMLパス */
  photoXmlPath: string;
  /** 写真ファイルフォルダパス */
  picFolderPath: string;
  /** 参考図フォルダパス */
  draFolderPath?: string;
  /** 写真ファイル一覧 */
  photoFiles: PhotoFileEntry[];
  /** 参考図ファイル一覧 */
  drawingFiles: DrawingFileEntry[];
}

/**
 * 写真ファイルエントリ
 */
export interface PhotoFileEntry {
  /** 元ファイル名 */
  originalFileName: string;
  /** 電子納品ファイル名（P0000001.JPG形式） */
  deliveryFileName: string;
  /** ファイルパス */
  filePath: string;
  /** ファイルサイズ（バイト） */
  fileSize: number;
  /** 写真情報参照 */
  photoInfo: PhotoInfo;
}

/**
 * 参考図ファイルエントリ
 */
export interface DrawingFileEntry {
  /** 元ファイル名 */
  originalFileName: string;
  /** 電子納品ファイル名（D0000001.JPG形式） */
  deliveryFileName: string;
  /** ファイルパス */
  filePath: string;
  /** ファイルサイズ（バイト） */
  fileSize: number;
}

// =============================================================================
// 検証型定義
// =============================================================================

/**
 * 検証結果
 */
export interface ValidationResult {
  /** 検証成功フラグ */
  isValid: boolean;
  /** エラー一覧 */
  errors: ValidationError[];
  /** 警告一覧 */
  warnings: ValidationWarning[];
  /** 検証日時 */
  validatedAt: string;
  /** 検証対象フォルダ */
  targetFolder: string;
}

/**
 * 検証エラー
 */
export interface ValidationError {
  /** エラーコード */
  code: string;
  /** エラーメッセージ */
  message: string;
  /** 対象ファイル */
  targetFile?: string;
  /** 対象項目 */
  targetField?: string;
  /** 詳細情報 */
  details?: string;
}

/**
 * 検証警告
 */
export interface ValidationWarning {
  /** 警告コード */
  code: string;
  /** 警告メッセージ */
  message: string;
  /** 対象ファイル */
  targetFile?: string;
  /** 詳細情報 */
  details?: string;
}

/**
 * 検証ルール
 */
export interface ValidationRule {
  /** ルールID */
  id: string;
  /** ルール名 */
  name: string;
  /** 説明 */
  description: string;
  /** 必須フラグ */
  required: boolean;
  /** 検証関数 */
  validate: (data: PhotoInfoFile, folder: ElectronicDeliveryFolder) => ValidationError[];
}

// =============================================================================
// エクスポート設定型定義
// =============================================================================

/**
 * エクスポート設定
 */
export interface ExportConfig {
  /** プロジェクトID */
  projectId: string;
  /** 出力フォーマット */
  outputFormat: "zip" | "folder";
  /** 適用要領基準バージョン */
  standardVersion: string;
  /** 写真品質設定 */
  photoQuality: PhotoQualityConfig;
  /** 含める写真ID一覧 */
  photoIds?: string[];
  /** メタデータ設定 */
  metadata: ExportMetadata;
}

/**
 * 写真品質設定
 */
export interface PhotoQualityConfig {
  /** 最大画像幅 */
  maxWidth?: number;
  /** 最大画像高さ */
  maxHeight?: number;
  /** JPEG品質 */
  jpegQuality: number;
  /** 圧縮有効フラグ */
  compressionEnabled: boolean;
}

/**
 * エクスポートメタデータ
 */
export interface ExportMetadata {
  /** 工事名 */
  constructionName: string;
  /** 施工会社名 */
  contractorName: string;
  /** 発注者名 */
  ordererName?: string;
  /** 工期開始日 */
  constructionStartDate?: string;
  /** 工期終了日 */
  constructionEndDate?: string;
}

/**
 * エクスポート進捗
 */
export interface ExportProgress {
  /** 現在のステップ */
  currentStep: ExportStep;
  /** 総ステップ数 */
  totalSteps: number;
  /** 完了ステップ数 */
  completedSteps: number;
  /** 進捗率（0-100） */
  progressPercent: number;
  /** 現在処理中のファイル */
  currentFile?: string;
  /** 処理済みファイル数 */
  processedFiles: number;
  /** 総ファイル数 */
  totalFiles: number;
}

/**
 * エクスポートステップ
 */
export type ExportStep =
  | "preparing"
  | "creating-folders"
  | "copying-photos"
  | "generating-xml"
  | "validating"
  | "creating-archive"
  | "completed"
  | "failed";

/**
 * エクスポート結果
 */
export interface ExportResult {
  /** 成功フラグ */
  success: boolean;
  /** 出力ファイルパス/URL */
  outputPath?: string;
  /** ダウンロードURL */
  downloadUrl?: string;
  /** ファイルサイズ */
  fileSize?: number;
  /** 検証結果 */
  validationResult?: ValidationResult;
  /** エラーメッセージ */
  error?: string;
  /** 処理時間（ミリ秒） */
  processingTimeMs: number;
}

// =============================================================================
// プロジェクト写真データ型定義（内部用）
// =============================================================================

/**
 * プロジェクト写真データ
 */
export interface ProjectPhoto {
  /** 写真ID */
  id: string;
  /** プロジェクトID */
  projectId: string;
  /** ファイル名 */
  fileName: string;
  /** ファイルパス */
  filePath: string;
  /** ファイルサイズ */
  fileSize: number;
  /** MIME Type */
  mimeType: string;
  /** 写真大分類 */
  majorCategory: PhotoMajorCategory;
  /** 写真区分 */
  category: PhotoCategory;
  /** 写真タイトル */
  title: string;
  /** 撮影箇所 */
  shootingLocation?: string;
  /** 撮影日時 */
  shootingDate: Date;
  /** 工種 */
  constructionType?: string;
  /** 種別 */
  workType?: string;
  /** 細別 */
  detailType?: string;
  /** 代表写真フラグ */
  isRepresentative: boolean;
  /** 備考 */
  remarks?: string;
  /** 位置情報 */
  location?: {
    latitude: number;
    longitude: number;
  };
  /** 作成日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt: Date;
}

/**
 * プロジェクト情報
 */
export interface Project {
  /** プロジェクトID */
  id: string;
  /** プロジェクト名 */
  name: string;
  /** 工事名 */
  constructionName: string;
  /** 施工会社名 */
  contractorName: string;
  /** 発注者名 */
  ordererName?: string;
  /** 工期開始日 */
  startDate?: Date;
  /** 工期終了日 */
  endDate?: Date;
  /** 作成日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt: Date;
}
