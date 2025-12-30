/**
 * 2FA Status API
 * Issue #52: Two-factor authentication
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/auth/2fa/status
 * Get current 2FA status for authenticated user
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        twoFactorEnabled: true,
        recoveryCodes: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      enabled: user.twoFactorEnabled,
      recoveryCodesRemaining: user.recoveryCodes.length,
    });
  } catch (error) {
    console.error('2FA status error:', error);
    return NextResponse.json(
      { error: 'Failed to get 2FA status' },
      { status: 500 }
    );
  }
}
