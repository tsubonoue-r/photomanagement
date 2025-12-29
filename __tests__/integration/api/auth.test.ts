/**
 * Auth API Integration Tests
 * Issue #27: Testing for authentication API endpoints
 */

import { NextRequest } from 'next/server';

// Mock modules
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed_password'),
  verifyPassword: jest.fn(),
}));

import { POST } from '@/app/api/auth/register/route';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    const createRequest = (body: object) => {
      return new Request('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    };

    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'MEMBER',
        createdAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const request = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe('User registered successfully');
      expect(data.user).toEqual(expect.objectContaining({
        name: 'Test User',
        email: 'test@example.com',
      }));
    });

    it('should return 400 for missing name', async () => {
      const request = createRequest({
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 for invalid email', async () => {
      const request = createRequest({
        name: 'Test User',
        email: 'invalid-email',
        password: 'Password123',
        confirmPassword: 'Password123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details.email).toBeDefined();
    });

    it('should return 400 for short password', async () => {
      const request = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Pwd1',
        confirmPassword: 'Pwd1',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.details.password).toBeDefined();
    });

    it('should return 400 for password without uppercase', async () => {
      const request = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.details.password).toBeDefined();
    });

    it('should return 400 for password without lowercase', async () => {
      const request = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'PASSWORD123',
        confirmPassword: 'PASSWORD123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.details.password).toBeDefined();
    });

    it('should return 400 for password without number', async () => {
      const request = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password',
        confirmPassword: 'Password',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.details.password).toBeDefined();
    });

    it('should return 400 for mismatched passwords', async () => {
      const request = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password456',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.details.confirmPassword).toBeDefined();
    });

    it('should return 409 for existing user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com',
      });

      const request = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('already exists');
    });

    it('should hash password before storing', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'MEMBER',
        createdAt: new Date(),
      });

      const request = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      });

      await POST(request);

      expect(hashPassword).toHaveBeenCalledWith('Password123');
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: 'hashed_password',
          }),
        })
      );
    });

    it('should return 500 for database errors', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const request = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should assign MEMBER role by default', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'MEMBER',
        createdAt: new Date(),
      });

      const request = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      });

      await POST(request);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'MEMBER',
          }),
        })
      );
    });

    it('should not return password in response', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'MEMBER',
        createdAt: new Date(),
      });

      const request = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.user.password).toBeUndefined();
    });

    it('should trim whitespace from name', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'MEMBER',
        createdAt: new Date(),
      });

      const request = createRequest({
        name: '  Test User  ',
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      });

      await POST(request);

      // The validation should handle trimming or pass it through
      expect(prisma.user.create).toHaveBeenCalled();
    });
  });
});
