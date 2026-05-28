import { memo, useEffect, useState } from "react";
import { Menu, CircleHelp, X, Keyboard, Mouse, Layers, Flame, Satellite, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useMenuStore from "src/app/store/store";
import { useI18n } from "src/shared/i18n/I18nProvider";

import styles from "./Header.module.scss";

const helpIcons = [Mouse, Keyboard, Layers, Flame, Satellite, Sparkles];

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.94, y: -12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, scale: 0.96, y: -8, transition: { duration: 0.15 } },
};

const HelpModal = ({ onClose }) => {
  const { t } = useI18n();
  const helpSections = t("map.help.sections", []);

  return (
    <motion.div
      className={styles.helpOverlay}
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClose}
    >
      <motion.div
        className={styles.helpModal}
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={t("map.help.dialogAria")}
      >
        <div className={styles.helpHeader}>
          <div className={styles.helpTitle}>
            <CircleHelp size={18} />
            {t("map.help.title")}
          </div>
          <button className={styles.helpClose} onClick={onClose} aria-label={t("map.help.closeAria")}>
            <X size={16} />
          </button>
        </div>

        <div className={styles.helpBody}>
          <p className={styles.helpIntro}>
            <span className={styles.helpRunes} aria-hidden="true">{t("common.brandRunes")}</span>
            {t("map.help.intro")}
          </p>

          <div className={styles.helpGrid}>
            {helpSections.map(({ title, items }, index) => {
              const Icon = helpIcons[index] ?? CircleHelp;

              return (
                <div key={title} className={styles.helpSection}>
                  <div className={styles.helpSectionTitle}>
                    <Icon size={13} />
                    {title}
                  </div>
                  <ul className={styles.helpList}>
                    {items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className={styles.helpFooter}>{t("map.help.footer")}</div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Header = memo(() => {
  const { isMenuOpen, toggleMenu } = useMenuStore();
  const [helpOpen, setHelpOpen] = useState(false);
  const { language, languages, setLanguage, t } = useI18n();

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && helpOpen) setHelpOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [helpOpen]);

  return (
    <>
      <header className={styles.header}>
        <div className={styles["header-inner"]}>
          <div className={styles["header-left"]}>
            <button
              className={styles["header-menu-btn"]}
              onClick={toggleMenu}
              data-tooltip={isMenuOpen ? t("common.collapse") : t("common.expand")}
              aria-label={isMenuOpen ? t("common.closeMenu") : t("common.openMenu")}
            >
              <AnimatePresence mode="wait">
                {isMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <X />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Menu />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            <div className={styles["header-logo"]}>
              <a href="/" aria-label={t("common.homeAria")}>
                <img src="/temp_logo.png" alt={t("common.brand")} loading="lazy" />
                <div className={styles["header-logo__textblock"]}>
                  <span className={styles["header-logo__runes"]} aria-hidden="true">
                    {t("common.brandRunes")}
                  </span>
                  <span className={styles["header-logo__name"]}>{t("common.brand")}</span>
                </div>
              </a>
            </div>
          </div>

          <div className={styles["header-right"]}>
            <div className={styles["header-lang"]} role="group" aria-label={t("common.languageSelect")}>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  className={`${styles["header-lang-btn"]} ${language === lang.code ? styles["header-lang-btn--active"] : ""}`}
                  onClick={() => setLanguage(lang.code)}
                  aria-pressed={language === lang.code}
                  title={lang.name}
                >
                  {lang.label}
                </button>
              ))}
            </div>
            <div className={styles["header-info"]}>
              <button
                className={styles["header-info-btn"]}
                id="help-button"
                data-tooltip={t("map.help.buttonTooltip")}
                aria-label={t("map.help.openAria")}
                role="button"
                onClick={() => setHelpOpen(true)}
              >
                <CircleHelp aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
      </AnimatePresence>
    </>
  );
});

Header.displayName = "Header";
export default Header;
