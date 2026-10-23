// Pure checks for the locale dictionaries in src/i18n/locales. scripts/check-i18n.mjs reads the files.
//
// A dictionary set is { locale: { namespace: tree } }. A tree is nested objects with string leaves.
// A plural value ({ one, few, many, other }) is just another nested object, so its forms are
// compared as keys like `count.one`.

// Latin terms that may stay inside Kazakh strings: names, data sources, units and file formats.
// 'English' is the endonym in the language switcher and 'ENG' its short code.
export const KK_LATIN_ALLOW = [
  'Tabiat Küzeti', 'NASA', 'FIRMS', 'MODIS', 'VIIRS', 'MCD64A1', 'ERA5-Land', 'ERA5', 'FWI', 'GFAS', 'GFED',
  'CO₂', 'CH₄', 'PM2.5', 'OpenStreetMap', 'Sentinel-2', 'Terra', 'Aqua', 'S-NPP', 'NOAA-20', 'NOAA-21',
  'PNG', 'CSV', 'ENG', 'English',
];

const isTree = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

// { nav: { map: 'x' } } -> Map { 'nav.map' => 'x' }. Empty objects add no keys.
function flatten(tree, prefix = '', into = new Map()) {
  for (const [name, value] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${name}` : name;
    if (isTree(value)) flatten(value, key, into);
    else into.set(key, value);
  }
  return into;
}

// Compares every namespace across the locales and returns error lines, grouped by namespace,
// then by locale in the order given:
//   "en/common: missing nav.data"  the other locales have it (checked against the union of keys)
//   "ru/common: extra nav.old"     only this locale has it (also reported as missing in the rest)
//   "kk/common: empty nav.map"     blank string
//   "kk/common: not a string nav.map"  null, number or array
// A locale without a namespace counts as having none of its keys.
export function compareKeys(dicts) {
  const locales = Object.keys(dicts);
  const namespaces = new Set(locales.flatMap((locale) => Object.keys(dicts[locale] ?? {})));
  const errors = [];
  for (const namespace of namespaces) {
    const flat = new Map(locales.map((locale) => [locale, flatten(dicts[locale]?.[namespace] ?? {})]));
    const union = new Set(locales.flatMap((locale) => [...flat.get(locale).keys()]));
    for (const locale of locales) {
      const own = flat.get(locale);
      const label = `${locale}/${namespace}`;
      for (const key of union) {
        if (!own.has(key)) {
          errors.push(`${label}: missing ${key}`);
          continue;
        }
        if (locales.length > 1 && locales.filter((other) => flat.get(other).has(key)).length === 1) {
          errors.push(`${label}: extra ${key}`);
        }
        const value = own.get(key);
        if (typeof value !== 'string') errors.push(`${label}: not a string ${key}`);
        else if (value.trim() === '') errors.push(`${label}: empty ${key}`);
      }
    }
  }
  return errors;
}

const LATIN_RUN = /\p{Script=Latin}{3,}/u;
const PLACEHOLDER = /\{\{[^}]*\}\}/g;

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Matches an allowed term only as a whole word: the neighbours may not be Latin letters, so
// 'Terra' is cut out of "Terra" but not out of "Terrain". The longest term goes first so that
// 'ERA5-Land' is not left as 'ERA5' plus '-Land'.
function allowedTerms(allow) {
  const terms = allow
    .map((term) => term.normalize('NFC'))
    .filter((term) => term !== '')
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp);
  if (terms.length === 0) return null;
  return new RegExp(`(?<!\\p{Script=Latin})(?:${terms.join('|')})(?!\\p{Script=Latin})`, 'gu');
}

// Finds Latin transliteration in the Kazakh dictionaries ({ namespace: tree }). Placeholders
// ({{count}}, {{kind:id}}) and the allowed terms are cut out first; a run of three or more
// Latin letters (diacritics included) in what is left is an error. One error per key, naming
// the first such word: "kk/common: nav.story contains 'Tarih'".
export function findLatinInKazakh(dict, allow) {
  const allowed = allowedTerms(allow);
  const errors = [];
  for (const [namespace, tree] of Object.entries(dict)) {
    for (const [key, value] of flatten(tree)) {
      if (typeof value !== 'string') continue;
      let text = value.normalize('NFC').replace(PLACEHOLDER, ' ');
      if (allowed) text = text.replace(allowed, ' ');
      const word = text.match(LATIN_RUN)?.[0];
      if (word) errors.push(`kk/${namespace}: ${key} contains '${word}'`);
    }
  }
  return errors;
}
