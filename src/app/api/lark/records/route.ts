/**
 * Lark Baseレコード検索API
 * 整番、品名、品名2 で検索可能
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  isLarkConfigured,
  listRecords,
  listRecordsWithConstructionPhoto,
  mapRecordToProject,
  getDefaultMapping,
  getSearchFields,
} from '@/lib/lark/client';
import type { LarkApiResponse, LarkProjectData, LarkRecord } from '@/lib/lark/types';

/**
 * レコードをテキスト検索でフィルタリング
 */
function filterRecords(
  records: LarkRecord[],
  searchText: string,
  searchFields: string[]
): LarkRecord[] {
  if (!searchText.trim()) return records;

  const lowerSearch = searchText.toLowerCase();

  return records.filter((record) => {
    for (const fieldName of searchFields) {
      const fieldValue = record.fields[fieldName];
      if (fieldValue) {
        // 文字列化して検索
        const strValue = typeof fieldValue === 'string'
          ? fieldValue
          : JSON.stringify(fieldValue);
        if (strValue.toLowerCase().includes(lowerSearch)) {
          return true;
        }
      }
    }
    return false;
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      );
    }

    if (!isLarkConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Lark Base連携が設定されていません' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const rawPageSize = parseInt(searchParams.get('pageSize') || '100', 10);
    const pageSize = Math.min(Math.max(rawPageSize || 100, 1), 500); // 1-500の範囲に制限
    const pageToken = searchParams.get('pageToken') || undefined;
    const constructionPhotoOnly = searchParams.get('constructionPhoto') === 'true';

    // 検索対象フィールド: 整番, 品名, 品名2
    const searchFields = getSearchFields();
    console.log('[Lark API] Search fields:', searchFields);
    console.log('[Lark API] Search text:', search);
    console.log('[Lark API] Construction photo only:', constructionPhotoOnly);

    let filteredItems: LarkRecord[];
    let hasMoreRecords = false;
    let nextPageToken: string | undefined;

    // 「◆工程写真」が「有」のレコードのみを取得するモード
    if (constructionPhotoOnly) {
      // 全ページ取得（ページネーションなし）
      const allRecords = await listRecordsWithConstructionPhoto();
      console.log('[Lark API] Records with construction photo:', allRecords.length);

      // 検索テキストでフィルタリング
      filteredItems = search
        ? filterRecords(allRecords, search, searchFields)
        : allRecords;

      console.log('[Lark API] After search filter:', filteredItems.length);
    } else {
      // 通常モード: ページネーション対応
      const response = await listRecords({
        page_size: search ? 500 : pageSize, // 検索時は多めに取得
        page_token: pageToken,
      });

      console.log('[Lark API] Fetched records:', response.data.items.length);

      // 検索テキストでフィルタリング
      filteredItems = search
        ? filterRecords(response.data.items, search, searchFields)
        : response.data.items;

      if (search) {
        console.log('[Lark API] Filtered records:', filteredItems.length);
      }

      hasMoreRecords = response.data.has_more;
      nextPageToken = response.data.page_token;
    }

    // プロジェクトデータに変換
    const mapping = getDefaultMapping();
    const records: LarkProjectData[] = [];

    for (const item of filteredItems) {
      try {
        records.push(mapRecordToProject(item, mapping));
      } catch (e) {
        console.warn('[Lark API] Failed to map record:', item.record_id, e);
      }
    }

    // ページサイズで制限
    const limitedRecords = records.slice(0, pageSize);

    const result: LarkApiResponse<{
      records: LarkProjectData[];
      hasMore: boolean;
      pageToken?: string;
      total: number;
    }> = {
      success: true,
      data: {
        records: limitedRecords,
        hasMore: constructionPhotoOnly
          ? records.length > pageSize
          : records.length > pageSize || hasMoreRecords,
        pageToken: nextPageToken,
        total: records.length,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Lark API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'レコード取得に失敗しました',
      },
      { status: 500 }
    );
  }
}
