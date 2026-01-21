/**
 * Project Types and Interfaces
 * Issue #30: Project Management Screen Implementation
 */

import type { ProjectStatus } from '@prisma/client';

/**
 * Project entity (application layer)
 */
export interface Project {
  id: string;
  organizationId: string;
  name: string;                              // 案件名 (品名+品名2)
  code: string | null;                       // 整番
  description: string | null;
  clientName: string | null;
  contractorName: string | null;             // 施工者
  location: string | null;
  startDate: Date | null;
  endDate: Date | null;
  status: ProjectStatus;
  // 新規フィールド
  salesPerson: string | null;                // 営業担当者 (担当者LU)
  constructionName: string | null;           // 工事名 (◆工事項目)
  steelFabricationCategory: string | null;   // 鉄骨製作区分
  membraneFabricationCategory: string | null; // 膜製作区分
  constructionPhoto: string | null;          // 工程写真 (◆工程写真)
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    photos: number;
    albums: number;
    members: number;
  };
}

/**
 * Project with counts for list display
 */
export interface ProjectWithCounts extends Project {
  _count: {
    photos: number;
    albums: number;
    members: number;
  };
}

/**
 * Project creation input
 */
export interface CreateProjectInput {
  name: string;                         // 案件名
  code?: string;                        // 整番
  description?: string;
  clientName?: string;
  contractorName?: string;              // 施工者
  location?: string;
  startDate?: string;
  endDate?: string;
  status?: ProjectStatus;
  // 新規フィールド
  salesPerson?: string;                 // 営業担当者
  constructionName?: string;            // 工事名
  steelFabricationCategory?: string;    // 鉄骨製作区分
  membraneFabricationCategory?: string; // 膜製作区分
  constructionPhoto?: string;           // 工程写真
}

/**
 * Project update input
 */
export interface UpdateProjectInput {
  name?: string;                         // 案件名
  code?: string;                         // 整番
  description?: string;
  clientName?: string;
  contractorName?: string;               // 施工者
  location?: string;
  startDate?: string;
  endDate?: string;
  status?: ProjectStatus;
  // 新規フィールド
  salesPerson?: string;                  // 営業担当者
  constructionName?: string;             // 工事名
  steelFabricationCategory?: string;     // 鉄骨製作区分
  membraneFabricationCategory?: string;  // 膜製作区分
  constructionPhoto?: string;            // 工程写真
}

/**
 * Project list response
 */
export interface ProjectListResponse {
  projects: ProjectWithCounts[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Project API response wrapper
 */
export interface ProjectApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Project filter options
 */
export interface ProjectFilterOptions {
  status?: ProjectStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Project status display configuration
 */
export const PROJECT_STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; color: string; bgColor: string }
> = {
  ACTIVE: {
    label: '進行中',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
  },
  COMPLETED: {
    label: '完了',
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
  },
  ARCHIVED: {
    label: 'アーカイブ',
    color: 'text-gray-800',
    bgColor: 'bg-gray-100',
  },
  SUSPENDED: {
    label: '中断',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-100',
  },
};

/**
 * Get status display label
 */
export function getStatusLabel(status: ProjectStatus): string {
  return PROJECT_STATUS_CONFIG[status]?.label ?? status;
}

/**
 * Get status color classes
 */
export function getStatusColorClasses(status: ProjectStatus): string {
  const config = PROJECT_STATUS_CONFIG[status];
  return config ? `${config.color} ${config.bgColor}` : 'text-gray-800 bg-gray-100';
}
