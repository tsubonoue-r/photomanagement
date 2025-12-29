/**
 * Projects API Routes
 * GET /api/projects - List projects
 * POST /api/projects - Create project
 * Issue #30: Project Management Screen Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAllProjects, createProject } from '@/lib/project/project-service';
import type {
  CreateProjectInput,
  ProjectApiResponse,
  Project,
  ProjectListResponse
} from '@/types/project';
import type { ProjectStatus } from '@prisma/client';

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
          error: 'Unauthorized',
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
        error: 'Failed to fetch projects',
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
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const body = (await request.json()) as CreateProjectInput;

    if (!body.name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project name is required',
        },
        { status: 400 }
      );
    }

    // Use a default organization ID for now
    // In production, this would come from the user's session/membership
    const organizationId = 'default-org';

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
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create project',
      },
      { status: 500 }
    );
  }
}
