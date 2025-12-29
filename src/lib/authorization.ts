/**
 * Authorization Module
 * Provides role-based access control (RBAC) for API endpoints
 */

import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import type { ProjectRole, OrganizationRole, Role } from '@prisma/client';
import { auth } from './auth';
import { prisma } from './prisma';
import type {
  AuthorizationResult,
  AuthorizationError,
  AuthorizationErrorCode,
  AuthorizationOptions,
  Permission,
  PROJECT_ROLE_HIERARCHY,
  ORGANIZATION_ROLE_HIERARCHY,
  SYSTEM_ROLE_HIERARCHY,
  PROJECT_ROLE_PERMISSIONS,
  ORGANIZATION_ROLE_PERMISSIONS,
} from '@/types/authorization';

// Re-export role hierarchies for external use
export {
  PROJECT_ROLE_HIERARCHY,
  ORGANIZATION_ROLE_HIERARCHY,
  SYSTEM_ROLE_HIERARCHY,
  PROJECT_ROLE_PERMISSIONS,
  ORGANIZATION_ROLE_PERMISSIONS,
} from '@/types/authorization';

/**
 * Create an authorization error response
 */
export function createAuthError(
  code: AuthorizationErrorCode,
  message: string,
  status: number = 403
): NextResponse<{ error: AuthorizationError }> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status }
  );
}

/**
 * Get the current authenticated session
 * Returns null if not authenticated
 */
export async function getSession(): Promise<Session | null> {
  return await auth();
}

/**
 * Require authentication and return the session
 * Throws an error response if not authenticated
 */
export async function requireAuth(): Promise<
  | { session: Session; error: null }
  | { session: null; error: NextResponse<{ error: AuthorizationError }> }
> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      session: null,
      error: createAuthError(
        'UNAUTHORIZED',
        'Authentication required',
        401
      ),
    };
  }

  return { session, error: null };
}

/**
 * Check if a user has the required system role
 */
export function hasSystemRole(
  userRole: Role,
  requiredRole: Role
): boolean {
  const hierarchy: readonly Role[] = ['VIEWER', 'MEMBER', 'MANAGER', 'ADMIN'];
  const userIndex = hierarchy.indexOf(userRole);
  const requiredIndex = hierarchy.indexOf(requiredRole);
  return userIndex >= requiredIndex;
}

/**
 * Check if a user has the required project role
 */
export function hasProjectRole(
  userRole: ProjectRole,
  requiredRole: ProjectRole
): boolean {
  const hierarchy: readonly ProjectRole[] = ['VIEWER', 'MEMBER', 'MANAGER'];
  const userIndex = hierarchy.indexOf(userRole);
  const requiredIndex = hierarchy.indexOf(requiredRole);
  return userIndex >= requiredIndex;
}

/**
 * Check if a user has the required organization role
 */
export function hasOrganizationRole(
  userRole: OrganizationRole,
  requiredRole: OrganizationRole
): boolean {
  const hierarchy: readonly OrganizationRole[] = ['VIEWER', 'MEMBER', 'ADMIN', 'OWNER'];
  const userIndex = hierarchy.indexOf(userRole);
  const requiredIndex = hierarchy.indexOf(requiredRole);
  return userIndex >= requiredIndex;
}

/**
 * Get project role permissions
 */
export function getProjectPermissions(role: ProjectRole): Permission[] {
  const permissions: Record<ProjectRole, Permission[]> = {
    VIEWER: ['read'],
    MEMBER: ['read', 'write'],
    MANAGER: ['read', 'write', 'delete', 'admin'],
  };
  return permissions[role] || [];
}

/**
 * Get organization role permissions
 */
export function getOrganizationPermissions(role: OrganizationRole): Permission[] {
  const permissions: Record<OrganizationRole, Permission[]> = {
    VIEWER: ['read'],
    MEMBER: ['read', 'write'],
    ADMIN: ['read', 'write', 'delete', 'admin'],
    OWNER: ['read', 'write', 'delete', 'admin'],
  };
  return permissions[role] || [];
}

/**
 * Check if a user has access to a project
 * @param userId - User ID to check
 * @param projectId - Project ID to check access for
 * @param requiredRole - Minimum required project role (default: VIEWER)
 * @returns Authorization result with role information
 */
