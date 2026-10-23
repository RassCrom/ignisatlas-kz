import { normalizeLocale } from './locales.js';

function withLeadingSlash(path) {
  if (!path) return '/';
  return path.startsWith('/') ? path : `/${path}`;
}

// '/ru/map/legacy' -> { locale: 'ru', rest: '/map/legacy' }.
// An unknown first segment is part of the path: '/map' -> { locale: null, rest: '/map' }.
// `rest` always starts with '/'.
export function splitLocalePath(pathname) {
  const path = withLeadingSlash(pathname);
  const end = path.indexOf('/', 1);
  const first = end === -1 ? path.slice(1) : path.slice(1, end);
  const locale = normalizeLocale(first);
  if (!locale) return { locale: null, rest: path };
  return { locale, rest: end === -1 ? '/' : path.slice(end) };
}

// withLocale('ru', '/map') -> '/ru/map'; withLocale('ru', '/') -> '/ru/'.
export function withLocale(locale, rest) {
  return `/${locale}${withLeadingSlash(rest)}`;
}

// Re-prefixes the path with nextLocale and keeps the query string and hash.
export function swapLocaleInPath(pathname, search, hash, nextLocale) {
  const { rest } = splitLocalePath(pathname);
  return `${withLocale(nextLocale, rest)}${search ?? ''}${hash ?? ''}`;
}
