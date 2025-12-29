/**
 * NextAuth Mock
 * Issue #27: Mock for authentication in tests
 */

import type { Session } from 'next-auth';

// Default mock session
export const mockSession: Session = {
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'MEMBER',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Mock useSession hook
export const mockUseSession = jest.fn(() => ({
  data: mockSession,
  status: 'authenticated' as const,
}));

// Mock signIn function
export const mockSignIn = jest.fn();

// Mock signOut function
export const mockSignOut = jest.fn();

// Mock getServerSession
export const mockGetServerSession = jest.fn(() => Promise.resolve(mockSession));

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
  signIn: mockSignIn,
  signOut: mockSignOut,
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: mockGetServerSession,
}));

// Helper to set authenticated state
export const setAuthenticatedSession = (session: Partial<Session> = {}) => {
  const mergedSession = {
    ...mockSession,
    ...session,
    user: {
      ...mockSession.user,
      ...session.user,
    },
  };
  mockUseSession.mockReturnValue({
    data: mergedSession,
    status: 'authenticated' as const,
  });
  mockGetServerSession.mockResolvedValue(mergedSession);
  return mergedSession;
};

// Helper to set unauthenticated state
export const setUnauthenticatedSession = () => {
  mockUseSession.mockReturnValue({
    data: null,
    status: 'unauthenticated' as const,
  });
  mockGetServerSession.mockResolvedValue(null);
};

// Helper to set loading state
export const setLoadingSession = () => {
  mockUseSession.mockReturnValue({
    data: null,
    status: 'loading' as const,
  });
};

// Reset all auth mocks
export const resetAuthMocks = () => {
  mockUseSession.mockReset();
  mockSignIn.mockReset();
  mockSignOut.mockReset();
  mockGetServerSession.mockReset();
  setAuthenticatedSession();
};

export default {
  mockSession,
  mockUseSession,
  mockSignIn,
  mockSignOut,
  mockGetServerSession,
  setAuthenticatedSession,
  setUnauthenticatedSession,
  setLoadingSession,
  resetAuthMocks,
};
