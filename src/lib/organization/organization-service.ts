/**
 * Organization Service
 * Business logic for organization management with Prisma
 * Issue #35: Organization & Member Management UI
 */

import { prisma } from '@/lib/prisma';
import type { OrganizationRole, PlanType } from '@prisma/client';
import type {
  Organization,
  OrganizationWithCounts,
  OrganizationWithMembers,
  OrganizationMember,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationListResponse,
  OrganizationInvitation,
  CreateInvitationInput,
} from '@/types/organization';

/**
 * Generate a URL-friendly slug from organization name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
}

/**
 * Ensure slug is unique by appending a number if necessary
 */
async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let counter = 0;

  while (true) {
    const existing = await prisma.organization.findFirst({
      where: {
        slug,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    if (!existing) {
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

/**
 * Get all organizations for a user
 */
export async function getUserOrganizations(
  userId: string
): Promise<OrganizationListResponse> {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    include: {
      organization: {
        include: {
          _count: {
            select: {
              members: true,
              projects: true,
            },
          },
        },
      },
    },
    orderBy: {
      organization: {
        name: 'asc',
      },
    },
  });

  const organizations = memberships.map((m) => m.organization) as OrganizationWithCounts[];

  return {
    organizations,
    total: organizations.length,
  };
}

/**
 * Get organization by ID with member count
 */
export async function getOrganization(
  organizationId: string
): Promise<OrganizationWithCounts | null> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      _count: {
        select: {
          members: true,
          projects: true,
        },
      },
    },
  });

  return organization as OrganizationWithCounts | null;
}

/**
 * Get organization with all members
 */
export async function getOrganizationWithMembers(
  organizationId: string
): Promise<OrganizationWithMembers | null> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: [
          { role: 'asc' },
          { createdAt: 'asc' },
        ],
      },
      _count: {
        select: {
          members: true,
          projects: true,
        },
      },
    },
  });

  return organization as OrganizationWithMembers | null;
}

/**
 * Get user's role in organization
 */
export async function getUserOrganizationRole(
  organizationId: string,
  userId: string
): Promise<OrganizationRole | null> {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
  });

  return membership?.role ?? null;
}

/**
 * Check if user is member of organization
 */
export async function isOrganizationMember(
  organizationId: string,
  userId: string
): Promise<boolean> {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
  });

  return !!membership;
}

/**
 * Check if user can manage organization (OWNER or ADMIN)
 */
export async function canManageOrganization(
  organizationId: string,
  userId: string
): Promise<boolean> {
  const role = await getUserOrganizationRole(organizationId, userId);
  return role === 'OWNER' || role === 'ADMIN';
}

/**
 * Create new organization
 */
export async function createOrganization(
  userId: string,
  input: CreateOrganizationInput
): Promise<Organization> {
  const baseSlug = input.slug || generateSlug(input.name);
  const slug = await ensureUniqueSlug(baseSlug);

  const organization = await prisma.organization.create({
    data: {
      name: input.name,
      slug,
      plan: input.plan || 'FREE',
      members: {
        create: {
          userId,
          role: 'OWNER',
        },
      },
    },
    include: {
      _count: {
        select: {
          members: true,
          projects: true,
        },
      },
    },
  });

  return organization as Organization;
}

/**
 * Update organization
 */
export async function updateOrganization(
  organizationId: string,
  input: UpdateOrganizationInput
): Promise<Organization | null> {
  const existing = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!existing) {
    return null;
  }

  let slug = existing.slug;
  if (input.slug && input.slug !== existing.slug) {
    slug = await ensureUniqueSlug(input.slug, organizationId);
  } else if (input.name && input.name !== existing.name && !input.slug) {
    // Optionally regenerate slug if name changes
    // slug = await ensureUniqueSlug(generateSlug(input.name), organizationId);
  }

  const organization = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.slug !== undefined && { slug }),
      ...(input.plan !== undefined && { plan: input.plan }),
    },
    include: {
      _count: {
        select: {
          members: true,
          projects: true,
        },
      },
    },
  });

  return organization as Organization;
}

/**
 * Delete organization
 */
