import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { SettingsClient } from './SettingsClient';
import type { NotificationSettings } from '@/types/user-settings';

/**
 * Settings Page
 *
 * Server component that fetches user data and renders the settings interface.
 * Provides sections for:
 * - Profile editing (name, avatar)
 * - Password change
 * - Notification settings
 * - Display settings (theme)
 * - Account deletion
 */
export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Fetch complete user data
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  // Default notification settings
  // In a production app, these would be fetched from a UserSettings table
  const defaultNotifications: NotificationSettings = {
    emailNotifications: true,
    projectUpdates: true,
    albumSharing: true,
    weeklyDigest: false,
  };

  return (
    <SettingsClient
      user={{
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        createdAt: user.createdAt,
      }}
      notifications={defaultNotifications}
    />
  );
}
