/**
 * 2FA Verification API
 * Issue #52: Two-factor authentication
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, verifyRecoveryCode, removeRecoveryCode } from '@/lib/two-factor';

interface VerifyRequest {
  userId: string;
  code: string;
  isRecoveryCode?: boolean;
}

/**
 * POST /api/auth/2fa/verify
 * Verify 2FA token during login
 */
export async function POST(request: Request) {
  try {
    const body: VerifyRequest = await request.json();
    const { userId, code, isRecoveryCode } = body;

    if (!userId || !code) {
      return NextResponse.json(
        { error: 'User ID and code are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
        twoFactorSecret: true,
        recoveryCodes: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA is not enabled for this user' },
        { status: 400 }
      );
    }

    let isValid = false;

    if (isRecoveryCode) {
      // Verify recovery code
      isValid = verifyRecoveryCode(code, user.recoveryCodes);

      if (isValid) {
        // Remove the used recovery code
        const updatedCodes = removeRecoveryCode(code, user.recoveryCodes);
        await prisma.user.update({
          where: { id: userId },
          data: { recoveryCodes: updatedCodes },
        });
      }
    } else {
      // Verify TOTP
      isValid = verifyToken(code, user.twoFactorSecret);
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification successful',
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
