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
    const t = (path, fallback = "") => {
      const valueByLanguage = readPath(translations[language], path);
      if (valueByLanguage !== undefined) return valueByLanguage;

      const defaultValue = readPath(translations[DEFAULT_LANGUAGE], path);
      return defaultValue ?? fallback;
    };

    return {
      language,
      languageConfig: LANGUAGES.find(({ code }) => code === language) ?? LANGUAGES[0],
      languages: LANGUAGES,
      setLanguage,
      t,
    };
  }, [language, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }

  return context;
};
