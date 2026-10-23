import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from 'src/design/contrast';
import scales from 'src/design/scales.json';

// jsdom replaces the global URL, so build the path with node:url instead of new URL().
const cssPath = join(dirname(fileURLToPath(import.meta.url)), 'tokens.css');
const css = readFileSync(cssPath, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

// Splits the stylesheet into { selectors, body } rule blocks (flat rules only).
const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
  selectors: m[1].split(',').map((s) => s.trim()),
  body: m[2],
}));

const NIGHT = '[data-surface="night"]';
const PAPER = '[data-surface="paper"]';

// A surface is every block whose selector list contains its selector, merged in source order
// (Night is split into a variables block shared with :root and a color-scheme block).
// 'root' is the shared block that is selected by :root alone.
const SURFACE_BLOCKS = {
  night: (b) => b.selectors.includes(NIGHT),
  paper: (b) => b.selectors.includes(PAPER),
  root: (b) => b.selectors.length === 1 && b.selectors[0] === ':root',
};

function declarations(matchingBlocks) {
  return Object.fromEntries(
    matchingBlocks.flatMap((b) => [...b.body.matchAll(/([\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])),
  );
}

function surfaceVars(surface) {
  const matching = blocks.filter(SURFACE_BLOCKS[surface]);
  if (matching.length === 0) throw new Error(`no block for ${surface}`);
  return declarations(matching);
}

// Hex values are compared in upper case, as written in the spec.
function token(surface, name) {
  const value = surfaceVars(surface)[name];
  if (value === undefined) throw new Error(`${name} is not defined for ${surface}`);
  return /^#[0-9a-f]{3,8}$/i.test(value) ? value.toUpperCase() : value;
}

describe('surface contrast (AA)', () => {
  it.each([
    ['night', '--ink', '--bg', 4.5],
    ['night', '--ink-dim', '--bg', 4.5],
    ['night', '--ink-dim', '--surface-2', 4.5],
    ['night', '--fire', '--bg', 3],
    ['paper', '--ink', '--bg', 4.5],
    ['paper', '--ink-dim', '--bg', 4.5],
    ['paper', '--ink-dim', '--surface-2', 4.5],
    ['paper', '--fire', '--bg', 3],
  ])('%s %s on %s >= %f', (surface, fg, bg, min) => {
    expect(contrastRatio(token(surface, fg), token(surface, bg))).toBeGreaterThanOrEqual(min);
  });
});

describe('palette values', () => {
  it('night palette uses spec values', () => {
    expect(token('night', '--bg')).toBe('#05060A');
    expect(token('night', '--surface')).toBe('#0C0E15');
    expect(token('night', '--surface-2')).toBe('#151821');
    expect(token('night', '--line')).toBe('#1C1F2A');
    expect(token('night', '--ink')).toBe('#F2EDE6');
    expect(token('night', '--ink-dim')).toBe('#8A8D97');
    expect(token('night', '--fire')).toBe('#FF6A1A');
    expect(token('night', '--fire-hot')).toBe('#FFC36B');
    expect(token('night', '--scar')).toBe('#96280C');
    expect(token('night', '--sky')).toBe('#3FA9FF');
  });

  it('paper palette uses spec values', () => {
    expect(token('paper', '--bg')).toBe('#ECEDE7');
    expect(token('paper', '--surface')).toBe('#F6F6F2');
    expect(token('paper', '--surface-2')).toBe('#FFFFFF');
    expect(token('paper', '--line')).toBe('#C9CBC3');
    expect(token('paper', '--ink')).toBe('#14161A');
    expect(token('paper', '--fire')).toBe('#D2261C');
    expect(token('paper', '--steppe')).toBe('#A9853B');
  });

  it('paper ink-dim is the AA-corrected value', () => expect(token('paper', '--ink-dim')).toBe('#5F6266'));

  it('keeps one-surface tokens out of the other surface', () => {
    for (const name of ['--fire-hot', '--scar', '--sky']) {
      expect(surfaceVars('paper')).not.toHaveProperty(name);
    }
    expect(surfaceVars('night')).not.toHaveProperty('--steppe');
  });

  it('makes night the default surface on :root', () => {
    const block = blocks.find((b) => b.selectors.includes(':root') && b.selectors.includes('[data-surface="night"]'));
    expect(block).toBeDefined();
  });

  it('declares color-scheme per surface', () => {
    expect(token('night', 'color-scheme')).toBe('dark');
    expect(token('paper', 'color-scheme')).toBe('light');
  });

  // color-scheme is not a custom property: on :root it would re-theme native controls on every existing page.
  it('never sets color-scheme on :root', () => {
    expect(surfaceVars('root')).not.toHaveProperty('color-scheme');
    const rootBlocks = blocks.filter((b) => b.selectors.includes(':root'));
    expect(rootBlocks.length).toBeGreaterThan(0);
    for (const b of rootBlocks) expect(declarations([b])).not.toHaveProperty('color-scheme');
  });

  it('sets color-scheme only in rules scoped to a [data-surface] selector', () => {
    const withScheme = blocks.filter((b) => 'color-scheme' in declarations([b]));
    expect(withScheme.length).toBeGreaterThan(0);
    for (const b of withScheme) {
      for (const selector of b.selectors) expect(selector).toMatch(/^\[data-surface="(night|paper)"\]$/);
    }
  });
});

describe('shared tokens', () => {
  const root = surfaceVars('root');

  it('defines the shanyrak palette on :root', () => {
    expect(root['--sh-night']).toBe('#16153A');
    expect(root['--sh-saffron']).toBe('#E8A33D');
    expect(root['--sh-felt']).toBe('#EAD9B6');
    expect(root['--sh-ember']).toBe('#D2401E');
  });

  it('defines the font stacks', () => {
    expect(root['--font-display']).toBe('"Roboto Flex Variable", "Onest Variable", system-ui, sans-serif');
    expect(root['--font-text']).toBe('"Onest Variable", system-ui, sans-serif');
    expect(root['--font-serif']).toBe('"Spectral", Georgia, serif');
    expect(root['--font-mono']).toBe('"IBM Plex Mono", ui-monospace, monospace');
  });

  it('defines the type scale', () => {
    const sizes = [12, 14, 16, 18, 22, 28, 36, 48, 72, 104];
    expect(Object.keys(root).filter((k) => k.startsWith('--fs-'))).toEqual(sizes.map((s) => `--fs-${s}`));
    for (const s of sizes) expect(root[`--fs-${s}`]).toBe(`${s}px`);
  });

  it('defines the motion tokens', () => {
    expect(root['--ease-ui']).toBe('cubic-bezier(.16,1,.3,1)');
    expect(root['--dur-ui']).toBe('180ms');
    expect(root['--dur-scene']).toBe('750ms');
  });
});

describe('scales vs tokens', () => {
  it('diverging scale runs from night --sky through --line to night --fire', () => {
    expect(scales.diverging).toEqual([token('night', '--sky'), token('night', '--line'), token('night', '--fire')]);
  });
});
