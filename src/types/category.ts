/**
 * カテゴリ関連の型定義
 */

export interface Category {
  id: string;
  name: string;
  code: string | null;
  level: number;
  sortOrder: number;
  isStandard: boolean;
  projectId: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  children?: Category[];
  parent?: Category | null;
  _count?: {
    photos: number;
    children: number;
  };
}

export interface CategoryFormData {
  name: string;
  code?: string;
  level: number;
  parentId?: string | null;
}

export interface CategoryCreateInput {
  name: string;
  code?: string;
  level: number;
  sortOrder?: number;
  isStandard?: boolean;
  projectId: string;
  parentId?: string | null;
}

export interface CategoryUpdateInput {
  name?: string;
  code?: string;
  sortOrder?: number;
}

export interface ReorderInput {
  categoryId: string;
  newSortOrder: number;
  newParentId?: string | null;
}

export interface ImportStandardCategoriesInput {
  projectId: string;
  workTypeCodes?: string[];
}

export interface CategoryTreeNode {
  id: string;
  name: string;
  code: string | null;
  level: number;
  sortOrder: number;
  isStandard: boolean;
  parentId: string | null;
  photoCount: number;
  children: CategoryTreeNode[];
}

export interface CategoryListResponse {
  categories: Category[];
  total: number;
}

export interface CategoryTreeResponse {
  tree: CategoryTreeNode[];
}

export interface CategoryResponse {
  category: Category;
}

export const LEVEL_NAMES: Record<number, string> = {
  1: "工種",
  2: "種別",
  3: "細別",
};

export function getLevelName(level: number): string {
  return LEVEL_NAMES[level] || `レベル${level}`;
}
