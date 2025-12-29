/**
 * Organization Types and Interfaces
 * Issue #35: Organization & Member Management UI
 */

import type { OrganizationRole, PlanType } from '@prisma/client';

/**
 * Organization entity
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: PlanType;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Organization with member counts
 */
export interface OrganizationWithCounts extends Organization {
  _count: {
    members: number;
    projects: number;
  };
}

/**
 * Organization member entity
 */
export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
  };
}

/**
 * Organization with members
 */
export interface OrganizationWithMembers extends Organization {
  members: OrganizationMember[];
  _count: {
    members: number;
    projects: number;
  };
}

/**
 * Create organization input
 */
export interface CreateOrganizationInput {
  name: string;
  slug?: string;
  plan?: PlanType;
}

/**
 * Update organization input
 */
export interface UpdateOrganizationInput {
  name?: string;
  slug?: string;
  plan?: PlanType;
}

/**
 * Invite member input
 */
export interface InviteMemberInput {
  email: string;
  role?: OrganizationRole;
}

/**
 * Update member role input
 */
export interface UpdateMemberRoleInput {
  role: OrganizationRole;
}

/**
 * Invitation entity
 */
export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  email: string | null;
  role: OrganizationRole;
  code: string;
  expiresAt: Date;
  usedAt: Date | null;
  usedById: string | null;
  createdById: string;
  createdAt: Date;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
}

/**
 * Create invitation input
 */
export interface CreateInvitationInput {
  email?: string;
  role?: OrganizationRole;
  expiresInDays?: number;
}

/**
 * Organization list response
 */
export interface OrganizationListResponse {
  organizations: OrganizationWithCounts[];
  total: number;
}

/**
 * Organization API response wrapper
 */
export interface OrganizationApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Organization role display configuration
 */
export const ORGANIZATION_ROLE_CONFIG: Record<
  OrganizationRole,
  { label: string; description: string; color: string; bgColor: string }
> = {
  OWNER: {
    label: 'Owner',
    description: 'Full control of organization',
    color: 'text-purple-800',
    bgColor: 'bg-purple-100',
  },
  ADMIN: {
    label: 'Admin',
    description: 'Can manage members and settings',
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
  },
  MEMBER: {
    label: 'Member',
    description: 'Can create and manage projects',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
  },
  VIEWER: {
    label: 'Viewer',
    description: 'Read-only access',
    color: 'text-gray-800',
    bgColor: 'bg-gray-100',
  },
};

/**
 * Plan type display configuration
 */
export const PLAN_TYPE_CONFIG: Record<
  PlanType,
  { label: string; description: string; color: string; bgColor: string }
> = {
  FREE: {
    label: 'Free',
    description: 'Basic features for small teams',
    color: 'text-gray-800',
    bgColor: 'bg-gray-100',
  },
  STARTER: {
    label: 'Starter',
    description: 'For growing teams',
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
  },
  PROFESSIONAL: {
    label: 'Professional',
    description: 'Advanced features for professionals',
    color: 'text-purple-800',
    bgColor: 'bg-purple-100',
  },
  ENTERPRISE: {
    label: 'Enterprise',
    description: 'Custom solutions for large organizations',
    color: 'text-indigo-800',
    bgColor: 'bg-indigo-100',
  },
};

/**
 * Get role display label
 */
export function getRoleLabel(role: OrganizationRole): string {
  return ORGANIZATION_ROLE_CONFIG[role]?.label ?? role;
}

/**
 * Get role color classes
 */
export function getRoleColorClasses(role: OrganizationRole): string {
  const config = ORGANIZATION_ROLE_CONFIG[role];
  return config ? `${config.color} ${config.bgColor}` : 'text-gray-800 bg-gray-100';
}

/**
 * Check if role can manage organization (OWNER or ADMIN)
 */
export function canManageOrganization(role: OrganizationRole): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

/**
 * Check if role can invite members (OWNER or ADMIN)
 */
export function canInviteMembers(role: OrganizationRole): boolean {
  return role === 'OWNER' || role === 'ADMIN';
}

/**
 * Check if role can remove members (OWNER or ADMIN, but not self-removal for OWNER)
 */
export function canRemoveMember(
  currentUserRole: OrganizationRole,
  targetMemberRole: OrganizationRole
): boolean {
  if (currentUserRole === 'OWNER') {
    return targetMemberRole !== 'OWNER';
  }
  if (currentUserRole === 'ADMIN') {
    return targetMemberRole !== 'OWNER' && targetMemberRole !== 'ADMIN';
  }
  return false;
}

/**
 * Check if role can change member role (OWNER or ADMIN)
 */
export function canChangeMemberRole(
  currentUserRole: OrganizationRole,
  targetMemberRole: OrganizationRole
): boolean {
  if (currentUserRole === 'OWNER') {
    return targetMemberRole !== 'OWNER';
  }
  if (currentUserRole === 'ADMIN') {
    return targetMemberRole !== 'OWNER' && targetMemberRole !== 'ADMIN';
  }
  return false;
}

/**
 * Get available roles for assignment based on current user role
 */
export function getAssignableRoles(currentUserRole: OrganizationRole): OrganizationRole[] {
  if (currentUserRole === 'OWNER') {
    return ['ADMIN', 'MEMBER', 'VIEWER'];
  }
  if (currentUserRole === 'ADMIN') {
    return ['MEMBER', 'VIEWER'];
  }
  return [];
}

/**
 * Generate invitation code
 */
export function generateInvitationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 32; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
