import { useI18n } from "src/shared/i18n/I18nProvider";
import styles from "./Footer.module.scss";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useI18n();
  const navigationLinks = t("landing.nav", []);

  return (
    <footer className={styles.footer}>
      <div className={styles.footer__container}>
        <div className={styles.footer__top}>
          <div className={styles.footer__brand}>
            <a href="/" className={styles.footer__logo} aria-label={t("common.homeAria")}>
              <span className={styles.logo__runes} aria-hidden="true">{t("common.brandRunes")}</span>
              <span className={styles.logo__text}>{t("common.brand")}</span>
            </a>
            <p className={styles.footer__tagline}>{t("landing.footer.tagline")}</p>
          </div>

          <nav className={styles.footer__nav} aria-label={t("landing.footer.navAria")}>
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
            © {currentYear} {t("common.brand")}. {t("landing.footer.copyright")}
          </p>
          <div className={styles.legal__links}>
            <span className={styles.legal__note}>{t("landing.footer.dataSources")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
