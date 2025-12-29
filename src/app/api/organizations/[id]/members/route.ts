/**
 * Organization Members API Routes
 * GET /api/organizations/[id]/members - List members
 * POST /api/organizations/[id]/members - Add member (invite)
 * Issue #35: Organization & Member Management UI
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getUserOrganizationRole,
  getOrganizationMembers,
  addOrganizationMember,
  findUserByEmail,
  isOrganizationMember,
} from '@/lib/organization/organization-service';
import type {
  InviteMemberInput,
  OrganizationApiResponse,
  OrganizationMember,
} from '@/types/organization';
import type { OrganizationRole } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/organizations/[id]/members
 * List all members of organization
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<OrganizationApiResponse<OrganizationMember[]>>> {
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

    // Check if user is member of organization
    const userRole = await getUserOrganizationRole(id, session.user.id);
    if (!userRole) {
      return NextResponse.json(
        {
          success: false,
          error: 'Organization not found or access denied',
        },
        { status: 404 }
      );
    }

    const members = await getOrganizationMembers(id);

    return NextResponse.json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch members',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations/[id]/members
 * Add a new member to organization (OWNER or ADMIN only)
 */
export async function POST(
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

    const { id } = await params;

    // Check if user can invite members
    const userRole = await getUserOrganizationRole(id, session.user.id);
    if (!userRole || (userRole !== 'OWNER' && userRole !== 'ADMIN')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Permission denied. Only OWNER or ADMIN can invite members.',
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as InviteMemberInput;

    if (!body.email?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email is required',
        },
        { status: 400 }
      );
    }

    // Validate email format
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

    // Validate role assignment permissions
    const requestedRole: OrganizationRole = body.role || 'MEMBER';
    if (requestedRole === 'OWNER') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot assign OWNER role directly. Use transfer ownership instead.',
        },
        { status: 400 }
      );
    }
    if (userRole === 'ADMIN' && requestedRole === 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'ADMINs cannot invite other ADMINs.',
        },
        { status: 403 }
      );
    }

    // Find user by email
    const user = await findUserByEmail(body.email.trim().toLowerCase());
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found. The user must have an account first.',
        },
        { status: 404 }
      );
    }

    // Check if already a member
    const isMember = await isOrganizationMember(id, user.id);
    if (isMember) {
      return NextResponse.json(
        {
          success: false,
          error: 'User is already a member of this organization.',
        },
        { status: 400 }
      );
    }

    // Add member
    const member = await addOrganizationMember(id, user.id, requestedRole);

    return NextResponse.json(
      {
        success: true,
        data: member,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add member',
      },
      { status: 500 }
    );
  }
}
