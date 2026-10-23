import { describe, expect, it } from 'vitest';
import { dictionaries } from './dictionaries.js';
import { LOCALES } from './locales.js';

// 'nav.story' style paths of every string in a tree.
function leafPaths(node, prefix = '') {
  return Object.entries(node).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value !== null && typeof value === 'object' ? leafPaths(value, path) : [path];
  });
}

describe('dictionaries', () => {
  it('has a common namespace for every supported locale', () => {
    expect(Object.keys(dictionaries).sort()).toEqual([...LOCALES].sort());
    for (const locale of LOCALES) expect(dictionaries[locale].common).toBeTypeOf('object');
  });

  it('defines the same keys in every locale', () => {
    const reference = leafPaths(dictionaries.ru.common).sort();
    expect(reference.length).toBeGreaterThan(0);
    for (const locale of LOCALES) expect(leafPaths(dictionaries[locale].common).sort()).toEqual(reference);
  });

  it('has no empty strings', () => {
    for (const locale of LOCALES) {
      const common = dictionaries[locale].common;
      for (const path of leafPaths(common)) {
        const value = path.split('.').reduce((node, key) => node[key], common);
        expect(value, `${locale}:${path}`).toMatch(/\S/);
      }
    }
  });

  it('holds the navigation, language and skip-link strings', () => {
    const { kk, ru, en } = dictionaries;
    expect([kk.common.nav, ru.common.nav, en.common.nav]).toEqual([
      { story: 'Тарих', atlas: 'Атлас', map: 'Карта', data: 'Деректер' },
      { story: 'История', atlas: 'Атлас', map: 'Карта', data: 'Данные' },
      { story: 'Story', atlas: 'Atlas', map: 'Map', data: 'Data' },
    ]);
    for (const { common } of [kk, ru, en]) {
      expect(common.lang).toEqual({ kk: 'Қазақша', ru: 'Русский', en: 'English' });
      expect(common.langShort).toEqual({ kk: 'ҚАЗ', ru: 'РУС', en: 'ENG' });
    }
    expect([kk.common.skipToContent, ru.common.skipToContent, en.common.skipToContent]).toEqual([
      'Мазмұнға өту',
      'Перейти к содержимому',
      'Skip to content',
    ]);
  });
});
