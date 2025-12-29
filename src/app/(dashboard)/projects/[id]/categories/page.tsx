"use client";

import React, { useState, useEffect, useCallback } from "react";
import { use } from "react";
import {
  Plus,
  Download,
  FolderTree,
  GripVertical,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  CategoryTree,
  CategoryForm,
  CategoryDragDrop,
  ImportStandardCategories,
} from "@/components/categories";
import type { Category, CategoryFormData } from "@/types/category";

interface PageProps {
  params: Promise<{ id: string }>;
}

type ViewMode = "tree" | "reorder";

export default function CategoriesPage({ params }: PageProps) {
  const { id: projectId } = use(params);

  // 状態
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("tree");

  // 展開状態
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // モーダル状態
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);

  // 選択状態
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  // カテゴリ一覧を取得
  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/categories?projectId=${projectId}&parentId=null&includeChildren=true`
      );
      if (!response.ok) {
        throw new Error("カテゴリの取得に失敗しました");
      }
      const data = await response.json();
      setCategories(data.categories);

      // 初回は工種を展開
      if (expandedIds.size === 0) {
        const level1Ids = data.categories.map((c: Category) => c.id);
        setExpandedIds(new Set(level1Ids));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, expandedIds.size]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // 展開/折りたたみ
  const handleToggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  // カテゴリ選択
  const handleSelect = (category: Category) => {
    setSelectedCategory(category);
  };

  // 新規工種追加
  const handleAddWorkType = () => {
    setFormMode("create");
    setEditingCategory(null);
    setParentCategory(null);
    setIsFormOpen(true);
  };

  // 子カテゴリ追加
  const handleAddChild = (parent: Category) => {
    setFormMode("create");
    setEditingCategory(null);
    setParentCategory(parent);
    setIsFormOpen(true);
  };

  // 編集
  const handleEdit = (category: Category) => {
    setFormMode("edit");
    setEditingCategory(category);
    setParentCategory(null);
    setIsFormOpen(true);
  };

  // 削除
  const handleDelete = async (category: Category) => {
    const childCount = category._count?.children ?? 0;
    const photoCount = category._count?.photos ?? 0;

    let message = `「${category.name}」を削除しますか？`;
    if (childCount > 0) {
      message += `\n\n注意: ${childCount}件の子カテゴリも一緒に削除されます。`;
    }
    if (photoCount > 0) {
      message = `このカテゴリには${photoCount}枚の写真が関連付けられているため削除できません。\n先に写真を移動または削除してください。`;
      alert(message);
      return;
    }

    if (!confirm(message)) return;

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "削除に失敗しました");
      }

      await fetchCategories();
      if (selectedCategory?.id === category.id) {
        setSelectedCategory(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  // フォーム送信
  const handleFormSubmit = async (data: CategoryFormData) => {
    if (formMode === "create") {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          projectId,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "作成に失敗しました");
      }
    } else {
      const response = await fetch(`/api/categories/${editingCategory!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          code: data.code,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "更新に失敗しました");
      }
    }

    await fetchCategories();
  };

  // 並び替え
  const handleReorder = async (
    items: { id: string; sortOrder: number }[]
  ) => {
    const response = await fetch("/api/categories/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    if (!response.ok) {
      throw new Error("並び替えに失敗しました");
    }
  };

  // インポート完了
  const handleImportComplete = () => {
    fetchCategories();
  };

  return (
    <div className="h-full flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <FolderTree className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            カテゴリ管理
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* 表示切替 */}
          <div className="flex rounded-md border border-gray-300 dark:border-gray-600">
            <button
              className={`px-3 py-1.5 text-sm ${
                viewMode === "tree"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              } rounded-l-md`}
              onClick={() => setViewMode("tree")}
            >
              <FolderTree className="w-4 h-4" />
            </button>
            <button
              className={`px-3 py-1.5 text-sm ${
                viewMode === "reorder"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              } rounded-r-md`}
              onClick={() => setViewMode("reorder")}
            >
              <GripVertical className="w-4 h-4" />
            </button>
          </div>

          <button
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300
                     bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
                     rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => setIsImportOpen(true)}
          >
            <Download className="w-4 h-4" />
            標準インポート
          </button>

          <button
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-white
                     bg-blue-600 hover:bg-blue-700 rounded-md"
            onClick={handleAddWorkType}
          >
            <Plus className="w-4 h-4" />
            工種を追加
          </button>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm text-white
                       bg-blue-600 hover:bg-blue-700 rounded-md"
              onClick={fetchCategories}
            >
              <RefreshCw className="w-4 h-4" />
              再読み込み
            </button>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-500">
            <FolderTree className="w-12 h-12" />
            <p>カテゴリがありません</p>
            <div className="flex gap-2">
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm
                         bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
                         rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => setIsImportOpen(true)}
              >
                <Download className="w-4 h-4" />
                標準カテゴリをインポート
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm text-white
                         bg-blue-600 hover:bg-blue-700 rounded-md"
                onClick={handleAddWorkType}
              >
                <Plus className="w-4 h-4" />
                工種を追加
              </button>
            </div>
          </div>
        ) : viewMode === "tree" ? (
          <div className="max-w-2xl">
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
          </div>
        ) : (
          <div className="max-w-2xl">
            <p className="text-sm text-gray-500 mb-4">
              ドラッグ&ドロップでカテゴリの順序を変更できます
            </p>
            <CategoryDragDrop
              categories={categories}
              onReorder={handleReorder}
              expandedIds={expandedIds}
              onToggleExpand={handleToggleExpand}
            />
          </div>
        )}
      </div>

      {/* フォームモーダル */}
      <CategoryForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        category={editingCategory}
        parentCategory={parentCategory}
        mode={formMode}
      />

      {/* インポートモーダル */}
      <ImportStandardCategories
        projectId={projectId}
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}
