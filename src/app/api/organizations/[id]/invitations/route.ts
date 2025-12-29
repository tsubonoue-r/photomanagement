/**
 * Organization Invitations API Routes
 * GET /api/organizations/[id]/invitations - List active invitations
 * POST /api/organizations/[id]/invitations - Create invitation link
 * Issue #35: Organization & Member Management UI
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getUserOrganizationRole,
  createInvitation,
  getOrganizationInvitations,
} from '@/lib/organization/organization-service';
import type {
  CreateInvitationInput,
  OrganizationApiResponse,
  OrganizationInvitation,
} from '@/types/organization';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/organizations/[id]/invitations
 * List all active invitations for organization
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<OrganizationApiResponse<OrganizationInvitation[]>>> {
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

    const { id } = await params;

    // Check if user can manage invitations
    const userRole = await getUserOrganizationRole(id, session.user.id);
    if (!userRole || (userRole !== 'OWNER' && userRole !== 'ADMIN')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Permission denied. Only OWNER or ADMIN can view invitations.',
        },
        { status: 403 }
      );
    }

    const invitations = await getOrganizationInvitations(id);

    return NextResponse.json({
      success: true,
      data: invitations,
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch invitations',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations/[id]/invitations
 * Create a new invitation link (OWNER or ADMIN only)
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<OrganizationApiResponse<OrganizationInvitation>>> {
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

    const { id } = await params;

    // Check if user can create invitations
    const userRole = await getUserOrganizationRole(id, session.user.id);
    if (!userRole || (userRole !== 'OWNER' && userRole !== 'ADMIN')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Permission denied. Only OWNER or ADMIN can create invitations.',
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as CreateInvitationInput;

    // Validate email if provided
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid email format',
          },
          { status: 400 }
        );
      }
    }

    // Validate role assignment permissions
    if (body.role === 'OWNER') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot create invitation with OWNER role.',
        },
        { status: 400 }
      );
    }

    if (userRole === 'ADMIN' && body.role === 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'ADMINs cannot create invitations for ADMIN role.',
        },
        { status: 403 }
      );
    }

    // Validate expiration days
    if (body.expiresInDays !== undefined) {
      if (body.expiresInDays < 1 || body.expiresInDays > 30) {
        return NextResponse.json(
          {
            success: false,
            error: 'Expiration must be between 1 and 30 days.',
          },
          { status: 400 }
        );
      }
    }

    const invitation = await createInvitation(id, session.user.id, body);

    return NextResponse.json(
      {
        success: true,
        data: invitation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create invitation',
      },
      { status: 500 }
    );
  }
}
