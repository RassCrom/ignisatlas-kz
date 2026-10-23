import { test, expect } from '@playwright/test';

const errorsOf = (page) => {
  const e = [];
  page.on('console', (m) => m.type() === 'error' && !/net::ERR_/.test(m.text()) && e.push(m.text()));
  page.on('pageerror', (x) => e.push(String(x)));
  return e;
};

test('root goes to Kazakh', async ({ page }) => {
  const e = errorsOf(page);
  await page.goto('/');
  await expect(page).toHaveURL(/\/kk\/$/);
  expect(e).toEqual([]);
});

test('old report URL gets a prefix', async ({ page }) => {
  await page.goto('/report');
  await expect(page).toHaveURL(/\/kk\/report$/);
});

test('deep link to the legacy map loads the map', async ({ page }) => {
  await page.goto('/ru/map/legacy');
  await expect(page.locator('.maplibregl-canvas')).toBeVisible({ timeout: 15000 });
});

test('html lang follows the prefix', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
