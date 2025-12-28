"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Category, CategoryFormData } from "@/types/category";
import { getLevelName } from "@/types/category";

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  category?: Category | null;
  parentCategory?: Category | null;
  mode: "create" | "edit";
}

export function CategoryForm({ isOpen, onClose, onSubmit, category, parentCategory, mode }: CategoryFormProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && category) { setName(category.name); setCode(category.code || ""); }
      else { setName(""); setCode(""); }
      setError(null);
    }
  }, [isOpen, mode, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const level = mode === "edit" ? category!.level : parentCategory ? parentCategory.level + 1 : 1;
      await onSubmit({ name: name.trim(), code: code.trim() || undefined, level, parentId: mode === "edit" ? category?.parentId : parentCategory?.id });
      onClose();
    } catch (err) { setError(err instanceof Error ? err.message : "エラーが発生しました"); }
    finally { setIsSubmitting(false); }
  };

  if (!isOpen) return null;

  const level = mode === "edit" ? category!.level : parentCategory ? parentCategory.level + 1 : 1;
  const title = mode === "edit" ? `${getLevelName(level)}を編集` : `${getLevelName(level)}を追加`;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
            <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {parentCategory && mode === "create" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">親カテゴリ</label>
                <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-700 dark:text-gray-300">{parentCategory.name}{parentCategory.code && <span className="ml-2 text-gray-500 font-mono text-sm">({parentCategory.code})</span>}</div>
              </div>
            )}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{getLevelName(level)}名 <span className="text-red-500">*</span></label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500" placeholder={`${getLevelName(level)}名を入力`} required autoFocus />
            </div>
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">コード</label>
              <input type="text" id="code" value={code} onChange={(e) => setCode(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500" placeholder="例: 1-1-1" />
              <p className="mt-1 text-xs text-gray-500">任意。分類用のコードを設定できます。</p>
            </div>
            {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"><p className="text-sm text-red-600 dark:text-red-400">{error}</p></div>}
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600" disabled={isSubmitting}>キャンセル</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50" disabled={isSubmitting || !name.trim()}>{isSubmitting ? "処理中..." : mode === "edit" ? "更新" : "追加"}</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
