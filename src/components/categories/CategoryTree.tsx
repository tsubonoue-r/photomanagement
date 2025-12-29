"use client";
import React, { useState } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, Image, MoreVertical, Plus, Pencil, Trash2 } from "lucide-react";
import type { Category } from "@/types/category";
import { getLevelName } from "@/types/category";

interface CategoryTreeProps { categories: Category[]; selectedId?: string | null; onSelect?: (c: Category) => void; onEdit?: (c: Category) => void; onDelete?: (c: Category) => void; onAddChild?: (c: Category) => void; expandedIds?: Set<string>; onToggleExpand?: (id: string) => void; }

export function CategoryTree({ categories, selectedId, onSelect, onEdit, onDelete, onAddChild, expandedIds = new Set(), onToggleExpand }: CategoryTreeProps) {
  return <div className="space-y-1">{categories.map((c) => (<TreeItem key={c.id} category={c} selectedId={selectedId} onSelect={onSelect} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} expandedIds={expandedIds} onToggleExpand={onToggleExpand} depth={0} />))}</div>;
}

function TreeItem({ category: c, selectedId, onSelect, onEdit, onDelete, onAddChild, expandedIds, onToggleExpand, depth }: { category: Category; selectedId?: string | null; onSelect?: (c: Category) => void; onEdit?: (c: Category) => void; onDelete?: (c: Category) => void; onAddChild?: (c: Category) => void; expandedIds: Set<string>; onToggleExpand?: (id: string) => void; depth: number }) {
  const [showMenu, setShowMenu] = useState(false);
  const hasChildren = c.children && c.children.length > 0;
  const isExpanded = expandedIds.has(c.id);
  const isSelected = selectedId === c.id;
  const photoCount = c._count?.photos ?? 0;

  return (
    <div>
      <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""}`} style={{ paddingLeft: `${depth * 16 + 8}px` }} onClick={() => onSelect?.(c)}>
        <button className={`p-0.5 rounded hover:bg-gray-200 ${hasChildren ? "visible" : "invisible"}`} onClick={(e) => { e.stopPropagation(); onToggleExpand?.(c.id); }}>{isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}</button>
        {isExpanded ? <FolderOpen className="w-4 h-4 text-yellow-500" /> : <Folder className="w-4 h-4 text-yellow-500" />}
        <span className="flex-1 text-sm truncate">{c.name}</span>
        {c.code && <span className="text-xs text-gray-500 font-mono">{c.code}</span>}
        {c.isStandard && <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">標準</span>}
        {photoCount > 0 && <span className="flex items-center gap-1 text-xs text-gray-500"><Image className="w-3 h-3" />{photoCount}</span>}
        <div className="relative">
          <button className="p-1 rounded hover:bg-gray-200" onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}><MoreVertical className="w-4 h-4 text-gray-400" /></button>
          {showMenu && (<><div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} /><div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border z-20">{c.level < 3 && <button className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); setShowMenu(false); onAddChild?.(c); }}><Plus className="w-4 h-4" />{getLevelName(c.level + 1)}を追加</button>}{!c.isStandard && <button className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEdit?.(c); }}><Pencil className="w-4 h-4" />編集</button>}<button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete?.(c); }}><Trash2 className="w-4 h-4" />削除</button></div></>)}
        </div>
      </div>
      {hasChildren && isExpanded && <div>{c.children!.map((child) => (<TreeItem key={child.id} category={child} selectedId={selectedId} onSelect={onSelect} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} expandedIds={expandedIds} onToggleExpand={onToggleExpand} depth={depth + 1} />))}</div>}
    </div>
  );
}
