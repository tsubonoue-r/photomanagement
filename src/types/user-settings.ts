/**
 * User Settings Types
 * Type definitions for user settings and profile management
 */

import { z } from 'zod';

// =============================================================================
// Validation Schemas
// =============================================================================

/**
 * Profile update validation schema
 */
export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  image: z.string().url('Invalid image URL').optional().nullable(),
});

/**
 * Password change validation schema
 */
export const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, 'Current password must be at least 8 characters'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

/**
 * Notification settings validation schema
 */
export const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  projectUpdates: z.boolean(),
  albumSharing: z.boolean(),
  weeklyDigest: z.boolean(),
});

/**
 * Display settings validation schema
 */
export const displaySettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.enum(['en', 'ja']).optional(),
  gridSize: z.enum(['small', 'medium', 'large']).optional(),
});

/**
 * Account deletion validation schema
 */
export const accountDeleteSchema = z.object({
  password: z.string().min(8, 'Password is required'),
  confirmation: z.literal('DELETE MY ACCOUNT', {
    error: 'Please type "DELETE MY ACCOUNT" to confirm',
  }),
});

// =============================================================================
// Type Definitions
// =============================================================================

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;
export type DisplaySettings = z.infer<typeof displaySettingsSchema>;
export type AccountDeleteInput = z.infer<typeof accountDeleteSchema>;

/**
 * User settings data structure
 */
export interface UserSettings {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  notifications: NotificationSettings;
  display: DisplaySettings;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Settings section type for navigation
 */
export type SettingsSection =
  | 'profile'
  | 'password'
  | 'notifications'
  | 'display'
  | 'account';

/**
 * Settings update response
 */
export interface SettingsUpdateResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: Partial<UserSettings>;
}
