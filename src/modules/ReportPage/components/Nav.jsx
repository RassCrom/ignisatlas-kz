import { useState } from "react";
import styles from "./Nav.module.scss";

const navItems = [
  { id: "hero", label: "Главная" },
  { id: "abstract", label: "Абстракт" },
  { id: "regions", label: "Регионы" },
  { id: "temporal", label: "Динамика" },
  { id: "elevation", label: "Высоты" },
  { id: "landcover", label: "Покров" },
  { id: "infra", label: "Инфраструктура" },
  { id: "compare", label: "Сравнение" },
  { id: "conclusions", label: "Выводы" },
];

export { navItems };

export default function Nav({ activeSection }) {
  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>          
        <a href="/" aria-label="Ionosphere Home">
          <img src="/logo_nobg.png" alt="Ionosphere Logo" />
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
