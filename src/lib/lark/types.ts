/**
 * Lark Base API Types
 * Lark Base連携のための型定義
 */

// Lark API認証設定
export interface LarkAuthConfig {
  appId: string;
  appSecret: string;
  appToken: string;
  tableId: string;
}

// Lark トークンレスポンス
export interface LarkTokenResponse {
  code: number;
  msg: string;
  tenant_access_token: string;
  expire: number;
}

// Lark Base レコードフィールド
export interface LarkRecordField {
  text?: string | { text: string }[];
  number?: number;
  date?: number;
  select?: string;
  multi_select?: string[];
  [key: string]: unknown;
}

// Lark Base レコード
export interface LarkRecord {
  record_id: string;
  fields: Record<string, LarkRecordField>;
}

// Lark Base レコードレスポンス
export interface LarkRecordsResponse {
  code: number;
  msg: string;
  data: {
    has_more: boolean;
    page_token?: string;
    total: number;
    items: LarkRecord[];
  };
}

// 検索リクエスト
export interface LarkSearchRequest {
  page_size?: number;
  page_token?: string;
  filter?: LarkFilter;
  sort?: LarkSort[];
  field_names?: string[];
}

// フィルター条件
export interface LarkFilter {
  conjunction: 'and' | 'or';
  conditions: LarkCondition[];
}

// 検索条件
export interface LarkCondition {
  field_name: string;
  operator: 'is' | 'isNot' | 'contains' | 'doesNotContain' | 'isEmpty' | 'isNotEmpty' | 'isGreater' | 'isLess';
  value?: string[];
}

// ソート条件
export interface LarkSort {
  field_name: string;
  desc?: boolean;
}

// プロジェクトフィールドマッピング (Lark Baseフィールド名)
export interface LarkProjectMapping {
  codeField: string;                        // 整番
  nameField: string;                        // 品名
  nameField2?: string;                      // 品名2
  salesPersonField?: string;                // 担当者LU
  contractorNameField?: string;             // 施工者
  constructionNameField?: string;           // ◆工事項目
  steelFabricationCategoryField?: string;   // 鉄骨製作区分
  membraneFabricationCategoryField?: string; // 膜製作区分
  constructionPhotoField?: string;          // ◆工程写真
}

// PhotoManagement用プロジェクトデータ
export interface LarkProjectData {
  recordId: string;
  code?: string;                        // 整番
  name: string;                         // 案件名 (品名+品名2)
  salesPerson?: string;                 // 営業担当者 (担当者LU)
  contractorName?: string;              // 施工者
  constructionName?: string;            // 工事名 (◆工事項目)
  steelFabricationCategory?: string;    // 鉄骨製作区分
  membraneFabricationCategory?: string; // 膜製作区分
  constructionPhoto?: string;           // 工程写真 (◆工程写真)
}

// APIレスポンス
export interface LarkApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================================================
// 一括インポート関連の型定義
// =============================================================================

/**
 * 一括インポートリクエスト
 */
export interface BulkImportRequest {
  /** インポート対象のLarkレコードID配列 */
  recordIds: string[];
  /** ドライランモード（実際にはインポートせず、結果をプレビュー） */
  dryRun?: boolean;
}

/**
 * 個別インポート結果
 */
export interface ImportItemResult {
  /** LarkレコードID */
  recordId: string;
  /** 製番（code） */
  code?: string;
  /** 案件名 */
  name: string;
  /** インポートステータス */
  status: 'success' | 'skipped' | 'error';
  /** スキップ理由またはエラーメッセージ */
  message?: string;
  /** 作成されたプロジェクトID（成功時のみ） */
  projectId?: string;
}

/**
 * 一括インポート結果
 */
export interface BulkImportResult {
  /** 成功件数 */
  successCount: number;
  /** スキップ件数（重複など） */
  skippedCount: number;
  /** エラー件数 */
  errorCount: number;
  /** 総処理件数 */
  totalCount: number;
  /** 個別結果 */
  items: ImportItemResult[];
  /** ドライランモードかどうか */
  dryRun: boolean;
}

/**
 * 同期ステータス（既存プロジェクトとの差分）
 */
export interface LarkSyncStatus {
  /** Larkレコード情報 */
  record: LarkProjectData;
  /** 同期状態 */
  syncStatus: 'new' | 'exists' | 'updated';
  /** 既存プロジェクトID（存在する場合） */
  existingProjectId?: string;
  /** 既存プロジェクト名（存在する場合） */
  existingProjectName?: string;
}

/**
 * 同期検知レスポンス
 */
export interface SyncCheckResponse {
  /** 新規レコード数 */
  newCount: number;
  /** 既存レコード数 */
  existsCount: number;
  /** 更新対象数 */
  updatedCount: number;
  /** 総レコード数 */
  totalCount: number;
  /** 個別ステータス */
  items: LarkSyncStatus[];
}
