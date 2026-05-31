import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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

export const I18nProvider = ({ children }) => {
  const [language, setLanguageState] = useState(getInitialLanguage);

  const setLanguage = useCallback((nextLanguage) => {
    if (!isSupportedLanguage(nextLanguage)) return;
    setLanguageState(nextLanguage);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }

    const activeLanguage = LANGUAGES.find(({ code }) => code === language);
    document.documentElement.lang = activeLanguage?.htmlLang ?? language;
  }, [language]);

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

const useStandaloneI18n = () => {
  const [language, setLanguageState] = useState(getInitialLanguage);

  const setLanguage = useCallback((nextLanguage) => {
    if (!isSupportedLanguage(nextLanguage)) return;

    setLanguageState(nextLanguage);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
      window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: nextLanguage }));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

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
  }, []);

  useEffect(() => {
    const activeLanguage = LANGUAGES.find(({ code }) => code === language);
    document.documentElement.lang = activeLanguage?.htmlLang ?? language;
  }, [language]);

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
  const fallback = useStandaloneI18n();

  return context ?? fallback;
};
