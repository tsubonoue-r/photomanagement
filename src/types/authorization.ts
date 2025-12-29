/**
 * Authorization Types
 * Type definitions for role-based access control and authorization
 */

import type { Session } from 'next-auth';
import type { ProjectRole, OrganizationRole, Role } from '@prisma/client';

/**
 * Permission levels for different operations
 */
export type Permission = 'read' | 'write' | 'delete' | 'admin';

/**
 * Resource types that can be authorized
 */
export type ResourceType =
  | 'project'
  | 'organization'
  | 'photo'
  | 'album'
  | 'category'
  | 'blackboard'
  | 'blackboard-template';

/**
 * Authorization context for checking access
 */
export interface AuthorizationContext {
  userId: string;
  projectId?: string;
  organizationId?: string;
  resourceType?: ResourceType;
  resourceId?: string;
}

/**
 * Result of an authorization check
 */
export interface AuthorizationResult {
  authorized: boolean;
  reason?: string;
  role?: ProjectRole | OrganizationRole | Role;
}

/**
 * Project membership with role information
 */
export interface ProjectMembership {
  projectId: string;
  userId: string;
  role: ProjectRole;
  organizationId: string;
}

/**
 * Organization membership with role information
 */
export interface OrganizationMembership {
  organizationId: string;
  userId: string;
  role: OrganizationRole;
}

/**
 * Extended session with authorization metadata
 */
export interface AuthorizedSession extends Session {
  user: Session['user'] & {
    id: string;
    role: Role;
  };
}

/**
 * Authorization error types
 */
export type AuthorizationErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INVALID_SESSION'
  | 'MISSING_PROJECT_ID'
  | 'MISSING_ORGANIZATION_ID'
  | 'INSUFFICIENT_PERMISSIONS';

/**
 * Authorization error response
 */
export interface AuthorizationError {
  code: AuthorizationErrorCode;
  message: string;
  requiredRole?: string;
  currentRole?: string;
}

/**
 * Role hierarchy for project roles
 * Higher index = more permissions
 */
export const PROJECT_ROLE_HIERARCHY: readonly ProjectRole[] = [
  'VIEWER',
  'MEMBER',
  'MANAGER',
] as const;

/**
 * Role hierarchy for organization roles
 * Higher index = more permissions
 */
export const ORGANIZATION_ROLE_HIERARCHY: readonly OrganizationRole[] = [
  'VIEWER',
  'MEMBER',
  'ADMIN',
  'OWNER',
] as const;

/**
 * Role hierarchy for system roles
 * Higher index = more permissions
 */
export const SYSTEM_ROLE_HIERARCHY: readonly Role[] = [
  'VIEWER',
  'MEMBER',
  'MANAGER',
  'ADMIN',
] as const;

/**
 * Permission mapping for project roles
 */
export const PROJECT_ROLE_PERMISSIONS: Record<ProjectRole, Permission[]> = {
  VIEWER: ['read'],
  MEMBER: ['read', 'write'],
  MANAGER: ['read', 'write', 'delete', 'admin'],
};

/**
 * Permission mapping for organization roles
 */
export const ORGANIZATION_ROLE_PERMISSIONS: Record<OrganizationRole, Permission[]> = {
  VIEWER: ['read'],
  MEMBER: ['read', 'write'],
  ADMIN: ['read', 'write', 'delete', 'admin'],
  OWNER: ['read', 'write', 'delete', 'admin'],
};

/**
 * Options for authorization middleware
 */
export interface AuthorizationOptions {
  /** Required project role (if project-scoped) */
  requiredProjectRole?: ProjectRole;
  /** Required organization role (if org-scoped) */
  requiredOrganizationRole?: OrganizationRole;
  /** Required system role */
  requiredSystemRole?: Role;
  /** Required permission level */
  requiredPermission?: Permission;
  /** Allow system admins to bypass checks */
  allowAdminOverride?: boolean;
}
