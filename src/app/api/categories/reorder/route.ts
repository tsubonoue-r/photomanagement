import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reorderSchema = z.object({
  categoryId: z.string(),
  newIndex: z.number().min(0),
  parentId: z.string().nullable(),
});

// POST /api/categories/reorder - カテゴリ並び替え
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryId, newIndex, parentId } = reorderSchema.parse(body);

    // 対象カテゴリを取得
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "カテゴリが見つかりません" },
        { status: 404 }
      );
    }

    // 同じ親を持つ兄弟カテゴリを取得（sortOrder順）
    const siblings = await prisma.category.findMany({
      where: {
        projectId: category.projectId,
        parentId: parentId,
        id: { not: categoryId }, // 自分自身を除く
      },
      orderBy: { sortOrder: "asc" },
    });

    // 新しい順序を計算
    const reorderedSiblings = [...siblings];
    reorderedSiblings.splice(newIndex, 0, category);

    // トランザクションでsortOrderを一括更新
    await prisma.$transaction(
      reorderedSiblings.map((sibling, index) =>
        prisma.category.update({
          where: { id: sibling.id },
          data: { sortOrder: index + 1 },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to reorder categories:", error);
    return NextResponse.json(
      { error: "カテゴリの並び替えに失敗しました" },
      { status: 500 }
    );
  }
}
