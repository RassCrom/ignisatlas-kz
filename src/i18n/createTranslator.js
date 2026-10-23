import { FALLBACK_LOCALE, INTL_LOCALE } from './locales.js';

const TOKEN = /\{\{\s*([^\s{}:]+)(?::([^\s{}]+))?\s*\}\}/g;

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const pluralRulesCache = new Map();

function pluralRulesFor(locale) {
  const tag = INTL_LOCALE[locale] ?? INTL_LOCALE[FALLBACK_LOCALE];
  if (!pluralRulesCache.has(tag)) pluralRulesCache.set(tag, new Intl.PluralRules(tag));
  return pluralRulesCache.get(tag);
}

// Walks 'common.nav.story' through dictionaries[locale]; the first segment is the namespace.
// Only own properties are read, so keys like 'constructor' or '__proto__' never match.
function lookup(dictionaries, locale, key) {
  let node = dictionaries?.[locale];
  for (const segment of key.split('.')) {
    if (node === null || typeof node !== 'object' || !hasOwn(node, segment)) return undefined;
    node = node[segment];
  }
  return node;
}

// A string is used as is. A { one, few, many, other } object is a plural set:
// the category comes from Intl.PluralRules(locale) for params.count, with 'other' as the fallback.
// Any other value (a branch of the tree, a number) counts as missing.
function resolve(value, locale, params) {
  if (typeof value === 'string') return value;
  if (value === null || typeof value !== 'object') return undefined;
  const category = pluralRulesFor(locale).select(Number(params.count));
  const form = hasOwn(value, category) ? value[category] : value.other;
  return typeof form === 'string' ? form : undefined;
}

function interpolate(text, params, formatToken) {
  return text.replace(TOKEN, (match, name, id) => {
    if (id !== undefined) {
      // {{kind:id}} belongs to formatToken, never to params.
      if (typeof formatToken !== 'function') return match;
      const formatted = formatToken(name, id);
      return formatted === undefined || formatted === null ? match : String(formatted);
    }
    return hasOwn(params, name) && params[name] != null ? String(params[name]) : match;
  });
}

// Lookup order: locale, FALLBACK_LOCALE, then the key itself.
export function createTranslator({ locale, dictionaries, formatToken } = {}) {
  return function t(key, params) {
    const values = params ?? {};
    for (const candidate of locale === FALLBACK_LOCALE ? [locale] : [locale, FALLBACK_LOCALE]) {
      const text = resolve(lookup(dictionaries, candidate, key), candidate, values);
      if (text !== undefined) return interpolate(text, values, formatToken);
    }
    return key;
  };
}
