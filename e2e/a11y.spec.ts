import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { registerFreshUser, signOutOnServer } from './helpers';

// FE-9: axe in a real browser (so colour contrast is checked) on the key screens, in light and dark.

async function expectAccessible(page: Page) {
  // Let entrance transitions settle so contrast is measured on final colours.
  await page.waitForTimeout(300);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const summary = results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
  expect(summary).toEqual([]);
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme });

    test('landing', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expectAccessible(page);
    });

    test('sample plan, every tab', async ({ page }) => {
      await page.goto('/sample');
      await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
      for (const tab of ['Overview', 'Insights', 'Partnerships', 'Campaigns', 'Experiments', 'Evidence']) {
        await page.getByRole('tab', { name: tab }).click();
        await expectAccessible(page);
      }
    });

    test('sign up, brief form and saved plans', async ({ page }) => {
      await signOutOnServer(page);
      await page.goto('/sign-up');
      await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
      await expectAccessible(page);

      await registerFreshUser(page);
      await page.goto('/app/plans');
      await expect(page.getByRole('heading', { level: 1, name: 'Plans' })).toBeVisible();
      await expectAccessible(page);

      await page.goto('/app/profiles/new');
      await page.getByRole('button', { name: 'Continue' }).click();
      // Validation errors visible: their red text must still pass contrast.
      await expect(page.getByLabel('Brand name')).toHaveAttribute('aria-invalid', 'true');
      await expectAccessible(page);
    });
  });
}

test('keyboard: skip link, tabs and evidence drawer', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard walkthrough is a desktop concern');
  await page.goto('/sample');
  await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();

  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: /Skip to/ });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();

  const overview = page.getByRole('tab', { name: 'Overview' });
  await overview.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Insights' })).toBeFocused();
  await expect(page.getByRole('tab', { name: 'Insights' })).toHaveAttribute('aria-selected', 'true');

  const chip = page
    .getByRole('tabpanel')
    .getByRole('button', { name: /^Open evidence/ })
    .first();
  await chip.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(chip).toBeFocused();
});

test('respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/sample');
  const button = page.getByRole('tab', { name: 'Overview' });
  await expect(button).toBeVisible();
  const duration = await button.evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(duration.split(',').every((d) => parseFloat(d) <= 0.0001)).toBe(true);
});
