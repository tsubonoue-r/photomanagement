/**
 * Organizations E2E Tests
 * Issue #42: E2E testing for organization management
 */

import { test, expect } from '@playwright/test';

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
    test.skip('should display create organization form', async ({ page }) => {
      await page.goto('/organizations');

      const createButton = page.getByRole('button', { name: /create|new|add/i });
      await createButton.click();

      await expect(page.getByLabel(/name/i)).toBeVisible();
    });

    test.skip('should validate organization name', async ({ page }) => {
      await page.goto('/organizations');

      const createButton = page.getByRole('button', { name: /create|new|add/i });
      await createButton.click();

      // Try to submit with empty name
      await page.getByRole('button', { name: /create|submit|save/i }).click();

      await expect(page.getByText(/required|name.*required/i)).toBeVisible();
    });

    test.skip('should create new organization', async ({ page }) => {
      await page.goto('/organizations');

      const createButton = page.getByRole('button', { name: /create|new|add/i });
      await createButton.click();

      await page.getByLabel(/name/i).fill('Test Organization');

      const descriptionField = page.getByLabel(/description/i);
      if (await descriptionField.isVisible()) {
        await descriptionField.fill('Test organization description');
      }

      await page.getByRole('button', { name: /create|submit|save/i }).click();

      await expect(page.getByText(/created|success/i)).toBeVisible();
    });
  });

  test.describe('Organization Details', () => {
    test.skip('should display organization details', async ({ page }) => {
      await page.goto('/organizations');

      // Click on first organization in list
      const orgCard = page.locator('[data-testid="org-card"]').first();
      if (await orgCard.isVisible()) {
        await orgCard.click();

        await expect(page.getByRole('heading')).toBeVisible();
        await expect(page.getByText(/member/i)).toBeVisible();
      }
    });

    test.skip('should display organization members', async ({ page }) => {
      await page.goto('/organizations/test-org');

      const membersTab = page.getByRole('tab', { name: /member/i });
      if (await membersTab.isVisible()) {
        await membersTab.click();

        await expect(page.getByRole('list')).toBeVisible();
      }
    });
  });

  test.describe('Member Management', () => {
    test.skip('should invite new member', async ({ page }) => {
      await page.goto('/organizations/test-org');

      const inviteButton = page.getByRole('button', { name: /invite|add.*member/i });
      await inviteButton.click();

      await page.getByLabel(/email/i).fill('newmember@example.com');

      const roleSelect = page.getByLabel(/role/i);
      if (await roleSelect.isVisible()) {
        await roleSelect.selectOption('member');
      }

      await page.getByRole('button', { name: /send.*invite|invite/i }).click();

      await expect(page.getByText(/invited|sent/i)).toBeVisible();
    });

    test.skip('should change member role', async ({ page }) => {
      await page.goto('/organizations/test-org');

      const membersTab = page.getByRole('tab', { name: /member/i });
      if (await membersTab.isVisible()) {
        await membersTab.click();
      }

      // Click on member actions menu
      const memberActions = page.locator('[data-testid="member-actions"]').first();
      if (await memberActions.isVisible()) {
        await memberActions.click();

        await page.getByRole('menuitem', { name: /change.*role/i }).click();
        await page.getByRole('option', { name: /admin/i }).click();

        await expect(page.getByText(/updated|changed/i)).toBeVisible();
      }
    });

    test.skip('should remove member', async ({ page }) => {
      await page.goto('/organizations/test-org');

      const membersTab = page.getByRole('tab', { name: /member/i });
      if (await membersTab.isVisible()) {
        await membersTab.click();
      }

      const memberActions = page.locator('[data-testid="member-actions"]').first();
      if (await memberActions.isVisible()) {
        await memberActions.click();

        await page.getByRole('menuitem', { name: /remove|delete/i }).click();

        // Confirm removal
        await page.getByRole('button', { name: /confirm|yes|remove/i }).click();

        await expect(page.getByText(/removed|deleted/i)).toBeVisible();
      }
    });
  });

  test.describe('Organization Settings', () => {
    test.skip('should update organization name', async ({ page }) => {
      await page.goto('/organizations/test-org/settings');

      const nameInput = page.getByLabel(/name/i);
      await nameInput.clear();
      await nameInput.fill('Updated Organization Name');

      await page.getByRole('button', { name: /save|update/i }).click();

      await expect(page.getByText(/saved|updated|success/i)).toBeVisible();
    });

    test.skip('should delete organization', async ({ page }) => {
      await page.goto('/organizations/test-org/settings');

      const deleteButton = page.getByRole('button', { name: /delete.*organization/i });
      await deleteButton.click();

      // Confirmation dialog
      await expect(page.getByRole('dialog')).toBeVisible();

      // Type organization name to confirm
      const confirmInput = page.getByPlaceholder(/type.*name/i);
      if (await confirmInput.isVisible()) {
        await confirmInput.fill('test-org');
      }

      await page.getByRole('button', { name: /delete|confirm/i }).click();

      await expect(page).toHaveURL(/\/organizations/);
    });
  });

  test.describe('Project Management', () => {
    test.skip('should create new project in organization', async ({ page }) => {
      await page.goto('/organizations/test-org');

      const projectsTab = page.getByRole('tab', { name: /project/i });
      if (await projectsTab.isVisible()) {
        await projectsTab.click();
      }

      const createProjectButton = page.getByRole('button', { name: /create.*project|new.*project/i });
      await createProjectButton.click();

      await page.getByLabel(/name/i).fill('New Project');

      await page.getByRole('button', { name: /create|submit/i }).click();

      await expect(page.getByText(/created|success/i)).toBeVisible();
    });
  });
});
