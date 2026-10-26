// Renders the PWA icons from the logo mark (public/favicon.svg) with Playwright's Chromium.
// Placeholders until brand icons exist (FE-02 FE-7). Run: node scripts/generate-icons.mjs
import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const mark = await readFile(new URL('../public/favicon.svg', import.meta.url), 'utf8');
const inner = mark.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

// `fill`: share of the canvas the mark covers. Maskable icons keep it inside the 80% safe zone on a full-bleed
// background; the Apple icon has no transparency.
const icons = [
  { file: 'icon-192.png', size: 192, fill: 1, background: 'transparent' },
  { file: 'icon-512.png', size: 512, fill: 1, background: 'transparent' },
  { file: 'maskable-512.png', size: 512, fill: 0.62, background: '#14122B' },
  { file: 'apple-touch-icon-180.png', size: 180, fill: 0.82, background: '#14122B' },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const { file, size, fill, background } of icons) {
  const markSize = size * fill;
  const offset = (size - markSize) / 2;
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0;background:${background}">
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" style="display:block">
        <svg x="${offset}" y="${offset}" width="${markSize}" height="${markSize}" viewBox="0 0 32 32">${inner}</svg>
      </svg></body></html>`,
  );
  await page.screenshot({ path: `public/icons/${file}`, omitBackground: background === 'transparent' });
  console.log(`public/icons/${file}`);
}
await browser.close();
