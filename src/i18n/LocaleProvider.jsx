import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createTranslator } from './createTranslator.js';
import { dictionaries } from './dictionaries.js';
import { LOCALE_STORAGE_KEY, isLocale } from './locales.js';
import { swapLocaleInPath } from './paths.js';

const LocaleContext = createContext(null);

function saveLocale(locale) {
  // Reading globalThis.localStorage can throw as well (blocked site data).
  try {
    globalThis.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // The choice still applies through the URL; it just is not remembered.
  }
}

// Under BrowserRouter the router's location only follows history events the router hears about, and
// the legacy map moves the address bar with window.history.pushState (its '#map=...' view), which it
// does not hear about. So when the address bar is on the router's own path, its query and hash are
// the live ones. Under MemoryRouter (tests) the paths differ and the router's values are used.
function liveSearchAndHash(routerLocation) {
  try {
    const { location } = globalThis;
    if (location && location.pathname === routerLocation.pathname) {
      return { search: location.search, hash: location.hash };
    }
  } catch {
    // No window.location; fall back to the router's own values.
  }
  return { search: routerLocation.search, hash: routerLocation.hash };
}

// `locale` comes from the URL prefix and must already be a supported locale (the route checks it).
export function LocaleProvider({ locale, children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // setLocale reads the latest router state from here so its identity does not change on every
  // navigation (useNavigate changes with the location) and consumers are not re-rendered by it.
  const latest = useRef({ locale, location, navigate });
  useEffect(() => {
    latest.current = { locale, location, navigate };
  });

  const t = useMemo(() => createTranslator({ locale, dictionaries }), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // The language in the URL is the one the visitor is using now, so remember it: links without a
  // prefix ('/map', '/report', the old logo href="/") then redirect to this language.
  useEffect(() => {
    saveLocale(locale);
  }, [locale]);

  const setLocale = useCallback((next) => {
    if (!isLocale(next)) return;
    saveLocale(next);
    const current = latest.current;
    // Picking the language that is already active would only stack a duplicate history entry.
    if (next === current.locale) return;
    const { pathname } = current.location;
    const { search, hash } = liveSearchAndHash(current.location);
    current.navigate(swapLocaleInPath(pathname, search, hash, next), { replace: false });
  }, []);

  const value = useMemo(() => ({ locale, t, setLocale }), [locale, t, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === null) throw new Error('useLocale must be used inside <LocaleProvider>');
  return context;
}
