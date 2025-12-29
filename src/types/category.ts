/**
 * Category Types
 * For photo categorization in construction projects
 */

export interface Category {
  id: string;
  name: string;
  code?: string;
  description?: string;
  parentId?: string | null;
  projectId: string;
  order: number;
  level: number;
  path: string;
  photoCount: number;
  isStandard?: boolean;
  children?: Category[];
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    children?: number;
    photos?: number;
  };
}

export interface CategoryFormData {
  name: string;
  code?: string;
  description?: string;
  parentId?: string | null;
}

export interface CategoryCreateInput {
  name: string;
  description?: string;
  parentId?: string | null;
  projectId: string;
}

export interface CategoryUpdateInput {
  name?: string;
  description?: string;
  parentId?: string | null;
  order?: number;
}

export interface CategoryReorderInput {
  categoryId: string;
  order: number;
  parentId?: string | null;
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
}

export interface CategoryListResponse {
  categories: Category[];
  total: number;
}

export interface StandardCategory {
  id: string;
  name: string;
  description: string;
  children?: StandardCategory[];
}

export const CONSTRUCTION_STANDARD_CATEGORIES: StandardCategory[] = [
  {
    id: 'exterior',
    name: 'Exterior',
    description: 'Exterior construction work',
    children: [
      { id: 'foundation', name: 'Foundation', description: 'Foundation work' },
      { id: 'framing', name: 'Framing', description: 'Structural framing' },
      { id: 'roofing', name: 'Roofing', description: 'Roof installation' },
      { id: 'siding', name: 'Siding', description: 'Exterior siding' },
    ],
  },
  {
    id: 'interior',
    name: 'Interior',
    description: 'Interior construction work',
    children: [
      { id: 'electrical', name: 'Electrical', description: 'Electrical work' },
      { id: 'plumbing', name: 'Plumbing', description: 'Plumbing work' },
      { id: 'hvac', name: 'HVAC', description: 'Heating and cooling' },
      { id: 'drywall', name: 'Drywall', description: 'Drywall installation' },
      { id: 'flooring', name: 'Flooring', description: 'Floor installation' },
    ],
  },
  {
    id: 'site',
    name: 'Site Work',
    description: 'Site preparation and landscaping',
    children: [
      { id: 'grading', name: 'Grading', description: 'Site grading' },
      { id: 'paving', name: 'Paving', description: 'Paving and concrete' },
      { id: 'landscaping', name: 'Landscaping', description: 'Landscaping' },
    ],
  },
];
