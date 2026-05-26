import { memo, useEffect, useState } from "react";
import { Menu, CircleHelp, X, Keyboard, Mouse, Layers, Flame, Satellite, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useMenuStore from "src/app/store/store";

import styles from "./Header.module.scss";

const HELP_SECTIONS = [
  {
    icon: Mouse,
    title: "Навигация по карте",
    items: [
      "ЛКМ + перетаскивание — перемещение карты",
      "Колёсико мыши / двойной клик — приближение",
      "ПКМ — контекстное меню (погода, координаты)",
      "Клик по объекту — детальная информация",
    ],
  },
  {
    icon: Keyboard,
    title: "Клавиши",
    items: [
      "+ / − — приближение / отдаление",
      "Стрелки — переключение вкладок панели",
      "Home / End — первая / последняя вкладка",
      "Esc — закрыть панель",
    ],
  },
  {
    icon: Layers,
    title: "Панель слоёв",
    items: [
      "Слои — управление базовыми слоями",
      "Управление слоями — видимость и порядок",
    ],
  },
  {
    icon: Flame,
    title: "Мониторинг природных явлений",
    items: [
      "Горячие точки FIRMS (MODIS / VIIRS)",
      "Пожарный риск, моделирование, горелые площади",
      "Засуха, торфяники, атмосфера",
      "Водные объекты и паводки",
    ],
  },
  {
    icon: Satellite,
    title: "Космические снимки",
    items: [
      "Sentinel-2, Landsat 8/9, MODIS True Color",
      "LST — температура поверхности",
      "Выберите AOI и дату для поиска снимков",
    ],
  },
  {
    icon: Sparkles,
    title: "Пресеты",
    items: [
      "Быстрые сценарии: пожары, риск, инфраструктура",
      "Водный мониторинг, засуха, экология",
      "Чистая карта — сброс всех слоёв",
    ],
  },
];

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.94, y: -12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, scale: 0.96, y: -8, transition: { duration: 0.15 } },
};

const HelpModal = ({ onClose }) => (
  <motion.div
    className={styles.helpOverlay}
    variants={overlayVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    onClick={onClose}
  >
    <motion.div
      className={styles.helpModal}
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label="Справка по геопорталу"
    >
      <div className={styles.helpHeader}>
        <div className={styles.helpTitle}>
          <CircleHelp size={18} />
          Справка
        </div>
        <button className={styles.helpClose} onClick={onClose} aria-label="Закрыть">
          <X size={16} />
        </button>
      </div>

      <div className={styles.helpBody}>
        <p className={styles.helpIntro}>
          <span className={styles.helpRunes} aria-hidden="true">𐰔𐰐 𐱅𐰘𐰜𐰓</span>
          Tabiat Küzeti — спутниковый геопортал мониторинга природных явлений Казахстана.
        </p>

        <div className={styles.helpGrid}>
          {HELP_SECTIONS.map(({ icon: Icon, title, items }) => (
            <div key={title} className={styles.helpSection}>
              <div className={styles.helpSectionTitle}>
                <Icon size={13} />
                {title}
              </div>
              <ul className={styles.helpList}>
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={styles.helpFooter}>
          Данные: NASA FIRMS · ESA Copernicus · Microsoft Planetary Computer
        </div>
      </div>
    </motion.div>
  </motion.div>
);

const Header = memo(() => {
  const { isMenuOpen, toggleMenu } = useMenuStore();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && helpOpen) setHelpOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [helpOpen]);

  return (
    <>
      <header className={styles.header}>
        <div className={styles['header-inner']}>
          <div className={styles['header-left']}>
            <button
              className={styles['header-menu-btn']}
              onClick={toggleMenu}
              data-tooltip={isMenuOpen ? "Collapse" : "Expand"}
              aria-label={isMenuOpen ? "Collapse menu" : "Expand menu"}
            >
              <AnimatePresence mode="wait">
                {isMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <X />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Menu />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            <div className={styles['header-logo']}>
              <a href="/" aria-label="Tabiat Küzeti — на главную">
                <img
                  src="/temp_logo.png"
                  alt="Tabiat Küzeti"
                  loading="lazy"
                />
                <div className={styles['header-logo__textblock']}>
                  <span className={styles['header-logo__runes']} aria-hidden="true">𐰔𐰐 𐱅𐰘𐰜𐰓</span>
                  <span className={styles['header-logo__name']}>Tabiat Küzeti</span>
                </div>
              </a>
            </div>
          </div>

          <div className={styles['header-right']}>
            <div className={styles['header-info']}>
              <button
                className={styles['header-info-btn']}
                id="help-button"
                data-tooltip="Справка"
                aria-label="Открыть справку"
                role="button"
                onClick={() => setHelpOpen(true)}
              >
                <CircleHelp aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
      </AnimatePresence>
    </>
  );
});

Header.displayName = "Header";
export default Header;
