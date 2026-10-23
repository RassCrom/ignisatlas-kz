// Checks the locale dictionaries in src/i18n/locales/{kk,ru,en}/*.json:
// the same keys in every locale, no empty strings, no Latin transliteration in Kazakh.
// Usage: node scripts/check-i18n.mjs   (exits with code 1 and prints each problem if any check fails)
//
// The old dictionary in src/shared/i18n/config.js is not checked: it goes away with the old pages.
import { readdirSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { LOCALES } from '../src/i18n/locales.js';
import { compareKeys, findLatinInKazakh, KK_LATIN_ALLOW } from './lib/i18n-check.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const localesDir = join(root, 'src', 'i18n', 'locales');

// Reads every locale's *.json files into { locale: { namespace: tree } }; the file name is the namespace.
function loadDictionaries() {
  const dicts = {};
  const problems = [];
  for (const locale of LOCALES) {
    dicts[locale] = {};
    const dir = join(localesDir, locale);
    let files = [];
    try {
      files = readdirSync(dir).filter((name) => name.endsWith('.json')).sort();
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      problems.push(`${locale}: folder src/i18n/locales/${locale} not found`);
    }
    for (const file of files) {
      const namespace = file.slice(0, -'.json'.length);
      try {
        dicts[locale][namespace] = JSON.parse(readFileSync(join(dir, file), 'utf8'));
      } catch (error) {
        problems.push(`${locale}/${namespace}: invalid JSON (${error.message})`);
      }
    }
  }
  return { dicts, problems };
}

const { dicts, problems } = loadDictionaries();
const namespaces = new Set(LOCALES.flatMap((locale) => Object.keys(dicts[locale])));

// With unreadable files the key comparison would only bury the real problem under "missing" lines.
if (problems.length === 0) {
  if (namespaces.size === 0) problems.push('no dictionaries found in src/i18n/locales');
  problems.push(...compareKeys(dicts), ...findLatinInKazakh(dicts.kk, KK_LATIN_ALLOW));
}

if (problems.length > 0) {
  for (const line of problems) console.error(line);
  console.error(`${problems.length} i18n problem${problems.length === 1 ? '' : 's'}`);
  process.exit(1);
}
console.log(`i18n OK (${LOCALES.length} locales, ${namespaces.size} namespaces)`);
