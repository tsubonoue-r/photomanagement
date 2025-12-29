/**
 * Error Pages E2E Tests
 * Issue #42: E2E testing for error pages
 */

import { test, expect } from '@playwright/test';

test.describe('Error Pages', () => {
  test.describe('404 Not Found Page', () => {
    test('should display 404 page for non-existent route', async ({ page }) => {
      await page.goto('/this-page-does-not-exist-12345');

      // Check for 404 indicators
      await expect(page.getByText(/404|not found/i)).toBeVisible();
    });

    test('should display page title', async ({ page }) => {
      await page.goto('/non-existent-page');

      await expect(page.getByRole('heading', { name: /not found|page not found/i })).toBeVisible();
    });

    test('should have search functionality', async ({ page }) => {
      await page.goto('/non-existent-page');

      const searchInput = page.getByRole('textbox', { name: /search/i });
      if (await searchInput.isVisible()) {
        await searchInput.fill('test query');

        const searchButton = page.getByRole('button', { name: /search/i });
        await searchButton.click();

        // Should attempt to navigate to dashboard (may redirect to login if not authenticated)
        // The URL will either be dashboard with search or login (after redirect)
        await page.waitForURL(/(dashboard|login)/);
        const url = page.url();
        expect(url.includes('dashboard') || url.includes('login')).toBeTruthy();
      }
    });

    test('should have home link', async ({ page }) => {
      await page.goto('/non-existent-page');

      const homeLink = page.getByRole('link', { name: /home|go.*home/i });
      await expect(homeLink).toBeVisible();
    });

    test('should have go back button', async ({ page }) => {
      // First navigate to dashboard, then to non-existent page
      await page.goto('/');
      await page.goto('/non-existent-page');

      const backButton = page.getByRole('button', { name: /back|go.*back/i });
      if (await backButton.isVisible()) {
        await backButton.click();

        // Should navigate back
        await expect(page).not.toHaveURL(/non-existent/);
      }
    });

    test('should display quick links', async ({ page }) => {
      await page.goto('/non-existent-page');

      // Check for quick link cards
      const dashboardLink = page.getByRole('link', { name: /dashboard/i });
      const settingsLink = page.getByRole('link', { name: /settings/i });
      const organizationsLink = page.getByRole('link', { name: /organizations/i });

      // At least one quick link should be visible
      const anyVisible = await dashboardLink.isVisible() ||
                         await settingsLink.isVisible() ||
                         await organizationsLink.isVisible();
      expect(anyVisible).toBeTruthy();
    });

    test('should have login and register links', async ({ page }) => {
      await page.goto('/non-existent-page');

      const loginLink = page.getByRole('link', { name: /login/i });
      const registerLink = page.getByRole('link', { name: /register/i });

      // Check if at least login link is visible
      if (await loginLink.isVisible()) {
        await expect(loginLink).toHaveAttribute('href', '/login');
      }

      if (await registerLink.isVisible()) {
        await expect(registerLink).toHaveAttribute('href', '/register');
      }
    });
  });

  test.describe('Error Boundary', () => {
    test.skip('should catch and display runtime errors', async ({ page }) => {
      // This test would require a route that intentionally throws an error
      await page.goto('/error-test');

      await expect(page.getByText(/something went wrong|error/i)).toBeVisible();
    });

    test.skip('should provide retry option', async ({ page }) => {
      await page.goto('/error-test');

      const retryButton = page.getByRole('button', { name: /retry|try again/i });
      if (await retryButton.isVisible()) {
        await retryButton.click();
      }
    });
  });

  test.describe('API Error Handling', () => {
    test.skip('should display error toast for failed API calls', async ({ page }) => {
      // Mock API failure
      await page.route('**/api/**', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      });

      await page.goto('/dashboard');

      // Check for error indication
      await expect(page.getByText(/error|failed/i)).toBeVisible({ timeout: 10000 });
    });

    test.skip('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/**', (route) => {
        route.abort('failed');
      });

      await page.goto('/dashboard');

      await expect(page.getByText(/network|connection|offline/i)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Authentication Errors', () => {
    test('should redirect to login on 401 error', async ({ page }) => {
      await page.goto('/dashboard');

      // Without authentication, should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test.skip('should display forbidden page for 403 errors', async ({ page }) => {
      // Mock 403 response
      await page.route('**/api/organizations/**', (route) => {
        route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Forbidden' }),
        });
      });

      await page.goto('/organizations/restricted-org');

      await expect(page.getByText(/forbidden|access denied|permission/i)).toBeVisible();
    });
  });

  test.describe('Form Validation Errors', () => {
    test('should display validation errors on login form', async ({ page }) => {
      await page.goto('/login');

      // Submit empty form
      const submitButton = page.getByRole('button', { name: /sign in/i });
      await submitButton.click();

      // Should show validation errors - check form contains error text
      await expect(page.locator('form')).toContainText(/required|invalid/i);
    });

    test('should display validation errors on registration form', async ({ page }) => {
      await page.goto('/register');

      // Wait for form to load
      const submitButton = page.getByRole('button', { name: /create account/i });
      await expect(submitButton).toBeVisible({ timeout: 10000 });

      await submitButton.click();

      // Should show validation errors - check for specific error message
      await expect(page.getByText('Name is required')).toBeVisible();
    });
  });

  test.describe('Loading States', () => {
    test.skip('should display loading indicator during page transitions', async ({ page }) => {
      await page.goto('/');

      // Start navigation
      const navigationPromise = page.goto('/dashboard');

      // Check for loading indicator
      const loadingIndicator = page.locator('[data-testid="loading"]');
      // Loading state might be very brief

      await navigationPromise;
    });

    test.skip('should display skeleton loaders for content', async ({ page }) => {
      // Slow down API responses to see skeleton loaders
      await page.route('**/api/**', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      });

      await page.goto('/dashboard');

      // Check for skeleton elements
      const skeleton = page.locator('.animate-pulse, [data-testid="skeleton"]');
      // Skeleton might appear briefly
    });
  });
});
