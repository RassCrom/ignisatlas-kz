export const LOCALES = Object.freeze(['kk', 'ru', 'en']);

export const DEFAULT_LOCALE = 'kk';

// Missing strings are looked up in this locale before the key itself is shown.
export const FALLBACK_LOCALE = 'ru';

// BCP 47 tags handed to Intl (plural rules, number and date formatting).
export const INTL_LOCALE = Object.freeze({ kk: 'kk-KZ', ru: 'ru-RU', en: 'en-GB' });

// Same key the previous provider (src/shared/i18n) already writes, so saved choices survive.
export const LOCALE_STORAGE_KEY = 'fires-kz-language';

// Exact, case-sensitive membership test for a supported locale code.
export function isLocale(value) {
  return typeof value === 'string' && LOCALES.includes(value);
}

// Case-insensitive: 'KK' -> 'kk'. Returns null for anything that is not a supported locale.
export function normalizeLocale(value) {
  if (typeof value !== 'string') return null;
  const code = value.trim().toLowerCase();
  return isLocale(code) ? code : null;
}
