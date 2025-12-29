/**
 * 国土交通省 電子納品要領 工種・種別・細別マスタデータ
 */

export interface StandardCategory {
  code: string;
  name: string;
  level: 1 | 2 | 3;
  parentCode?: string;
}

export const standardCategories: StandardCategory[] = [
  { code: "1", name: "着工前及び完成写真", level: 1 },
  { code: "1-1", name: "着工前", level: 2, parentCode: "1" },
  { code: "1-1-1", name: "着工前写真", level: 3, parentCode: "1-1" },
  { code: "1-2", name: "完成", level: 2, parentCode: "1" },
  { code: "1-2-1", name: "完成写真", level: 3, parentCode: "1-2" },
  { code: "2", name: "施工状況写真", level: 1 },
  { code: "2-1", name: "土工", level: 2, parentCode: "2" },
  { code: "2-1-1", name: "掘削工", level: 3, parentCode: "2-1" },
  { code: "2-1-2", name: "盛土工", level: 3, parentCode: "2-1" },
  { code: "2-2", name: "基礎工", level: 2, parentCode: "2" },
  { code: "2-2-1", name: "既製杭工", level: 3, parentCode: "2-2" },
  { code: "2-2-2", name: "場所打ち杭工", level: 3, parentCode: "2-2" },
  { code: "2-3", name: "躯体工", level: 2, parentCode: "2" },
  { code: "2-3-1", name: "鉄筋工", level: 3, parentCode: "2-3" },
  { code: "2-3-2", name: "コンクリート工", level: 3, parentCode: "2-3" },
  { code: "2-4", name: "舗装工", level: 2, parentCode: "2" },
  { code: "2-4-1", name: "アスファルト舗装工", level: 3, parentCode: "2-4" },
  { code: "3", name: "安全管理写真", level: 1 },
  { code: "3-1", name: "安全施設", level: 2, parentCode: "3" },
  { code: "3-1-1", name: "バリケード", level: 3, parentCode: "3-1" },
  { code: "4", name: "使用材料写真", level: 1 },
  { code: "4-1", name: "材料搬入", level: 2, parentCode: "4" },
  { code: "4-1-1", name: "鉄筋搬入", level: 3, parentCode: "4-1" },
  { code: "5", name: "品質管理写真", level: 1 },
  { code: "5-1", name: "出来形管理", level: 2, parentCode: "5" },
  { code: "5-1-1", name: "寸法測定", level: 3, parentCode: "5-1" },
  { code: "6", name: "出来形管理写真", level: 1 },
  { code: "6-1", name: "測定状況", level: 2, parentCode: "6" },
  { code: "6-1-1", name: "測量状況", level: 3, parentCode: "6-1" },
  { code: "7", name: "災害写真", level: 1 },
  { code: "7-1", name: "災害状況", level: 2, parentCode: "7" },
  { code: "7-1-1", name: "被災状況", level: 3, parentCode: "7-1" },
  { code: "8", name: "その他", level: 1 },
  { code: "8-1", name: "打合せ", level: 2, parentCode: "8" },
  { code: "8-1-1", name: "定例会議", level: 3, parentCode: "8-1" },
];

export function getWorkTypes(): StandardCategory[] { return standardCategories.filter(cat => cat.level === 1); }
