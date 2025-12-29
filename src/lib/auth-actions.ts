'use server';

import { signIn, signOut } from '@/lib/auth';
import { AuthError } from 'next-auth';

export async function loginAction(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { success: false, error: 'Invalid email or password' };
        default:
          return { success: false, error: 'Something went wrong' };
      }
    }
    throw error;
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: '/login' });
}
