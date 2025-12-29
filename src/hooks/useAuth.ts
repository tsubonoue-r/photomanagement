'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { Role } from '@prisma/client';

interface UseAuthOptions {
  required?: boolean;
  redirectTo?: string;
  allowedRoles?: Role[];
}

export function useAuth(options: UseAuthOptions = {}) {
  const { required = false, redirectTo = '/login', allowedRoles } = options;
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const user = session?.user;

  useEffect(() => {
    if (!isLoading && required && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isLoading, required, isAuthenticated, router, redirectTo]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && allowedRoles && user?.role) {
      if (!allowedRoles.includes(user.role)) {
        router.push('/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, allowedRoles, user?.role, router]);

  const hasRole = (roles: Role[]): boolean => {
    if (!user?.role) return false;
    return roles.includes(user.role);
  };

  const isAdmin = (): boolean => {
    return user?.role === 'ADMIN';
  };

  const isManager = (): boolean => {
    return user?.role === 'ADMIN' || user?.role === 'MANAGER';
  };

  const canEdit = (): boolean => {
    return user?.role !== 'VIEWER';
  };

  return {
    session,
    user,
    status,
    isLoading,
    isAuthenticated,
    hasRole,
    isAdmin,
    isManager,
    canEdit,
  };
}

export default useAuth;
