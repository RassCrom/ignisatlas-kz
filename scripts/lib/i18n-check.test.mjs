import { expect, it } from 'vitest';
import { compareKeys, findLatinInKazakh, KK_LATIN_ALLOW } from './i18n-check.mjs';

it('reports missing, extra and empty keys against the union', () => {
  const errors = compareKeys({ kk: { common: { a: 'x', b: '' } }, ru: { common: { a: 'x', b: 'y', c: 'z' } }, en: { common: { a: 'x', b: 'y' } } });
  expect(errors).toEqual(expect.arrayContaining(['kk/common: empty b', 'kk/common: missing c', 'en/common: missing c']));
});

it('flags Latin transliteration but allows listed terms and placeholders', () => {
  const dict = { common: { ok: 'MODIS {{count}} нүкте', bad: 'Qazaqstandaghy örtter' } };
  expect(findLatinInKazakh(dict, KK_LATIN_ALLOW)).toEqual(["kk/common: bad contains 'Qazaqstandaghy'"]);
});

it('returns nothing for dictionaries that agree', () => {
  const same = { common: { nav: { map: 'x' }, title: 'y' } };
  expect(compareKeys({ kk: same, ru: same, en: same })).toEqual([]);
});

it('names a key present in one locale only as extra there and missing elsewhere', () => {
  const errors = compareKeys({
    kk: { common: { nav: { map: 'x' } } },
    ru: { common: { nav: { map: 'x', old: 'y' } } },
    en: { common: { nav: { map: 'x' } } },
  });
  expect(errors).toEqual(['kk/common: missing nav.old', 'ru/common: extra nav.old', 'en/common: missing nav.old']);
});

it('does not call a key extra when two of three locales have it', () => {
  const errors = compareKeys({ kk: { common: { a: 'x' } }, ru: { common: { a: 'x', b: 'y' } }, en: { common: { a: 'x', b: 'y' } } });
  expect(errors).toEqual(['kk/common: missing b']);
});

it('compares plural sets as nested keys', () => {
  const errors = compareKeys({
    kk: { common: { count: { one: 'a', other: 'b' } } },
    ru: { common: { count: { one: 'a', few: 'c', many: 'd', other: 'b' } } },
    en: { common: { count: { one: 'a', few: 'c', many: 'd', other: 'b' } } },
  });
  expect(errors).toEqual(['kk/common: missing count.few', 'kk/common: missing count.many']);
});

it('treats a namespace that a locale lacks as having none of its keys', () => {
  const errors = compareKeys({ kk: { common: { a: 'x' }, map: { b: 'y' } }, ru: { common: { a: 'x' } }, en: { common: { a: 'x' }, map: { b: 'y' } } });
  expect(errors).toEqual(['ru/map: missing b']);
});

it('counts whitespace-only strings as empty and non-strings as invalid', () => {
  const errors = compareKeys({
    kk: { common: { a: '  ', b: null, c: 5, d: ['x'] } },
    ru: { common: { a: 'x', b: 'x', c: 'x', d: 'x' } },
  });
  expect(errors).toEqual(['kk/common: empty a', 'kk/common: not a string b', 'kk/common: not a string c', 'kk/common: not a string d']);
});

it('ignores empty objects when comparing keys', () => {
  expect(compareKeys({ kk: { common: { a: 'x', group: {} } }, ru: { common: { a: 'x' } } })).toEqual([]);
});

it('allows every listed term, the English endonym and the short code', () => {
  const dict = { common: { lang: 'English', short: 'ENG', title: 'Tabiat Küzeti', src: 'NASA FIRMS, MODIS, VIIRS, ERA5-Land, ERA5, Sentinel-2' } };
  expect(findLatinInKazakh(dict, KK_LATIN_ALLOW)).toEqual([]);
  expect(KK_LATIN_ALLOW).toContain('English');
});

it('cuts the longer term first so ERA5-Land leaves nothing behind', () => {
  expect(findLatinInKazakh({ common: { s: 'ERA5-Land және ERA5' } }, ['ERA5', 'ERA5-Land'])).toEqual([]);
});

it('matches terms as whole words, so a Latin word that merely starts with one is flagged', () => {
  expect(findLatinInKazakh({ common: { s: 'Terrain' } }, KK_LATIN_ALLOW)).toEqual(["kk/common: s contains 'Terrain'"]);
  expect(findLatinInKazakh({ common: { s: 'ENGLISH' } }, KK_LATIN_ALLOW)).toEqual(["kk/common: s contains 'ENGLISH'"]);
});

it('accepts a term next to Cyrillic or punctuation', () => {
  expect(findLatinInKazakh({ common: { s: 'NASAның, (MODIS) деректері' } }, KK_LATIN_ALLOW)).toEqual([]);
});

it('flags a run of three or more Latin letters, diacritics included, but not shorter ones', () => {
  expect(findLatinInKazakh({ common: { a: 'Küzeti', b: 'ab мен ÖÖ' } }, KK_LATIN_ALLOW)).toEqual(["kk/common: a contains 'Küzeti'"]);
});

it('reports one error per key, naming the first Latin word', () => {
  expect(findLatinInKazakh({ common: { s: 'Tarih jane Atlas' } }, KK_LATIN_ALLOW)).toEqual(["kk/common: s contains 'Tarih'"]);
});

it('walks nested keys and plural sets in every namespace', () => {
  const dict = { common: { nav: { story: 'Tarih' }, count: { one: '{{count}} нүкте', other: 'Nukte' } }, map: { a: 'Zhanu' } };
  expect(findLatinInKazakh(dict, KK_LATIN_ALLOW)).toEqual([
    "kk/common: nav.story contains 'Tarih'",
    "kk/common: count.other contains 'Nukte'",
    "kk/map: a contains 'Zhanu'",
  ]);
});

it('ignores placeholders of both kinds', () => {
  expect(findLatinInKazakh({ common: { s: '{{count}} және {{region:almaty}}' } }, KK_LATIN_ALLOW)).toEqual([]);
});

it('compares composed and decomposed spellings of an allowed term as equal', () => {
  const decomposed = 'Tabiat Küzeti';
  expect(findLatinInKazakh({ common: { s: decomposed } }, KK_LATIN_ALLOW)).toEqual([]);
});
