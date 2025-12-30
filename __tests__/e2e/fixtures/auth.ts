/**
 * Authentication Fixtures for E2E Tests
 * Issue #42: E2Eテスト・統合テストの完全実装
 *
 * Provides authenticated test context for tests that require login.
 */

import { test as base, expect, Page, BrowserContext } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

// Test user credentials
export const TEST_USER = {
  email: 'e2e-test@example.com',
  password: 'E2ETestPassword123!',
  name: 'E2E Test User',
};

// Storage state file path
const AUTH_FILE = path.join(__dirname, '../.auth/user.json');

/**
 * Authenticate a user by filling login form
 */
async function authenticateUser(page: Page): Promise<void> {
  await page.goto('/login');

  // Fill login form
  await page.getByLabel(/email/i).fill(TEST_USER.email);
  await page.getByLabel(/password/i).fill(TEST_USER.password);

  // Submit form
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to dashboard or authenticated page
  await page.waitForURL(/\/(dashboard|organizations|settings)/, {
    timeout: 15000,
  });
}

/**
 * Register a new test user
 */
async function registerTestUser(page: Page): Promise<boolean> {
  try {
    await page.goto('/register');

    // Check if register page loaded
    const heading = page.getByRole('heading', { name: /create.*account/i });
    if (!(await heading.isVisible({ timeout: 5000 }))) {
      console.log('Register page not accessible, user may already exist');
      return false;
    }

    // Fill registration form
    await page.getByLabel(/full name/i).fill(TEST_USER.name);
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.locator('#password').fill(TEST_USER.password);
    await page.getByLabel(/confirm password/i).fill(TEST_USER.password);

    // Submit form
    await page.getByRole('button', { name: /create account/i }).click();

    // Wait for success (redirect or success message)
    await page.waitForURL(/\/(dashboard|login)/, { timeout: 15000 });

    return true;
  } catch (error) {
    console.log('Registration failed, user may already exist:', error);
    return false;
  }
}

/**
 * Setup authentication state
 * This creates a storage state file that can be reused by tests
 */
export async function globalSetup(context: BrowserContext): Promise<void> {
  const page = await context.newPage();

  try {
    // Try to login first
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Check if login succeeded
    try {
      await page.waitForURL(/\/(dashboard|organizations|settings)/, {
        timeout: 10000,
      });
    } catch {
      // Login failed, try to register
      console.log('Login failed, attempting to register test user...');
      await registerTestUser(page);

      // Now try to login again
      await authenticateUser(page);
    }

    // Ensure auth directory exists
    const authDir = path.dirname(AUTH_FILE);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    // Save storage state
    await context.storageState({ path: AUTH_FILE });
    console.log('Authentication state saved to:', AUTH_FILE);
  } finally {
    await page.close();
  }
}

/**
 * Custom test fixture with authenticated user
 */
type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    // Check if auth file exists
    let context;

    if (fs.existsSync(AUTH_FILE)) {
      // Use existing auth state
      context = await browser.newContext({ storageState: AUTH_FILE });
    } else {
      // Create new context and authenticate
      context = await browser.newContext();
      await globalSetup(context);
    }

    const page = await context.newPage();

    // Verify authentication by checking redirect
    await page.goto('/dashboard');
    const url = page.url();

    if (url.includes('/login')) {
      // Auth state is stale, re-authenticate
      console.log('Auth state stale, re-authenticating...');
      await authenticateUser(page);
      await context.storageState({ path: AUTH_FILE });
    }

    await use(page);

    await page.close();
    await context.close();
  },
});

export { expect };

/**
 * Helper to skip test if authentication is not available
 */
export function skipIfNoAuth(testFn: () => void): void {
  if (!fs.existsSync(AUTH_FILE)) {
    console.log('Skipping test: No authentication state available');
    return;
  }
  testFn();
}

/**
 * Mock authenticated session for API tests
 */
export const mockAuthSession = {
  user: {
    id: 'test-user-id',
    email: TEST_USER.email,
    name: TEST_USER.name,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};
