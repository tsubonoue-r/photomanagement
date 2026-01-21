/**
 * Lark Base 一括インポートAPI
 * POST: 「◆工程写真」が「有」の案件を一括インポート
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
  BulkImportRequest,
  BulkImportResult,
  ImportItemResult,
  LarkProjectData,
} from '@/lib/lark/types';

/**
 * Get or create default organization for user
 */
async function getOrCreateOrganization(userId: string): Promise<string> {
  // Check if user has an organization membership
  const membership = await prisma.organizationMember.findFirst({
    where: { userId },
    select: { organizationId: true },
  });

  if (membership) {
    return membership.organizationId;
  }

  // Create default organization if none exists
  const defaultOrg = await prisma.organization.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'デフォルト組織',
      slug: 'default',
      plan: 'FREE',
    },
  });

  // Add user to the organization
  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: defaultOrg.id,
        userId,
      },
    },
    update: {},
    create: {
      organizationId: defaultOrg.id,
      userId,
      role: 'OWNER',
    },
  });

  return defaultOrg.id;
}

/**
 * 既存プロジェクトのcodeリストを取得
 */
async function getExistingProjectCodes(): Promise<Set<string>> {
  const projects = await prisma.project.findMany({
    where: {
      code: { not: null },
    },
    select: { code: true },
  });

  return new Set(projects.map((p) => p.code!).filter(Boolean));
}

/**
 * POST /api/lark/import-bulk
 * 一括インポート実行
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<LarkApiResponse<BulkImportResult>>> {
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

    const body = (await request.json()) as BulkImportRequest;
    const { recordIds, dryRun = false } = body;

    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'インポート対象のレコードIDが指定されていません' },
        { status: 400 }
      );
    }

    // 一括インポートの最大件数制限
    const MAX_IMPORT_COUNT = 100;
    if (recordIds.length > MAX_IMPORT_COUNT) {
      return NextResponse.json(
        { success: false, error: `一度にインポートできるのは${MAX_IMPORT_COUNT}件までです` },
        { status: 400 }
      );
    }

    // ユーザーIDの検証
    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'ユーザーIDが取得できません' },
        { status: 401 }
      );
    }

    console.log(`[Lark Import] Starting bulk import: ${recordIds.length} records, dryRun: ${dryRun}`);

    // Larkから「◆工程写真」が「有」の全レコードを取得
    const allRecords = await listRecordsWithConstructionPhoto();
    const mapping = getDefaultMapping();

    // 指定されたrecordIdのみ抽出
    const targetRecords = allRecords.filter((r) => recordIds.includes(r.record_id));
    console.log(`[Lark Import] Target records found: ${targetRecords.length}`);

    // 既存のプロジェクトcode一覧を取得
    const existingCodes = await getExistingProjectCodes();
    console.log(`[Lark Import] Existing project codes: ${existingCodes.size}`);

    // 組織IDを取得
    const organizationId = await getOrCreateOrganization(userId);

    // インポート処理
    const items: ImportItemResult[] = [];
    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const record of targetRecords) {
      const projectData: LarkProjectData = mapRecordToProject(record, mapping);

      // 重複チェック（codeが既に存在する場合はスキップ）
      if (projectData.code && existingCodes.has(projectData.code)) {
        items.push({
          recordId: record.record_id,
          code: projectData.code,
          name: projectData.name,
          status: 'skipped',
          message: `製番 ${projectData.code} は既にインポート済みです`,
        });
        skippedCount++;
        continue;
      }

      // ドライランモードの場合はインポートをスキップ
      if (dryRun) {
        items.push({
          recordId: record.record_id,
          code: projectData.code,
          name: projectData.name,
          status: 'success',
          message: 'ドライラン: インポート可能',
        });
        successCount++;
        continue;
      }

      // 実際のインポート処理
      try {
        const project = await prisma.project.create({
          data: {
            organizationId,
            name: projectData.name,
            code: projectData.code || null,
            salesPerson: projectData.salesPerson || null,
            contractorName: projectData.contractorName || null,
            constructionName: projectData.constructionName || null,
            steelFabricationCategory: projectData.steelFabricationCategory || null,
            membraneFabricationCategory: projectData.membraneFabricationCategory || null,
            constructionPhoto: projectData.constructionPhoto || null,
            status: 'ACTIVE',
          },
        });

        // 重複防止のため、新しく作成したcodeを追加
        if (projectData.code) {
          existingCodes.add(projectData.code);
        }

        items.push({
          recordId: record.record_id,
          code: projectData.code,
          name: projectData.name,
          status: 'success',
          message: 'インポート成功',
          projectId: project.id,
        });
        successCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '不明なエラー';
        console.error(`[Lark Import] Error importing ${projectData.code}:`, error);

        items.push({
          recordId: record.record_id,
          code: projectData.code,
          name: projectData.name,
          status: 'error',
          message: `インポートエラー: ${errorMessage}`,
        });
        errorCount++;
      }
    }

    const result: BulkImportResult = {
      successCount,
      skippedCount,
      errorCount,
      totalCount: targetRecords.length,
      items,
      dryRun,
    };

    console.log(`[Lark Import] Completed: success=${successCount}, skipped=${skippedCount}, error=${errorCount}`);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Lark Import] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '一括インポートに失敗しました',
      },
      { status: 500 }
    );
  }
}