export async function checkProjectAccess(
  userId: string,
  projectId: string,
  requiredRole: ProjectRole = 'VIEWER'
): Promise<AuthorizationResult> {
  try {
    // First, check if user is a system admin (bypass all checks)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === 'ADMIN') {
      return {
        authorized: true,
        reason: 'System admin access',
        role: 'MANAGER' as ProjectRole,
      };
    }

    // Check project membership
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      select: {
        role: true,
        project: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    if (membership) {
      const hasAccess = hasProjectRole(membership.role, requiredRole);
      return {
        authorized: hasAccess,
        reason: hasAccess
          ? 'Project member'
          : `Insufficient project role. Required: ${requiredRole}, Current: ${membership.role}`,
        role: membership.role,
      };
    }

    // Check organization membership (organization admins/owners have project access)
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    });

    if (project) {
      const orgMembership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: project.organizationId,
            userId,
          },
        },
        select: { role: true },
      });

      if (orgMembership) {
        // Organization ADMIN and OWNER have full project access
        if (orgMembership.role === 'ADMIN' || orgMembership.role === 'OWNER') {
          return {
            authorized: true,
            reason: 'Organization admin/owner access',
            role: 'MANAGER' as ProjectRole,
          };
        }

        // Organization members have viewer access to projects
        if (orgMembership.role === 'MEMBER' && requiredRole === 'VIEWER') {
          return {
            authorized: true,
            reason: 'Organization member read access',
            role: 'VIEWER' as ProjectRole,
          };
        }
      }
    }

    return {
      authorized: false,
      reason: 'No project access',
    };
  } catch (error) {
    console.error('Error checking project access:', error);
    return {
      authorized: false,
      reason: 'Error checking access',
    };
  }
}

/**
 * Check if a user has access to an organization
 * @param userId - User ID to check
 * @param organizationId - Organization ID to check access for
 * @param requiredRole - Minimum required organization role (default: VIEWER)
 * @returns Authorization result with role information
 */
export async function checkOrganizationAccess(
  userId: string,
  organizationId: string,
  requiredRole: OrganizationRole = 'VIEWER'
): Promise<AuthorizationResult> {
  try {
    // First, check if user is a system admin (bypass all checks)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === 'ADMIN') {
      return {
        authorized: true,
        reason: 'System admin access',
        role: 'OWNER' as OrganizationRole,
      };
    }

    // Check organization membership
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      select: { role: true },
    });

    if (!membership) {
      return {
        authorized: false,
        reason: 'Not a member of this organization',
      };
    }

    const hasAccess = hasOrganizationRole(membership.role, requiredRole);
    return {
      authorized: hasAccess,
      reason: hasAccess
        ? 'Organization member'
        : `Insufficient organization role. Required: ${requiredRole}, Current: ${membership.role}`,
      role: membership.role,
    };
  } catch (error) {
    console.error('Error checking organization access:', error);
    return {
      authorized: false,
      reason: 'Error checking access',
    };
  }
}

/**
 * Require a specific system role
 * @param session - User session
 * @param allowedRoles - Array of allowed roles
 * @returns Authorization result
 */
export function requireRole(
  session: Session | null,
  allowedRoles: Role[]
): AuthorizationResult {
  if (!session?.user) {
    return {
      authorized: false,
      reason: 'No session',
    };
  }

  const userRole = (session.user as { role?: Role }).role;
  if (!userRole) {
    return {
      authorized: false,
      reason: 'No role assigned',
    };
  }

  const hasAccess = allowedRoles.includes(userRole);
  return {
    authorized: hasAccess,
    reason: hasAccess
      ? 'Role authorized'
      : `Insufficient role. Required one of: ${allowedRoles.join(', ')}, Current: ${userRole}`,
    role: userRole,
  };
}

/**
 * Middleware to check project access for API routes
 * Returns error response if unauthorized, null if authorized
 */
export async function withProjectAccess(
  projectId: string | null | undefined,
  requiredRole: ProjectRole = 'VIEWER'
): Promise<NextResponse<{ error: AuthorizationError }> | null> {
  const { session, error } = await requireAuth();
  if (error) return error;

  if (!projectId) {
    return createAuthError(
      'MISSING_PROJECT_ID',
      'Project ID is required',
      400
    );
  }

  const result = await checkProjectAccess(session.user.id, projectId, requiredRole);
  if (!result.authorized) {
    return createAuthError(
      'FORBIDDEN',
      result.reason || 'Access denied to this project'
    );
  }

  return null;
}

