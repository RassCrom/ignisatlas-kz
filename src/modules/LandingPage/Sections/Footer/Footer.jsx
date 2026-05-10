import Button from "../shared/Button/Button";
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
              aria-label="IgnisAtlas — на главную"
            >
              <span className={styles.logo__text}>IgnisAtlas</span>
            </a>
            <p className={styles.footer__tagline}>
              Спутниковый мониторинг лесных пожаров в Казахстане
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

        <div className={styles.footer__cta}>
          <div className={styles.cta__content}>
            <h3 className={styles.cta__title}>
              Откройте IgnisAtlas прямо сейчас
            </h3>
            <p className={styles.cta__description}>
              Интерактивная карта, архив с 2001 года, данные MODIS и VIIRS — всё
              бесплатно
            </p>
          </div>
          <Button
            href="/map"
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
          >
            Открыть геопортал
          </Button>
        </div>

        <div className={styles.footer__bottom}>
          <p className={styles.copyright}>
            © {currentYear} IgnisAtlas. Открытый проект.
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
