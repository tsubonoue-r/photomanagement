/**
 * Categories API Routes
 * GET /api/categories - List categories
 * POST /api/categories - Create category
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth, withProjectAccess } from "@/lib/authorization";

const createCategorySchema = z.object({
  name: z.string().min(1, "カテゴリ名は必須です"),
  code: z.string().optional(),
  parentId: z.string().nullable().optional(),
  projectId: z.string(),
  isStandard: z.boolean().optional().default(false),
});

/**
 * GET /api/categories
 * List categories for a project
 * Requires: Authentication + Project VIEWER role
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    // Check project access (VIEWER role for reading)
    const accessError = await withProjectAccess(projectId, "VIEWER");
    if (accessError) return accessError;

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

/**
 * POST /api/categories
 * Create a new category
 * Requires: Authentication + Project MEMBER role
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const body = await request.json();
    const validated = createCategorySchema.parse(body);

    // Check project access (MEMBER role for creating)
    const accessError = await withProjectAccess(validated.projectId, "MEMBER");
    if (accessError) return accessError;

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
        { error: "バリデーションエラー", details: error.issues },
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
