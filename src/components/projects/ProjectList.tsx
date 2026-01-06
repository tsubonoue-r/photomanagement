'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Loader2 } from 'lucide-react';
import { ProjectCard } from './ProjectCard';
import { ProjectForm } from './ProjectForm';
import { DeleteProjectDialog } from './DeleteProjectDialog';
import type { ProjectWithCounts, ProjectApiResponse, ProjectListResponse } from '@/types/project';
import type { ProjectStatus } from '@prisma/client';

interface ProjectListProps {
  initialProjects?: ProjectWithCounts[];
  /** コンパクトモード（ダッシュボード用） */
  compact?: boolean;
}

/**
 * Project List Component
 *
 * Displays a grid of project cards with:
 * - Status filter
 * - Search functionality
 * - Create new project button
 * - Edit and delete actions
 */
export function ProjectList({ initialProjects = [], compact = false }: ProjectListProps) {
  const [projects, setProjects] = useState<ProjectWithCounts[]>(initialProjects);
  const [loading, setLoading] = useState(!initialProjects.length);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modal state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithCounts | null>(null);
  const [deletingProject, setDeletingProject] = useState<ProjectWithCounts | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (debouncedSearch) params.set('search', debouncedSearch);

      const response = await fetch(`/api/projects?${params.toString()}`);
      const result: ProjectApiResponse<ProjectListResponse> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch projects');
      }

      setProjects(result.data?.projects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch]);

  // Fetch on filter/search change
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Handle project created/updated
  const handleProjectSaved = () => {
    setShowCreateForm(false);
    setEditingProject(null);
    fetchProjects();
  };

  // Handle project deleted
  const handleProjectDeleted = () => {
    setDeletingProject(null);
    fetchProjects();
  };

  // Status filter options
  const statusOptions: { value: ProjectStatus | ''; label: string }[] = [
    { value: '', label: 'すべてのステータス' },
    { value: 'ACTIVE', label: '進行中' },
    { value: 'COMPLETED', label: '完了' },
    { value: 'ARCHIVED', label: 'アーカイブ' },
    { value: 'SUSPENDED', label: '一時停止' },
  ];

  // Compact mode for dashboard
  if (compact) {
    return (
      <div className="space-y-2">
        {loading && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        )}

        {!loading && projects.length === 0 && (
          <div className="text-center py-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">プロジェクトがありません</p>
          </div>
        )}

        {!loading && projects.slice(0, 5).map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onEdit={setEditingProject}
            onDelete={setDeletingProject}
            compact
          />
        ))}

        {/* Edit Project Modal */}
        {editingProject && (
          <ProjectForm
            project={editingProject}
            onSave={handleProjectSaved}
            onCancel={() => setEditingProject(null)}
          />
        )}

        {/* Delete Confirmation Dialog */}
        {deletingProject && (
          <DeleteProjectDialog
            project={deletingProject}
            onConfirm={handleProjectDeleted}
            onCancel={() => setDeletingProject(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">プロジェクト</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新規プロジェクト
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="プロジェクトを検索..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | '')}
            className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
          <button
            onClick={fetchProjects}
            className="ml-4 underline hover:no-underline"
          >
            再試行
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && projects.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="w-16 h-16 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {debouncedSearch || statusFilter ? 'プロジェクトが見つかりません' : 'プロジェクトがありません'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {debouncedSearch || statusFilter
              ? '検索条件やフィルターを変更してみてください'
              : '最初のプロジェクトを作成しましょう'}
          </p>
          {!debouncedSearch && !statusFilter && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              プロジェクトを作成
            </button>
          )}
        </div>
      )}

      {/* Project Grid */}
      {!loading && !error && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={setEditingProject}
              onDelete={setDeletingProject}
            />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateForm && (
        <ProjectForm
          onSave={handleProjectSaved}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <ProjectForm
          project={editingProject}
          onSave={handleProjectSaved}
          onCancel={() => setEditingProject(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingProject && (
        <DeleteProjectDialog
          project={deletingProject}
          onConfirm={handleProjectDeleted}
          onCancel={() => setDeletingProject(null)}
        />
      )}
    </div>
  );
}

export default ProjectList;
