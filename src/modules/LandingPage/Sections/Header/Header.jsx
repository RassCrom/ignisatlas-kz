import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./Header.module.scss";

const LANGS = ["RU", "EN", "KK"];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeLang, setActiveLang] = useState("RU");

  const navigationLinks = [
    { label: "Возможности", href: "#features" },
    { label: "Данные", href: "#data" },
    { label: "Для кого", href: "#audience" },
    { label: "Технологии", href: "#tech" },
  ];

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

  return (
    <header className={styles.header}>
      <div className={styles.header__container}>
        <motion.div
          className={styles.header__logo}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <a href="/" aria-label="Tabiat Küzeti — на главную" className={styles.logo__link}>
            <img src="/temp_logo.png" alt="Tabiat Küzeti" className={styles.logo__icon} />
            <div className={styles.logo__textblock}>
              <span className={styles.logo__runes} aria-hidden="true">𐰔𐰐 𐱅𐰘𐰜𐰓</span>
              <span className={styles.logo__name}>Tabiat Küzeti</span>
            </div>
          </a>
        </motion.div>

        <nav className={styles.header__nav} aria-label="Основная навигация">
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

        <div className={styles.header__lang} role="group" aria-label="Выбор языка">
          {LANGS.map((lang) => (
            <button
              key={lang}
              className={`${styles.lang__btn} ${activeLang === lang ? styles["lang__btn--active"] : ""}`}
              onClick={() => setActiveLang(lang)}
              aria-pressed={activeLang === lang}
            >
              {lang}
            </button>
          ))}
        </div>

        <button
          className={styles.header__burger}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Открыть меню"
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
            aria-label="Мобильное меню"
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
