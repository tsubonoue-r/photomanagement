'use client';

import { memo } from 'react';
import type { Category } from '@/types/category';

interface CategoryTreeProps {
  projectId?: string;
  categories?: Category[];
  selectedId?: string;
  onSelect?: (category: Category) => void;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => Promise<void>;
  onAddChild?: (parent: Category) => void;
  expandedIds?: Set<string>;
  onToggleExpand?: (id: string) => void;
}

export const CategoryTree = memo<CategoryTreeProps>(function CategoryTree({
  projectId,
  categories = [],
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onAddChild,
  expandedIds = new Set(),
  onToggleExpand,
}) {
  const renderCategory = (category: Category, level: number = 0) => {
    const isExpanded = expandedIds.has(category.id);
    const isSelected = selectedId === category.id;
    const hasChildren = category.children && category.children.length > 0;

    return (
      <div key={category.id} className="select-none">
        <div
          className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 ${
            isSelected ? 'bg-blue-100' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => onSelect?.(category)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand?.(category.id);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? '-' : '+'}
            </button>
          )}
          {!hasChildren && <span className="w-4" />}
          <span className="flex-1">{category.name}</span>
          <span className="text-xs text-gray-400">
            {category._count?.photos ?? category.photoCount ?? 0}
          </span>
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(category);
              }}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddChild?.(category);
              }}
              className="text-xs text-green-500 hover:text-green-700"
            >
              Add
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(category);
              }}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Del
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {category.children!.map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
      {categories.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">
          No categories yet. Create one to get started.
        </p>
      ) : (
        <div className="space-y-1">
          {categories.map((category) => renderCategory(category, 0))}
        </div>
      )}
    </div>
  );
});

export default CategoryTree;
