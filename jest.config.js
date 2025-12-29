/**
 * Jest Configuration
 * Issue #27: Testing Setup for Photo Management App
 */

/** @type {import('jest').Config} */
const config = {
  // Test environment
  testEnvironment: 'node',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Test match patterns
  testMatch: [
    '<rootDir>/__tests__/unit/**/*.test.ts',
    '<rootDir>/__tests__/unit/**/*.test.tsx',
    '<rootDir>/__tests__/integration/**/*.test.ts',
  ],

  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.test.json',
      useESM: true,
    }],
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**/page.tsx',
    '!src/app/**/layout.tsx',
    '!src/app/**/loading.tsx',
    '!src/app/**/error.tsx',
    '!src/app/**/not-found.tsx',
    '!src/components/providers/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/__tests__/e2e/',
  ],

  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>'],

  // Clear mocks automatically
  clearMocks: true,

  // Verbose output
  verbose: true,

  // Timeout for each test
  testTimeout: 30000,

  // Projects for different test types
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/__tests__/unit/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: '<rootDir>/tsconfig.test.json',
          useESM: true,
        }],
      },
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/__tests__/integration/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: '<rootDir>/tsconfig.test.json',
          useESM: true,
        }],
      },
    },
  ],
};

module.exports = config;