/**
 * Middleware to check organization access for API routes
 * Returns error response if unauthorized, null if authorized
 */
export async function withOrganizationAccess(
  organizationId: string | null | undefined,
  requiredRole: OrganizationRole = 'VIEWER'
): Promise<NextResponse<{ error: AuthorizationError }> | null> {
  const { session, error } = await requireAuth();
  if (error) return error;

  if (!organizationId) {
    return createAuthError(
      'MISSING_ORGANIZATION_ID',
      'Organization ID is required',
      400
    );
  }

  const result = await checkOrganizationAccess(session.user.id, organizationId, requiredRole);
  if (!result.authorized) {
    return createAuthError(
      'FORBIDDEN',
      result.reason || 'Access denied to this organization'
    );
  }

  return null;
}

/**
 * Middleware to require specific system roles
 * Returns error response if unauthorized, null if authorized
 */
export async function withRole(
  allowedRoles: Role[]
): Promise<NextResponse<{ error: AuthorizationError }> | null> {
  const { session, error } = await requireAuth();
  if (error) return error;

  const result = requireRole(session, allowedRoles);
  if (!result.authorized) {
    return createAuthError(
      'FORBIDDEN',
      result.reason || 'Insufficient permissions'
    );
  }

  return null;
}

/**
 * Get the project ID from a resource (photo, album, category, blackboard)
 * Useful for checking access when only the resource ID is provided
 */
export async function getProjectIdFromResource(
  resourceType: 'photo' | 'album' | 'category' | 'blackboard',
  resourceId: string
): Promise<string | null> {
  try {
    switch (resourceType) {
      case 'photo': {
        const photo = await prisma.photo.findUnique({
          where: { id: resourceId },
          select: { projectId: true },
        });
        return photo?.projectId || null;
      }
      case 'album': {
        const album = await prisma.album.findUnique({
          where: { id: resourceId },
          select: { projectId: true },
        });
        return album?.projectId || null;
      }
      case 'category': {
        const category = await prisma.category.findUnique({
          where: { id: resourceId },
          select: { projectId: true },
        });
        return category?.projectId || null;
      }
      case 'blackboard': {
        const blackboard = await prisma.blackboard.findUnique({
          where: { id: resourceId },
          select: { projectId: true },
        });
        return blackboard?.projectId || null;
      }
      default:
        return null;
    }
  } catch (error) {
    console.error(`Error getting project ID from ${resourceType}:`, error);
    return null;
  }
}

/**
 * Check access to a resource by its ID
 * Automatically looks up the project ID and checks access
 */
export async function checkResourceAccess(
  userId: string,
  resourceType: 'photo' | 'album' | 'category' | 'blackboard',
  resourceId: string,
  requiredRole: ProjectRole = 'VIEWER'
): Promise<AuthorizationResult> {
  const projectId = await getProjectIdFromResource(resourceType, resourceId);

  if (!projectId) {
    return {
      authorized: false,
      reason: `${resourceType} not found`,
    };
  }

  return checkProjectAccess(userId, projectId, requiredRole);
}

/**
 * Middleware to check resource access for API routes
 * Automatically looks up the project and checks access
 */
export async function withResourceAccess(
  resourceType: 'photo' | 'album' | 'category' | 'blackboard',
  resourceId: string | null | undefined,
  requiredRole: ProjectRole = 'VIEWER'
): Promise<NextResponse<{ error: AuthorizationError }> | null> {
  const { session, error } = await requireAuth();
  if (error) return error;

  if (!resourceId) {
    return createAuthError(
      'NOT_FOUND',
      `${resourceType} ID is required`,
      400
    );
  }

  const result = await checkResourceAccess(
    session.user.id,
    resourceType,
    resourceId,
    requiredRole
  );

  if (!result.authorized) {
    const status = result.reason?.includes('not found') ? 404 : 403;
    return createAuthError(
      result.reason?.includes('not found') ? 'NOT_FOUND' : 'FORBIDDEN',
      result.reason || `Access denied to this ${resourceType}`,
      status
    );
  }

  return null;
}
