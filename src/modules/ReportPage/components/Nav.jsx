import styles from "./Nav.module.scss";
import { navItems } from "./navItems";

export default function Nav({ activeSection }) {
  return (
    <nav className={styles.nav}>
      <a href="/" aria-label="Tabiat Küzeti — главная" className={styles.logo}>
        <img src="/temp_logo.png" alt="Tabiat Küzeti" className={styles.logo__icon} />
        <div className={styles.logo__text}>
          <span className={styles.logo__runes} aria-hidden="true">𐰔𐰐 𐱅𐰘𐰜𐰓</span>
          <span className={styles.logo__name}>Tabiat Küzeti</span>
        </div>
      </a>
      <div className={styles.links}>
        {navItems.map((n) => (
          <a
            key={n.id}
            href={`#${n.id}`}
            className={`${styles.link} ${activeSection === n.id ? styles.active : ""}`}
          >
            {n.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
