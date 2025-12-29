/**
 * Category Detail API Routes
 * GET /api/categories/[id] - Get category details
 * PATCH /api/categories/[id] - Update category
 * DELETE /api/categories/[id] - Delete category
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth, withResourceAccess } from "@/lib/authorization";

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  sortOrder: z.number().optional(),
});

/**
 * GET /api/categories/[id]
 * Get category details
 * Requires: Authentication + Project VIEWER role
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await params;

    // Check resource access (category -> project -> VIEWER role)
    const accessError = await withResourceAccess("category", id, "VIEWER");
    if (accessError) return accessError;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
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
    });

    if (!category) {
      return NextResponse.json(
        { error: "カテゴリが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Failed to fetch category:", error);
    return NextResponse.json(
      { error: "カテゴリの取得に失敗しました" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/categories/[id]
 * Update category
 * Requires: Authentication + Project MEMBER role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await params;

    // Check resource access (category -> project -> MEMBER role for updates)
    const accessError = await withResourceAccess("category", id, "MEMBER");
    if (accessError) return accessError;

    const body = await request.json();
    const validated = updateCategorySchema.parse(body);

    // 標準カテゴリは編集不可
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "カテゴリが見つかりません" },
        { status: 404 }
      );
    }

    if (existing.isStandard && validated.name) {
      return NextResponse.json(
        { error: "標準カテゴリの名前は編集できません" },
        { status: 400 }
      );
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: validated.name,
        code: validated.code,
        sortOrder: validated.sortOrder,
      },
      include: {
        _count: { select: { photos: true, children: true } },
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "バリデーションエラー", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to update category:", error);
    return NextResponse.json(
      { error: "カテゴリの更新に失敗しました" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories/[id]
 * Delete category
 * Requires: Authentication + Project MANAGER role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await params;

    // Check resource access (category -> project -> MANAGER role for delete)
    const accessError = await withResourceAccess("category", id, "MANAGER");
    if (accessError) return accessError;

    // 子カテゴリや写真が紐づいている場合は削除不可
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { children: true, photos: true } },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "カテゴリが見つかりません" },
        { status: 404 }
      );
    }

    if (category._count.children > 0) {
      return NextResponse.json(
        { error: "子カテゴリが存在するため削除できません" },
        { status: 400 }
      );
    }

    if (category._count.photos > 0) {
      return NextResponse.json(
        { error: "写真が紐づいているため削除できません" },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json(
      { error: "カテゴリの削除に失敗しました" },
      { status: 500 }
    );
  }
}
