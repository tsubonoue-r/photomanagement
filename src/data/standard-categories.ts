/**
 * 国土交通省 電子納品要領 工種・種別・細別マスタデータ
 */

export interface StandardCategory {
  code: string;
  name: string;
  level: 1 | 2 | 3;
  parentCode?: string;
}

export interface StandardCategoryHierarchy {
  code: string;
  name: string;
  level: 1 | 2 | 3;
  children?: StandardCategoryHierarchy[];
}

export const standardCategories: StandardCategory[] = [
  // 工種 1: 着工前及び完成写真
  { code: "1", name: "着工前及び完成写真", level: 1 },
  { code: "1-1", name: "着工前", level: 2, parentCode: "1" },
  { code: "1-1-1", name: "着工前写真", level: 3, parentCode: "1-1" },
  { code: "1-2", name: "完成", level: 2, parentCode: "1" },
  { code: "1-2-1", name: "完成写真", level: 3, parentCode: "1-2" },

  // 工種 2: 施工状況写真
  { code: "2", name: "施工状況写真", level: 1 },
  { code: "2-1", name: "土工", level: 2, parentCode: "2" },
  { code: "2-1-1", name: "掘削工", level: 3, parentCode: "2-1" },
  { code: "2-1-2", name: "盛土工", level: 3, parentCode: "2-1" },
  { code: "2-1-3", name: "路体・路床工", level: 3, parentCode: "2-1" },
  { code: "2-1-4", name: "残土処理工", level: 3, parentCode: "2-1" },
  { code: "2-2", name: "基礎工", level: 2, parentCode: "2" },
  { code: "2-2-1", name: "既製杭工", level: 3, parentCode: "2-2" },
  { code: "2-2-2", name: "場所打ち杭工", level: 3, parentCode: "2-2" },
  { code: "2-2-3", name: "深礎工", level: 3, parentCode: "2-2" },
  { code: "2-3", name: "躯体工", level: 2, parentCode: "2" },
  { code: "2-3-1", name: "鉄筋工", level: 3, parentCode: "2-3" },
  { code: "2-3-2", name: "型枠工", level: 3, parentCode: "2-3" },
  { code: "2-3-3", name: "コンクリート工", level: 3, parentCode: "2-3" },
  { code: "2-4", name: "橋梁上部工", level: 2, parentCode: "2" },
  { code: "2-4-1", name: "PC橋工", level: 3, parentCode: "2-4" },
  { code: "2-4-2", name: "鋼橋工", level: 3, parentCode: "2-4" },
  { code: "2-5", name: "舗装工", level: 2, parentCode: "2" },
  { code: "2-5-1", name: "アスファルト舗装工", level: 3, parentCode: "2-5" },
  { code: "2-5-2", name: "コンクリート舗装工", level: 3, parentCode: "2-5" },
  { code: "2-6", name: "排水工", level: 2, parentCode: "2" },
  { code: "2-6-1", name: "側溝工", level: 3, parentCode: "2-6" },
  { code: "2-6-2", name: "集水桝工", level: 3, parentCode: "2-6" },
  { code: "2-7", name: "法面工", level: 2, parentCode: "2" },
  { code: "2-7-1", name: "法面保護工", level: 3, parentCode: "2-7" },
  { code: "2-7-2", name: "法面緑化工", level: 3, parentCode: "2-7" },
  { code: "2-8", name: "擁壁工", level: 2, parentCode: "2" },
  { code: "2-8-1", name: "RC擁壁工", level: 3, parentCode: "2-8" },
  { code: "2-8-2", name: "重力式擁壁工", level: 3, parentCode: "2-8" },

  // 工種 3: 安全管理写真
  { code: "3", name: "安全管理写真", level: 1 },
  { code: "3-1", name: "安全施設", level: 2, parentCode: "3" },
  { code: "3-1-1", name: "バリケード", level: 3, parentCode: "3-1" },
  { code: "3-1-2", name: "仮囲い", level: 3, parentCode: "3-1" },
  { code: "3-2", name: "安全教育", level: 2, parentCode: "3" },
  { code: "3-2-1", name: "新規入場者教育", level: 3, parentCode: "3-2" },
  { code: "3-2-2", name: "定期安全教育", level: 3, parentCode: "3-2" },

  // 工種 4: 使用材料写真
  { code: "4", name: "使用材料写真", level: 1 },
  { code: "4-1", name: "材料搬入", level: 2, parentCode: "4" },
  { code: "4-1-1", name: "鉄筋搬入", level: 3, parentCode: "4-1" },
  { code: "4-1-2", name: "セメント搬入", level: 3, parentCode: "4-1" },
  { code: "4-2", name: "材料保管", level: 2, parentCode: "4" },
  { code: "4-2-1", name: "材料保管状況", level: 3, parentCode: "4-2" },

  // 工種 5: 品質管理写真
  { code: "5", name: "品質管理写真", level: 1 },
  { code: "5-1", name: "出来形管理", level: 2, parentCode: "5" },
  { code: "5-1-1", name: "寸法測定", level: 3, parentCode: "5-1" },
  { code: "5-2", name: "品質試験", level: 2, parentCode: "5" },
  { code: "5-2-1", name: "スランプ試験", level: 3, parentCode: "5-2" },
  { code: "5-2-2", name: "圧縮強度試験", level: 3, parentCode: "5-2" },

  // 工種 6: 出来形管理写真
  { code: "6", name: "出来形管理写真", level: 1 },
  { code: "6-1", name: "測定状況", level: 2, parentCode: "6" },
  { code: "6-1-1", name: "測量状況", level: 3, parentCode: "6-1" },
  { code: "6-2", name: "寸法確認", level: 2, parentCode: "6" },
  { code: "6-2-1", name: "幅員確認", level: 3, parentCode: "6-2" },

  // 工種 7: 災害写真
  { code: "7", name: "災害写真", level: 1 },
  { code: "7-1", name: "災害状況", level: 2, parentCode: "7" },
  { code: "7-1-1", name: "被災状況", level: 3, parentCode: "7-1" },

  // 工種 8: その他
  { code: "8", name: "その他", level: 1 },
  { code: "8-1", name: "打合せ", level: 2, parentCode: "8" },
  { code: "8-1-1", name: "定例会議", level: 3, parentCode: "8-1" },
  { code: "8-2", name: "その他記録", level: 2, parentCode: "8" },
  { code: "8-2-1", name: "一般記録", level: 3, parentCode: "8-2" },
];

