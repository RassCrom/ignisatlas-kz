import styles from "./ReportFooter.module.scss";

const currentYear = new Date().getFullYear();

const navLinks = [
  { label: "Абстракт",    href: "#abstract"  },
  { label: "Регионы",     href: "#regions"   },
  { label: "Динамика",    href: "#temporal"  },
  { label: "Высотность",  href: "#elevation" },
  { label: "Покров",      href: "#landcover" },
  { label: "Выводы",      href: "#conclusions" },
];

export default function ReportFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <a href="/" className={styles.logo} aria-label="TulparMaps — главная">
              <img src="/temp_logo.png" alt="TulparMaps" className={styles.logoImg} />
              <span className={styles.logoText}>TulparMaps</span>
            </a>
            <p className={styles.tagline}>
              Аналитический отчёт · Пожарная активность Казахстана · 2001–2024
            </p>
          </div>

          <nav className={styles.nav} aria-label="Разделы отчёта">
            <ul className={styles.navList}>
              {navLinks.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className={styles.navLink}>{n.label}</a>
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
