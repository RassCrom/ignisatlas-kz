import { readdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { expect, it } from 'vitest';
import { KAZAKH_CODEPOINTS, missingCodePoints } from './glyphs.mjs';

// jsdom replaces the global URL, so build the path with node:url instead of new URL().
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const onest = join(root, 'node_modules', '@fontsource-variable', 'onest', 'files');

it('lists the nine Kazakh-specific Cyrillic letters', () => {
  const letters = KAZAKH_CODEPOINTS.map((cp) => String.fromCodePoint(cp)).join('');
  expect(letters).toBe('әғқңөұүһі');
});

it('finds all Kazakh letters in Onest cyrillic subsets', async () => {
  const files = (await readdir(onest)).filter((f) => /cyrillic/.test(f)).map((f) => join(onest, f));
  expect(files.length).toBeGreaterThan(0);
  expect(await missingCodePoints(files, KAZAKH_CODEPOINTS)).toEqual([]);
});

it('reports all letters missing from a latin-only subset', async () => {
  const latin = (await readdir(onest)).filter((f) => /-latin-wght/.test(f)).map((f) => join(onest, f));
  expect(latin.length).toBeGreaterThan(0);
  expect(await missingCodePoints(latin, KAZAKH_CODEPOINTS)).toHaveLength(9);
});

it('reports only the letters that no file covers', async () => {
  const files = (await readdir(onest)).filter((f) => /-cyrillic-wght/.test(f)).map((f) => join(onest, f));
  // The base cyrillic subset has і (U+0456) and ұ (U+04B1); the rest live in cyrillic-ext.
  const missing = await missingCodePoints(files, KAZAKH_CODEPOINTS);
  expect(missing).not.toContain(0x0456);
  expect(missing).not.toContain(0x04b1);
  expect(missing.length).toBe(7);
});
