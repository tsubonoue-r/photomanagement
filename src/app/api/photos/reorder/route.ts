/**
 * Photo Reorder API
 * Issue #49: Persist photo display order to database
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface ReorderRequest {
  projectId: string;
  photoIds: string[];
}

/**
 * PATCH /api/photos/reorder
 * Update display order for photos in a project
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ReorderRequest = await request.json();
    const { projectId, photoIds } = body;

    if (!projectId || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json(
        { error: 'projectId and photoIds array are required' },
        { status: 400 }
      );
    }

    // Verify user has access to the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          {
            organization: {
              members: {
                some: {
                  userId: session.user.id,
                },
              },
            },
          },
          {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        ],
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Update display order for each photo in a transaction
    await prisma.$transaction(
      photoIds.map((photoId, index) =>
        prisma.photo.update({
          where: { id: photoId },
          data: { displayOrder: index },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `Updated display order for ${photoIds.length} photos`,
    });
  } catch (error) {
    console.error('Photo reorder error:', error);
    return NextResponse.json(
      { error: 'Failed to reorder photos' },
      { status: 500 }
    );
  }
}
