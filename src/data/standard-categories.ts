/**
 * 国土交通省 電子納品要領 工種・種別・細別マスタデータ
 *
 * 階層構造:
 * - 工種 (Level 1): 大分類
 * - 種別 (Level 2): 中分類
 * - 細別 (Level 3): 小分類
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

/**
 * 国交省標準カテゴリ（フラット形式）
 */
export const standardCategories: StandardCategory[] = [
  // ============================================
  // 工種 1: 着工前及び完成写真
  // ============================================
  { code: "1", name: "着工前及び完成写真", level: 1 },
  { code: "1-1", name: "着工前", level: 2, parentCode: "1" },
  { code: "1-1-1", name: "着工前写真", level: 3, parentCode: "1-1" },
  { code: "1-2", name: "完成", level: 2, parentCode: "1" },
  { code: "1-2-1", name: "完成写真", level: 3, parentCode: "1-2" },

  // ============================================
  // 工種 2: 施工状況写真
  // ============================================
  { code: "2", name: "施工状況写真", level: 1 },

  // 種別 2-1: 土工
  { code: "2-1", name: "土工", level: 2, parentCode: "2" },
  { code: "2-1-1", name: "掘削工", level: 3, parentCode: "2-1" },
  { code: "2-1-2", name: "盛土工", level: 3, parentCode: "2-1" },
  { code: "2-1-3", name: "路体・路床工", level: 3, parentCode: "2-1" },
  { code: "2-1-4", name: "残土処理工", level: 3, parentCode: "2-1" },

  // 種別 2-2: 基礎工
  { code: "2-2", name: "基礎工", level: 2, parentCode: "2" },
  { code: "2-2-1", name: "既製杭工", level: 3, parentCode: "2-2" },
  { code: "2-2-2", name: "場所打ち杭工", level: 3, parentCode: "2-2" },
  { code: "2-2-3", name: "深礎工", level: 3, parentCode: "2-2" },
  { code: "2-2-4", name: "オープンケーソン工", level: 3, parentCode: "2-2" },
  { code: "2-2-5", name: "ニューマチックケーソン工", level: 3, parentCode: "2-2" },
  { code: "2-2-6", name: "鋼管矢板基礎工", level: 3, parentCode: "2-2" },
  { code: "2-2-7", name: "地中連続壁基礎工", level: 3, parentCode: "2-2" },

  // 種別 2-3: 躯体工
  { code: "2-3", name: "躯体工", level: 2, parentCode: "2" },
  { code: "2-3-1", name: "鉄筋工", level: 3, parentCode: "2-3" },
  { code: "2-3-2", name: "型枠工", level: 3, parentCode: "2-3" },
  { code: "2-3-3", name: "コンクリート工", level: 3, parentCode: "2-3" },
  { code: "2-3-4", name: "プレキャスト工", level: 3, parentCode: "2-3" },

  // 種別 2-4: 橋梁上部工
  { code: "2-4", name: "橋梁上部工", level: 2, parentCode: "2" },
  { code: "2-4-1", name: "PC橋工", level: 3, parentCode: "2-4" },
  { code: "2-4-2", name: "鋼橋工", level: 3, parentCode: "2-4" },
  { code: "2-4-3", name: "RC橋工", level: 3, parentCode: "2-4" },

  // 種別 2-5: 舗装工
  { code: "2-5", name: "舗装工", level: 2, parentCode: "2" },
  { code: "2-5-1", name: "アスファルト舗装工", level: 3, parentCode: "2-5" },
  { code: "2-5-2", name: "コンクリート舗装工", level: 3, parentCode: "2-5" },
  { code: "2-5-3", name: "路盤工", level: 3, parentCode: "2-5" },

  // 種別 2-6: 排水工
  { code: "2-6", name: "排水工", level: 2, parentCode: "2" },
  { code: "2-6-1", name: "側溝工", level: 3, parentCode: "2-6" },
  { code: "2-6-2", name: "集水桝工", level: 3, parentCode: "2-6" },
  { code: "2-6-3", name: "暗渠工", level: 3, parentCode: "2-6" },
  { code: "2-6-4", name: "管渠工", level: 3, parentCode: "2-6" },

  // 種別 2-7: 法面工
  { code: "2-7", name: "法面工", level: 2, parentCode: "2" },
  { code: "2-7-1", name: "法面保護工", level: 3, parentCode: "2-7" },
  { code: "2-7-2", name: "法面緑化工", level: 3, parentCode: "2-7" },
  { code: "2-7-3", name: "法枠工", level: 3, parentCode: "2-7" },
  { code: "2-7-4", name: "アンカー工", level: 3, parentCode: "2-7" },

  // 種別 2-8: 擁壁工
  { code: "2-8", name: "擁壁工", level: 2, parentCode: "2" },
  { code: "2-8-1", name: "RC擁壁工", level: 3, parentCode: "2-8" },
  { code: "2-8-2", name: "重力式擁壁工", level: 3, parentCode: "2-8" },
  { code: "2-8-3", name: "補強土擁壁工", level: 3, parentCode: "2-8" },
  { code: "2-8-4", name: "ブロック積擁壁工", level: 3, parentCode: "2-8" },

  // 種別 2-9: トンネル工
  { code: "2-9", name: "トンネル工", level: 2, parentCode: "2" },
  { code: "2-9-1", name: "掘削工", level: 3, parentCode: "2-9" },
  { code: "2-9-2", name: "支保工", level: 3, parentCode: "2-9" },
  { code: "2-9-3", name: "覆工", level: 3, parentCode: "2-9" },
  { code: "2-9-4", name: "インバート工", level: 3, parentCode: "2-9" },

  // 種別 2-10: 河川工
  { code: "2-10", name: "河川工", level: 2, parentCode: "2" },
  { code: "2-10-1", name: "護岸工", level: 3, parentCode: "2-10" },
  { code: "2-10-2", name: "根固工", level: 3, parentCode: "2-10" },
  { code: "2-10-3", name: "水制工", level: 3, parentCode: "2-10" },
  { code: "2-10-4", name: "床止工", level: 3, parentCode: "2-10" },

  // 種別 2-11: 海岸・港湾工
  { code: "2-11", name: "海岸・港湾工", level: 2, parentCode: "2" },
  { code: "2-11-1", name: "防波堤工", level: 3, parentCode: "2-11" },
  { code: "2-11-2", name: "岸壁工", level: 3, parentCode: "2-11" },
  { code: "2-11-3", name: "護岸工", level: 3, parentCode: "2-11" },
  { code: "2-11-4", name: "消波工", level: 3, parentCode: "2-11" },

  // 種別 2-12: 仮設工
  { code: "2-12", name: "仮設工", level: 2, parentCode: "2" },
  { code: "2-12-1", name: "土留工", level: 3, parentCode: "2-12" },
  { code: "2-12-2", name: "仮桟橋工", level: 3, parentCode: "2-12" },
  { code: "2-12-3", name: "仮設道路工", level: 3, parentCode: "2-12" },
  { code: "2-12-4", name: "足場工", level: 3, parentCode: "2-12" },

  // ============================================
  // 工種 3: 安全管理写真
  // ============================================
  { code: "3", name: "安全管理写真", level: 1 },
  { code: "3-1", name: "安全施設", level: 2, parentCode: "3" },
  { code: "3-1-1", name: "バリケード", level: 3, parentCode: "3-1" },
  { code: "3-1-2", name: "仮囲い", level: 3, parentCode: "3-1" },
  { code: "3-1-3", name: "安全標識", level: 3, parentCode: "3-1" },
  { code: "3-1-4", name: "照明設備", level: 3, parentCode: "3-1" },
  { code: "3-2", name: "安全教育", level: 2, parentCode: "3" },
  { code: "3-2-1", name: "新規入場者教育", level: 3, parentCode: "3-2" },
  { code: "3-2-2", name: "定期安全教育", level: 3, parentCode: "3-2" },
  { code: "3-2-3", name: "特別教育", level: 3, parentCode: "3-2" },
  { code: "3-3", name: "安全巡視", level: 2, parentCode: "3" },
  { code: "3-3-1", name: "日常点検", level: 3, parentCode: "3-3" },
  { code: "3-3-2", name: "安全パトロール", level: 3, parentCode: "3-3" },

  // ============================================
  // 工種 4: 使用材料写真
  // ============================================
  { code: "4", name: "使用材料写真", level: 1 },
  { code: "4-1", name: "材料搬入", level: 2, parentCode: "4" },
  { code: "4-1-1", name: "鉄筋搬入", level: 3, parentCode: "4-1" },
  { code: "4-1-2", name: "セメント搬入", level: 3, parentCode: "4-1" },
  { code: "4-1-3", name: "骨材搬入", level: 3, parentCode: "4-1" },
  { code: "4-1-4", name: "鋼材搬入", level: 3, parentCode: "4-1" },
  { code: "4-2", name: "材料保管", level: 2, parentCode: "4" },
  { code: "4-2-1", name: "材料保管状況", level: 3, parentCode: "4-2" },
  { code: "4-2-2", name: "品質管理状況", level: 3, parentCode: "4-2" },
  { code: "4-3", name: "試験成績", level: 2, parentCode: "4" },
  { code: "4-3-1", name: "ミルシート", level: 3, parentCode: "4-3" },
  { code: "4-3-2", name: "試験結果", level: 3, parentCode: "4-3" },

  // ============================================
  // 工種 5: 品質管理写真
  // ============================================
  { code: "5", name: "品質管理写真", level: 1 },
  { code: "5-1", name: "出来形管理", level: 2, parentCode: "5" },
  { code: "5-1-1", name: "寸法測定", level: 3, parentCode: "5-1" },
  { code: "5-1-2", name: "高さ測定", level: 3, parentCode: "5-1" },
  { code: "5-1-3", name: "勾配測定", level: 3, parentCode: "5-1" },
  { code: "5-2", name: "品質試験", level: 2, parentCode: "5" },
  { code: "5-2-1", name: "スランプ試験", level: 3, parentCode: "5-2" },
  { code: "5-2-2", name: "空気量試験", level: 3, parentCode: "5-2" },
  { code: "5-2-3", name: "圧縮強度試験", level: 3, parentCode: "5-2" },
  { code: "5-2-4", name: "現場密度試験", level: 3, parentCode: "5-2" },
  { code: "5-3", name: "配合管理", level: 2, parentCode: "5" },
  { code: "5-3-1", name: "配合計画書", level: 3, parentCode: "5-3" },
  { code: "5-3-2", name: "練り混ぜ記録", level: 3, parentCode: "5-3" },

  // ============================================
  // 工種 6: 出来形管理写真
  // ============================================
  { code: "6", name: "出来形管理写真", level: 1 },
  { code: "6-1", name: "測定状況", level: 2, parentCode: "6" },
  { code: "6-1-1", name: "測量状況", level: 3, parentCode: "6-1" },
  { code: "6-1-2", name: "検測状況", level: 3, parentCode: "6-1" },
  { code: "6-2", name: "寸法確認", level: 2, parentCode: "6" },
  { code: "6-2-1", name: "幅員確認", level: 3, parentCode: "6-2" },
  { code: "6-2-2", name: "厚さ確認", level: 3, parentCode: "6-2" },
  { code: "6-2-3", name: "延長確認", level: 3, parentCode: "6-2" },

  // ============================================
  // 工種 7: 災害写真
  // ============================================
  { code: "7", name: "災害写真", level: 1 },
  { code: "7-1", name: "災害状況", level: 2, parentCode: "7" },
  { code: "7-1-1", name: "被災状況", level: 3, parentCode: "7-1" },
  { code: "7-1-2", name: "応急対策", level: 3, parentCode: "7-1" },
  { code: "7-1-3", name: "復旧状況", level: 3, parentCode: "7-1" },

  // ============================================
  // 工種 8: その他
  // ============================================
  { code: "8", name: "その他", level: 1 },
  { code: "8-1", name: "打合せ", level: 2, parentCode: "8" },
  { code: "8-1-1", name: "定例会議", level: 3, parentCode: "8-1" },
  { code: "8-1-2", name: "立会検査", level: 3, parentCode: "8-1" },
  { code: "8-2", name: "その他記録", level: 2, parentCode: "8" },
  { code: "8-2-1", name: "一般記録", level: 3, parentCode: "8-2" },
];

