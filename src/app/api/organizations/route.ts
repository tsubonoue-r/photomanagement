/**
 * Organizations API Routes
 * GET /api/organizations - List user's organizations
 * POST /api/organizations - Create organization
 * Issue #35: Organization & Member Management UI
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getUserOrganizations,
  createOrganization,
} from '@/lib/organization/organization-service';
import type {
  CreateOrganizationInput,
  OrganizationApiResponse,
  Organization,
  OrganizationListResponse,
} from '@/types/organization';

/**
 * GET /api/organizations
 * List all organizations the user is a member of
 */
export async function GET(): Promise<NextResponse<OrganizationApiResponse<OrganizationListResponse>>> {
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

    const result = await getUserOrganizations(session.user.id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch organizations',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations
 * Create a new organization
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<OrganizationApiResponse<Organization>>> {
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

    const body = (await request.json()) as CreateOrganizationInput;

    if (!body.name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Organization name is required',
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

    const organization = await createOrganization(session.user.id, {
      ...body,
      name: body.name.trim(),
    });

    return NextResponse.json(
      {
        success: true,
        data: organization,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create organization',
      },
      { status: 500 }
    );
  }
}
