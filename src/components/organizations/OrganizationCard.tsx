'use client';

import { Building2, Users, Folder, Settings, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import type { OrganizationWithCounts } from '@/types/organization';
import { PLAN_TYPE_CONFIG } from '@/types/organization';
import Link from 'next/link';

interface OrganizationCardProps {
  organization: OrganizationWithCounts;
  onEdit?: (organization: OrganizationWithCounts) => void;
  onDelete?: (organization: OrganizationWithCounts) => void;
  userRole?: string;
}

/**
 * Organization Card Component
 *
 * Displays organization information in a card format with:
 * - Organization name and plan badge
 * - Member and project counts
 * - Quick action menu (edit, settings, delete)
 */
export function OrganizationCard({
  organization,
  onEdit,
  onDelete,
  userRole,
}: OrganizationCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const canManage = userRole === 'OWNER' || userRole === 'ADMIN';

  const planConfig = PLAN_TYPE_CONFIG[organization.plan];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <Link
                href={`/organizations/${organization.id}`}
                className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
              >
                {organization.name}
              </Link>
              <p className="text-sm text-gray-500">/{organization.slug}</p>
            </div>
          </div>

          {canManage && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEdit?.(organization);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg"
                    >
                      組織を編集
                    </button>
                    <Link
                      href={`/organizations/${organization.id}/settings`}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowMenu(false)}
                    >
                      <Settings className="w-4 h-4 inline-block mr-2" />
                      設定
                    </Link>
                    {userRole === 'OWNER' && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onDelete?.(organization);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg"
                      >
                        組織を削除
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Plan Badge */}
        <div className="mb-4">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${planConfig.color} ${planConfig.bgColor}`}
          >
            {planConfig.label}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>
              {organization._count.members}人のメンバー
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4" />
            <span>
              {organization._count.projects}件のプロジェクト
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 rounded-b-lg">
        <Link
          href={`/organizations/${organization.id}`}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          組織を表示
        </Link>
      </div>
    </div>
  );
}

export default OrganizationCard;
