import { manifest, pwaOptions, runtimeCaching } from './pwa';

type Matcher = (options: { url: URL; sameOrigin: boolean }) => boolean;

const ORIGIN = 'https://kompass.example';

/** The first rule that matches wins, like Workbox's router. */
function ruleFor(path: string, method = 'GET') {
  const url = new URL(path, ORIGIN);
  return runtimeCaching.find((rule) => {
    const matches = (rule.urlPattern as Matcher)({ url, sameOrigin: url.origin === ORIGIN });
    return matches && (rule.method ?? 'GET') === method;
  });
}

describe('service worker policy (FE-01 §7)', () => {
  it('serves the sample plan and meta stale-while-revalidate, at most 2 entries for 7 days', () => {
    for (const path of ['/api/v1/sample-plan', '/api/v1/meta']) {
      const rule = ruleFor(path);
      expect(rule?.handler).toBe('StaleWhileRevalidate');
      expect(rule?.options?.expiration).toEqual({ maxEntries: 2, maxAgeSeconds: 7 * 24 * 60 * 60 });
    }
  });

  it.each([
    ['/api/v1/growth-plans', 'GET'],
    ['/api/v1/growth-plans/abc', 'GET'],
    ['/api/v1/growth-plans', 'POST'],
    ['/api/v1/auth/refresh', 'POST'],
    ['/api/v1/profiles/1', 'PUT'],
    ['/api/v1/growth-plans/a/experiments/b', 'PATCH'],
    ['/api/v1/profiles/1', 'DELETE'],
    ['/api/v1/meta', 'POST'],
    ['/api/v1/sample-plan/extra', 'GET'],
  ])('never caches %s %s', (path, method) => {
    expect(ruleFor(path, method)?.handler).toBe('NetworkOnly');
  });

  it('caches Google Fonts for a year', () => {
    const rule = ruleFor('https://fonts.gstatic.com/s/inter/v1/a.woff2');
    expect(rule?.handler).toBe('CacheFirst');
    expect(rule?.options?.expiration?.maxAgeSeconds).toBe(365 * 24 * 60 * 60);
  });

  it('leaves other origins to the network', () => {
    expect(ruleFor('https://elsewhere.example/api/v1/meta')).toBeUndefined();
  });

  it('falls back to the app shell for navigations, except /api', () => {
    expect(pwaOptions.workbox?.navigateFallback).toBe('/index.html');
    const denylist = pwaOptions.workbox?.navigateFallbackDenylist ?? [];
    expect(denylist.some((re) => re.test('/api/v1/meta'))).toBe(true);
    expect(denylist.some((re) => re.test('/app/plans'))).toBe(false);
  });

  it('asks before updating', () => {
    expect(pwaOptions.registerType).toBe('prompt');
  });

  it('declares an installable manifest', () => {
    expect(manifest).toMatchObject({ display: 'standalone', start_url: '/app/plans?source=pwa', scope: '/' });
    const icons = manifest?.icons ?? [];
    expect(icons.map((i) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
    expect(icons.some((i) => i.purpose === 'maskable')).toBe(true);
  });
});
