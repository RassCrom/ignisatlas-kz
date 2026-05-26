import { memo, useRef } from "react";
import { Flame, History, Layers, PencilRuler, Satellite, Sparkles, Wrench } from "lucide-react";
import useMenuStore from "src/app/store/store";
import DropDown from "./DropDown/DropDown.jsx";
import styles from "./Sidebar.module.scss";

const TABS = [
  { id: 2, icon: Flame,       tooltip: "Мониторинг природных явлений" },
  { id: 3, icon: Satellite,   tooltip: "Космические снимки" },
  { id: 9, icon: History,     tooltip: "Исторические пожары" },
  { id: 1, icon: PencilRuler, tooltip: "Слои" },
  { id: 7, icon: Layers,      tooltip: "Управление слоями" },
  { id: 4, icon: Wrench,      tooltip: "Инструменты" },
  { id: 8, icon: Sparkles,    tooltip: "Пресеты" },
];

const Sidebar = memo(() => {
  const { isMenuOpen, openTabIndex, toggleMenu, setTabIndex } = useMenuStore();
  const sidebarRef = useRef(null);
  const tabRefs = useRef([]);

  const activateTab = (clickedId) => {
    if (isMenuOpen && openTabIndex === clickedId) {
      toggleMenu();
    } else {
      if (!isMenuOpen) toggleMenu();
      setTabIndex(clickedId);
    }
  };

  const handleTabClick = (e) => {
    const clickedId = parseInt(e.currentTarget.dataset.tabId, 10);
    activateTab(clickedId);
  };

  const handleTabKeyDown = (e, index) => {
    const horizontalNext = e.key === "ArrowRight";
    const horizontalPrev = e.key === "ArrowLeft";
    const verticalNext = e.key === "ArrowDown";
    const verticalPrev = e.key === "ArrowUp";

    if (!horizontalNext && !horizontalPrev && !verticalNext && !verticalPrev && e.key !== "Home" && e.key !== "End") {
      return;
    }

    e.preventDefault();

    let nextIndex = index;
    if (horizontalNext || verticalNext) nextIndex = (index + 1) % TABS.length;
    if (horizontalPrev || verticalPrev) nextIndex = (index - 1 + TABS.length) % TABS.length;
    if (e.key === "Home") nextIndex = 0;
    if (e.key === "End") nextIndex = TABS.length - 1;

    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <aside className={styles.sidebar} ref={sidebarRef} aria-label="Map controls">
      <div
        className={`${styles.menu} ${isMenuOpen ? styles.open : ""}`}
        role="toolbar"
        aria-label="Map sidebar tabs"
        aria-orientation="vertical"
      >
        {TABS.map(({ id, icon: Icon, tooltip }, index) => {
          const isActive = openTabIndex === id;
          const isExpanded = isMenuOpen && isActive;

          return (
            <button
              key={id}
              id={`sidebar-tab-${id}`}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              data-tab-id={id}
              className={`${styles.tab} ${isActive ? styles.active : ""}`}
              onClick={handleTabClick}
              onKeyDown={(e) => handleTabKeyDown(e, index)}
              title={tooltip}
              aria-label={tooltip}
              aria-controls="sidebar-panel"
              aria-expanded={isExpanded}
              aria-pressed={isExpanded}
            >
              <div className={styles["tab-inner"]}>
                <div className={styles["tab-icon"]}>
                  <Icon aria-hidden="true" focusable="false" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {isMenuOpen && (
        <div id="sidebar-panel" role="region" aria-labelledby={`sidebar-tab-${openTabIndex}`}>
          <DropDown openTabIndex={openTabIndex} />
        </div>
      )}
    </aside>
  );
});

Sidebar.displayName = "Sidebar";

export default Sidebar;
