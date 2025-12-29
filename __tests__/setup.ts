/**
 * Jest Test Setup
 * Issue #27: Testing Configuration for Photo Management App
 */

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-jest';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.S3_BUCKET_NAME = 'test-bucket';
process.env.S3_REGION = 'ap-northeast-1';

// Extend Jest matchers
import '@testing-library/jest-dom';

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn((...args) => {
    // Only log unexpected errors
    if (
      typeof args[0] === 'string' &&
      !args[0].includes('Warning:') &&
      !args[0].includes('Not implemented')
    ) {
      originalConsoleError(...args);
    }
  });

  console.warn = jest.fn((...args) => {
    // Only log important warnings
    if (
      typeof args[0] === 'string' &&
      !args[0].includes('Warning:')
    ) {
      originalConsoleWarn(...args);
    }
  });
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test utilities
declare global {
  namespace NodeJS {
    interface Global {
      testUtils: {
        createMockUser: (overrides?: Partial<MockUser>) => MockUser;
        createMockPhoto: (overrides?: Partial<MockPhoto>) => MockPhoto;
        createMockProject: (overrides?: Partial<MockProject>) => MockProject;
        wait: (ms: number) => Promise<void>;
      };
    }
  }
}

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';
  createdAt: Date;
  updatedAt: Date;
}

interface MockPhoto {
  id: string;
  title: string;
  filename: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
  projectId: string;
  categoryId: string | null;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MockProject {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Helper functions for creating test data
export const testUtils = {
  createMockUser: (overrides: Partial<MockUser> = {}): MockUser => ({
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'MEMBER',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }),

  createMockPhoto: (overrides: Partial<MockPhoto> = {}): MockPhoto => ({
    id: 'test-photo-id',
    title: 'Test Photo',
    filename: 'test-photo.jpg',
    url: 'https://example.com/photos/test-photo.jpg',
    thumbnailUrl: 'https://example.com/photos/test-photo-thumb.jpg',
    width: 1920,
    height: 1080,
    fileSize: 1024000,
    mimeType: 'image/jpeg',
    projectId: 'test-project-id',
    categoryId: null,
    uploadedBy: 'test-user-id',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }),

  createMockProject: (overrides: Partial<MockProject> = {}): MockProject => ({
    id: 'test-project-id',
    name: 'Test Project',
    description: 'Test project description',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }),

  wait: (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms)),
};

// Make test utilities globally available
(global as unknown as { testUtils: typeof testUtils }).testUtils = testUtils;

export { MockUser, MockPhoto, MockProject };
