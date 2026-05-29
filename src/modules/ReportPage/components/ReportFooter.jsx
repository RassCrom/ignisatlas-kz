import { useI18n } from "src/shared/i18n/I18nProvider";
import { getLocalizedValue } from "src/shared/i18n/localize";
import { navItems } from "./navItems";
import { useReportI18n } from "../reportI18n";
import styles from "./ReportFooter.module.scss";

const currentYear = new Date().getFullYear();

export default function ReportFooter() {
  const { t } = useI18n();
  const { language, text } = useReportI18n();
  const footerLinks = navItems.filter(({ id }) =>
    ["abstract", "regions", "temporal", "elevation", "landcover", "conclusions"].includes(id)
  );

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <a href="/" className={styles.logo} aria-label={t("common.homeAria")}>
              <img src="/temp_logo.png" alt={t("common.brand")} className={styles.logoImg} />
              <span className={styles.logoText}>{t("common.brand")}</span>
            </a>
            <p className={styles.tagline}>{text.footer.tagline}</p>
          </div>

          <nav className={styles.nav} aria-label={text.footer.navAria}>
            <ul className={styles.navList}>
              {footerLinks.map((n) => (
                <li key={n.id}>
                  <a href={`#${n.id}`} className={styles.navLink}>
                    {getLocalizedValue(n, "label", language)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>© {currentYear} TulparMaps</p>
          <span className={styles.sources}>
            NASA FIRMS · ESA WorldCover 2021 · NASADEM · HDX · OpenStreetMap
          </span>
        </div>
      </div>
    </footer>
  );
}
