"use client";
import React from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Folder, Image } from "lucide-react";
import type { Category } from "@/types/category";

interface CategoryDragDropProps {
  categories: Category[];
  onReorder: (categoryId: string, newIndex: number, parentId: string | null) => Promise<void>;
}

export function CategoryDragDrop({ categories, onReorder }: CategoryDragDropProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [isReordering, setIsReordering] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activeCategory = activeId
    ? findCategoryById(categories, activeId)
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const activeCategory = findCategoryById(categories, active.id as string);
    const overCategory = findCategoryById(categories, over.id as string);

    if (!activeCategory || !overCategory) return;

    // Only allow reordering within same parent
    if (activeCategory.parentId !== overCategory.parentId) return;

    const siblings = getSiblings(categories, activeCategory.parentId);
    const newIndex = siblings.findIndex((c) => c.id === over.id);

    if (newIndex === -1) return;

    setIsReordering(true);
    try {
      await onReorder(active.id as string, newIndex, activeCategory.parentId);
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={`space-y-1 ${isReordering ? "opacity-50 pointer-events-none" : ""}`}>
        <SortableContext
          items={categories.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {categories.map((category) => (
            <SortableItem
              key={category.id}
              category={category}
              depth={0}
              onReorder={onReorder}
            />
          ))}
        </SortableContext>
      </div>

      <DragOverlay>
        {activeCategory ? (
          <DragOverlayItem category={activeCategory} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

interface SortableItemProps {
  category: Category;
  depth: number;
  onReorder: (categoryId: string, newIndex: number, parentId: string | null) => Promise<void>;
}

function SortableItem({ category, depth, onReorder }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasChildren = category.children && category.children.length > 0;
  const photoCount = category._count?.photos ?? 0;

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${
          isDragging ? "opacity-50 bg-blue-50" : ""
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <button
          className="p-1 rounded hover:bg-gray-200 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </button>

        <Folder className="w-4 h-4 text-yellow-500" />
        <span className="flex-1 text-sm truncate">{category.name}</span>

        {category.code && (
          <span className="text-xs text-gray-500 font-mono">{category.code}</span>
        )}

        {category.isStandard && (
          <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
            標準
          </span>
        )}

        {photoCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Image className="w-3 h-3" />
            {photoCount}
          </span>
        )}
      </div>

      {hasChildren && (
        <SortableContext
          items={category.children!.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {category.children!.map((child) => (
            <SortableItem
              key={child.id}
              category={child}
              depth={depth + 1}
              onReorder={onReorder}
            />
          ))}
        </SortableContext>
      )}
    </div>
  );
}

function DragOverlayItem({ category }: { category: Category }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-md shadow-lg border">
      <GripVertical className="w-4 h-4 text-gray-400" />
      <Folder className="w-4 h-4 text-yellow-500" />
      <span className="text-sm">{category.name}</span>
      {category.code && (
        <span className="text-xs text-gray-500 font-mono">{category.code}</span>
      )}
    </div>
  );
}

function findCategoryById(categories: Category[], id: string): Category | null {
  for (const category of categories) {
    if (category.id === id) return category;
    if (category.children) {
      const found = findCategoryById(category.children, id);
      if (found) return found;
    }
  }
  return null;
}

function getSiblings(categories: Category[], parentId: string | null): Category[] {
  if (parentId === null) return categories;
  const parent = findCategoryById(categories, parentId);
  return parent?.children || [];
}
