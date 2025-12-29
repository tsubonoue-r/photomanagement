/**
 * Organization Invitation API Routes
 * DELETE /api/organizations/[id]/invitations/[invitationId] - Revoke invitation
 * Issue #35: Organization & Member Management UI
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getUserOrganizationRole,
  revokeInvitation,
} from '@/lib/organization/organization-service';
import type { OrganizationApiResponse } from '@/types/organization';

interface RouteParams {
  params: Promise<{ id: string; invitationId: string }>;
}

/**
 * DELETE /api/organizations/[id]/invitations/[invitationId]
 * Revoke/delete an invitation (OWNER or ADMIN only)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<OrganizationApiResponse<{ revoked: boolean }>>> {
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

    const { id, invitationId } = await params;

    // Check if user can manage invitations
    const userRole = await getUserOrganizationRole(id, session.user.id);
    if (!userRole || (userRole !== 'OWNER' && userRole !== 'ADMIN')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Permission denied. Only OWNER or ADMIN can revoke invitations.',
        },
        { status: 403 }
      );
    }

    const success = await revokeInvitation(invitationId);
    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invitation not found or already revoked',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { revoked: true },
    });
  } catch (error) {
    console.error('Error revoking invitation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to revoke invitation',
      },
      { status: 500 }
    );
  }
}
