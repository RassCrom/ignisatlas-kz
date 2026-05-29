import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LanguageSwitcher from "src/shared/components/LanguageSwitcher/LanguageSwitcher";
import { useI18n } from "src/shared/i18n/I18nProvider";
import styles from "./Header.module.scss";

const navVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const mobileMenuVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: "auto", transition: { duration: 0.3 } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.2 } },
};

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useI18n();
  const navigationLinks = t("landing.nav", []);

  return (
    <header className={styles.header}>
      <div className={styles.header__container}>
        <motion.div
          className={styles.header__logo}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <a href="/" aria-label={t("common.homeAria")} className={styles.logo__link}>
            <img src="/hero-tabiat-v2.png" alt={t("common.brand")} className={styles.logo__icon} />
            <div className={styles.logo__textblock}>
              <span className={styles.logo__runes} aria-hidden="true">
                {t("common.brandRunes")}
              </span>
              <span className={styles.logo__name}>{t("common.brand")}</span>
            </div>
          </a>
        </motion.div>

        <nav className={styles.header__nav} aria-label={t("landing.navAria")}>
          <motion.ul
            className={styles.nav__list}
            variants={navVariants}
            initial="hidden"
            animate="visible"
          >
            {navigationLinks.map((link) => (
              <motion.li key={link.href} variants={itemVariants}>
                <a className={styles.nav__link} href={link.href}>
                  {link.label}
                </a>
              </motion.li>
            ))}
          </motion.ul>
        </nav>

        <LanguageSwitcher className={styles.header__lang} />

        <button
          className={styles.header__burger}
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label={isMenuOpen ? t("common.closeMenu") : t("common.openMenu")}
          aria-expanded={isMenuOpen}
        >
          <span
            className={`${styles.burger__line} ${isMenuOpen ? styles["burger__line--open"] : ""}`}
          />
          <span
            className={`${styles.burger__line} ${isMenuOpen ? styles["burger__line--open"] : ""}`}
          />
          <span
            className={`${styles.burger__line} ${isMenuOpen ? styles["burger__line--open"] : ""}`}
          />
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
            aria-label={t("landing.mobileNavAria")}
          >
            <ul className={styles.mobile__list}>
              {navigationLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className={styles.mobile__link}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
