import { useRef, memo } from "react";
import { PencilRuler, Flame, Satellite, Wrench, Layers } from "lucide-react";
import useMenuStore from "src/app/store/store";
import DropDown from "./DropDown/DropDown.jsx";
import styles from "./Sidebar.module.scss";

const TABS = [
  { id: 1, icon: PencilRuler, tooltip: "Слои" },
  { id: 2, icon: Flame,       tooltip: "Мониторинг природных явлений" },
  { id: 3, icon: Satellite,   tooltip: "Космические снимки" },
  { id: 4, icon: Wrench,      tooltip: "Инструменты" },
  { id: 7, icon: Layers,      tooltip: "Управление слоями" },
];

const Sidebar = memo(() => {
  const { isMenuOpen, openTabIndex, toggleMenu, setTabIndex } = useMenuStore();
  const sidebarRef = useRef(null);

  const handleTabClick = (e) => {
    const clickedId = parseInt(e.currentTarget.id.replace("sidebar-tab-", ""), 10);
    if (isMenuOpen && openTabIndex === clickedId) {
      toggleMenu();
    } else {
      if (!isMenuOpen) toggleMenu();
      setTabIndex(clickedId);
    }
  };

  return (
    <aside className={styles.sidebar} ref={sidebarRef}>
      <div className={`${styles.menu} ${isMenuOpen ? styles.open : ""}`}>
        {TABS.map(({ id, icon: Icon, tooltip }) => (
          <div
            key={id}
            id={`sidebar-tab-${id}`}
            className={`${styles.tab} ${openTabIndex === id ? styles.active : ""}`}
            onClick={handleTabClick}
            title={tooltip}
            role="button"
          >
            <div className={styles["tab-inner"]}>
              <div className={styles["tab-icon"]}>
                <Icon />
              </div>
            </div>
          </div>
        ))}
      </div>

      {isMenuOpen && (
        <DropDown openTabIndex={openTabIndex} />
      )}
    </aside>
  );
});

Sidebar.displayName = "Sidebar";

export default Sidebar;
