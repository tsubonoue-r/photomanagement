/**
 * Prisma Mock
 * Issue #27: Mock for database operations in tests
 */

import type { PrismaClient } from '@prisma/client';

// Create mock functions for all Prisma methods
const createMockPrismaModel = () => ({
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  upsert: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  count: jest.fn(),
  aggregate: jest.fn(),
  groupBy: jest.fn(),
});

export const mockPrisma = {
  user: createMockPrismaModel(),
  photo: createMockPrismaModel(),
  project: createMockPrismaModel(),
  category: createMockPrismaModel(),
  album: createMockPrismaModel(),
  albumPhoto: createMockPrismaModel(),
  blackboard: createMockPrismaModel(),
  blackboardTemplate: createMockPrismaModel(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn((callback) => callback(mockPrisma)),
} as unknown as jest.Mocked<PrismaClient>;

// Mock the prisma module
jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

// Helper to reset all mocks
export const resetPrismaMocks = () => {
  Object.values(mockPrisma).forEach((model) => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach((method) => {
        if (typeof method === 'function' && 'mockReset' in method) {
          (method as jest.Mock).mockReset();
        }
      });
    }
  });
};

export default mockPrisma;
