/**
 * Authorization Module Unit Tests
 * Issue #37: API Endpoint Authorization Implementation
 */

import {
  hasSystemRole,
  hasProjectRole,
  hasOrganizationRole,
  requireRole,
  getProjectPermissions,
  getOrganizationPermissions,
} from '@/lib/authorization';
import type { Role, ProjectRole, OrganizationRole } from '@prisma/client';
import type { Session } from 'next-auth';

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    projectMember: {
      findUnique: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
    organizationMember: {
      findUnique: jest.fn(),
    },
    photo: {
      findUnique: jest.fn(),
    },
    album: {
      findUnique: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
    blackboard: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock next-auth
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

describe('Authorization Module', () => {
  describe('hasSystemRole', () => {
    it('should return true when user has exact required role', () => {
      expect(hasSystemRole('ADMIN', 'ADMIN')).toBe(true);
      expect(hasSystemRole('MEMBER', 'MEMBER')).toBe(true);
      expect(hasSystemRole('VIEWER', 'VIEWER')).toBe(true);
    });

    it('should return true when user has higher role than required', () => {
      expect(hasSystemRole('ADMIN', 'MEMBER')).toBe(true);
      expect(hasSystemRole('ADMIN', 'VIEWER')).toBe(true);
      expect(hasSystemRole('MANAGER', 'MEMBER')).toBe(true);
      expect(hasSystemRole('MANAGER', 'VIEWER')).toBe(true);
      expect(hasSystemRole('MEMBER', 'VIEWER')).toBe(true);
    });

    it('should return false when user has lower role than required', () => {
      expect(hasSystemRole('VIEWER', 'MEMBER')).toBe(false);
      expect(hasSystemRole('VIEWER', 'MANAGER')).toBe(false);
      expect(hasSystemRole('VIEWER', 'ADMIN')).toBe(false);
      expect(hasSystemRole('MEMBER', 'MANAGER')).toBe(false);
      expect(hasSystemRole('MEMBER', 'ADMIN')).toBe(false);
      expect(hasSystemRole('MANAGER', 'ADMIN')).toBe(false);
    });
  });

  describe('hasProjectRole', () => {
    it('should return true when user has exact required role', () => {
      expect(hasProjectRole('MANAGER', 'MANAGER')).toBe(true);
      expect(hasProjectRole('MEMBER', 'MEMBER')).toBe(true);
      expect(hasProjectRole('VIEWER', 'VIEWER')).toBe(true);
    });

    it('should return true when user has higher role than required', () => {
      expect(hasProjectRole('MANAGER', 'MEMBER')).toBe(true);
      expect(hasProjectRole('MANAGER', 'VIEWER')).toBe(true);
      expect(hasProjectRole('MEMBER', 'VIEWER')).toBe(true);
    });

    it('should return false when user has lower role than required', () => {
      expect(hasProjectRole('VIEWER', 'MEMBER')).toBe(false);
      expect(hasProjectRole('VIEWER', 'MANAGER')).toBe(false);
      expect(hasProjectRole('MEMBER', 'MANAGER')).toBe(false);
    });
  });

  describe('hasOrganizationRole', () => {
    it('should return true when user has exact required role', () => {
      expect(hasOrganizationRole('OWNER', 'OWNER')).toBe(true);
      expect(hasOrganizationRole('ADMIN', 'ADMIN')).toBe(true);
      expect(hasOrganizationRole('MEMBER', 'MEMBER')).toBe(true);
      expect(hasOrganizationRole('VIEWER', 'VIEWER')).toBe(true);
    });

    it('should return true when user has higher role than required', () => {
      expect(hasOrganizationRole('OWNER', 'ADMIN')).toBe(true);
      expect(hasOrganizationRole('OWNER', 'MEMBER')).toBe(true);
      expect(hasOrganizationRole('OWNER', 'VIEWER')).toBe(true);
      expect(hasOrganizationRole('ADMIN', 'MEMBER')).toBe(true);
      expect(hasOrganizationRole('ADMIN', 'VIEWER')).toBe(true);
      expect(hasOrganizationRole('MEMBER', 'VIEWER')).toBe(true);
    });

    it('should return false when user has lower role than required', () => {
      expect(hasOrganizationRole('VIEWER', 'MEMBER')).toBe(false);
      expect(hasOrganizationRole('VIEWER', 'ADMIN')).toBe(false);
      expect(hasOrganizationRole('VIEWER', 'OWNER')).toBe(false);
      expect(hasOrganizationRole('MEMBER', 'ADMIN')).toBe(false);
      expect(hasOrganizationRole('MEMBER', 'OWNER')).toBe(false);
      expect(hasOrganizationRole('ADMIN', 'OWNER')).toBe(false);
    });
  });

  describe('requireRole', () => {
    it('should return authorized true when user has allowed role', () => {
      const session: Session = {
        user: {
          id: 'user-1',
          role: 'ADMIN' as Role,
          email: 'admin@example.com',
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      };

      const result = requireRole(session, ['ADMIN', 'MANAGER']);
      expect(result.authorized).toBe(true);
      expect(result.role).toBe('ADMIN');
    });

    it('should return authorized false when user does not have allowed role', () => {
      const session: Session = {
        user: {
          id: 'user-1',
          role: 'VIEWER' as Role,
          email: 'viewer@example.com',
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      };

      const result = requireRole(session, ['ADMIN', 'MANAGER']);
      expect(result.authorized).toBe(false);
      expect(result.reason).toContain('Insufficient role');
    });

    it('should return authorized false when session is null', () => {
      const result = requireRole(null, ['ADMIN']);
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe('No session');
    });

    it('should return authorized false when user has no role', () => {
      const session: Session = {
        user: {
          id: 'user-1',
          email: 'user@example.com',
        } as Session['user'],
        expires: new Date(Date.now() + 86400000).toISOString(),
      };

      const result = requireRole(session, ['ADMIN']);
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe('No role assigned');
    });
  });

  describe('getProjectPermissions', () => {
    it('should return correct permissions for VIEWER', () => {
      const permissions = getProjectPermissions('VIEWER');
      expect(permissions).toContain('read');
      expect(permissions).not.toContain('write');
      expect(permissions).not.toContain('delete');
      expect(permissions).not.toContain('admin');
    });

    it('should return correct permissions for MEMBER', () => {
      const permissions = getProjectPermissions('MEMBER');
      expect(permissions).toContain('read');
      expect(permissions).toContain('write');
      expect(permissions).not.toContain('delete');
      expect(permissions).not.toContain('admin');
    });

    it('should return correct permissions for MANAGER', () => {
      const permissions = getProjectPermissions('MANAGER');
      expect(permissions).toContain('read');
      expect(permissions).toContain('write');
      expect(permissions).toContain('delete');
      expect(permissions).toContain('admin');
    });
  });

  describe('getOrganizationPermissions', () => {
    it('should return correct permissions for VIEWER', () => {
      const permissions = getOrganizationPermissions('VIEWER');
      expect(permissions).toContain('read');
      expect(permissions).not.toContain('write');
      expect(permissions).not.toContain('delete');
      expect(permissions).not.toContain('admin');
    });

    it('should return correct permissions for MEMBER', () => {
      const permissions = getOrganizationPermissions('MEMBER');
      expect(permissions).toContain('read');
      expect(permissions).toContain('write');
      expect(permissions).not.toContain('delete');
      expect(permissions).not.toContain('admin');
    });

    it('should return correct permissions for ADMIN', () => {
      const permissions = getOrganizationPermissions('ADMIN');
      expect(permissions).toContain('read');
      expect(permissions).toContain('write');
      expect(permissions).toContain('delete');
      expect(permissions).toContain('admin');
    });

    it('should return correct permissions for OWNER', () => {
      const permissions = getOrganizationPermissions('OWNER');
      expect(permissions).toContain('read');
      expect(permissions).toContain('write');
      expect(permissions).toContain('delete');
      expect(permissions).toContain('admin');
    });
  });
});

describe('Role Hierarchy Tests', () => {
  describe('System Role Hierarchy', () => {
    const roles: Role[] = ['VIEWER', 'MEMBER', 'MANAGER', 'ADMIN'];

    it('should follow correct hierarchy order', () => {
      // Each role should have access to its level and below
      for (let i = 0; i < roles.length; i++) {
        for (let j = 0; j <= i; j++) {
          expect(hasSystemRole(roles[i], roles[j])).toBe(true);
        }
        // Should not have access to higher roles
        for (let j = i + 1; j < roles.length; j++) {
          expect(hasSystemRole(roles[i], roles[j])).toBe(false);
        }
      }
    });
  });

  describe('Project Role Hierarchy', () => {
    const roles: ProjectRole[] = ['VIEWER', 'MEMBER', 'MANAGER'];

    it('should follow correct hierarchy order', () => {
      for (let i = 0; i < roles.length; i++) {
        for (let j = 0; j <= i; j++) {
          expect(hasProjectRole(roles[i], roles[j])).toBe(true);
        }
        for (let j = i + 1; j < roles.length; j++) {
          expect(hasProjectRole(roles[i], roles[j])).toBe(false);
        }
      }
    });
  });

  describe('Organization Role Hierarchy', () => {
    const roles: OrganizationRole[] = ['VIEWER', 'MEMBER', 'ADMIN', 'OWNER'];

    it('should follow correct hierarchy order', () => {
      for (let i = 0; i < roles.length; i++) {
        for (let j = 0; j <= i; j++) {
          expect(hasOrganizationRole(roles[i], roles[j])).toBe(true);
        }
        for (let j = i + 1; j < roles.length; j++) {
          expect(hasOrganizationRole(roles[i], roles[j])).toBe(false);
        }
      }
    });
  });
});

describe('Permission Mapping Tests', () => {
  describe('Project Role to Permission Mapping', () => {
    it('VIEWER should only have read permission', () => {
      const permissions = getProjectPermissions('VIEWER');
      expect(permissions).toHaveLength(1);
      expect(permissions).toEqual(['read']);
    });

    it('MEMBER should have read and write permissions', () => {
      const permissions = getProjectPermissions('MEMBER');
      expect(permissions).toHaveLength(2);
      expect(permissions).toEqual(expect.arrayContaining(['read', 'write']));
    });

    it('MANAGER should have all permissions', () => {
      const permissions = getProjectPermissions('MANAGER');
      expect(permissions).toHaveLength(4);
      expect(permissions).toEqual(expect.arrayContaining(['read', 'write', 'delete', 'admin']));
    });
  });

  describe('Organization Role to Permission Mapping', () => {
    it('VIEWER should only have read permission', () => {
      const permissions = getOrganizationPermissions('VIEWER');
      expect(permissions).toHaveLength(1);
      expect(permissions).toEqual(['read']);
    });

    it('MEMBER should have read and write permissions', () => {
      const permissions = getOrganizationPermissions('MEMBER');
      expect(permissions).toHaveLength(2);
      expect(permissions).toEqual(expect.arrayContaining(['read', 'write']));
    });

    it('ADMIN should have all permissions', () => {
      const permissions = getOrganizationPermissions('ADMIN');
      expect(permissions).toHaveLength(4);
      expect(permissions).toEqual(expect.arrayContaining(['read', 'write', 'delete', 'admin']));
    });

    it('OWNER should have all permissions', () => {
      const permissions = getOrganizationPermissions('OWNER');
      expect(permissions).toHaveLength(4);
      expect(permissions).toEqual(expect.arrayContaining(['read', 'write', 'delete', 'admin']));
    });
  });
});
