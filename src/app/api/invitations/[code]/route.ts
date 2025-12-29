/**
 * Invitation Accept API Routes
 * GET /api/invitations/[code] - Get invitation details
 * POST /api/invitations/[code] - Accept invitation
 * Issue #35: Organization & Member Management UI
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getInvitationByCode,
  acceptInvitation,
  isInvitationValid,
} from '@/lib/organization/organization-service';
import type {
  OrganizationApiResponse,
  OrganizationInvitation,
  OrganizationMember,
} from '@/types/organization';

interface RouteParams {
  params: Promise<{ code: string }>;
}

/**
 * GET /api/invitations/[code]
 * Get invitation details (public endpoint, but limited info)
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<OrganizationApiResponse<{ valid: boolean; organization?: { name: string; slug: string }; role?: string }>>> {
  try {
    const { code } = await params;

    const invitation = await getInvitationByCode(code);

    if (!invitation) {
      return NextResponse.json({
        success: true,
        data: { valid: false },
      });
    }

    const valid = await isInvitationValid(code);

    if (!valid) {
      return NextResponse.json({
        success: true,
        data: { valid: false },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        organization: {
          name: invitation.organization.name,
          slug: invitation.organization.slug,
        },
        role: invitation.role,
      },
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch invitation',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invitations/[code]
 * Accept invitation (requires authentication)
 */
export async function POST(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<OrganizationApiResponse<OrganizationMember>>> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'You must be logged in to accept an invitation',
        },
        { status: 401 }
      );
    }

    const { code } = await params;

    const result = await acceptInvitation(code, session.user.id);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to accept invitation',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.member!,
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to accept invitation',
      },
      { status: 500 }
    );
  }
}
