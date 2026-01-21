'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Database } from 'lucide-react';
import type { ProjectWithCounts, CreateProjectInput, UpdateProjectInput } from '@/types/project';
import type { ProjectStatus } from '@prisma/client';
import { LarkBaseImportDialog } from './LarkBaseImportDialog';
import type { LarkProjectData } from '@/lib/lark/types';

interface ProjectFormProps {
  project?: ProjectWithCounts | null;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * Project Form Component
 *
 * フィールド:
 * - 整番 (code)
 * - 案件名 (name) ← Lark: 品名+品名2
 * - 営業担当者 (salesPerson) ← Lark: 担当者LU
 * - 施工者 (contractorName)
 * - 工事名 (constructionName) ← Lark: ◆工事項目
 * - 鉄骨製作区分 (steelFabricationCategory)
 * - 膜製作区分 (membraneFabricationCategory)
 * - 工程写真 (constructionPhoto) ← Lark: ◆工程写真
 */
export function ProjectForm({ project, onSave, onCancel }: ProjectFormProps) {
  const isEditing = !!project;

  // Form state - 新しいフィールド構成
  const [code, setCode] = useState('');                                    // 整番
  const [name, setName] = useState('');                                    // 案件名
  const [salesPerson, setSalesPerson] = useState('');                      // 営業担当者
  const [contractorName, setContractorName] = useState('');                // 施工者
  const [constructionName, setConstructionName] = useState('');            // 工事名
  const [steelFabricationCategory, setSteelFabricationCategory] = useState(''); // 鉄骨製作区分
  const [membraneFabricationCategory, setMembraneFabricationCategory] = useState(''); // 膜製作区分
  const [constructionPhoto, setConstructionPhoto] = useState('');          // 工程写真
  const [status, setStatus] = useState<ProjectStatus>('ACTIVE');

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lark Base import state
  const [showLarkImport, setShowLarkImport] = useState(false);
  const [larkConfigured, setLarkConfigured] = useState(false);

  // Initialize form with project data when editing
  useEffect(() => {
    if (project) {
      setCode(project.code || '');
      setName(project.name);
      setSalesPerson(project.salesPerson || '');
      setContractorName(project.contractorName || '');
      setConstructionName(project.constructionName || '');
      setSteelFabricationCategory(project.steelFabricationCategory || '');
      setMembraneFabricationCategory(project.membraneFabricationCategory || '');
      setConstructionPhoto(project.constructionPhoto || '');
      setStatus(project.status);
    }
  }, [project]);

  // Check if Lark Base is configured
  useEffect(() => {
    if (!isEditing) {
      fetch('/api/lark/config')
        .then((res) => res.json())
        .then((data) => setLarkConfigured(data.data?.configured || false))
        .catch(() => setLarkConfigured(false));
    }
  }, [isEditing]);

  // Handle Lark Base import
  const handleLarkImport = (data: LarkProjectData) => {
    setCode(data.code || '');
    setName(data.name);
    setSalesPerson(data.salesPerson || '');
    setContractorName(data.contractorName || '');
    setConstructionName(data.constructionName || '');
    setSteelFabricationCategory(data.steelFabricationCategory || '');
    setMembraneFabricationCategory(data.membraneFabricationCategory || '');
    setConstructionPhoto(data.constructionPhoto || '');
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('案件名は必須です');
      return;
    }

    try {
      setSaving(true);

      const payload: CreateProjectInput | UpdateProjectInput = {
        code: code.trim() || undefined,
        name: name.trim(),
        salesPerson: salesPerson.trim() || undefined,
        contractorName: contractorName.trim() || undefined,
        constructionName: constructionName.trim() || undefined,
        steelFabricationCategory: steelFabricationCategory.trim() || undefined,
        membraneFabricationCategory: membraneFabricationCategory.trim() || undefined,
        constructionPhoto: constructionPhoto.trim() || undefined,
        status,
      };

      const url = isEditing ? `/api/projects/${project.id}` : '/api/projects';
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'プロジェクトの保存に失敗しました');
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プロジェクトの保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // Status options
  const statusOptions: { value: ProjectStatus; label: string }[] = [
    { value: 'ACTIVE', label: '進行中' },
    { value: 'COMPLETED', label: '完了' },
    { value: 'ARCHIVED', label: 'アーカイブ' },
    { value: 'SUSPENDED', label: '一時停止' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'プロジェクトを編集' : '新規プロジェクト作成'}
            </h2>
            <button
              onClick={onCancel}
              className="p-1 rounded hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Lark Base Import Button */}
            {!isEditing && larkConfigured && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Lark Baseから案件をインポート</p>
                    <p className="text-xs text-blue-600 mt-1">整番・品名・品名2で検索できます</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLarkImport(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Database className="w-4 h-4" />
                    インポート
                  </button>
                </div>
              </div>
            )}

            {/* 基本情報 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                基本情報
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 整番 */}
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                    整番
                  </label>
                  <input
                    type="text"
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="整番を入力"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* ステータス */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    ステータス
                  </label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 案件名 */}
                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    案件名 <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-2">(Lark: 品名+品名2)</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="案件名を入力"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    autoFocus
                  />
                </div>

                {/* 営業担当者 */}
                <div>
                  <label htmlFor="salesPerson" className="block text-sm font-medium text-gray-700 mb-1">
                    営業担当者
                    <span className="text-xs text-gray-500 ml-2">(Lark: 担当者LU)</span>
                  </label>
                  <input
                    type="text"
                    id="salesPerson"
                    value={salesPerson}
                    onChange={(e) => setSalesPerson(e.target.value)}
                    placeholder="営業担当者を入力"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* 施工者 */}
                <div>
                  <label htmlFor="contractorName" className="block text-sm font-medium text-gray-700 mb-1">
                    施工者
                  </label>
                  <input
                    type="text"
                    id="contractorName"
                    value={contractorName}
                    onChange={(e) => setContractorName(e.target.value)}
                    placeholder="施工者を入力"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* 工事名 */}
                <div className="md:col-span-2">
                  <label htmlFor="constructionName" className="block text-sm font-medium text-gray-700 mb-1">
                    工事名
                    <span className="text-xs text-gray-500 ml-2">(Lark: ◆工事項目)</span>
                  </label>
                  <input
                    type="text"
                    id="constructionName"
                    value={constructionName}
                    onChange={(e) => setConstructionName(e.target.value)}
                    placeholder="工事名を入力"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 製作区分 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                製作区分
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 鉄骨製作区分 */}
                <div>
                  <label htmlFor="steelFabricationCategory" className="block text-sm font-medium text-gray-700 mb-1">
                    鉄骨製作区分
                  </label>
                  <input
                    type="text"
                    id="steelFabricationCategory"
                    value={steelFabricationCategory}
                    onChange={(e) => setSteelFabricationCategory(e.target.value)}
                    placeholder="鉄骨製作区分を入力"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* 膜製作区分 */}
                <div>
                  <label htmlFor="membraneFabricationCategory" className="block text-sm font-medium text-gray-700 mb-1">
                    膜製作区分
                  </label>
                  <input
                    type="text"
                    id="membraneFabricationCategory"
                    value={membraneFabricationCategory}
                    onChange={(e) => setMembraneFabricationCategory(e.target.value)}
                    placeholder="膜製作区分を入力"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 工程写真 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                工程写真
              </h3>

              <div>
                <label htmlFor="constructionPhoto" className="block text-sm font-medium text-gray-700 mb-1">
                  工程写真
                  <span className="text-xs text-gray-500 ml-2">(Lark: ◆工程写真)</span>
                </label>
                <input
                  type="text"
                  id="constructionPhoto"
                  value={constructionPhoto}
                  onChange={(e) => setConstructionPhoto(e.target.value)}
                  placeholder="工程写真の情報を入力"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={saving}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={saving || !name.trim()}
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? '保存中...' : isEditing ? '更新' : '作成'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Lark Base Import Dialog */}
      {showLarkImport && (
        <LarkBaseImportDialog
          isOpen={showLarkImport}
          onClose={() => setShowLarkImport(false)}
          onImport={handleLarkImport}
        />
      )}
    </>
  );
}

export default ProjectForm;
