"use client";

import React, { useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Folder, FolderOpen, ChevronRight, ChevronDown, Image } from "lucide-react";
import type { Category } from "@/types/category";

interface CategoryDragDropProps {
  categories: Category[];
  onReorder: (items: { id: string; sortOrder: number }[]) => Promise<void>;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
}

export function CategoryDragDrop({ categories, onReorder, expandedIds, onToggleExpand }: CategoryDragDropProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [items, setItems] = useState(categories);

  React.useEffect(() => { setItems(categories); }, [categories]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => { setActiveId(event.active.id as string); };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);
    const reorderData = newItems.map((item, index) => ({ id: item.id, sortOrder: index }));
    try { await onReorder(reorderData); } catch { setItems(categories); }
  };

  const activeItem = activeId ? items.find((item) => item.id === activeId) : null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">{items.map((category) => (<SortableItem key={category.id} category={category} isExpanded={expandedIds.has(category.id)} onToggleExpand={onToggleExpand} depth={0} />))}</div>
      </SortableContext>
      <DragOverlay>{activeItem ? <div className="bg-white dark:bg-gray-800 shadow-lg rounded-md border border-blue-500 opacity-90"><DragOverlayItem category={activeItem} /></div> : null}</DragOverlay>
    </DndContext>
  );
}

interface SortableItemProps { category: Category; isExpanded: boolean; onToggleExpand: (id: string) => void; depth: number; }

function SortableItem({ category, isExpanded, onToggleExpand, depth }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const hasChildren = category.children && category.children.length > 0;
  const photoCount = category._count?.photos ?? 0;

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white dark:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700" style={{ paddingLeft: `${depth * 16 + 8}px` }}>
        <button className="p-0.5 cursor-grab active:cursor-grabbing rounded hover:bg-gray-100 dark:hover:bg-gray-700" {...attributes} {...listeners}><GripVertical className="w-4 h-4 text-gray-400" /></button>
        <button className={`p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${hasChildren ? "visible" : "invisible"}`} onClick={() => onToggleExpand(category.id)}>{isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}</button>
        {isExpanded ? <FolderOpen className="w-4 h-4 text-yellow-500" /> : <Folder className="w-4 h-4 text-yellow-500" />}
        <span className="flex-1 text-sm text-gray-900 dark:text-gray-100 truncate">{category.name}</span>
        {category.code && <span className="text-xs text-gray-500 font-mono">{category.code}</span>}
        {category.isStandard && <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">標準</span>}
        {photoCount > 0 && <span className="flex items-center gap-1 text-xs text-gray-500"><Image className="w-3 h-3" />{photoCount}</span>}
      </div>
      {hasChildren && isExpanded && !isDragging && (<div>{category.children!.map((child) => (<SortableItem key={child.id} category={child} isExpanded={false} onToggleExpand={onToggleExpand} depth={depth + 1} />))}</div>)}
    </div>
  );
}

function DragOverlayItem({ category }: { category: Category }) {
  const photoCount = category._count?.photos ?? 0;
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <GripVertical className="w-4 h-4 text-gray-400" />
      <Folder className="w-4 h-4 text-yellow-500" />
      <span className="text-sm text-gray-900 dark:text-gray-100">{category.name}</span>
      {category.code && <span className="text-xs text-gray-500 font-mono">{category.code}</span>}
      {category.isStandard && <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">標準</span>}
      {photoCount > 0 && <span className="flex items-center gap-1 text-xs text-gray-500"><Image className="w-3 h-3" />{photoCount}</span>}
    </div>
  );
}
