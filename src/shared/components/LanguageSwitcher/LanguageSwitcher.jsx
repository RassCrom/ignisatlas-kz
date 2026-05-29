import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Languages } from "lucide-react";
import { useI18n } from "src/shared/i18n/I18nProvider";

import styles from "./LanguageSwitcher.module.scss";

const LanguageSwitcher = ({ className = "", compact = false, languageCodes = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const { language, languageConfig, languages, setLanguage, t } = useI18n();
  const visibleLanguages = languageCodes
    ? languages.filter((lang) => languageCodes.includes(lang.code))
    : languages;
  const activeLanguageConfig = visibleLanguages.find((lang) => lang.code === language) ?? visibleLanguages[0] ?? languageConfig;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (code) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div
      ref={ref}
      className={`${styles.switcher} ${compact ? styles.compact : ""} ${className}`}
    >
      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.open : ""}`}
        onClick={() => setIsOpen((open) => !open)}
        aria-label={t("common.languageSelect")}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Languages size={15} aria-hidden="true" />
        <span>{activeLanguageConfig.label}</span>
        <ChevronDown size={14} className={styles.chevron} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className={styles.menu} role="listbox" aria-label={t("common.languageSelect")}>
          {visibleLanguages.map((lang) => {
            const isActive = language === lang.code;

            return (
              <button
                key={lang.code}
                type="button"
                className={`${styles.option} ${isActive ? styles.active : ""}`}
                onClick={() => handleSelect(lang.code)}
                role="option"
                aria-selected={isActive}
              >
                <span className={styles.optionLabel}>{lang.label}</span>
                <span className={styles.optionName}>{lang.name}</span>
                {isActive && <Check size={14} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
