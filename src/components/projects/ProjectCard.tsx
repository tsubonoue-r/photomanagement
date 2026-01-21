'use client';

import Link from 'next/link';
import { Folder, Image, BookOpen, Users, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { ProjectWithCounts } from '@/types/project';
import { getStatusColorClasses, getStatusLabel } from '@/types/project';

interface ProjectCardProps {
  project: ProjectWithCounts;
  onEdit: (project: ProjectWithCounts) => void;
  onDelete: (project: ProjectWithCounts) => void;
  /** コンパクトモード（リストスタイル） */
  compact?: boolean;
}

/**
 * Project Card Component
 *
 * Displays project information in a card format with:
 * - Project name and description
 * - Status badge
 * - Photo, album, and member counts
 * - Actions menu (view, edit, delete)
 */
export function ProjectCard({ project, onEdit, onDelete, compact = false }: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Compact mode - list style for dashboard
  if (compact) {
    return (
      <Link
        href={`/projects/${project.id}`}
        className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-[0.98] transition-all"
      >
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
          <Folder className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {project.name}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Image className="w-3 h-3" />
              {project._count.photos}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {project._count.albums}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColorClasses(project.status)}`}
            >
              {getStatusLabel(project.status)}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 text-gray-400">
          <Eye className="w-4 h-4" />
        </div>
      </Link>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      {/* Card Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Folder className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/projects/${project.id}`}
                className="text-base font-semibold text-gray-900 hover:text-blue-600 truncate block"
              >
                {project.name}
              </Link>
              {project.code && (
                <span className="text-xs text-gray-500 font-mono">{project.code}</span>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                <Link
                  href={`/projects/${project.id}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowMenu(false)}
                >
                  <Eye className="w-4 h-4" />
                  表示
                </Link>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(project);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4" />
                  編集
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(project);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  削除
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 営業担当者・施工者 */}
        {(project.salesPerson || project.contractorName) && (
          <p className="mt-2 text-sm text-gray-600 truncate">
            {project.salesPerson && <span>営業: {project.salesPerson}</span>}
            {project.salesPerson && project.contractorName && <span> | </span>}
            {project.contractorName && <span>施工: {project.contractorName}</span>}
          </p>
        )}

        {/* Status Badge */}
        <div className="mt-3">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColorClasses(project.status)}`}
          >
            {getStatusLabel(project.status)}
          </span>
        </div>
      </div>

      {/* Card Body - Stats */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500">
              <Image className="w-4 h-4" />
              <span className="text-lg font-semibold text-gray-900">
                {project._count.photos}
              </span>
            </div>
            <span className="text-xs text-gray-500">写真</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500">
              <BookOpen className="w-4 h-4" />
              <span className="text-lg font-semibold text-gray-900">
                {project._count.albums}
              </span>
            </div>
            <span className="text-xs text-gray-500">アルバム</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500">
              <Users className="w-4 h-4" />
              <span className="text-lg font-semibold text-gray-900">
                {project._count.members}
              </span>
            </div>
            <span className="text-xs text-gray-500">メンバー</span>
          </div>
        </div>
      </div>

      {/* Card Footer - 工事情報 */}
      <div className="px-4 py-3 bg-gray-50 rounded-b-lg border-t border-gray-100">
        {project.constructionName && (
          <div className="text-xs text-gray-500 truncate mb-1">
            <span className="font-medium">工事名:</span> {project.constructionName}
          </div>
        )}
        {(project.steelFabricationCategory || project.membraneFabricationCategory) && (
          <div className="flex gap-3 text-xs text-gray-500">
            {project.steelFabricationCategory && (
              <span>鉄骨: {project.steelFabricationCategory}</span>
            )}
            {project.membraneFabricationCategory && (
              <span>膜: {project.membraneFabricationCategory}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectCard;
