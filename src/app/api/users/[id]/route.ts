/**
 * User API Routes
 * Handles user profile updates and account deletion
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, createAuthError } from '@/lib/authorization';
import { verifyPassword } from '@/lib/auth';
import {
  profileUpdateSchema,
  accountDeleteSchema,
  notificationSettingsSchema,
} from '@/types/user-settings';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/users/[id]
 * Get user profile and settings
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;

    // Users can only access their own profile (unless admin)
    if (session.user.id !== id && session.user.role !== 'ADMIN') {
      return createAuthError('FORBIDDEN', 'Access denied', 403);
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return user with default notification settings
    // In a production app, these would be stored in a separate table
    return NextResponse.json({
      success: true,
      data: {
        ...user,
        notifications: {
          emailNotifications: true,
          projectUpdates: true,
          albumSharing: true,
          weeklyDigest: false,
        },
        display: {
          theme: 'system',
          language: 'en',
          gridSize: 'medium',
        },
      },
    });
  } catch (error) {
    console.error('GET /api/users/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/[id]
 * Update user profile
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;

    // Users can only update their own profile (unless admin)
    if (session.user.id !== id && session.user.role !== 'ADMIN') {
      return createAuthError('FORBIDDEN', 'Access denied', 403);
    }

    const body = await request.json();
    const { type } = body;

    // Handle different update types
    if (type === 'profile') {
      const validated = profileUpdateSchema.safeParse(body.data);
      if (!validated.success) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: validated.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          name: validated.data.name,
          image: validated.data.image,
        },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser,
      });
    }

    if (type === 'notifications') {
      const validated = notificationSettingsSchema.safeParse(body.data);
      if (!validated.success) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: validated.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      // In a production app, save to UserSettings table
      // For now, we just return success
      return NextResponse.json({
        success: true,
        message: 'Notification settings updated successfully',
        data: { notifications: validated.data },
      });
    }

    return NextResponse.json(
      { error: 'Invalid update type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('PATCH /api/users/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]
 * Delete user account
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;

    // Users can only delete their own account (unless admin)
    if (session.user.id !== id && session.user.role !== 'ADMIN') {
      return createAuthError('FORBIDDEN', 'Access denied', 403);
    }

    const body = await request.json();
    const validated = accountDeleteSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Get user with password for verification
    const user = await prisma.user.findUnique({
      where: { id },
      select: { password: true },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'User not found or cannot be deleted' },
        { status: 404 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(
      validated.data.password,
      user.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      );
    }

    // Delete user (cascading deletes will handle related records)
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/users/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
