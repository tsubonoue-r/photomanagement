import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { standardCategories, type StandardCategory } from "@/data/standard-categories";

const importSchema = z.object({ projectId: z.string().min(1), workTypeCodes: z.array(z.string()).optional() });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = importSchema.safeParse(body);
    if (!validation.success) return NextResponse.json({ error: "Invalid input", details: validation.error.issues }, { status: 400 });

    const { projectId, workTypeCodes } = validation.data;
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "プロジェクトが見つかりません" }, { status: 404 });

    let categoriesToImport: StandardCategory[];
    if (workTypeCodes && workTypeCodes.length > 0) {
      const selectedWorkTypes = new Set(workTypeCodes);
      categoriesToImport = standardCategories.filter((cat) => {
        if (cat.level === 1) return selectedWorkTypes.has(cat.code);
        let currentCode = cat.parentCode;
        while (currentCode) {
          if (selectedWorkTypes.has(currentCode)) return true;
          const parent = standardCategories.find((c) => c.code === currentCode);
          currentCode = parent?.parentCode;
        }
        return false;
      });
    } else { categoriesToImport = standardCategories; }

    const existingCategories = await prisma.category.findMany({ where: { projectId, isStandard: true }, select: { code: true } });
    const existingCodes = new Set(existingCategories.map((c) => c.code));
    const newCategories = categoriesToImport.filter((cat) => !existingCodes.has(cat.code));

    if (newCategories.length === 0) return NextResponse.json({ success: true, message: "すべての標準カテゴリは既にインポート済みです", imported: 0 });

    const codeToId = new Map<string, string>();
    const existingWithIds = await prisma.category.findMany({ where: { projectId, isStandard: true, code: { not: null } }, select: { id: true, code: true } });
    existingWithIds.forEach((c) => { if (c.code) codeToId.set(c.code, c.id); });

    const sortedCategories = [...newCategories].sort((a, b) => a.level - b.level);
    let importedCount = 0;

    for (const cat of sortedCategories) {
      let parentId: string | null = null;
      if (cat.parentCode) { parentId = codeToId.get(cat.parentCode) || null; if (!parentId) continue; }
      const maxSortOrder = await prisma.category.aggregate({ where: { projectId, parentId }, _max: { sortOrder: true } });
      const newSortOrder = (maxSortOrder._max.sortOrder ?? 0) + 1;
      const created = await prisma.category.create({ data: { name: cat.name, code: cat.code, level: cat.level, sortOrder: newSortOrder, isStandard: true, projectId, parentId } });
      codeToId.set(cat.code, created.id);
      importedCount++;
    }
    return NextResponse.json({ success: true, message: `${importedCount}件の標準カテゴリをインポートしました`, imported: importedCount, skipped: existingCodes.size });
  } catch (error) { console.error("Failed to import standard categories:", error); return NextResponse.json({ error: "標準カテゴリのインポートに失敗しました" }, { status: 500 }); }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const workTypes = standardCategories.filter((cat) => cat.level === 1);
    let importedCodes: Set<string> = new Set();
    if (projectId) {
      const imported = await prisma.category.findMany({ where: { projectId, isStandard: true }, select: { code: true } });
      importedCodes = new Set(imported.map((c) => c.code).filter(Boolean) as string[]);
    }
    const result = workTypes.map((wt) => ({
      code: wt.code, name: wt.name, isImported: importedCodes.has(wt.code),
      subTypesCount: standardCategories.filter((c) => c.level === 2 && c.parentCode === wt.code).length,
      totalCount: countDescendants(wt.code),
    }));
    return NextResponse.json({ workTypes: result, total: workTypes.length });
  } catch (error) { console.error("Failed to fetch standard categories:", error); return NextResponse.json({ error: "標準カテゴリの取得に失敗しました" }, { status: 500 }); }
}

function countDescendants(workTypeCode: string): number {
  let count = 0; const queue = [workTypeCode];
  while (queue.length > 0) { const code = queue.shift()!; const children = standardCategories.filter((c) => c.parentCode === code); count += children.length; queue.push(...children.map((c) => c.code)); }
  return count + 1;
}
