/**
 * Two-Factor Authentication Utilities
 * Issue #52: 2FA/MFA support
 */

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';

const APP_NAME = 'PhotoManager';

/**
 * Generate a new TOTP secret
 */
export function generateSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate TOTP URI for QR code
 */
export function generateTotpUri(email: string, secret: string): string {
  return authenticator.keyuri(email, APP_NAME, secret);
}

/**
 * Generate QR code as data URL
 */
export async function generateQRCode(uri: string): Promise<string> {
  return QRCode.toDataURL(uri, {
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
}

/**
 * Verify TOTP token
 */
export function verifyToken(token: string, secret: string): boolean {
  return authenticator.verify({ token, secret });
}

/**
 * Generate recovery codes
 */
export function generateRecoveryCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8 character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    // Format as XXXX-XXXX
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

/**
 * Check if a recovery code is valid
 */
export function verifyRecoveryCode(code: string, codes: string[]): boolean {
  const normalizedCode = code.toUpperCase().replace(/\s/g, '');
  return codes.includes(normalizedCode);
}

/**
 * Remove used recovery code from list
 */
export function removeRecoveryCode(code: string, codes: string[]): string[] {
  const normalizedCode = code.toUpperCase().replace(/\s/g, '');
  return codes.filter((c) => c !== normalizedCode);
}
