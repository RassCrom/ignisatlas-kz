import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Header.module.scss';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationLinks = [
    { label: 'Продукты', href: '#products' },
    { label: 'Отрасли', href: '#industries' },
    { label: 'О компании', href: '#about' },
    { label: 'Контакты', href: '#contact' }
  ];

  const navVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { 
      opacity: 1, 
      height: 'auto',
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0, 
      height: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.header__container}>
        <motion.div 
          className={styles.header__logo}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <a href="/" aria-label="Ionosphere Home">
            <img src="/logo_nobg.png" alt="Ionosphere Logo" />
          </a>
        </motion.div>

        <nav className={styles.header__nav} aria-label="Main navigation">
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

        <button
          className={styles.header__burger}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          <span className={`${styles.burger__line} ${isMenuOpen ? styles['burger__line--open'] : ''}`} />
          <span className={`${styles.burger__line} ${isMenuOpen ? styles['burger__line--open'] : ''}`} />
          <span className={`${styles.burger__line} ${isMenuOpen ? styles['burger__line--open'] : ''}`} />
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