"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { Plus, RefreshCw, GripVertical, List } from "lucide-react";
import {
  CategoryTree,
  CategoryForm,
  CategoryDragDrop,
  ImportStandardCategories,
} from "@/components/categories";
import type { Category, CategoryFormData } from "@/types/category";
import { getLevelName } from "@/types/category";

type ViewMode = "tree" | "reorder";

interface DeleteConfirmModalProps {
  category: Category;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmModal({ category, onConfirm, onCancel }: DeleteConfirmModalProps) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onCancel} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
          <h3 className="text-lg font-semibold mb-2">カテゴリを削除</h3>
          <p className="text-gray-600 mb-4">
            「{category.name}」を削除しますか？この操作は取り消せません。
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md"
            >
              削除
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CategoriesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const [existingCodes, setExistingCodes] = useState<Set<string>>(new Set());

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/categories?projectId=${projectId}`);
      if (!response.ok) throw new Error("カテゴリの取得に失敗しました");
      const data = await response.json();
      setCategories(data.categories);

      // 既存のコードを収集
      const codes = new Set<string>();
      const collectCodes = (cats: Category[]) => {
        for (const cat of cats) {
          if (cat.code) codes.add(cat.code);
          if (cat.children) collectCodes(cat.children);
        }
      };
      collectCodes(data.categories);
      setExistingCodes(codes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleToggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleSelect = (category: Category) => {
    setSelectedCategory(category);
  };

  const handleAddRoot = () => {
    setFormMode("create");
    setEditingCategory(null);
    setParentCategory(null);
    setIsFormOpen(true);
  };

  const handleAddChild = (parent: Category) => {
    if (parent.level >= 3) return;
    setFormMode("create");
    setEditingCategory(null);
    setParentCategory(parent);
    setIsFormOpen(true);
  };

  const handleEdit = (category: Category) => {
    setFormMode("edit");
    setEditingCategory(category);
    setParentCategory(null);
    setIsFormOpen(true);
  };

  const handleDelete = (category: Category) => {
    setDeleteTarget(category);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const response = await fetch(`/api/categories/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "削除に失敗しました");
      }
      await fetchCategories();
      if (selectedCategory?.id === deleteTarget.id) {
        setSelectedCategory(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleFormSubmit = async (data: CategoryFormData) => {
    const url =
      formMode === "edit" && editingCategory
        ? `/api/categories/${editingCategory.id}`
        : "/api/categories";
    const method = formMode === "edit" ? "PATCH" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        projectId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "保存に失敗しました");
    }

    await fetchCategories();
  };

  const handleReorder = async (
    categoryId: string,
    newIndex: number,
    parentId: string | null
  ) => {
    const response = await fetch("/api/categories/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, newIndex, parentId }),
    });

    if (!response.ok) {
      throw new Error("並び替えに失敗しました");
    }

    await fetchCategories();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">カテゴリ管理</h1>
          <p className="text-gray-600 mt-1">
            工種・種別・細別を管理します
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("tree")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm ${
                viewMode === "tree"
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <List className="w-4 h-4" />
              ツリー
            </button>
            <button
              onClick={() => setViewMode("reorder")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm ${
                viewMode === "reorder"
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <GripVertical className="w-4 h-4" />
              並び替え
            </button>
          </div>

          <ImportStandardCategories
            projectId={projectId}
            onImport={fetchCategories}
            existingCodes={existingCodes}
          />

          <button
            onClick={handleAddRoot}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            {getLevelName(1)}を追加
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 underline"
          >
            閉じる
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4">
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                カテゴリがありません
              </p>
              <div className="flex items-center justify-center gap-3">
                <ImportStandardCategories
                  projectId={projectId}
                  onImport={fetchCategories}
                  existingCodes={existingCodes}
                />
                <button
                  onClick={handleAddRoot}
                  className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4" />
                  カスタムカテゴリを追加
                </button>
              </div>
            </div>
          ) : viewMode === "tree" ? (
            <CategoryTree
              categories={categories}
              selectedId={selectedCategory?.id}
              onSelect={handleSelect}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAddChild={handleAddChild}
              expandedIds={expandedIds}
              onToggleExpand={handleToggleExpand}
            />
          ) : (
            <CategoryDragDrop
              categories={categories}
              onReorder={handleReorder}
            />
          )}
        </div>
      </div>

      <CategoryForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        category={editingCategory}
        parentCategory={parentCategory}
        mode={formMode}
      />

      {deleteTarget && (
        <DeleteConfirmModal
          category={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
