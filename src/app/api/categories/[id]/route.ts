import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateCategorySchema = z.object({ name: z.string().min(1).optional(), code: z.string().optional(), sortOrder: z.number().optional() });

interface RouteParams { params: Promise<{ id: string }>; }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const category = await prisma.category.findUnique({
      where: { id }, include: { parent: true, children: { include: { children: { include: { _count: { select: { photos: true } } }, orderBy: { sortOrder: "asc" } }, _count: { select: { photos: true, children: true } } }, orderBy: { sortOrder: "asc" } }, _count: { select: { photos: true, children: true } } },
    });
    if (!category) return NextResponse.json({ error: "カテゴリが見つかりません" }, { status: 404 });
    return NextResponse.json({ category });
  } catch (error) { console.error("Failed to fetch category:", error); return NextResponse.json({ error: "カテゴリの取得に失敗しました" }, { status: 500 }); }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = updateCategorySchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ error: "Invalid input", details: validation.error.issues }, { status: 400 });

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "カテゴリが見つかりません" }, { status: 404 });
    if (existing.isStandard && validation.data.name) return NextResponse.json({ error: "標準カテゴリの名前は変更できません" }, { status: 400 });

    const category = await prisma.category.update({ where: { id }, data: validation.data, include: { _count: { select: { photos: true, children: true } } } });
    return NextResponse.json({ category });
  } catch (error) { console.error("Failed to update category:", error); return NextResponse.json({ error: "カテゴリの更新に失敗しました" }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { photos: true, children: true } } } });
    if (!existing) return NextResponse.json({ error: "カテゴリが見つかりません" }, { status: 404 });
    if (existing._count.photos > 0) return NextResponse.json({ error: `このカテゴリには${existing._count.photos}枚の写真が関連付けられています。先に写真を移動または削除してください。` }, { status: 400 });
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) { console.error("Failed to delete category:", error); return NextResponse.json({ error: "カテゴリの削除に失敗しました" }, { status: 500 }); }
}
