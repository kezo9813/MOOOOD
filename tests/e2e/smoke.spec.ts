import { test, expect } from '@playwright/test';

test('homepage has CTA links', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /create account/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
});
