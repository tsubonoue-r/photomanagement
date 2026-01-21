/**
 * Projects API Routes
 * GET /api/projects - List projects
 * POST /api/projects - Create project
 * Issue #30: Project Management Screen Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAllProjects, createProject } from '@/lib/project/project-service';
import type {
  CreateProjectInput,
  ProjectApiResponse,
  Project,
  ProjectListResponse
} from '@/types/project';
import type { ProjectStatus } from '@prisma/client';

/**
 * Get or create default organization for user
 */
async function getOrCreateOrganization(userId: string): Promise<string> {
  // Check if user has an organization membership
  const membership = await prisma.organizationMember.findFirst({
    where: { userId },
    select: { organizationId: true },
  });

  if (membership) {
    return membership.organizationId;
  }

  // Create default organization if none exists
  const defaultOrg = await prisma.organization.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'デフォルト組織',
      slug: 'default',
      plan: 'FREE',
    },
  });

  // Add user to the organization (use upsert to handle duplicates)
  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: defaultOrg.id,
        userId,
      },
    },
    update: {},
    create: {
      organizationId: defaultOrg.id,
      userId,
      role: 'OWNER',
    },
  });

  return defaultOrg.id;
}

/**
 * GET /api/projects
 * List all projects with optional filtering
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ProjectApiResponse<ProjectListResponse>>> {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: '認証が必要です',
        },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const status = searchParams.get('status') as ProjectStatus | null;
    const search = searchParams.get('search') || undefined;

    const result = await getAllProjects({
      status: status || undefined,
      search,
      page,
      pageSize,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'プロジェクトの取得に失敗しました',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ProjectApiResponse<Project>>> {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: '認証が必要です',
        },
        { status: 401 }
      );
    }

    const body = (await request.json()) as CreateProjectInput;

    if (!body.name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'プロジェクト名は必須です',
        },
        { status: 400 }
      );
    }

    // Get or create organization for user
    const organizationId = await getOrCreateOrganization(session.user.id as string);
    console.log('Creating project with organizationId:', organizationId);

    const project = await createProject(organizationId, {
      ...body,
      name: body.name.trim(),
    });

    return NextResponse.json(
      {
        success: true,
        data: project,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project:', error);
    const errorMessage = error instanceof Error ? error.message : 'プロジェクトの作成に失敗しました';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
