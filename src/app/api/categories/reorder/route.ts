import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bulkReorderSchema = z.object({ items: z.array(z.object({ id: z.string().min(1), sortOrder: z.number().min(0), parentId: z.string().nullable().optional() })) });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = bulkReorderSchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ error: "Invalid input", details: validation.error.issues }, { status: 400 });

    const { items } = validation.data;
    await prisma.$transaction(items.map((item) => prisma.category.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder, parentId: item.parentId !== undefined ? item.parentId : undefined } })));
    return NextResponse.json({ success: true, message: `${items.length}件のカテゴリを並び替えました` });
  } catch (error) { console.error("Failed to reorder categories:", error); return NextResponse.json({ error: "カテゴリの並び替えに失敗しました" }, { status: 500 }); }
}
