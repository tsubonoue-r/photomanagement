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
 * Lark Baseフィールド名 → プロジェクト項目
 */
export function getDefaultMapping(): LarkProjectMapping {
  return {
    codeField: '製番',                              // 製番（整番）
    nameField: '品名',                              // 案件名 (品名)
    nameField2: '品名2',                            // 案件名 (品名2) - 連結
    salesPersonField: '担当者',                     // 営業担当者
    contractorNameField: '施工者',                  // 施工者
    constructionNameField: '◆工事項目',            // 工事名
    steelFabricationCategoryField: '鉄骨製作区分', // 鉄骨製作区分
    membraneFabricationCategoryField: '膜製作区分', // 膜製作区分
    constructionPhotoField: '◆工程写真',           // 工程写真
  };
}

/**
 * 検索対象フィールド名を取得
 */
export function getSearchFields(): string[] {
  return ['製番', '品名', '品名2'];
}

/**
 * Lark BaseレコードをProjectデータに変換
 */
export function mapRecordToProject(
  record: LarkRecord,
  mapping: LarkProjectMapping = getDefaultMapping()
): LarkProjectData {
  const fields = record.fields;

  // 案件名 = 品名 + 品名2 を連結
  const name1 = extractFieldValue(fields[mapping.nameField]) || '';
  const name2 = mapping.nameField2 ? extractFieldValue(fields[mapping.nameField2]) || '' : '';
  const name = [name1, name2].filter(Boolean).join(' ') || `レコード ${record.record_id}`;

  return {
    recordId: record.record_id,
    code: extractFieldValue(fields[mapping.codeField]) || undefined,
    name,
    salesPerson: mapping.salesPersonField
      ? extractFieldValue(fields[mapping.salesPersonField]) || undefined
      : undefined,
    contractorName: mapping.contractorNameField
      ? extractFieldValue(fields[mapping.contractorNameField]) || undefined
      : undefined,
    constructionName: mapping.constructionNameField
      ? extractFieldValue(fields[mapping.constructionNameField]) || undefined
      : undefined,
    steelFabricationCategory: mapping.steelFabricationCategoryField
      ? extractFieldValue(fields[mapping.steelFabricationCategoryField]) || undefined
      : undefined,
    membraneFabricationCategory: mapping.membraneFabricationCategoryField
      ? extractFieldValue(fields[mapping.membraneFabricationCategoryField]) || undefined
      : undefined,
    constructionPhoto: mapping.constructionPhotoField
      ? extractFieldValue(fields[mapping.constructionPhotoField]) || undefined
      : undefined,
  };
}
