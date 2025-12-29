'use client';

import { useState, useEffect, memo } from 'react';
import type { Category, CategoryFormData } from '@/types/category';

interface CategoryFormProps {
  projectId?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit?: (data: CategoryFormData) => void | Promise<void>;
  category?: Category | null;
  parentCategory?: Category | null;
  mode?: 'create' | 'edit';
}

export const CategoryForm = memo<CategoryFormProps>(function CategoryForm({
  projectId,
  isOpen = false,
  onClose,
  onSubmit,
  category,
  parentCategory,
  mode = 'create',
}) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (category && mode === 'edit') {
      setName(category.name);
      setDescription(category.description || '');
    } else {
      setName('');
      setCode('');
      setDescription('');
    }
  }, [category, mode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({
      name,
      code,
      description,
      parentId: parentCategory?.id || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {mode === 'create' ? 'Create Category' : 'Edit Category'}
          </h2>

          {parentCategory && (
            <p className="text-sm text-gray-500 mb-4">
              Parent: {parentCategory.name}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {mode === 'create' ? 'Create' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

export default CategoryForm;
