import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, FALLBACK_LOCALE, INTL_LOCALE, LOCALES, LOCALE_STORAGE_KEY, isLocale, normalizeLocale } from './locales.js';

describe('locales', () => {
  it('exposes the supported locales and defaults', () => {
    expect(LOCALES).toEqual(['kk', 'ru', 'en']);
    expect(DEFAULT_LOCALE).toBe('kk');
    expect(FALLBACK_LOCALE).toBe('ru');
    expect(INTL_LOCALE).toEqual({ kk: 'kk-KZ', ru: 'ru-RU', en: 'en-GB' });
    expect(LOCALE_STORAGE_KEY).toBe('fires-kz-language');
  });

  it('isLocale accepts only exact supported codes', () => {
    expect(['kk', 'ru', 'en'].every(isLocale)).toBe(true);
    expect([isLocale('KK'), isLocale('de'), isLocale(''), isLocale(null), isLocale(undefined), isLocale(1)]).toEqual([false, false, false, false, false, false]);
  });

  it('normalizeLocale ignores case and rejects unsupported values', () => {
    expect(normalizeLocale('KK')).toBe('kk');
    expect(normalizeLocale('Ru')).toBe('ru');
    expect(normalizeLocale('de')).toBeNull();
    expect(normalizeLocale(undefined)).toBeNull();
  });
});
