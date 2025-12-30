/**
 * 2FA Setup API
 * Issue #52: Two-factor authentication
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  generateSecret,
  generateTotpUri,
  generateQRCode,
  verifyToken,
  generateRecoveryCodes,
} from '@/lib/two-factor';

/**
 * GET /api/auth/2fa/setup
 * Generate new 2FA secret and QR code
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorEnabled: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA is already enabled' },
        { status: 400 }
      );
    }

    // Generate new secret
    const secret = generateSecret();
    const uri = generateTotpUri(user.email, secret);
    const qrCode = await generateQRCode(uri);

    // Temporarily store the secret (not enabled yet)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { twoFactorSecret: secret },
    });

    return NextResponse.json({
      secret,
      qrCode,
      uri,
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup 2FA' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/2fa/setup
 * Verify token and enable 2FA
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorEnabled: true, twoFactorSecret: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA is already enabled' },
        { status: 400 }
      );
    }

    if (!user.twoFactorSecret) {
      return NextResponse.json(
        { error: 'Please start 2FA setup first' },
        { status: 400 }
      );
    }

    // Verify the token
    const isValid = verifyToken(token, user.twoFactorSecret);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Generate recovery codes
    const recoveryCodes = generateRecoveryCodes();

    // Enable 2FA
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: true,
        recoveryCodes,
      },
    });

    return NextResponse.json({
      success: true,
      recoveryCodes,
      message: 'Two-factor authentication has been enabled',
    });
  } catch (error) {
    console.error('2FA enable error:', error);
    return NextResponse.json(
      { error: 'Failed to enable 2FA' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/2fa/setup
 * Disable 2FA
 */
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required to disable 2FA' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorEnabled: true, password: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA is not enabled' },
        { status: 400 }
      );
    }

    // Verify password
    const bcrypt = await import('bcryptjs');
    if (!user.password || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 400 }
      );
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        recoveryCodes: [],
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication has been disabled',
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json(
      { error: 'Failed to disable 2FA' },
      { status: 500 }
    );
  }
}
