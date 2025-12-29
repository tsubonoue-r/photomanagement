import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createCategorySchema = z.object({
  name: z.string().min(1, "カテゴリ名は必須です"),
  code: z.string().optional(),
  level: z.number().min(1).max(3),
  parentId: z.string().nullable().optional(),
  projectId: z.string(),
  isStandard: z.boolean().optional().default(false),
});

// GET /api/categories - カテゴリ一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    // 親カテゴリから再帰的に取得
    const categories = await prisma.category.findMany({
      where: {
        projectId,
        parentId: null, // ルートカテゴリのみ
      },
      include: {
        children: {
          include: {
            children: {
              include: {
                _count: { select: { photos: true } },
              },
              orderBy: { sortOrder: "asc" },
            },
            _count: { select: { photos: true, children: true } },
          },
          orderBy: { sortOrder: "asc" },
        },
        _count: { select: { photos: true, children: true } },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ categories, total: categories.length });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { error: "カテゴリの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST /api/categories - カテゴリ作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createCategorySchema.parse(body);

    // 同じ親の下で最大のsortOrderを取得
    const maxSortOrder = await prisma.category.aggregate({
      where: {
        projectId: validated.projectId,
        parentId: validated.parentId ?? null,
      },
      _max: { sortOrder: true },
    });

    const category = await prisma.category.create({
      data: {
        name: validated.name,
        code: validated.code || null,
        level: validated.level,
        sortOrder: (maxSortOrder._max.sortOrder ?? 0) + 1,
        isStandard: validated.isStandard,
        projectId: validated.projectId,
        parentId: validated.parentId ?? null,
      },
      include: {
        _count: { select: { photos: true, children: true } },
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Failed to create category:", error);
    return NextResponse.json(
      { error: "カテゴリの作成に失敗しました" },
      { status: 500 }
    );
  }
}
