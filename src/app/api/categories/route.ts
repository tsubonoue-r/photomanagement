import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createCategorySchema = z.object({
  name: z.string().min(1), code: z.string().optional(), level: z.number().min(1).max(3),
  sortOrder: z.number().optional(), isStandard: z.boolean().optional(),
  projectId: z.string().min(1), parentId: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const parentId = searchParams.get("parentId");
    const includeChildren = searchParams.get("includeChildren") === "true";

    if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

    const where: { projectId: string; parentId?: string | null } = { projectId };
    if (parentId !== null) where.parentId = parentId === "null" ? null : parentId;

    if (includeChildren) {
      const categories = await prisma.category.findMany({
        where, include: { children: { include: { children: { include: { _count: { select: { photos: true } } }, orderBy: { sortOrder: "asc" } }, _count: { select: { photos: true, children: true } } }, orderBy: { sortOrder: "asc" } }, _count: { select: { photos: true, children: true } } }, orderBy: { sortOrder: "asc" },
      });
      return NextResponse.json({ categories, total: categories.length });
    }

    const categories = await prisma.category.findMany({ where, include: { _count: { select: { photos: true, children: true } } }, orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ categories, total: categories.length });
  } catch (error) { console.error("Failed to fetch categories:", error); return NextResponse.json({ error: "カテゴリの取得に失敗しました" }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = createCategorySchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ error: "Invalid input", details: validation.error.issues }, { status: 400 });

    const { name, code, level, sortOrder, isStandard, projectId, parentId } = validation.data;
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "プロジェクトが見つかりません" }, { status: 404 });

    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId } });
      if (!parent) return NextResponse.json({ error: "親カテゴリが見つかりません" }, { status: 404 });
      if (parent.level >= level) return NextResponse.json({ error: "子カテゴリのレベルは親より大きくなければなりません" }, { status: 400 });
    }

    const maxSortOrder = await prisma.category.aggregate({ where: { projectId, parentId: parentId || null }, _max: { sortOrder: true } });
    const newSortOrder = sortOrder ?? (maxSortOrder._max.sortOrder ?? 0) + 1;

    const category = await prisma.category.create({
      data: { name, code, level, sortOrder: newSortOrder, isStandard: isStandard ?? false, projectId, parentId: parentId || null },
      include: { _count: { select: { photos: true, children: true } } },
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) { console.error("Failed to create category:", error); return NextResponse.json({ error: "カテゴリの作成に失敗しました" }, { status: 500 }); }
}
