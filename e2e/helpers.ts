import { expect, type Page } from '@playwright/test';

export const PASSWORD = 'Correct-horse-1';

/** The stand-in API keeps one session for everyone: sign out so auth screens aren't skipped. */
export async function signOutOnServer(page: Page): Promise<void> {
  await page.request.post('/api/v1/auth/logout');
}

/** A fresh account per run (03-testing-strategy §4). */
export async function registerFreshUser(page: Page): Promise<string> {
  await signOutOnServer(page);
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  await page.goto('/sign-up');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/app\//);
  return email;
}

/** Fills the five-step brief form with the required fields and lands on Review. */
export async function fillBrief(page: Page, brandName = 'Eko Thread Co.'): Promise<void> {
  const next = () => page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Brand name').fill(brandName);
  await page.getByLabel('Category').selectOption('Streetwear');
  await next();
  await page.getByLabel('What you sell').fill('Graphic tees, hoodies and caps.');
  await next();
  // The radio input is visually hidden inside its option card; click the card like a user.
  await page.getByText('Turn interest into orders').click();
  await next();
  await expect(page.getByRole('heading', { level: 2, name: 'Cultural references' })).toBeVisible();
  await next();
  await expect(page.getByRole('heading', { level: 2, name: 'Review' })).toBeVisible();
}
