import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Flame, ShieldAlert, Satellite, Bookmark, Ruler, Pipette } from 'lucide-react';
import styles from './Features.module.scss';

const features = [
  {
    id: 1,
    Icon: Flame,
    title: 'Хитмап пожаров',
    description: 'Тепловая карта плотности очагов возгораний по всему Казахстану. Визуализируйте концентрацию пожаров по регионам и сезонам.',
  },
  {
    id: 2,
    Icon: ShieldAlert,
    title: 'Анализ риска',
    description: 'Оценка пожарной опасности на основе спутниковых снимков, исторических данных и метеорологических факторов.',
  },
  {
    id: 3,
    Icon: Satellite,
    title: 'Спутниковые снимки',
    description: 'Многоспектральные снимки Sentinel и Landsat с возможностью переключения между несколькими индексами — NDVI, NBR, свежие снимки.',
  },
  {
    id: 4,
    Icon: Bookmark,
    title: 'Пространственные закладки',
    description: 'Сохраняйте и мгновенно возвращайтесь к нужным участкам карты. Личная библиотека координат прямо в браузере.',
  },
  {
    id: 5,
    Icon: Ruler,
    title: 'Инструмент измерений',
    description: 'Измеряйте расстояния и площади непосредственно на карте. Полезно при оценке масштабов пожара или зоны риска.',
  },
  {
    id: 6,
    Icon: Pipette,
    title: 'Инспектор пикселей',
    description: 'Получайте спектральные значения для любого пикселя на снимке. Инструмент для специалистов дистанционного зондирования.',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

const Features = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px 0px' });

  return (
    <section id="features" className={styles.features} ref={ref}>
      <div className={styles.features__container}>
        <header className={styles.features__header}>
          <h4 className={styles.features__subtitle} aria-hidden="true">ВОЗМОЖНОСТИ</h4>
          <h2 className={styles.features__title}>Возможности геопортала</h2>
          <p className={styles.features__lead}>
            Все инструменты для мониторинга, анализа и исследования пожаров в одном месте.
          </p>
        </header>

        <motion.div
          className={styles.features__grid}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {features.map(({ id, Icon, title, description }) => (
            <motion.article
              key={id}
              className={styles.card}
              variants={cardVariants}
              whileHover={{ scale: 1.04, transition: { duration: 0.2 } }}
            >
              <div className={styles.card__icon}>
                <Icon size={26} strokeWidth={1.75} />
              </div>
              <h3 className={styles.card__title}>{title}</h3>
              <p className={styles.card__desc}>{description}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
