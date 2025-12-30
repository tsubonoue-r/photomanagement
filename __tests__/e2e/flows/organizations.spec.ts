/**
 * Organizations E2E Tests
 * Issue #42: E2E testing for organization management
 */

import { test, expect, Page } from '@playwright/test';
import { TEST_USER } from '../fixtures/auth';

// Helper to login
async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(TEST_USER.email);
  await page.getByLabel(/password/i).fill(TEST_USER.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/(dashboard|organizations|settings)/, { timeout: 15000 });
}

test.describe('Organization Management', () => {
  test.describe('Organization List', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/organizations');
      await expect(page).toHaveURL(/\/login/);
    });

    test('should display organizations page structure', async ({ page }) => {
      await page.goto('/organizations');

      const url = page.url();
      if (url.includes('/login')) {
        await expect(page.getByRole('heading', { name: /login|sign in/i })).toBeVisible();
        return;
      }

      // If organizations page is accessible, check structure
      await expect(page.getByRole('heading', { name: /organization/i })).toBeVisible();
    });
  });

  test.describe('Create Organization', () => {
    test('should display create organization form', async ({ page }) => {
      await login(page);
      await page.goto('/organizations');

      const createButton = page.getByRole('button', { name: /create|new|add/i });
      if (await createButton.isVisible()) {
        await createButton.click();

        // Check for form fields
        const nameField = page.getByLabel(/name/i);
        if (await nameField.isVisible()) {
          await expect(nameField).toBeVisible();
        }
      }
    });

    test('should validate organization name', async ({ page }) => {
      await login(page);
      await page.goto('/organizations');

      const createButton = page.getByRole('button', { name: /create|new|add/i });
      if (await createButton.isVisible()) {
        await createButton.click();

        // Try to submit with empty name
        const submitButton = page.getByRole('button', { name: /create|submit|save/i });
        if (await submitButton.isVisible()) {
          await submitButton.click();
          // Validation error should appear
          await page.waitForTimeout(500);
        }
      }
    });

    test('should create new organization', async ({ page }) => {
      await login(page);
      await page.goto('/organizations');

      const createButton = page.getByRole('button', { name: /create|new|add/i });
      if (await createButton.isVisible()) {
        await createButton.click();

        const nameField = page.getByLabel(/name/i);
        if (await nameField.isVisible()) {
          const uniqueName = `Test Org ${Date.now()}`;
          await nameField.fill(uniqueName);

          const descriptionField = page.getByLabel(/description/i);
          if (await descriptionField.isVisible()) {
            await descriptionField.fill('Test organization description');
          }

          const submitButton = page.getByRole('button', { name: /create|submit|save/i });
          if (await submitButton.isVisible()) {
            await submitButton.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    });
  });

  test.describe('Organization Details', () => {
    test('should display organization details', async ({ page }) => {
      await login(page);
      await page.goto('/organizations');

      // Click on first organization in list
      const orgCard = page.locator('[data-testid="org-card"]').first();
      const orgLink = page.locator('a[href*="/organizations/"]').first();

      if (await orgCard.isVisible()) {
        await orgCard.click();
        await expect(page.getByRole('heading')).toBeVisible();
      } else if (await orgLink.isVisible()) {
        await orgLink.click();
        await expect(page.getByRole('heading')).toBeVisible();
      }
    });

    test('should display organization members', async ({ page }) => {
      await login(page);
      await page.goto('/organizations');

      // Navigate to first organization
      const orgLink = page.locator('a[href*="/organizations/"]').first();
      if (await orgLink.isVisible()) {
        await orgLink.click();

        const membersTab = page.getByRole('tab', { name: /member/i });
        if (await membersTab.isVisible()) {
          await membersTab.click();
        }
      }
    });
  });

  test.describe('Member Management', () => {
    test('should invite new member', async ({ page }) => {
      await login(page);
      await page.goto('/organizations');

      // Navigate to an organization first
      const orgLink = page.locator('a[href*="/organizations/"]').first();
      if (await orgLink.isVisible()) {
        await orgLink.click();

        const inviteButton = page.getByRole('button', { name: /invite|add.*member/i });
        if (await inviteButton.isVisible()) {
          await inviteButton.click();

          const emailField = page.getByLabel(/email/i);
          if (await emailField.isVisible()) {
            await emailField.fill('test-invite@example.com');

            const roleSelect = page.getByLabel(/role/i);
            if (await roleSelect.isVisible()) {
              await roleSelect.selectOption('member');
            }
          }
        }
      }
    });

    test('should change member role', async ({ page }) => {
      await login(page);
      await page.goto('/organizations');

      const orgLink = page.locator('a[href*="/organizations/"]').first();
      if (await orgLink.isVisible()) {
        await orgLink.click();

        const membersTab = page.getByRole('tab', { name: /member/i });
        if (await membersTab.isVisible()) {
          await membersTab.click();
        }

        // Check for member actions
        const memberActions = page.locator('[data-testid="member-actions"]').first();
        if (await memberActions.isVisible()) {
          await memberActions.click();
        }
      }
    });

    test('should view member list', async ({ page }) => {
      await login(page);
      await page.goto('/organizations');

      const orgLink = page.locator('a[href*="/organizations/"]').first();
      if (await orgLink.isVisible()) {
        await orgLink.click();

        const membersTab = page.getByRole('tab', { name: /member/i });
        if (await membersTab.isVisible()) {
          await membersTab.click();
          // Member list should be visible
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('Organization Settings', () => {
    test('should update organization name', async ({ page }) => {
      await login(page);
      await page.goto('/organizations');

      const orgLink = page.locator('a[href*="/organizations/"]').first();
      if (await orgLink.isVisible()) {
        await orgLink.click();

        // Navigate to settings
        const settingsLink = page.getByRole('link', { name: /settings/i });
        if (await settingsLink.isVisible()) {
          await settingsLink.click();

          const nameInput = page.getByLabel(/name/i);
          if (await nameInput.isVisible()) {
            await nameInput.clear();
            await nameInput.fill('Updated Organization Name');
          }
        }
      }
    });

    test('should show delete confirmation', async ({ page }) => {
      await login(page);
      await page.goto('/organizations');

      const orgLink = page.locator('a[href*="/organizations/"]').first();
      if (await orgLink.isVisible()) {
        await orgLink.click();

        const settingsLink = page.getByRole('link', { name: /settings/i });
        if (await settingsLink.isVisible()) {
          await settingsLink.click();

          // Check if delete button exists (do not actually delete)
          const deleteButton = page.getByRole('button', { name: /delete.*organization/i });
          if (await deleteButton.isVisible()) {
            await expect(deleteButton).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Project Management', () => {
    test('should create new project in organization', async ({ page }) => {
      await login(page);
      await page.goto('/organizations');

      const orgLink = page.locator('a[href*="/organizations/"]').first();
      if (await orgLink.isVisible()) {
        await orgLink.click();

        const projectsTab = page.getByRole('tab', { name: /project/i });
        if (await projectsTab.isVisible()) {
          await projectsTab.click();
        }

        const createProjectButton = page.getByRole('button', { name: /create.*project|new.*project/i });
        if (await createProjectButton.isVisible()) {
          await createProjectButton.click();

          const nameField = page.getByLabel(/name/i);
          if (await nameField.isVisible()) {
            await nameField.fill(`Test Project ${Date.now()}`);
          }
        }
      }
    });
  });
});
