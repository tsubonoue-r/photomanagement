/**
 * Project-level Permission System
 *
 * Implements role-based access control for projects.
 * Each user can have a different role per project.
 *
 * Roles (from highest to lowest):
 * - OWNER: Full control, can delete project, manage all members
 * - ADMIN: Can manage members (except owner), full edit access
 * - MEMBER: Can upload and edit photos
 * - VIEWER: Read-only access
 */

import { prisma } from './prisma';
import type { Role, ProjectRole } from '@prisma/client';

export type Permission =
  | 'project:view'
  | 'project:edit'
  | 'project:delete'
  | 'project:manage_members'
  | 'photo:view'
  | 'photo:upload'
  | 'photo:edit'
  | 'photo:delete'
  | 'album:view'
  | 'album:create'
  | 'album:edit'
  | 'album:delete'
  | 'category:view'
  | 'category:create'
  | 'category:edit'
  | 'category:delete';

// Permission mappings for project roles
const projectRolePermissions: Record<ProjectRole, Permission[]> = {
  OWNER: [
    'project:view',
    'project:edit',
    'project:delete',
    'project:manage_members',
    'photo:view',
    'photo:upload',
    'photo:edit',
    'photo:delete',
    'album:view',
    'album:create',
    'album:edit',
    'album:delete',
    'category:view',
    'category:create',
    'category:edit',
    'category:delete',
  ],
  ADMIN: [
    'project:view',
    'project:edit',
    'project:manage_members',
    'photo:view',
    'photo:upload',
    'photo:edit',
    'photo:delete',
    'album:view',
    'album:create',
    'album:edit',
    'album:delete',
    'category:view',
    'category:create',
    'category:edit',
    'category:delete',
  ],
  MEMBER: [
    'project:view',
    'photo:view',
    'photo:upload',
    'photo:edit',
    'album:view',
    'album:create',
    'album:edit',
    'category:view',
  ],
  VIEWER: [
    'project:view',
    'photo:view',
    'album:view',
    'category:view',
  ],
};

// System-wide role overrides (for admins who can access all projects)
const systemRoleOverrides: Partial<Record<Role, Permission[]>> = {
  ADMIN: [
    'project:view',
    'project:edit',
    'project:manage_members',
    'photo:view',
    'photo:upload',
    'photo:edit',
    'photo:delete',
    'album:view',
    'album:create',
    'album:edit',
    'album:delete',
    'category:view',
    'category:create',
    'category:edit',
    'category:delete',
  ],
};

/**
 * Get user's project role
 */
export async function getUserProjectRole(
  userId: string,
  projectId: string
): Promise<ProjectRole | null> {
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
    select: {
      role: true,
    },
  });

  return membership?.role || null;
}

/**
 * Check if user has a specific permission in a project
 */
export async function hasProjectPermission(
  userId: string,
  projectId: string,
  permission: Permission
): Promise<boolean> {
  // Get user's system role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) return false;

  // Check system-level admin override
  const systemOverrides = systemRoleOverrides[user.role];
  if (systemOverrides?.includes(permission)) {
    return true;
  }

  // Get project-specific role
  const projectRole = await getUserProjectRole(userId, projectId);
  if (!projectRole) return false;

  // Check project-level permission
  return projectRolePermissions[projectRole].includes(permission);
}

/**
 * Get all permissions for a user in a project
 */
export async function getUserProjectPermissions(
  userId: string,
  projectId: string
): Promise<Permission[]> {
  // Get user's system role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) return [];

  // Check system-level admin override
  const systemOverrides = systemRoleOverrides[user.role];
  if (systemOverrides && systemOverrides.length > 0) {
    return systemOverrides;
  }

  // Get project-specific role
  const projectRole = await getUserProjectRole(userId, projectId);
  if (!projectRole) return [];

  return projectRolePermissions[projectRole];
}

/**
 * Check if user can access a project (has any role)
 */
export async function canAccessProject(
  userId: string,
  projectId: string
): Promise<boolean> {
  // System admin can access all projects
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role === 'ADMIN') return true;

  // Check project membership
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  return !!membership;
}

/**
 * Add a member to a project
 */
export async function addProjectMember(
  projectId: string,
  userId: string,
  role: ProjectRole = 'MEMBER'
): Promise<void> {
  await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
    create: {
      projectId,
      userId,
      role,
    },
    update: {
      role,
    },
  });
}

/**
 * Remove a member from a project
 */
export async function removeProjectMember(
  projectId: string,
  userId: string
): Promise<void> {
  await prisma.projectMember.delete({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });
}

/**
 * Update a member's role in a project
 */
export async function updateProjectMemberRole(
  projectId: string,
  userId: string,
  role: ProjectRole
): Promise<void> {
  await prisma.projectMember.update({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
    data: {
      role,
    },
  });
}

/**
 * Get all members of a project
 */
export async function getProjectMembers(projectId: string) {
  return prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      },
    },
    orderBy: [
      { role: 'asc' },
      { createdAt: 'asc' },
    ],
  });
}

/**
 * Get all projects a user has access to
 */
export async function getUserProjects(userId: string) {
  // Check if user is system admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // System admin can see all projects
  if (user?.role === 'ADMIN') {
    return prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get projects where user is a member
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    include: {
      project: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return memberships.map((m) => m.project);
}

/**
 * Middleware helper to check project access in API routes
 */
export async function requireProjectAccess(
  userId: string | undefined,
  projectId: string,
  requiredPermission?: Permission
): Promise<{ authorized: boolean; error?: string }> {
  if (!userId) {
    return { authorized: false, error: 'Authentication required' };
  }

  if (requiredPermission) {
    const hasPermission = await hasProjectPermission(userId, projectId, requiredPermission);
    if (!hasPermission) {
      return { authorized: false, error: 'Insufficient permissions' };
    }
  } else {
    const canAccess = await canAccessProject(userId, projectId);
    if (!canAccess) {
      return { authorized: false, error: 'Project access denied' };
    }
  }

  return { authorized: true };
}
