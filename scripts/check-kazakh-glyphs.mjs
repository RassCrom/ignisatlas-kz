// Checks that every font face shipped by src/design/fonts.js has the nine Kazakh Cyrillic letters.
// Usage: node scripts/check-kazakh-glyphs.mjs   (exits with code 1 if any letter is missing)
//
// Fontsource splits each face into unicode-range subsets, and the Kazakh letters are spread over
// the `cyrillic` and `cyrillic-ext` subsets, so a face is checked against both files together.
import { readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { KAZAKH_CODEPOINTS, missingCodePoints } from './lib/glyphs.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Families that tokens.css names in --font-*; each one has to be shipped by fonts.js.
const EXPECTED_FAMILIES = ['Roboto Flex Variable', 'Onest Variable', 'Spectral', 'IBM Plex Mono'];

const hex = (cp) => `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
const describe = (cp) => `${String.fromCodePoint(cp)} (${hex(cp)})`;

// The stylesheets that fonts.js imports, as paths inside node_modules.
function importedStylesheets() {
  const source = readFileSync(join(root, 'src', 'design', 'fonts.js'), 'utf8');
  return [...source.matchAll(/^\s*import\s+['"]([^'"]+\.css)['"]/gm)].map((m) =>
    join(root, 'node_modules', ...m[1].split('/')),
  );
}

// Collects { family, style, weight, cyrillicFiles } for every face in the stylesheets.
// A face is one family + style + weight; its Cyrillic subsets are merged into one entry.
function collectFaces(stylesheets) {
  const faces = new Map();
  for (const sheet of stylesheets) {
    const css = readFileSync(sheet, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const [, body] of css.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
      const prop = (name) => body.match(new RegExp(`${name}\\s*:\\s*([^;]+);`))?.[1].trim();
      const family = prop('font-family').replace(/^['"]|['"]$/g, '');
      const style = prop('font-style');
      const weight = prop('font-weight');
      const woff2 = body.match(/url\(\s*['"]?([^)'"]+\.woff2)['"]?\s*\)/)?.[1];
      const key = `${family}|${style}|${weight}`;
      if (!faces.has(key)) faces.set(key, { family, style, weight, cyrillicFiles: [] });
      if (woff2 && /-cyrillic(-ext)?-/.test(woff2)) {
        faces.get(key).cyrillicFiles.push(join(dirname(sheet), woff2));
      }
    }
  }
  return [...faces.values()];
}

const faces = collectFaces(importedStylesheets());
const problems = new Map(); // family -> lines to print
const addProblem = (family, line) => problems.set(family, [...(problems.get(family) ?? []), line]);

for (const face of faces) {
  const label = `${face.style} ${face.weight}`;
  if (face.cyrillicFiles.length === 0) {
    addProblem(face.family, `${label}: no cyrillic or cyrillic-ext subset is imported`);
    continue;
  }
  const missing = await missingCodePoints(face.cyrillicFiles, KAZAKH_CODEPOINTS);
  if (missing.length > 0) addProblem(face.family, `${label}: missing ${missing.map(describe).join(', ')}`);
}

for (const family of EXPECTED_FAMILIES) {
  const count = faces.filter((face) => face.family === family).length;
  if (count === 0) addProblem(family, 'not imported by src/design/fonts.js');
  else if (!problems.has(family)) console.log(`${family}: OK (${count} face${count === 1 ? '' : 's'})`);
}

for (const [family, lines] of problems) {
  for (const line of lines) console.error(`${family}: ${line}`);
}

if (problems.size > 0) {
  console.error(`${problems.size} of ${EXPECTED_FAMILIES.length} families fail the Kazakh glyph check`);
  process.exit(1);
}
console.log(`${EXPECTED_FAMILIES.length} families OK`);
