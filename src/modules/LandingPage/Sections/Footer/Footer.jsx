import styles from "./Footer.module.scss";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const navigationLinks = [
    { label: "Возможности", href: "#features" },
    { label: "Данные", href: "#data" },
    { label: "Для кого", href: "#audience" },
    { label: "Технологии", href: "#tech" },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.footer__container}>
        <div className={styles.footer__top}>
          <div className={styles.footer__brand}>
            <a
              href="/"
              className={styles.footer__logo}
              aria-label="Tabiat Küzeti — на главную"
            >
              <span className={styles.logo__runes} aria-hidden="true">𐰔𐰐 𐱅𐰘𐰜𐰓</span>
              <span className={styles.logo__text}>Tabiat Küzeti</span>
            </a>
            <p className={styles.footer__tagline}>
              Спутниковый мониторинг окружающей среды в Казахстане
            </p>
          </div>

          <nav
            className={styles.footer__nav}
            aria-label="Навигация по разделам"
          >
            <ul className={styles.nav__list}>
              {navigationLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className={styles.nav__link}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className={styles.footer__bottom}>
          <p className={styles.copyright}>
            © {currentYear} Tabiat Küzeti. Открытый проект.
          </p>
          <div className={styles.legal__links}>
            <span className={styles.legal__note}>
              Данные: NASA FIRMS · ESA Copernicus · Microsoft Planetary Computer
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
