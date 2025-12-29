import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  hasProjectPermission,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  updateProjectMemberRole,
} from '@/lib/permissions';

// Validation schema for adding/updating member
const memberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/projects/[id]/members - Get all project members
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id: projectId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user can view project
    const canView = await hasProjectPermission(session.user.id, projectId, 'project:view');
    if (!canView) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const members = await getProjectMembers(projectId);

    return NextResponse.json({ members }, { status: 200 });
  } catch (error) {
    console.error('Get project members error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/members - Add a member to project
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id: projectId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user can manage members
    const canManage = await hasProjectPermission(session.user.id, projectId, 'project:manage_members');
    if (!canManage) {
      return NextResponse.json(
        { error: 'You do not have permission to manage project members' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = memberSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validatedData.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { userId, role } = validatedData.data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Add member
    await addProjectMember(projectId, userId, role);

    return NextResponse.json(
      { message: 'Member added successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add project member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id]/members - Update member role
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id: projectId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user can manage members
    const canManage = await hasProjectPermission(session.user.id, projectId, 'project:manage_members');
    if (!canManage) {
      return NextResponse.json(
        { error: 'You do not have permission to manage project members' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = memberSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validatedData.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { userId, role } = validatedData.data;

    // Check if trying to change owner role (only owner can do this)
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!existingMember) {
      return NextResponse.json(
        { error: 'Member not found in project' },
        { status: 404 }
      );
    }

    // Only allow owner to change owner role or promote someone to owner
    if (existingMember.role === 'OWNER' || role === 'OWNER') {
      const currentUserRole = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: session.user.id,
          },
        },
      });

      if (currentUserRole?.role !== 'OWNER') {
        return NextResponse.json(
          { error: 'Only project owner can modify owner role' },
          { status: 403 }
        );
      }
    }

    await updateProjectMemberRole(projectId, userId, role);

    return NextResponse.json(
      { message: 'Member role updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update project member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/members - Remove member from project
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id: projectId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user can manage members
    const canManage = await hasProjectPermission(session.user.id, projectId, 'project:manage_members');
    if (!canManage) {
      return NextResponse.json(
        { error: 'You do not have permission to manage project members' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Cannot remove owner
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found in project' },
        { status: 404 }
      );
    }

    if (member.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot remove project owner. Transfer ownership first.' },
        { status: 403 }
      );
    }

    await removeProjectMember(projectId, userId);

    return NextResponse.json(
      { message: 'Member removed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Remove project member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