/**
 * フラット形式をツリー形式に変換
 */
export function buildCategoryTree(categories: StandardCategory[]): StandardCategoryHierarchy[] {
  const codeToCategory = new Map<string, StandardCategoryHierarchy>();

  // 全カテゴリをマップに格納
  categories.forEach(cat => {
    codeToCategory.set(cat.code, {
      code: cat.code,
      name: cat.name,
      level: cat.level,
      children: [],
    });
  });

  const roots: StandardCategoryHierarchy[] = [];

  // 親子関係を構築
  categories.forEach(cat => {
    const node = codeToCategory.get(cat.code)!;
    if (cat.parentCode) {
      const parent = codeToCategory.get(cat.parentCode);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

/**
 * カテゴリツリーを取得
 */
export function getStandardCategoryTree(): StandardCategoryHierarchy[] {
  return buildCategoryTree(standardCategories);
}

/**
 * 工種（Level 1）のみを取得
 */
export function getWorkTypes(): StandardCategory[] {
  return standardCategories.filter(cat => cat.level === 1);
}

/**
 * 特定の工種配下の種別を取得
 */
export function getSubTypes(workTypeCode: string): StandardCategory[] {
  return standardCategories.filter(
    cat => cat.level === 2 && cat.parentCode === workTypeCode
  );
}

/**
 * 特定の種別配下の細別を取得
 */
export function getDetails(subTypeCode: string): StandardCategory[] {
  return standardCategories.filter(
    cat => cat.level === 3 && cat.parentCode === subTypeCode
  );
}

/**
 * コードからカテゴリを検索
 */
export function findCategoryByCode(code: string): StandardCategory | undefined {
  return standardCategories.find(cat => cat.code === code);
}

/**
 * 名前でカテゴリを検索（部分一致）
 */
export function searchCategoriesByName(keyword: string): StandardCategory[] {
  const lowerKeyword = keyword.toLowerCase();
  return standardCategories.filter(cat =>
    cat.name.toLowerCase().includes(lowerKeyword)
  );
}
