/**
 * Lark Baseレコード検索API
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  isLarkConfigured,
  searchRecords,
  buildSearchFilter,
  mapRecordToProject,
  getDefaultMapping,
} from '@/lib/lark/client';
import type { LarkApiResponse, LarkProjectData } from '@/lib/lark/types';

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
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const pageToken = searchParams.get('pageToken') || undefined;

    const mapping = getDefaultMapping();
    const searchFields = [
      mapping.nameField,
      mapping.codeField,
      mapping.clientNameField,
    ].filter((f): f is string => !!f);

    const filter = search ? buildSearchFilter(search, searchFields) : undefined;

    const response = await searchRecords({
      page_size: pageSize,
      page_token: pageToken,
      filter,
    });

    const records: LarkProjectData[] = [];
    for (const item of response.data.items) {
      try {
        records.push(mapRecordToProject(item, mapping));
      } catch (e) {
        console.warn('Failed to map record:', item.record_id, e);
      }
    }

    const result: LarkApiResponse<{
      records: LarkProjectData[];
      hasMore: boolean;
      pageToken?: string;
      total: number;
    }> = {
      success: true,
      data: {
        records,
        hasMore: response.data.has_more,
        pageToken: response.data.page_token,
        total: response.data.total,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Lark records search error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'レコード取得に失敗しました',
      },
      { status: 500 }
    );
  }
}
