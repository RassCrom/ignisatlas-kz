import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_LANGUAGE, LANGUAGE_CODES, LANGUAGE_STORAGE_KEY, LANGUAGES, translations } from "./config";

const I18nContext = createContext(null);

const isSupportedLanguage = (language) => LANGUAGE_CODES.includes(language);

const getInitialLanguage = () => {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;

  const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (isSupportedLanguage(savedLanguage)) return savedLanguage;

  return DEFAULT_LANGUAGE;
};

const readPath = (source, path) =>
  path.split(".").reduce((value, key) => (value == null ? undefined : value[key]), source);

const createTranslator = (language) => (path, fallback = "") => {
  const valueByLanguage = readPath(translations[language], path);
  if (valueByLanguage !== undefined) return valueByLanguage;

  const defaultValue = readPath(translations[DEFAULT_LANGUAGE], path);
  return defaultValue ?? fallback;
};

const LANGUAGE_CHANGE_EVENT = "fires-kz-language-change";

// Without `language` the provider owns the language: it reads and saves it in localStorage and sets
// <html lang>. With `language` it is controlled: the value follows the prop, setLanguage(code) only
// calls onLanguageChange(code), and localStorage and <html lang> are left to the owner of the value
// (the locale-prefixed routes). The mode is chosen by the first render and is not meant to change.
export const I18nProvider = ({ children, language: controlledLanguage, onLanguageChange }) => {
  const isControlled = controlledLanguage !== undefined;
  const [ownLanguage, setLanguageState] = useState(() => (isControlled ? DEFAULT_LANGUAGE : getInitialLanguage()));
  const language = isControlled
    ? isSupportedLanguage(controlledLanguage)
      ? controlledLanguage
      : DEFAULT_LANGUAGE
    : ownLanguage;

  // Read through a ref so an inline callback does not change setLanguage and the context value.
  const onLanguageChangeRef = useRef(onLanguageChange);
  useEffect(() => {
    onLanguageChangeRef.current = onLanguageChange;
  });

  const setLanguage = useCallback(
    (nextLanguage) => {
      if (!isSupportedLanguage(nextLanguage)) return;

      if (isControlled) {
        onLanguageChangeRef.current?.(nextLanguage);
        return;
      }
      setLanguageState(nextLanguage);
    },
    [isControlled]
  );

  useEffect(() => {
    if (isControlled) return;

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }

    const activeLanguage = LANGUAGES.find(({ code }) => code === language);
    document.documentElement.lang = activeLanguage?.htmlLang ?? language;
  }, [isControlled, language]);

  const value = useMemo(() => {
    return {
      language,
      languageConfig: LANGUAGES.find(({ code }) => code === language) ?? LANGUAGES[0],
      languages: LANGUAGES,
      setLanguage,
      t: createTranslator(language),
    };
  }, [language, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

// Only used when there is no provider above (`enabled`). Hooks cannot be skipped, so under a provider
// it is kept inert: it does not read localStorage, listen for changes or touch <html lang>.
const useStandaloneI18n = (enabled) => {
  const [language, setLanguageState] = useState(() => (enabled ? getInitialLanguage() : DEFAULT_LANGUAGE));

  const setLanguage = useCallback((nextLanguage) => {
    if (!isSupportedLanguage(nextLanguage)) return;

    setLanguageState(nextLanguage);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
      window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: nextLanguage }));
    }
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return undefined;

    const handleLanguageChange = (event) => {
      if (isSupportedLanguage(event.detail)) {
        setLanguageState(event.detail);
      }
    };

    const handleStorage = (event) => {
      if (event.key === LANGUAGE_STORAGE_KEY && isSupportedLanguage(event.newValue)) {
        setLanguageState(event.newValue);
      }
    };

    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const activeLanguage = LANGUAGES.find(({ code }) => code === language);
    document.documentElement.lang = activeLanguage?.htmlLang ?? language;
  }, [enabled, language]);

  return useMemo(
    () => ({
      language,
      languageConfig: LANGUAGES.find(({ code }) => code === language) ?? LANGUAGES[0],
      languages: LANGUAGES,
      setLanguage,
      t: createTranslator(language),
    }),
    [language, setLanguage]
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  const fallback = useStandaloneI18n(context === null);

  return context ?? fallback;
};
