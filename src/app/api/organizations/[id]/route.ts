/**
 * Organization API Routes
 * GET /api/organizations/[id] - Get organization details
 * PUT /api/organizations/[id] - Update organization
 * DELETE /api/organizations/[id] - Delete organization
 * Issue #35: Organization & Member Management UI
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getOrganizationWithMembers,
  getUserOrganizationRole,
  updateOrganization,
  deleteOrganization,
  isSlugAvailable,
} from '@/lib/organization/organization-service';
import type {
  UpdateOrganizationInput,
  OrganizationApiResponse,
  OrganizationWithMembers,
} from '@/types/organization';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/organizations/[id]
 * Get organization details with members
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<OrganizationApiResponse<OrganizationWithMembers>>> {
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

    const organization = await getOrganizationWithMembers(id);
    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          error: 'Organization not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: organization,
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch organization',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/organizations/[id]
 * Update organization (OWNER or ADMIN only)
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<OrganizationApiResponse<OrganizationWithMembers>>> {
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

    // Check if user can manage organization
    const userRole = await getUserOrganizationRole(id, session.user.id);
    if (!userRole || (userRole !== 'OWNER' && userRole !== 'ADMIN')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Permission denied. Only OWNER or ADMIN can update organization.',
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as UpdateOrganizationInput;

    // Validate name if provided
    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: 'Organization name cannot be empty',
          },
          { status: 400 }
        );
      }
      if (body.name.length > 200) {
        return NextResponse.json(
          {
            success: false,
            error: 'Organization name must be 200 characters or less',
          },
          { status: 400 }
        );
      }
    }

    // Validate slug if provided
    if (body.slug !== undefined) {
      if (!body.slug.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: 'Organization slug cannot be empty',
          },
          { status: 400 }
        );
      }
      const available = await isSlugAvailable(body.slug, id);
      if (!available) {
        return NextResponse.json(
          {
            success: false,
            error: 'This slug is already taken',
          },
          { status: 400 }
        );
      }
    }

    const result = await updateOrganization(id, body);
    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: 'Organization not found',
        },
        { status: 404 }
      );
    }

    // Get full organization with members
    const organization = await getOrganizationWithMembers(id);

    return NextResponse.json({
      success: true,
      data: organization!,
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update organization',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[id]
 * Delete organization (OWNER only)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<OrganizationApiResponse<{ deleted: boolean }>>> {
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

    // Check if user is owner
    const userRole = await getUserOrganizationRole(id, session.user.id);
    if (userRole !== 'OWNER') {
      return NextResponse.json(
        {
          success: false,
          error: 'Permission denied. Only OWNER can delete organization.',
        },
        { status: 403 }
      );
    }

    const success = await deleteOrganization(id);
    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete organization',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete organization',
      },
      { status: 500 }
    );
  }
}
