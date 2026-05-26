import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FileText, Map } from 'lucide-react';
import Button from '../shared/Button/Button';
import styles from './Research.module.scss';

// Placeholder — replace with the live URL when published
const REPORT_URL = '/report';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};

const Research = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px 0px' });

  return (
    <section id="research" className={styles.research} ref={ref}>
      <div className={styles.research__container}>
        <motion.header
          className={styles.research__header}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h4 className={styles.research__subtitle} aria-hidden="true">ИССЛЕДОВАНИЯ</h4>
          <h2 className={styles.research__title}>Исследования</h2>
          <p className={styles.research__lead}>
            Аналитические материалы на основе данных Tabiat Küzeti.
          </p>
        </motion.header>

        <motion.div
          className={styles.research__grid}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {/* Card 1 — Report (available) */}
          <motion.article className={styles.card} variants={cardVariants}>
            <div className={styles.card__top}>
              <div className={styles.card__icon}>
                <FileText size={24} strokeWidth={1.75} />
              </div>
              <span className={`${styles.badge} ${styles['badge--available']}`}>
                Доступен
              </span>
            </div>
            <h3 className={styles.card__title}>Аналитический отчёт</h3>
            <p className={styles.card__desc}>
              Подробный анализ динамики пожаров в Казахстане на основе данных MODIS/VIIRS за 2001–2024 гг.
            </p>
            <div className={styles.card__footer}>
              <Button
                href={REPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Читать отчёт
              </Button>
            </div>
          </motion.article>

          {/* Card 2 — Storyfires (coming soon) */}
          {/* Internal route: ./storyfires — disabled pending implementation */}
          <motion.article
            className={`${styles.card} ${styles['card--soon']}`}
            variants={cardVariants}
          >
            <div className={styles.card__top}>
              <div className={styles.card__icon}>
                <Map size={24} strokeWidth={1.75} />
              </div>
              <span className={`${styles.badge} ${styles['badge--wip']}`}>
                В разработке
              </span>
            </div>
            <h3 className={styles.card__title}>История пожаров Казахстана</h3>
            <p className={styles.card__desc}>
              Интерактивное визуальное повествование о том, как менялась пожарная обстановка в стране за 24 года.
            </p>
            <div className={styles.card__footer}>
              <Button disabled variant="secondary">
                Скоро
              </Button>
            </div>
          </motion.article>
        </motion.div>
      </div>
    </section>
  );
};

export default Research;