export async function deleteOrganization(organizationId: string): Promise<boolean> {
  try {
    await prisma.organization.delete({
      where: { id: organizationId },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get organization members
 */
export async function getOrganizationMembers(
  organizationId: string
): Promise<OrganizationMember[]> {
  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: [
      { role: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  return members as OrganizationMember[];
}

/**
 * Add member to organization
 */
export async function addOrganizationMember(
  organizationId: string,
  userId: string,
  role: OrganizationRole = 'MEMBER'
): Promise<OrganizationMember> {
  const member = await prisma.organizationMember.create({
    data: {
      organizationId,
      userId,
      role,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      },
    },
  });

  return member as OrganizationMember;
}

/**
 * Update member role
 */
export async function updateMemberRole(
  organizationId: string,
  userId: string,
  role: OrganizationRole
): Promise<OrganizationMember | null> {
  try {
    const member = await prisma.organizationMember.update({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return member as OrganizationMember;
  } catch {
    return null;
  }
}

/**
 * Remove member from organization
 */
export async function removeMember(
  organizationId: string,
  userId: string
): Promise<boolean> {
  try {
    await prisma.organizationMember.delete({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
    },
  });
}

/**
 * Get organization owner count (should always be 1)
 */
export async function getOwnerCount(organizationId: string): Promise<number> {
  return prisma.organizationMember.count({
    where: {
      organizationId,
      role: 'OWNER',
    },
  });
}

/**
 * Check if slug is available
 */
export async function isSlugAvailable(
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const existing = await prisma.organization.findFirst({
    where: {
      slug,
      ...(excludeId && { id: { not: excludeId } }),
    },
  });

  return !existing;
}

/**
 * Get organization by slug
 */
export async function getOrganizationBySlug(
  slug: string
): Promise<OrganizationWithCounts | null> {
  const organization = await prisma.organization.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          members: true,
          projects: true,
        },
      },
    },
  });

  return organization as OrganizationWithCounts | null;
}

/**
 * Transfer organization ownership
 */
export async function transferOwnership(
  organizationId: string,
  currentOwnerId: string,
  newOwnerId: string
): Promise<boolean> {
  try {
    await prisma.$transaction([
      // Demote current owner to admin
      prisma.organizationMember.update({
        where: {
          organizationId_userId: {
            organizationId,
            userId: currentOwnerId,
          },
        },
        data: { role: 'ADMIN' },
      }),
      // Promote new owner
      prisma.organizationMember.update({
        where: {
          organizationId_userId: {
            organizationId,
            userId: newOwnerId,
          },
        },
        data: { role: 'OWNER' },
      }),
    ]);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// Invitation Management
// =============================================================================

/**
 * Generate a secure random invitation code
 */
function generateInvitationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 32; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create an invitation link for organization
 */
export async function createInvitation(
  organizationId: string,
  createdById: string,
  input: CreateInvitationInput
): Promise<OrganizationInvitation> {
  const code = generateInvitationCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays || 7));

  const invitation = await prisma.organizationInvitation.create({
    data: {
      organizationId,
      email: input.email?.toLowerCase() || null,
      role: input.role || 'MEMBER',
      code,
      expiresAt,
      createdById,
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  return invitation as OrganizationInvitation;
}

/**
 * Get invitation by code
 */
export async function getInvitationByCode(
  code: string
): Promise<OrganizationInvitation | null> {
  const invitation = await prisma.organizationInvitation.findUnique({
    where: { code },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  return invitation as OrganizationInvitation | null;
}

/**
 * Get all active invitations for organization
 */
export async function getOrganizationInvitations(
  organizationId: string
): Promise<OrganizationInvitation[]> {
  const invitations = await prisma.organizationInvitation.findMany({
    where: {
      organizationId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return invitations as OrganizationInvitation[];
}

/**
 * Accept invitation and add user to organization
 */
export async function acceptInvitation(
  code: string,
  userId: string
): Promise<{ success: boolean; error?: string; member?: OrganizationMember }> {
  const invitation = await prisma.organizationInvitation.findUnique({
    where: { code },
    include: {
      organization: true,
    },
  });

  if (!invitation) {
    return { success: false, error: 'Invitation not found' };
  }

  if (invitation.usedAt) {
    return { success: false, error: 'Invitation has already been used' };
  }

  if (invitation.expiresAt < new Date()) {
    return { success: false, error: 'Invitation has expired' };
  }

  // Check if email restriction exists
  if (invitation.email) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (user?.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return { success: false, error: 'This invitation is for a different email address' };
    }
  }

  // Check if already a member
  const existingMember = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: invitation.organizationId,
        userId,
      },
    },
  });

  if (existingMember) {
    return { success: false, error: 'You are already a member of this organization' };
  }

  // Use transaction to accept invitation and add member
  const [_, member] = await prisma.$transaction([
    prisma.organizationInvitation.update({
      where: { id: invitation.id },
      data: {
        usedAt: new Date(),
        usedById: userId,
      },
    }),
    prisma.organizationMember.create({
      data: {
        organizationId: invitation.organizationId,
        userId,
        role: invitation.role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
      },
    }),
  ]);

  return { success: true, member: member as OrganizationMember };
}

/**
 * Revoke/delete an invitation
 */
export async function revokeInvitation(invitationId: string): Promise<boolean> {
  try {
    await prisma.organizationInvitation.delete({
      where: { id: invitationId },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if invitation is valid
 */
export async function isInvitationValid(code: string): Promise<boolean> {
  const invitation = await prisma.organizationInvitation.findUnique({
    where: { code },
  });

  if (!invitation) return false;
  if (invitation.usedAt) return false;
  if (invitation.expiresAt < new Date()) return false;

  return true;
}
