/**
 * useAuth Hook Unit Tests
 * Issue #27: Testing for authentication hook
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Mock modules
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Import after mocking
import { useAuth } from '@/hooks/useAuth';

describe('useAuth Hook', () => {
  const mockPush = jest.fn();
  const mockUseSession = useSession as jest.Mock;
  const mockUseRouter = useRouter as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush });
  });

  describe('basic functionality', () => {
    it('should return loading state when session is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeUndefined();
    });

    it('should return authenticated state with user data', () => {
      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'MEMBER',
      };

      mockUseSession.mockReturnValue({
        data: { user: mockUser },
        status: 'authenticated',
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('should return unauthenticated state', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeUndefined();
    });
  });

  describe('redirect behavior', () => {
    it('should redirect to login when required and not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      renderHook(() => useAuth({ required: true }));

      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('should redirect to custom URL when specified', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      renderHook(() => useAuth({ required: true, redirectTo: '/custom-login' }));

      expect(mockPush).toHaveBeenCalledWith('/custom-login');
    });

    it('should not redirect when not required', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      renderHook(() => useAuth({ required: false }));

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should not redirect when authenticated', () => {
      mockUseSession.mockReturnValue({
        data: { user: { role: 'MEMBER' } },
        status: 'authenticated',
      });

      renderHook(() => useAuth({ required: true }));

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should not redirect while loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      });

      renderHook(() => useAuth({ required: true }));

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('role-based access', () => {
    it('should redirect to dashboard when role not allowed', () => {
      mockUseSession.mockReturnValue({
        data: { user: { role: 'VIEWER' } },
        status: 'authenticated',
      });

      renderHook(() => useAuth({ allowedRoles: ['ADMIN', 'MANAGER'] }));

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('should not redirect when role is allowed', () => {
      mockUseSession.mockReturnValue({
        data: { user: { role: 'ADMIN' } },
        status: 'authenticated',
      });

      renderHook(() => useAuth({ allowedRoles: ['ADMIN', 'MANAGER'] }));

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('role check methods', () => {
    it('hasRole should return true for matching role', () => {
      mockUseSession.mockReturnValue({
        data: { user: { role: 'MANAGER' } },
        status: 'authenticated',
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.hasRole(['MANAGER', 'ADMIN'])).toBe(true);
    });

    it('hasRole should return false for non-matching role', () => {
      mockUseSession.mockReturnValue({
        data: { user: { role: 'VIEWER' } },
        status: 'authenticated',
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.hasRole(['MANAGER', 'ADMIN'])).toBe(false);
    });

    it('hasRole should return false when not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.hasRole(['ADMIN'])).toBe(false);
    });

    it('isAdmin should return true for ADMIN role', () => {
      mockUseSession.mockReturnValue({
        data: { user: { role: 'ADMIN' } },
        status: 'authenticated',
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isAdmin()).toBe(true);
    });

    it('isAdmin should return false for non-ADMIN role', () => {
      mockUseSession.mockReturnValue({
        data: { user: { role: 'MANAGER' } },
        status: 'authenticated',
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isAdmin()).toBe(false);
    });

    it('isManager should return true for ADMIN or MANAGER', () => {
      mockUseSession.mockReturnValue({
        data: { user: { role: 'ADMIN' } },
        status: 'authenticated',
      });

      const { result: adminResult } = renderHook(() => useAuth());
      expect(adminResult.current.isManager()).toBe(true);

      mockUseSession.mockReturnValue({
        data: { user: { role: 'MANAGER' } },
        status: 'authenticated',
      });

      const { result: managerResult } = renderHook(() => useAuth());
      expect(managerResult.current.isManager()).toBe(true);
    });

    it('isManager should return false for MEMBER or VIEWER', () => {
      mockUseSession.mockReturnValue({
        data: { user: { role: 'MEMBER' } },
        status: 'authenticated',
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isManager()).toBe(false);
    });

    it('canEdit should return true for all except VIEWER', () => {
      const editableRoles = ['ADMIN', 'MANAGER', 'MEMBER'];

      editableRoles.forEach((role) => {
        mockUseSession.mockReturnValue({
          data: { user: { role } },
          status: 'authenticated',
        });

        const { result } = renderHook(() => useAuth());
        expect(result.current.canEdit()).toBe(true);
      });
    });

    it('canEdit should return false for VIEWER', () => {
      mockUseSession.mockReturnValue({
        data: { user: { role: 'VIEWER' } },
        status: 'authenticated',
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.canEdit()).toBe(false);
    });
  });

  describe('session data', () => {
    it('should return full session object', () => {
      const mockSession = {
        user: { id: 'user-1', role: 'MEMBER' },
        expires: '2024-12-31',
      };

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.session).toEqual(mockSession);
    });

    it('should return status', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.status).toBe('loading');
    });
  });
});
