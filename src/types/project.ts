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
  name: string;
  code: string | null;
  description: string | null;
  clientName: string | null;
  contractorName: string | null;
  location: string | null;
  startDate: Date | null;
  endDate: Date | null;
  status: ProjectStatus;
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
  name: string;
  code?: string;
  description?: string;
  clientName?: string;
  contractorName?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  status?: ProjectStatus;
}

/**
 * Project update input
 */
export interface UpdateProjectInput {
  name?: string;
  code?: string;
  description?: string;
  clientName?: string;
  contractorName?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  status?: ProjectStatus;
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
    label: 'Active',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
  },
  ARCHIVED: {
    label: 'Archived',
    color: 'text-gray-800',
    bgColor: 'bg-gray-100',
  },
  SUSPENDED: {
    label: 'Suspended',
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
