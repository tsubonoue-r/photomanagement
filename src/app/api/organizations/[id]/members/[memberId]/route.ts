/**
 * Organization Member API Routes
 * PUT /api/organizations/[id]/members/[memberId] - Update member role
 * DELETE /api/organizations/[id]/members/[memberId] - Remove member
 * Issue #35: Organization & Member Management UI
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getUserOrganizationRole,
  updateMemberRole,
  removeMember,
  getOwnerCount,
} from '@/lib/organization/organization-service';
import type {
  UpdateMemberRoleInput,
  OrganizationApiResponse,
  OrganizationMember,
} from '@/types/organization';
import type { OrganizationRole } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string; memberId: string }>;
}

/**
 * PUT /api/organizations/[id]/members/[memberId]
 * Update member role (OWNER or ADMIN only)
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<OrganizationApiResponse<OrganizationMember>>> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const { id, memberId } = await params;

    // Check current user's role
    const currentUserRole = await getUserOrganizationRole(id, session.user.id);
    if (!currentUserRole || (currentUserRole !== 'OWNER' && currentUserRole !== 'ADMIN')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Permission denied. Only OWNER or ADMIN can update member roles.',
        },
        { status: 403 }
      );
    }

    // Get target member's current role
    const targetMemberRole = await getUserOrganizationRole(id, memberId);
    if (!targetMemberRole) {
      return NextResponse.json(
        {
          success: false,
          error: 'Member not found',
        },
        { status: 404 }
      );
    }

    const body = (await request.json()) as UpdateMemberRoleInput;

    if (!body.role) {
      return NextResponse.json(
        {
          success: false,
          error: 'Role is required',
        },
        { status: 400 }
      );
    }

    const newRole: OrganizationRole = body.role;

    // Prevent changing OWNER role unless by another OWNER
    if (targetMemberRole === 'OWNER') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot change OWNER role. Use transfer ownership instead.',
        },
        { status: 403 }
      );
    }

    // Prevent assigning OWNER role
    if (newRole === 'OWNER') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot assign OWNER role directly. Use transfer ownership instead.',
        },
        { status: 400 }
      );
    }

    // ADMIN cannot promote to ADMIN or modify other ADMINs
    if (currentUserRole === 'ADMIN') {
      if (targetMemberRole === 'ADMIN') {
        return NextResponse.json(
          {
            success: false,
            error: 'ADMINs cannot modify other ADMIN roles.',
          },
          { status: 403 }
        );
      }
      if (newRole === 'ADMIN') {
        return NextResponse.json(
          {
            success: false,
            error: 'ADMINs cannot promote members to ADMIN.',
          },
          { status: 403 }
        );
      }
    }

    // Prevent self-demotion for OWNER
    if (memberId === session.user.id && currentUserRole === 'OWNER') {
      return NextResponse.json(
        {
          success: false,
          error: 'OWNER cannot change their own role. Transfer ownership first.',
        },
        { status: 400 }
      );
    }

    const member = await updateMemberRole(id, memberId, newRole);
    if (!member) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update member role',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: member,
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update member role',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[id]/members/[memberId]
 * Remove member from organization (OWNER or ADMIN only)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<OrganizationApiResponse<{ removed: boolean }>>> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const { id, memberId } = await params;

    // Check current user's role
    const currentUserRole = await getUserOrganizationRole(id, session.user.id);
    if (!currentUserRole || (currentUserRole !== 'OWNER' && currentUserRole !== 'ADMIN')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Permission denied. Only OWNER or ADMIN can remove members.',
        },
        { status: 403 }
      );
    }

    // Get target member's role
    const targetMemberRole = await getUserOrganizationRole(id, memberId);
    if (!targetMemberRole) {
      return NextResponse.json(
        {
          success: false,
          error: 'Member not found',
        },
        { status: 404 }
      );
    }

    // Prevent removing OWNER
    if (targetMemberRole === 'OWNER') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot remove OWNER. Transfer ownership first.',
        },
        { status: 403 }
      );
    }

    // ADMIN cannot remove other ADMINs
    if (currentUserRole === 'ADMIN' && targetMemberRole === 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'ADMINs cannot remove other ADMINs.',
        },
        { status: 403 }
      );
    }

    // Prevent self-removal for OWNER (they should transfer ownership first)
    if (memberId === session.user.id && currentUserRole === 'OWNER') {
      const ownerCount = await getOwnerCount(id);
      if (ownerCount <= 1) {
        return NextResponse.json(
          {
            success: false,
            error: 'Cannot remove yourself as the only OWNER. Transfer ownership first.',
          },
          { status: 400 }
        );
      }
    }

    const success = await removeMember(id, memberId);
    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to remove member',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { removed: true },
    });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to remove member',
      },
      { status: 500 }
    );
  }
}
