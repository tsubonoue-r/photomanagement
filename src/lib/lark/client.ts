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
 * Lark Baseテーブルからレコードを検索
 */
export async function searchRecords(
  request: LarkSearchRequest = {}
): Promise<LarkRecordsResponse> {
  const token = await getTenantAccessToken();
  const appToken = process.env.LARK_APP_TOKEN;
  const tableId = process.env.LARK_TABLE_ID;

  const response = await fetch(
    `${LARK_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records/search`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        page_size: request.page_size || 20,
        page_token: request.page_token,
        filter: request.filter,
        sort: request.sort,
        field_names: request.field_names,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Lark API failed: ${response.status}`);
  }

  const data: LarkRecordsResponse = await response.json();

  if (data.code !== 0) {
    throw new Error(`Lark API error: ${data.msg}`);
  }

  return data;
}

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
 */
function extractFieldValue(
  field: LarkRecordField | undefined
): string | null {
  if (!field) return null;

  // テキスト型
  if (field.text !== undefined) {
    if (typeof field.text === 'string') {
      return field.text;
    }
    if (Array.isArray(field.text)) {
      return field.text.map((t) => t.text).join('');
    }
  }

  // 数値型
  if (field.number !== undefined) {
    return String(field.number);
  }

  // 日付型（Unix timestamp to ISO string）
  if (field.date !== undefined) {
    return new Date(field.date).toISOString().split('T')[0];
  }

  // 選択型
  if (field.select !== undefined) {
    return field.select;
  }

  return null;
}

/**
 * デフォルトのフィールドマッピング
 */
export function getDefaultMapping(): LarkProjectMapping {
  return {
    nameField: process.env.LARK_FIELD_NAME || '案件名',
    codeField: process.env.LARK_FIELD_CODE || '案件コード',
    clientNameField: process.env.LARK_FIELD_CLIENT || '発注者',
    contractorNameField: process.env.LARK_FIELD_CONTRACTOR || '施工者',
    locationField: process.env.LARK_FIELD_LOCATION || '工事場所',
    startDateField: process.env.LARK_FIELD_START_DATE || '着工日',
    endDateField: process.env.LARK_FIELD_END_DATE || '完工日',
    descriptionField: process.env.LARK_FIELD_DESCRIPTION || '備考',
  };
}

/**
 * Lark BaseレコードをProjectデータに変換
 */
export function mapRecordToProject(
  record: LarkRecord,
  mapping: LarkProjectMapping = getDefaultMapping()
): LarkProjectData {
  const fields = record.fields;

  const name = extractFieldValue(fields[mapping.nameField] as LarkRecordField);

  if (!name) {
    throw new Error(`Record ${record.record_id} has no name field`);
  }

  return {
    recordId: record.record_id,
    name,
    code: mapping.codeField
      ? extractFieldValue(fields[mapping.codeField] as LarkRecordField) || undefined
      : undefined,
    clientName: mapping.clientNameField
      ? extractFieldValue(fields[mapping.clientNameField] as LarkRecordField) || undefined
      : undefined,
    contractorName: mapping.contractorNameField
      ? extractFieldValue(fields[mapping.contractorNameField] as LarkRecordField) || undefined
      : undefined,
    location: mapping.locationField
      ? extractFieldValue(fields[mapping.locationField] as LarkRecordField) || undefined
      : undefined,
    startDate: mapping.startDateField
      ? extractFieldValue(fields[mapping.startDateField] as LarkRecordField) || undefined
      : undefined,
    endDate: mapping.endDateField
      ? extractFieldValue(fields[mapping.endDateField] as LarkRecordField) || undefined
      : undefined,
    description: mapping.descriptionField
      ? extractFieldValue(fields[mapping.descriptionField] as LarkRecordField) || undefined
      : undefined,
  };
}
