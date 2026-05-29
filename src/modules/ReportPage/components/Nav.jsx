import styles from "./Nav.module.scss";
import { navItems } from "./navItems";
import LanguageSwitcher from "src/shared/components/LanguageSwitcher/LanguageSwitcher";
import { useI18n } from "src/shared/i18n/I18nProvider";
import { getLocalizedValue } from "src/shared/i18n/localize";

export default function Nav({ activeSection }) {
  const { language, t } = useI18n();

  return (
    <nav className={styles.nav}>
      <a href="/" aria-label={t("common.homeAria")} className={styles.logo}>
        <img src="/temp_logo.png" alt={t("common.brand")} className={styles.logo__icon} />
        <div className={styles.logo__text}>
          <span className={styles.logo__runes} aria-hidden="true">{t("common.brandRunes")}</span>
          <span className={styles.logo__name}>{t("common.brand")}</span>
        </div>
      </a>

      <div className={styles.navRight}>
        <div className={styles.links}>
          {navItems.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className={`${styles.link} ${activeSection === n.id ? styles.active : ""}`}
            >
              {getLocalizedValue(n, "label", language)}
            </a>
          ))}
        </div>
        <LanguageSwitcher compact />
      </div>
    </nav>
  );
}
