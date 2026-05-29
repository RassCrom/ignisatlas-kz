import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LanguageSwitcher from "src/shared/components/LanguageSwitcher/LanguageSwitcher";
import { useI18n } from "src/shared/i18n/I18nProvider";
import { getLocalizedValue } from "src/shared/i18n/localize";
import { navItems } from "./navItems";
import { useReportI18n } from "../reportI18n";
import styles from "./ReportHeader.module.scss";

const mobileMenuVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: "auto", transition: { duration: 0.3 } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.2 } },
};

export default function ReportHeader({ activeSection }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useI18n();
  const { language, text } = useReportI18n();

  return (
    <header className={styles.header}>
      <div className={styles.header__container}>
        <motion.div
          className={styles.header__logo}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45 }}
        >
          <a href="/" aria-label={t("common.homeAria")} className={styles.logo__link}>
            <img
              src="/hero-tabiat-v2.png"
              alt={t("common.brand")}
              className={styles.logo__icon}
            />
            <div className={styles.logo__textblock}>
              <span className={styles.logo__runes} aria-hidden="true">
                {t("common.brandRunes")}
              </span>
              <span className={styles.logo__name}>{t("common.brand")}</span>
            </div>
          </a>
        </motion.div>

        <div className={styles.header__badge}>
          <span className={styles.badge__separator} aria-hidden="true">/</span>
          <span className={styles.badge__label}>{text.header.badge}</span>
        </div>

        <nav className={styles.header__nav} aria-label={text.header.navAria}>
          <ul className={styles.nav__list}>
            {navItems.map((n, i) => (
              <motion.li
                key={n.id}
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: "easeOut" }}
              >
                <a
                  href={`#${n.id}`}
                  className={`${styles.nav__link} ${activeSection === n.id ? styles["nav__link--active"] : ""}`}
                >
                  {getLocalizedValue(n, "label", language)}
                </a>
              </motion.li>
            ))}
          </ul>
        </nav>

        <LanguageSwitcher className={styles.header__lang} languageCodes={["kk", "en"]} />

        <button
          className={styles.header__burger}
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label={isMenuOpen ? t("common.closeMenu") : t("common.openMenu")}
          aria-expanded={isMenuOpen}
        >
          <span className={`${styles.burger__line} ${isMenuOpen ? styles["burger__line--open"] : ""}`} />
          <span className={`${styles.burger__line} ${isMenuOpen ? styles["burger__line--open"] : ""}`} />
          <span className={`${styles.burger__line} ${isMenuOpen ? styles["burger__line--open"] : ""}`} />
        </button>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.nav
            className={styles.mobile__menu}
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            aria-label={text.header.mobileNavAria}
          >
            <ul className={styles.mobile__list}>
              {navItems.map((n) => (
                <li key={n.id}>
                  <a
                    href={`#${n.id}`}
                    className={`${styles.mobile__link} ${activeSection === n.id ? styles["mobile__link--active"] : ""}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {getLocalizedValue(n, "label", language)}
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
