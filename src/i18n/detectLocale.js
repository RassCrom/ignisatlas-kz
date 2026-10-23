import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, normalizeLocale } from './locales.js';

// Reading globalThis.localStorage itself can throw (blocked site data), not just getItem.
function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function defaultLanguages() {
  try {
    return globalThis.navigator?.languages ?? [];
  } catch {
    return [];
  }
}

function readSavedLocale(storage) {
  try {
    return normalizeLocale(storage?.getItem(LOCALE_STORAGE_KEY));
  } catch {
    return null;
  }
}

function firstSupportedLanguage(languages) {
  for (const tag of languages ?? []) {
    if (typeof tag !== 'string') continue;
    const locale = normalizeLocale(tag.split('-')[0]);
    if (locale) return locale;
  }
  return null;
}

// Saved choice, then the first supported browser language, then DEFAULT_LOCALE.
// Both options default to the browser globals, so detectLocale() works bare.
export function detectLocale({ storage = defaultStorage(), languages = defaultLanguages() } = {}) {
  return readSavedLocale(storage) ?? firstSupportedLanguage(languages) ?? DEFAULT_LOCALE;
}
