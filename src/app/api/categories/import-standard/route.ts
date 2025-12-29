import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { standardCategories, type StandardCategory } from "@/data/standard-categories";

const importSchema = z.object({
  projectId: z.string(),
  workTypeCodes: z.array(z.string()).min(1, "少なくとも1つの工種を選択してください"),
});

// POST /api/categories/import-standard - 標準カテゴリインポート
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, workTypeCodes } = importSchema.parse(body);

    // プロジェクトの存在確認
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "プロジェクトが見つかりません" },
        { status: 404 }
      );
    }

    // 選択された工種とその子カテゴリを抽出
    const categoriesToImport: StandardCategory[] = [];

    for (const workTypeCode of workTypeCodes) {
      // 工種（レベル1）を追加
      const workType = standardCategories.find(
        (c) => c.code === workTypeCode && c.level === 1
      );
      if (workType) {
        categoriesToImport.push(workType);
      }

      // 種別（レベル2）を追加
      const subTypes = standardCategories.filter(
        (c) => c.level === 2 && c.parentCode === workTypeCode
      );
      categoriesToImport.push(...subTypes);

      // 細別（レベル3）を追加
      for (const subType of subTypes) {
        const details = standardCategories.filter(
          (c) => c.level === 3 && c.parentCode === subType.code
        );
        categoriesToImport.push(...details);
      }
    }

    // 既存のカテゴリコードを取得
    const existingCategories = await prisma.category.findMany({
      where: {
        projectId,
        code: { in: categoriesToImport.map((c) => c.code) },
      },
      select: { code: true },
    });
    const existingCodes = new Set(existingCategories.map((c) => c.code));

    // 既存のカテゴリを除外
    const newCategories = categoriesToImport.filter(
      (c) => !existingCodes.has(c.code)
    );

    if (newCategories.length === 0) {
      return NextResponse.json({
        imported: 0,
        message: "すべてのカテゴリは既にインポート済みです",
      });
    }

    // コードからIDへのマッピングを作成するため、既存カテゴリを取得
    const allExistingCategories = await prisma.category.findMany({
      where: { projectId },
      select: { id: true, code: true },
    });
    const codeToIdMap = new Map(
      allExistingCategories.map((c) => [c.code, c.id])
    );

    // レベル順にソートして作成（親から子へ）
    const sortedCategories = [...newCategories].sort(
      (a, b) => a.level - b.level
    );

    let importedCount = 0;

    for (const category of sortedCategories) {
      // 親カテゴリのIDを取得
      let parentId: string | null = null;
      if (category.parentCode) {
        parentId = codeToIdMap.get(category.parentCode) ?? null;
      }

      // 同じ親の最大sortOrderを取得
      const maxSortOrder = await prisma.category.aggregate({
        where: {
          projectId,
          parentId,
        },
        _max: { sortOrder: true },
      });

      const created = await prisma.category.create({
        data: {
          name: category.name,
          code: category.code,
          sortOrder: (maxSortOrder._max.sortOrder ?? 0) + 1,
          isStandard: true,
          projectId,
          parentId,
        },
      });

      // マップを更新
      codeToIdMap.set(category.code, created.id);
      importedCount++;
    }

    return NextResponse.json({
      imported: importedCount,
      message: `${importedCount}件のカテゴリをインポートしました`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to import standard categories:", error);
    return NextResponse.json(
      { error: "標準カテゴリのインポートに失敗しました" },
      { status: 500 }
    );
  }
}
