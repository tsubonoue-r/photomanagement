/**
 * Forgot Password API
 * Issue #51: Password reset functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Rate limiting: 1 request per email per minute
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

interface ForgotPasswordRequest {
  email: string;
}

/**
 * POST /api/auth/forgot-password
 * Request password reset email
 */
export async function POST(request: NextRequest) {
  try {
    const body: ForgotPasswordRequest = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting check
    const lastRequest = rateLimitMap.get(normalizedEmail);
    if (lastRequest && Date.now() - lastRequest < RATE_LIMIT_WINDOW) {
      return NextResponse.json(
        { error: 'Please wait before requesting another reset email' },
        { status: 429 }
      );
    }

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link',
    });

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Don't reveal that the user doesn't exist
      return successResponse;
    }

    // Update rate limit
    rateLimitMap.set(normalizedEmail, Date.now());

    // Invalidate any existing tokens for this email
    await prisma.passwordResetToken.updateMany({
      where: {
        email: normalizedEmail,
        used: false,
      },
      data: {
        used: true,
      },
    });

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create reset token
    await prisma.passwordResetToken.create({
      data: {
        email: normalizedEmail,
        token,
        expires,
      },
    });

    // TODO: Send email with reset link
    // For now, log the reset link (in production, this should send an email)
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
    console.log(`[Password Reset] Reset link for ${normalizedEmail}: ${resetUrl}`);

    // In production, integrate with email service:
    // await sendPasswordResetEmail(normalizedEmail, resetUrl);

    return successResponse;
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
