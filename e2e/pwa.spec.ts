import { expect, test, type Page } from '@playwright/test';

/** Waits for the service worker to take control of the page (the first load is never controlled). */
async function controlledBySw(page: Page) {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
}

test('the manifest is installable', async ({ page, request }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();
  const manifest = (await (await request.get(href!)).json()) as {
    name: string;
    display: string;
    start_url: string;
    icons: { src: string; sizes: string; purpose?: string }[];
  };
  expect(manifest).toMatchObject({
    name: 'Kulture Compass',
    display: 'standalone',
    start_url: '/app/plans?source=pwa',
  });
  for (const icon of manifest.icons) {
    const response = await request.get(icon.src);
    expect(response.ok(), icon.src).toBe(true);
    expect(response.headers()['content-type']).toContain('image/png');
  }
  expect(manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true);
});

test('registers a service worker', async ({ page }) => {
  await controlledBySw(page);
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(scope).toBe(new URL('/', page.url()).href);
});

test('offline, navigations still load the app shell', async ({ page, context }) => {
  await controlledBySw(page);
  await context.setOffline(true);
  await page.goto('/offline');
  await expect(page.getByRole('heading', { name: 'You’re offline' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View the sample plan' })).toBeVisible();
});

test('the sample plan is available offline after one visit', async ({ page, context }) => {
  await controlledBySw(page);
  await page.goto('/sample');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText(/Sample plan/).first()).toBeVisible();

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Evidence' })).toBeVisible();
});

test('API responses for signed-in data are never cached by the service worker', async ({ page }) => {
  await controlledBySw(page);
  await page.goto('/sample');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const cached = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const name of await caches.keys()) {
      for (const req of await (await caches.open(name)).keys()) urls.push(new URL(req.url).pathname);
    }
    return urls.filter((u) => u.startsWith('/api/'));
  });
  expect(cached.sort()).toEqual(expect.arrayContaining(['/api/v1/sample-plan']));
  expect(cached.every((u) => u === '/api/v1/sample-plan' || u === '/api/v1/meta')).toBe(true);
});
