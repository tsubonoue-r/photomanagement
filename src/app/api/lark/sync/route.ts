/**
 * Lark Base 同期検知API
 * GET: 新規レコード検知（既存プロジェクトとの差分検出）
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  isLarkConfigured,
  listRecordsWithConstructionPhoto,
  mapRecordToProject,
  getDefaultMapping,
} from '@/lib/lark/client';
import type {
  LarkApiResponse,
  SyncCheckResponse,
  LarkSyncStatus,
} from '@/lib/lark/types';

/**
 * 既存プロジェクトのcode -> id, name マップを取得
 */
async function getExistingProjectMap(): Promise<Map<string, { id: string; name: string }>> {
  const projects = await prisma.project.findMany({
    where: {
      code: { not: null },
    },
    select: { id: true, code: true, name: true },
  });

  const map = new Map<string, { id: string; name: string }>();
  for (const p of projects) {
    if (p.code) {
      map.set(p.code, { id: p.id, name: p.name });
    }
  }
  return map;
}

/**
 * GET /api/lark/sync
 * 新規レコード検知（既存プロジェクトとの差分検出）
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<LarkApiResponse<SyncCheckResponse>>> {
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

    console.log('[Lark Sync] Checking for new records...');

    // Larkから「◆工程写真」が「有」の全レコードを取得
    const allRecords = await listRecordsWithConstructionPhoto();
    const mapping = getDefaultMapping();

    console.log(`[Lark Sync] Total Lark records with construction photo: ${allRecords.length}`);

    // 既存のプロジェクトcode -> {id, name} マップを取得
    const existingProjectMap = await getExistingProjectMap();
    console.log(`[Lark Sync] Existing projects count: ${existingProjectMap.size}`);

    // 同期ステータスをチェック
    const items: LarkSyncStatus[] = [];
    let newCount = 0;
    let existsCount = 0;
    let updatedCount = 0;

    for (const record of allRecords) {
      const projectData = mapRecordToProject(record, mapping);

      if (!projectData.code) {
        // codeがないレコードは新規扱い
        items.push({
          record: projectData,
          syncStatus: 'new',
        });
        newCount++;
        continue;
      }

      const existing = existingProjectMap.get(projectData.code);
      if (existing) {
        // 既存のプロジェクトがある
        items.push({
          record: projectData,
          syncStatus: 'exists',
          existingProjectId: existing.id,
          existingProjectName: existing.name,
        });
        existsCount++;
      } else {
        // 新規レコード
        items.push({
          record: projectData,
          syncStatus: 'new',
        });
        newCount++;
      }
    }

    const result: SyncCheckResponse = {
      newCount,
      existsCount,
      updatedCount,
      totalCount: allRecords.length,
      items,
    };

    console.log(`[Lark Sync] Result: new=${newCount}, exists=${existsCount}, total=${allRecords.length}`);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Lark Sync] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '同期検知に失敗しました',
      },
      { status: 500 }
    );
  }
}
