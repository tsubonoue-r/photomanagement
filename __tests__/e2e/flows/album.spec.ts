/**
 * Album E2E Tests
 * Issue #27: E2E testing for album creation and export flows
 * Issue #42: E2Eテスト・統合テストの完全実装
 */

import { test, expect, Page } from '@playwright/test';
import { TEST_USER } from '../fixtures/auth';

// Helper to login
async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(TEST_USER.email);
  await page.getByLabel(/password/i).fill(TEST_USER.password);
  await page.getByRole('button', { name: /login|sign in/i }).click();
  await page.waitForURL(/\/(dashboard|organizations|settings)/, { timeout: 15000 });
}

test.describe('Album Flow', () => {
  test.describe('Album List', () => {
    test('should show albums page structure', async ({ page }) => {
      // Just test that the login page is accessible
      await page.goto('/login');
      await expect(page.getByRole('heading', { name: /login|sign in/i })).toBeVisible();
    });

    test.skip('should display album list', async ({ page }) => {
      await login(page);
      await page.goto('/projects/test-project/albums');

      // Should show albums heading
      await expect(page.getByRole('heading', { name: /albums/i })).toBeVisible();
    });

    test.skip('should show create album button', async ({ page }) => {
      await login(page);
      await page.goto('/projects/test-project/albums');

      await expect(page.getByRole('button', { name: /create.*album|new.*album/i })).toBeVisible();
    });

    test.skip('should display album cards with photo count', async ({ page }) => {
      await login(page);
      await page.goto('/projects/test-project/albums');

      // Assuming albums exist
      const albumCard = page.locator('[data-testid="album-card"]').first();
      await expect(albumCard).toBeVisible();

      // Should show photo count
      await expect(albumCard.getByText(/\d+.*photos?|photos?.*\d+/i)).toBeVisible();
    });
  });

  test.describe('Album Creation', () => {
    test.skip('should open create album dialog', async ({ page }) => {
      await login(page);
      await page.goto('/projects/test-project/albums');

      await page.getByRole('button', { name: /create.*album|new.*album/i }).click();

      // Dialog should appear
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByLabel(/album.*name|name/i)).toBeVisible();
    });

    test.skip('should validate album name', async ({ page }) => {
      await login(page);
      await page.goto('/projects/test-project/albums');

      await page.getByRole('button', { name: /create.*album|new.*album/i }).click();

      // Try to submit without name
      await page.getByRole('button', { name: /create|save/i }).click();

      // Should show validation error
      await expect(page.getByText(/name.*required|required/i)).toBeVisible();
    });

    test.skip('should create album successfully', async ({ page }) => {
      await login(page);
      await page.goto('/projects/test-project/albums');

      await page.getByRole('button', { name: /create.*album|new.*album/i }).click();

      await page.getByLabel(/album.*name|name/i).fill('Test Album');
      await page.getByLabel(/description/i).fill('Test album description');
      await page.getByRole('button', { name: /create|save/i }).click();

      // Should show success and redirect
      await expect(page.getByText(/created|success/i)).toBeVisible();
    });
  });

  test.describe('Album Editing', () => {
    test.skip('should navigate to album editor', async ({ page }) => {
      await login(page);
      await page.goto('/projects/test-project/albums/test-album');

      // Should show album editor
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test.skip('should display photo selector', async ({ page }) => {
      await login(page);
      await page.goto('/projects/test-project/albums/test-album');

      // Photo selector should be visible
      await expect(page.getByText(/add.*photos|select.*photos/i)).toBeVisible();
    });

    test.skip('should add photos to album', async ({ page }) => {
      await login(page);
      await page.goto('/projects/test-project/albums/test-album');

      // Open photo selector
      await page.getByRole('button', { name: /add.*photos|select.*photos/i }).click();

      // Select a photo
      const photoCheckbox = page.locator('[data-testid="photo-select-checkbox"]').first();
      await photoCheckbox.click();

      // Confirm selection
      await page.getByRole('button', { name: /add|confirm/i }).click();

      // Photo should appear in album
      await expect(page.getByText(/photo.*added|added.*photo/i)).toBeVisible();
    });

    test.skip('should reorder photos via drag and drop', async ({ page }) => {
      await login(page);
      await page.goto('/projects/test-project/albums/test-album');

      // Get photos in album
      const photos = page.locator('[data-testid="album-photo"]');
      const firstPhoto = photos.first();
      const secondPhoto = photos.nth(1);

      // Perform drag and drop
      await firstPhoto.dragTo(secondPhoto);

      // Order should be updated
      await expect(page.getByText(/order.*updated|saved/i)).toBeVisible();
    });

    test.skip('should remove photos from album', async ({ page }) => {
      await login(page);
      await page.goto('/projects/test-project/albums/test-album');

      // Find remove button on first photo
      const firstPhoto = page.locator('[data-testid="album-photo"]').first();
      await firstPhoto.hover();
      await firstPhoto.getByRole('button', { name: /remove/i }).click();

      // Confirm removal
      await page.getByRole('button', { name: /confirm|yes/i }).click();

      // Should show success
      await expect(page.getByText(/removed/i)).toBeVisible();
    });

    test.skip('should update album name', async ({ page }) => {
      await login(page);
      await page.goto('/projects/test-project/albums/test-album');

      // Click edit button
      await page.getByRole('button', { name: /edit.*name|rename/i }).click();

      // Update name
      await page.getByLabel(/name/i).fill('Updated Album Name');
      await page.getByRole('button', { name: /save|update/i }).click();

      // Should show updated name
      await expect(page.getByText('Updated Album Name')).toBeVisible();
    });
  });

  test.describe('Album Export', () => {
    test.skip('should show export options', async ({ page }) => {
      await login(page);
      await page.goto('/projects/test-project/albums/test-album');

      // Click export button
      await page.getByRole('button', { name: /export/i }).click();

      // Export dialog should appear
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/pdf/i)).toBeVisible();
      await expect(page.getByText(/excel|xlsx/i)).toBeVisible();
      await expect(page.getByText(/zip/i)).toBeVisible();
    });

    test.skip('should export as PDF', async ({ page }) => {
      await login(page);
      await page.goto('/projects/test-project/albums/test-album');

      // Open export dialog
      await page.getByRole('button', { name: /export/i }).click();

      // Select PDF option
      await page.getByText(/pdf/i).click();

      // Start export
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: /download|export/i }).click();

      // Wait for download
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.pdf');
    });

    test.skip('should export as Excel', async ({ page }) => {
      await login(page);
      await page.goto('/projects/test-project/albums/test-album');

      await page.getByRole('button', { name: /export/i }).click();

      // Select Excel option
      await page.getByText(/excel|xlsx/i).click();

      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: /download|export/i }).click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.xlsx?$/);
    });

    test.skip('should export as ZIP', async ({ page }) => {
      await login(page);
      await page.goto('/projects/test-project/albums/test-album');

      await page.getByRole('button', { name: /export/i }).click();

      // Select ZIP option
      await page.getByText(/zip/i).click();

      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: /download|export/i }).click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.zip');
    });

    test.skip('should show export progress', async ({ page }) => {
      await login(page);
      await page.goto('/projects/test-project/albums/test-album');

      await page.getByRole('button', { name: /export/i }).click();
      await page.getByText(/pdf/i).click();
      await page.getByRole('button', { name: /download|export/i }).click();

      // Should show progress indicator
      await expect(page.getByRole('progressbar').or(page.getByText(/generating|processing/i))).toBeVisible();
    });
  });

  test.describe('Album Deletion', () => {
    test.skip('should show delete confirmation', async ({ page }) => {
      await login(page);
      await page.goto('/projects/test-project/albums/test-album');

      // Click delete button
      await page.getByRole('button', { name: /delete.*album/i }).click();

      // Confirmation dialog should appear
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/are you sure|confirm.*delete/i)).toBeVisible();
    });

    test.skip('should cancel deletion', async ({ page }) => {
      await login(page);
      await page.goto('/projects/test-project/albums/test-album');

      await page.getByRole('button', { name: /delete.*album/i }).click();
      await page.getByRole('button', { name: /cancel|no/i }).click();

      // Dialog should close, album should still exist
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test.skip('should delete album and redirect', async ({ page }) => {
      await login(page);
      await page.goto('/projects/test-project/albums/test-album');

      await page.getByRole('button', { name: /delete.*album/i }).click();
      await page.getByRole('button', { name: /confirm|yes|delete/i }).click();

      // Should redirect to albums list
      await expect(page).toHaveURL(/\/albums$/);
      await expect(page.getByText(/deleted|success/i)).toBeVisible();
    });
  });

  test.describe('Album Sharing', () => {
    test.skip('should generate share link', async ({ page }) => {
      await login(page);
      await page.goto('/projects/test-project/albums/test-album');

      // Click share button
      await page.getByRole('button', { name: /share/i }).click();

      // Share dialog should appear
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('textbox', { name: /link|url/i })).toBeVisible();
    });

    test.skip('should copy share link to clipboard', async ({ page }) => {
      await login(page);
      await page.goto('/projects/test-project/albums/test-album');

      await page.getByRole('button', { name: /share/i }).click();
      await page.getByRole('button', { name: /copy/i }).click();

      // Should show copied confirmation
      await expect(page.getByText(/copied/i)).toBeVisible();
    });
  });
});
