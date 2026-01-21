/**
 * Lark Base API Client
 * Lark Base APIとの通信を担当
 */

import type {
  LarkTokenResponse,
  LarkRecordsResponse,
  LarkSearchRequest,
  LarkFilter,
  LarkRecord,
  LarkRecordField,
  LarkProjectMapping,
  LarkProjectData,
} from './types';

const LARK_API_BASE = 'https://open.larksuite.com/open-apis';

// トークンキャッシュ
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Lark Base設定が有効かチェック
 */
export function isLarkConfigured(): boolean {
  return !!(
    process.env.LARK_APP_ID &&
    process.env.LARK_APP_SECRET &&
    process.env.LARK_APP_TOKEN &&
    process.env.LARK_TABLE_ID
  );
}

/**
 * tenant_access_tokenを取得（キャッシュ付き）
 */
export async function getTenantAccessToken(): Promise<string> {
  // キャッシュが有効な場合はそれを返す
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  const response = await fetch(
    `${LARK_API_BASE}/auth/v3/tenant_access_token/internal`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: process.env.LARK_APP_ID,
        app_secret: process.env.LARK_APP_SECRET,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Lark auth failed: ${response.status}`);
  }

  const data: LarkTokenResponse = await response.json();

  if (data.code !== 0) {
    throw new Error(`Lark auth error: ${data.msg}`);
  }

  // キャッシュを更新
  cachedToken = {
    token: data.tenant_access_token,
    expiresAt: Date.now() + data.expire * 1000,
  };

  return data.tenant_access_token;
}

/**
 * Lark Baseテーブルからレコードを一覧取得
 */
export async function listRecords(
  request: LarkSearchRequest = {}
): Promise<LarkRecordsResponse> {
  const token = await getTenantAccessToken();
  const appToken = process.env.LARK_APP_TOKEN;
  const tableId = process.env.LARK_TABLE_ID;

  // クエリパラメータを構築
  const params = new URLSearchParams();
  params.set('page_size', String(request.page_size || 20));
  if (request.page_token) {
    params.set('page_token', request.page_token);
  }

  const url = `${LARK_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records?${params}`;

  console.log('[Lark API] Fetching records from:', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  console.log('[Lark API] Response code:', data.code, 'msg:', data.msg);

  if (!response.ok || data.code !== 0) {
    const errorMsg = data.msg || `HTTP ${response.status}`;
    console.error('[Lark API] Error:', errorMsg);
    throw new Error(`Lark API error: ${errorMsg}`);
  }

  // レスポンス形式を統一
  return {
    code: data.code,
    msg: data.msg,
    data: {
      has_more: data.data?.has_more || false,
      page_token: data.data?.page_token,
      total: data.data?.total || 0,
      items: data.data?.items || [],
    },
  };
}

/**
 * searchRecords は listRecords のエイリアス（互換性のため）
 */
export const searchRecords = listRecords;

/**
 * テキスト検索用のフィルター条件を構築
 */
export function buildSearchFilter(
  searchText: string,
  searchFields: string[]
): LarkFilter {
  return {
    conjunction: 'or',
    conditions: searchFields.map((field) => ({
      field_name: field,
      operator: 'contains' as const,
      value: [searchText],
    })),
  };
}

/**
 * フィールド値を抽出するヘルパー
 * Lark Baseの様々なフィールド形式に対応
 */
function extractFieldValue(
  field: unknown
): string | null {
  if (field === null || field === undefined) return null;

  // 文字列の場合
  if (typeof field === 'string') {
    return field;
  }

  // 数値の場合
  if (typeof field === 'number') {
    return String(field);
  }

  // 配列の場合（テキスト配列や複数選択）
  if (Array.isArray(field)) {
    // テキスト配列 [{text: "..."}, ...]
    if (field.length > 0 && typeof field[0] === 'object' && field[0]?.text) {
      return field.map((t: { text: string }) => t.text).join('');
    }
    // 単純な配列
    return field.map(String).join(', ');
  }

  // オブジェクトの場合
  if (typeof field === 'object') {
    const obj = field as Record<string, unknown>;

    // テキスト型 {text: "..."}
    if ('text' in obj && typeof obj.text === 'string') {
      return obj.text;
    }

    // 日付型 {date: timestamp} または timestamp直接
    if ('date' in obj && typeof obj.date === 'number') {
      return new Date(obj.date).toISOString().split('T')[0];
    }

    // 選択型
    if ('value' in obj && typeof obj.value === 'string') {
      return obj.value;
    }

    // リンク型
    if ('link' in obj && typeof obj.link === 'string') {
      return obj.link;
    }
  }

  return null;
}

/**
 * デフォルトのフィールドマッピング
 */
export function getDefaultMapping(): LarkProjectMapping {
  return {
    nameField: process.env.LARK_FIELD_NAME || '品名',
    codeField: process.env.LARK_FIELD_CODE || '整番',
    clientNameField: process.env.LARK_FIELD_CLIENT || '発注者',
    contractorNameField: process.env.LARK_FIELD_CONTRACTOR || '施工者',
    locationField: process.env.LARK_FIELD_LOCATION || '工事場所',
    startDateField: process.env.LARK_FIELD_START_DATE || '着工日',
    endDateField: process.env.LARK_FIELD_END_DATE || '完工日',
    descriptionField: process.env.LARK_FIELD_DESCRIPTION || '品名2',
  };
}

/**
 * 検索対象フィールド名を取得
 */
export function getSearchFields(): string[] {
  return [
    process.env.LARK_FIELD_CODE || '整番',
    process.env.LARK_FIELD_NAME || '品名',
    process.env.LARK_FIELD_DESCRIPTION || '品名2',
  ];
}

/**
 * Lark Baseレコードから最初に見つかった有効な値を名前として使用
 */
function findNameFromRecord(fields: Record<string, unknown>, mapping: LarkProjectMapping): string {
  // まずマッピングで指定されたフィールドを試す
  const mappedName = extractFieldValue(fields[mapping.nameField]);
  if (mappedName) return mappedName;

  // 一般的な名前フィールドを試す
  const commonNameFields = ['案件名', '名前', '名称', 'name', 'Name', 'title', 'Title', '件名'];
  for (const fieldName of commonNameFields) {
    const value = extractFieldValue(fields[fieldName]);
    if (value) return value;
  }

  // 最初のテキストフィールドを使用
  for (const [key, value] of Object.entries(fields)) {
    const extracted = extractFieldValue(value);
    if (extracted && extracted.length > 0) {
      console.log(`[Lark] Using field "${key}" as name: ${extracted}`);
      return extracted;
    }
  }

  return `レコード ${Date.now()}`;
}

/**
 * Lark BaseレコードをProjectデータに変換
 */
export function mapRecordToProject(
  record: LarkRecord,
  mapping: LarkProjectMapping = getDefaultMapping()
): LarkProjectData {
  const fields = record.fields;

  console.log('[Lark] Record fields:', Object.keys(fields));

  const name = findNameFromRecord(fields, mapping);

  return {
    recordId: record.record_id,
    name,
    code: extractFieldValue(fields[mapping.codeField || '']) || undefined,
    clientName: extractFieldValue(fields[mapping.clientNameField || '']) || undefined,
    contractorName: extractFieldValue(fields[mapping.contractorNameField || '']) || undefined,
    location: extractFieldValue(fields[mapping.locationField || '']) || undefined,
    startDate: extractFieldValue(fields[mapping.startDateField || '']) || undefined,
    endDate: extractFieldValue(fields[mapping.endDateField || '']) || undefined,
    description: extractFieldValue(fields[mapping.descriptionField || '']) || undefined,
  };
}