export function buildCategoryTree(categories: StandardCategory[]): StandardCategoryHierarchy[] {
  const codeToCategory = new Map<string, StandardCategoryHierarchy>();
  categories.forEach(cat => {
    codeToCategory.set(cat.code, { code: cat.code, name: cat.name, level: cat.level, children: [] });
  });
  const roots: StandardCategoryHierarchy[] = [];
  categories.forEach(cat => {
    const node = codeToCategory.get(cat.code)!;
    if (cat.parentCode) {
      const parent = codeToCategory.get(cat.parentCode);
      if (parent) { parent.children = parent.children || []; parent.children.push(node); }
    } else { roots.push(node); }
  });
  return roots;
}

export function getStandardCategoryTree(): StandardCategoryHierarchy[] { return buildCategoryTree(standardCategories); }
export function getWorkTypes(): StandardCategory[] { return standardCategories.filter(cat => cat.level === 1); }
export function getSubTypes(workTypeCode: string): StandardCategory[] { return standardCategories.filter(cat => cat.level === 2 && cat.parentCode === workTypeCode); }
export function getDetails(subTypeCode: string): StandardCategory[] { return standardCategories.filter(cat => cat.level === 3 && cat.parentCode === subTypeCode); }
export function findCategoryByCode(code: string): StandardCategory | undefined { return standardCategories.find(cat => cat.code === code); }
export function searchCategoriesByName(keyword: string): StandardCategory[] { const lowerKeyword = keyword.toLowerCase(); return standardCategories.filter(cat => cat.name.toLowerCase().includes(lowerKeyword)); }
