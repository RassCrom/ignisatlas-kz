import Button from '../shared/Button/Button';
import styles from './Footer.module.scss';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const navigationLinks = [
    { label: 'Продукты', href: '#products' },
    { label: 'Отрасли', href: '#industries' },
    { label: 'О компании', href: '#about' },
    { label: 'Контакты', href: '#contact' }
  ];

  const socialLinks = [
    {
      href: 'mailto:ionos@ionos.kz',
      icon: '/email.svg',
      label: 'Email: ionos@ionos.kz',
      ariaLabel: 'Написать нам на email'
    },
    {
      href: 'https://www.linkedin.com/company/ionos-k',
      icon: '/linkedin.svg',
      label: 'LinkedIn',
      ariaLabel: 'Наша страница в LinkedIn',
      external: true
    },
    {
      href: 'https://maps.app.goo.gl/vGVRQr67SwyJDGwq5',
      icon: '/location.svg',
      label: 'Местоположение',
      ariaLabel: 'Наше местоположение на карте',
      external: true
    }
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.footer__container}>
        <div className={styles.footer__top}>
          <div className={styles.footer__brand}>
            <a href="/" className={styles.footer__logo} aria-label="Ionosphere Home">
              <img src="/logo_nobg.png" alt="Ionosphere Logo" />
            </a>
            <p className={styles.footer__tagline}>
              Современная система мониторинга пожаров в Казахстане
            </p>
          </div>

          <nav className={styles.footer__nav} aria-label="Footer navigation">
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
              Опробуйте нашу интерактивную карту — Fires KZ
            </h3>
            <p className={styles.cta__description}>
              Отслеживайте пожары в реальном времени с помощью спутниковых данных
            </p>
          </div>
          <Button href="/map" variant="primary">
            Открыть карту
          </Button>
        </div>

        <div className={styles.footer__bottom}>
          <div className={styles.footer__social}>
            {socialLinks.map((social) => (
              <a
                key={social.href}
                href={social.href}
                className={styles.social__link}
                aria-label={social.ariaLabel}
                target={social.external ? '_blank' : undefined}
                rel={social.external ? 'noopener noreferrer' : undefined}
              >
                <img src={social.icon} alt="" aria-hidden="true" />
              </a>
            ))}
          </div>

          <div className={styles.footer__legal}>
            <p className={styles.copyright}>
              © {currentYear} Ionosphere. Все права защищены.
            </p>
            <div className={styles.legal__links}>
              <a href="/privacy" className={styles.legal__link}>
                Политика конфиденциальности
              </a>
              <span className={styles.legal__separator}>•</span>
              <a href="/terms" className={styles.legal__link}>
                Условия использования
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;