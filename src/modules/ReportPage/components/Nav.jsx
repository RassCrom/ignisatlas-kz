import styles from "./Nav.module.scss";
import { navItems } from "./navItems";

export default function Nav({ activeSection }) {
  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>          
        <a href="/" aria-label="Ionosphere Home">
          <img src="/temp_logo.png" alt="Ionosphere Logo" />
        </a>
      </div>
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
