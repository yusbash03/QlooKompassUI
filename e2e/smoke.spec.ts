import { expect, test } from '@playwright/test';

test('landing page renders the product name', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page).toHaveTitle(/Kulture Compass/);
});

// Meaningful against the nginx image (E2E_BASE_URL), which sends the production CSP; `vite preview` sends none.
test('nothing is blocked by the content security policy', async ({ page }) => {
  const violations: string[] = [];
  page.on('console', (message) => {
    if (message.text().includes('Content Security Policy')) violations.push(message.text());
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.goto('/sample?tab=evidence');
  await expect(page.getByRole('tab', { name: 'Evidence', selected: true })).toBeVisible();
  expect(violations).toEqual([]);
});
