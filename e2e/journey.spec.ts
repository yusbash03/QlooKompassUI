import { expect, test, type Page } from '@playwright/test';
import { fillBrief, registerFreshUser } from './helpers';

// 03-testing-strategy §4 — end-to-end acceptance against the stand-in API (mock mode).

test('landing → sample plan', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'See a sample plan' }).first().click();
  await expect(page).toHaveURL(/\/sample$/);
  await expect(page.getByText(/Sample plan/).first()).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Evidence' })).toBeVisible();
});

test('register → brief → generate → progress → plan → saved plans', async ({ page }) => {
  await registerFreshUser(page);

  await page.goto('/app/profiles/new');
  await fillBrief(page);
  await page.getByRole('button', { name: 'Save & generate plan' }).click();

  await expect(page.getByRole('heading', { level: 1, name: 'Generate your growth plan' })).toBeVisible();
  await page.getByRole('button', { name: 'Generate growth plan' }).click();

  await expect(page).toHaveURL(/\/app\/plans\/[0-9a-f-]+\/progress$/);
  // Progress only ever shows what the backend reports.
  await expect(page.getByText('4 of 9 Qloo requests complete').first()).toBeVisible();

  await expect(page).toHaveURL(/\/app\/plans\/[0-9a-f-]+$/, { timeout: 20_000 });
  await expect(page.getByRole('heading', { level: 1, name: 'Eko Thread Co.' })).toBeVisible();
  const planUrl = new URL(page.url()).pathname;

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Eko Thread Co.' })).toBeVisible();
  await page.getByRole('link', { name: 'Plans', exact: true }).first().click();
  await expect(page.locator(`a[href="${planUrl}"]`).first()).toBeVisible();
});

test('every evidence chip opens a drawer for evidence that exists in the list', async ({ page }) => {
  await page.goto('/sample?tab=evidence');
  // The evidence list is a table on wide screens and cards on phones; either way every entry shows its key.
  const evidencePanel = page.getByRole('tabpanel', { name: 'Evidence' });
  await expect(
    evidencePanel
      .getByRole('button', { name: /^Open evidence ev_\d+/ })
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  const listed = new Set((await evidencePanel.innerText()).match(/ev_\d+/g) ?? []);
  expect(listed.size).toBeGreaterThan(0);

  for (const tab of ['Overview', 'Insights', 'Partnerships', 'Campaigns', 'Experiments']) {
    await page.getByRole('tab', { name: tab }).click();
    const panel = page.getByRole('tabpanel', { name: tab });
    await expect(panel).toBeVisible();
    const chips = panel.getByRole('button', { name: /^Open evidence ev_\d+/ });
    const count = await chips.count();
    for (let i = 0; i < count; i++) {
      await checkChip(page, chips.nth(i), listed);
    }
  }
});

async function checkChip(page: Page, chip: ReturnType<Page['locator']>, listed: Set<string>) {
  const key = /ev_\d+/.exec((await chip.textContent()) ?? '')?.[0];
  expect(key, 'chip shows its evidence key').toBeDefined();
  expect(listed.has(key!), `${key} is in the evidence list`).toBe(true);
  await chip.scrollIntoViewIfNeeded();
  await chip.click();
  const drawer = page.getByRole('dialog');
  await expect(drawer).toContainText(key!);
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(chip).toBeFocused();
}
