import { describe, expect, it } from 'vitest';
import { createTranslator } from './createTranslator.js';

const dictionaries = {
  kk: { common: { nav: { story: 'Тарих' }, fires: { one: '{{count}} өрт', other: '{{count}} өрт' } } },
  ru: { common: { nav: { story: 'История', map: 'Карта' }, fires: { one: '{{count}} пожар', few: '{{count}} пожара', many: '{{count}} пожаров', other: '{{count}} пожара' } } },
};

describe('createTranslator', () => {
  it('reads the current locale', () => expect(createTranslator({ locale: 'kk', dictionaries })('common.nav.story')).toBe('Тарих'));
  it('falls back to Russian', () => expect(createTranslator({ locale: 'kk', dictionaries })('common.nav.map')).toBe('Карта'));
  it('returns the key when nothing matches', () => expect(createTranslator({ locale: 'en', dictionaries })('common.nav.atlas')).toBe('common.nav.atlas'));

  it('picks Russian plural forms', () => {
    const t = createTranslator({ locale: 'ru', dictionaries });
    expect([1, 3, 5].map((count) => t('common.fires', { count }))).toEqual(['1 пожар', '3 пожара', '5 пожаров']);
  });

  it('delegates number tokens', () => {
    const t = createTranslator({ locale: 'ru', dictionaries: { ru: { s: { a: 'в {{n:ratio}} раза' } } }, formatToken: (kind, id) => `${kind}:${id}` });
    expect(t('s.a')).toBe('в n:ratio раза');
  });

  it('leaves number tokens untouched without formatToken', () => {
    const t = createTranslator({ locale: 'ru', dictionaries: { ru: { s: { a: 'в {{n:ratio}} раза' } } } });
    expect(t('s.a', { n: 5, ratio: 2 })).toBe('в {{n:ratio}} раза');
  });

  it('interpolates named params', () => {
    const t = createTranslator({ locale: 'ru', dictionaries: { ru: { s: { a: '{{name}} — {{ region }}' } } } });
    expect(t('s.a', { name: 'Алматы', region: 0 })).toBe('Алматы — 0');
  });

  it('leaves a placeholder when its param is missing', () => {
    const t = createTranslator({ locale: 'ru', dictionaries: { ru: { s: { a: 'Привет, {{name}}' } } } });
    expect(t('s.a')).toBe('Привет, {{name}}');
  });

  it('uses plural rules of the locale the text came from', () => {
    const t = createTranslator({ locale: 'kk', dictionaries: { kk: {}, ru: dictionaries.ru } });
    expect(t('common.fires', { count: 3 })).toBe('3 пожара');
  });

  it('picks the Kazakh plural form', () => {
    const t = createTranslator({ locale: 'kk', dictionaries });
    expect(t('common.fires', { count: 1 })).toBe('1 өрт');
    expect(t('common.fires', { count: 7 })).toBe('7 өрт');
  });

  it('falls back to other when the plural category is missing', () => {
    const t = createTranslator({ locale: 'ru', dictionaries: { ru: { s: { a: { one: '{{count}} раз', other: '{{count}} раза' } } } } });
    expect(t('s.a', { count: 5 })).toBe('5 раза');
  });

  it('treats a non-leaf key as missing', () => {
    const t = createTranslator({ locale: 'ru', dictionaries });
    expect(t('common.nav')).toBe('common.nav');
  });

  it('does not read inherited properties', () => {
    const t = createTranslator({ locale: 'ru', dictionaries });
    expect(t('common.nav.constructor')).toBe('common.nav.constructor');
    expect(t('common.__proto__')).toBe('common.__proto__');
  });

  it('does not re-interpolate param values', () => {
    const t = createTranslator({ locale: 'ru', dictionaries: { ru: { s: { a: '{{a}} {{b}}' } } } });
    expect(t('s.a', { a: '{{b}}', b: 'x' })).toBe('{{b}} x');
  });
});
