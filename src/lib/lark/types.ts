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

// プロジェクトフィールドマッピング
export interface LarkProjectMapping {
  nameField: string;
  codeField?: string;
  clientNameField?: string;
  contractorNameField?: string;
  locationField?: string;
  startDateField?: string;
  endDateField?: string;
  descriptionField?: string;
}

// PhotoManagement用プロジェクトデータ
export interface LarkProjectData {
  recordId: string;
  name: string;
  code?: string;
  clientName?: string;
  contractorName?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

// APIレスポンス
export interface LarkApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
