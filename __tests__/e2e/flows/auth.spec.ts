/**
 * Auth E2E Tests
 * Issue #27: E2E testing for authentication flows
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.describe('Registration', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto('/register');

      // Wait for the form to load (it uses Suspense)
      await expect(page.getByRole('heading', { name: /create.*account/i })).toBeVisible({ timeout: 10000 });
      await expect(page.getByLabel(/full name/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
      await expect(page.getByLabel(/confirm password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
    });

    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/register');

      // Wait for form to load
      await expect(page.getByRole('button', { name: /create account/i })).toBeVisible({ timeout: 10000 });

      await page.getByRole('button', { name: /create account/i }).click();

      // Check for validation messages
      await expect(page.getByText('Name is required')).toBeVisible();
      await expect(page.getByText('Email is required')).toBeVisible();
    });

    test('should show validation error for invalid email', async ({ page }) => {
      await page.goto('/register');

      await expect(page.getByRole('button', { name: /create account/i })).toBeVisible({ timeout: 10000 });

      await page.getByLabel(/full name/i).fill('Test User');
      // Use email that passes browser validation but fails server/custom validation
      // Or simply test that browser validation blocks invalid format
      const emailInput = page.getByLabel(/email/i);
      await emailInput.fill('invalid-email');
      await page.locator('#password').fill('Password123');
      await page.getByLabel(/confirm password/i).fill('Password123');
      await page.getByRole('button', { name: /create account/i }).click();

      // Browser's HTML5 validation kicks in for type="email" inputs
      // Check that the email input has validation error (browser native or custom)
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBeTruthy();
    });

    test('should show validation error for weak password', async ({ page }) => {
      await page.goto('/register');

      await expect(page.getByRole('button', { name: /create account/i })).toBeVisible({ timeout: 10000 });

      await page.getByLabel(/full name/i).fill('Test User');
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.locator('#password').fill('weak');
      await page.getByLabel(/confirm password/i).fill('weak');
      await page.getByRole('button', { name: /create account/i }).click();

      // Use exact text to avoid matching the hint text
      await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
    });

    test('should show error for mismatched passwords', async ({ page }) => {
      await page.goto('/register');

      await expect(page.getByRole('button', { name: /create account/i })).toBeVisible({ timeout: 10000 });

      await page.getByLabel(/full name/i).fill('Test User');
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.locator('#password').fill('Password123');
      await page.getByLabel(/confirm password/i).fill('Password456');
      await page.getByRole('button', { name: /create account/i }).click();

      await expect(page.getByText(/do not match/i)).toBeVisible();
    });

    test('should have link to login page', async ({ page }) => {
      await page.goto('/register');

      await expect(page.getByRole('heading', { name: /create.*account/i })).toBeVisible({ timeout: 10000 });

      const loginLink = page.getByRole('link', { name: /sign in/i });
      await expect(loginLink).toBeVisible();
      await loginLink.click();

      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Login', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login');

      await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/login');

      await page.getByRole('button', { name: /sign in/i }).click();

      // Validation messages should appear
      await expect(page.locator('form')).toContainText(/required|invalid/i);
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/email/i).fill('wrong@example.com');
      await page.getByLabel(/password/i).fill('WrongPassword123');
      await page.getByRole('button', { name: /sign in/i }).click();

      // Wait for error message - could be various error messages
      await expect(page.getByText(/invalid|incorrect|failed|error/i)).toBeVisible({ timeout: 15000 });
    });

    test('should have link to registration page', async ({ page }) => {
      await page.goto('/login');

      const registerLink = page.getByRole('link', { name: /create.*account|sign up|register/i });
      await expect(registerLink).toBeVisible();
      await registerLink.click();

      await expect(page).toHaveURL(/\/register/);
    });

    test('should redirect to login when accessing protected page without auth', async ({ page }) => {
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Authenticated User', () => {
    // These tests would require a test user to be set up
    test.skip('should redirect to dashboard after successful login', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('TestPassword123');
      await page.getByRole('button', { name: /sign in/i }).click();

      await expect(page).toHaveURL(/\/dashboard/);
    });

    test.skip('should display user info in header', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('TestPassword123');
      await page.getByRole('button', { name: /sign in/i }).click();

      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByText(/test@example.com|Test User/i)).toBeVisible();
    });

    test.skip('should logout successfully', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/password/i).fill('TestPassword123');
      await page.getByRole('button', { name: /sign in/i }).click();

      await expect(page).toHaveURL(/\/dashboard/);

      // Find and click logout button
      await page.getByRole('button', { name: /logout|sign out/i }).click();

      await expect(page).toHaveURL(/\/login|\/$/);
    });
  });
});
