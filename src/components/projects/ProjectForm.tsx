'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { ProjectWithCounts, CreateProjectInput, UpdateProjectInput } from '@/types/project';
import type { ProjectStatus } from '@prisma/client';

interface ProjectFormProps {
  project?: ProjectWithCounts | null;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * Project Form Component
 *
 * Provides a modal form for creating/editing projects with:
 * - Basic info (name, code, description)
 * - Client and contractor details
 * - Location and date range
 * - Status selection
 */
export function ProjectForm({ project, onSave, onCancel }: ProjectFormProps) {
  const isEditing = !!project;

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [clientName, setClientName] = useState('');
  const [contractorName, setContractorName] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('ACTIVE');

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with project data when editing
  useEffect(() => {
    if (project) {
      setName(project.name);
      setCode(project.code || '');
      setDescription(project.description || '');
      setClientName(project.clientName || '');
      setContractorName(project.contractorName || '');
      setLocation(project.location || '');
      setStartDate(project.startDate ? formatDateForInput(project.startDate) : '');
      setEndDate(project.endDate ? formatDateForInput(project.endDate) : '');
      setStatus(project.status);
    }
  }, [project]);

  // Format date for input[type="date"]
  function formatDateForInput(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('プロジェクト名は必須です');
      return;
    }

    try {
      setSaving(true);

      const payload: CreateProjectInput | UpdateProjectInput = {
        name: name.trim(),
        code: code.trim() || undefined,
        description: description.trim() || undefined,
        clientName: clientName.trim() || undefined,
        contractorName: contractorName.trim() || undefined,
        location: location.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
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

            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                基本情報
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    プロジェクト名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="プロジェクト名を入力"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                    プロジェクトコード
                  </label>
                  <input
                    type="text"
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="例: PRJ-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

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

                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    説明
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="プロジェクトの説明を入力"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Client Info Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                発注者・施工者情報
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
                    発注者名
                  </label>
                  <input
                    type="text"
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="発注者名を入力"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="contractorName" className="block text-sm font-medium text-gray-700 mb-1">
                    施工者名
                  </label>
                  <input
                    type="text"
                    id="contractorName"
                    value={contractorName}
                    onChange={(e) => setContractorName(e.target.value)}
                    placeholder="施工者名を入力"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    工事場所
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="工事場所を入力"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Schedule Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                工期
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    開始日
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    終了日
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
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
    </>
  );
}

export default ProjectForm;
