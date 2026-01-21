'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  X,
  Loader2,
  AlertCircle,
  Database,
  Calendar,
  MapPin,
  ChevronDown,
  Check,
} from 'lucide-react';
import type { LarkProjectData } from '@/lib/lark/types';

interface LarkBaseImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (project: LarkProjectData) => void;
}

/**
 * Fetch projects from Lark Base API
 */
async function fetchLarkProjects(
  query: string,
  pageToken?: string
): Promise<{ projects: LarkProjectData[]; hasMore: boolean; pageToken?: string }> {
  const params = new URLSearchParams();
  if (query) params.set('search', query);
  if (pageToken) params.set('pageToken', pageToken);
  params.set('pageSize', '20');

  const response = await fetch(`/api/lark/records?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Lark Baseからのデータ取得に失敗しました');
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Lark Baseからのデータ取得に失敗しました');
  }

  return {
    projects: result.data.records,
    hasMore: result.data.hasMore,
    pageToken: result.data.pageToken,
  };
}

/**
 * Lark Base Import Dialog Component
 *
 * Modal dialog for searching and importing projects from Lark Base:
 * - Search input with debounce
 * - Search results displayed as cards
 * - Selection and import functionality
 * - Loading and error state display
 * - "Load more" pagination
 */
export function LarkBaseImportDialog({
  isOpen,
  onClose,
  onImport,
}: LarkBaseImportDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [projects, setProjects] = useState<LarkProjectData[]>([]);
  const [selectedProject, setSelectedProject] = useState<LarkProjectData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [pageToken, setPageToken] = useState<string | undefined>(undefined);
  const [importing, setImporting] = useState(false);

  /**
   * Debounce search query
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  /**
   * Fetch projects when debounced query changes
   */
  useEffect(() => {
    if (!isOpen) return;

    const fetchProjectsAsync = async () => {
      setLoading(true);
      setError(null);
      setPageToken(undefined);
      setSelectedProject(null);

      try {
        const result = await fetchLarkProjects(debouncedQuery);
        setProjects(result.projects);
        setHasMore(result.hasMore);
        setPageToken(result.pageToken);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Lark Baseからのデータ取得に失敗しました'
        );
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectsAsync();
  }, [debouncedQuery, isOpen]);

  /**
   * Load more projects
   */
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !pageToken) return;

    setLoadingMore(true);
    setError(null);

    try {
      const result = await fetchLarkProjects(debouncedQuery, pageToken);
      setProjects((prev) => [...prev, ...result.projects]);
      setHasMore(result.hasMore);
      setPageToken(result.pageToken);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '追加データの取得に失敗しました'
      );
    } finally {
      setLoadingMore(false);
    }
  }, [debouncedQuery, hasMore, loadingMore, pageToken]);

  /**
   * Handle project selection
   */
  const handleSelect = useCallback((project: LarkProjectData) => {
    setSelectedProject((prev) => (prev?.recordId === project.recordId ? null : project));
  }, []);

  /**
   * Handle import
   */
  const handleImport = useCallback(async () => {
    if (!selectedProject) return;

    setImporting(true);
    try {
      await onImport(selectedProject);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'インポートに失敗しました'
      );
    } finally {
      setImporting(false);
    }
  }, [selectedProject, onImport, onClose]);

  /**
   * Reset state when dialog closes
   */
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setDebouncedQuery('');
      setProjects([]);
      setSelectedProject(null);
      setError(null);
      setPageToken(undefined);
      setHasMore(false);
    }
  }, [isOpen]);

  /**
   * Format date for display
   */
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Lark Baseからインポート
                </h2>
                <p className="text-sm text-gray-500">
                  プロジェクト情報を検索してインポート
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="閉じる"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="プロジェクト名、コード、場所で検索..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
              <p className="text-gray-500">検索中...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && projects.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Database className="w-12 h-12 mb-3 text-gray-300" />
              <p className="text-lg font-medium">プロジェクトが見つかりません</p>
              <p className="text-sm mt-1">
                {searchQuery
                  ? '別のキーワードで検索してください'
                  : 'Lark Baseにプロジェクトが登録されていません'}
              </p>
            </div>
          )}

          {/* Project List */}
          {!loading && projects.length > 0 && (
            <div className="space-y-3">
              {projects.map((project) => {
                const isSelected = selectedProject?.recordId === project.recordId;
                return (
                  <button
                    key={project.recordId}
                    onClick={() => handleSelect(project)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {project.name}
                          </h3>
                          {project.code && (
                            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {project.code}
                            </span>
                          )}
                        </div>
                        {project.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                          {project.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {project.location}
                            </span>
                          )}
                          {(project.startDate || project.endDate) && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(project.startDate)} ~{' '}
                              {formatDate(project.endDate)}
                            </span>
                          )}
                        </div>
                        {(project.clientName || project.contractorName) && (
                          <div className="flex flex-wrap gap-x-3 mt-2 text-xs text-gray-500">
                            {project.clientName && (
                              <span>発注者: {project.clientName}</span>
                            )}
                            {project.contractorName && (
                              <span>施工者: {project.contractorName}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div
                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ml-3 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        読み込み中...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        もっと読み込む
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {selectedProject ? (
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-gray-700">
                    {selectedProject.name}
                  </span>
                  を選択中
                </span>
              ) : (
                'インポートするプロジェクトを選択してください'
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleImport}
                disabled={!selectedProject || importing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    インポート中...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    インポート
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LarkBaseImportDialog;
