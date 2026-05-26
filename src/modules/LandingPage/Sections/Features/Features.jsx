import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Flame, CloudSun, MountainSnow, Droplets, Satellite, ScanSearch } from 'lucide-react';
import styles from './Features.module.scss';

const features = [
  {
    id: 1,
    Icon: Flame,
    title: 'Мониторинг пожаров',
    description: 'Тепловые аномалии MODIS и VIIRS, хитмап плотности очагов по всей территории Казахстана. Архив наблюдений с 2001 года.',
  },
  {
    id: 2,
    Icon: CloudSun,
    title: 'Мониторинг засух',
    description: 'Индексы NDVI и VHI на основе Sentinel и Landsat. Оценка дефицита влажности почвы и растительного стресса.',
  },
  {
    id: 3,
    Icon: MountainSnow,
    title: 'Мониторинг ледников',
    description: 'Динамика площади ледников Казахстана по снимкам Sentinel-2. Отслеживание ежегодных изменений снежного покрова.',
  },
  {
    id: 4,
    Icon: Droplets,
    title: 'Водные ресурсы',
    description: 'Мониторинг рек, озёр и водохранилищ. Спектральные индексы NDWI и MNDWI для оценки водного покрытия.',
  },
  {
    id: 5,
    Icon: Satellite,
    title: 'Спутниковые снимки',
    description: 'Sentinel-2 и Landsat с переключением спектральных индексов — NDVI, NBR, RGB, NIR. Многолетний архив снимков.',
  },
  {
    id: 6,
    Icon: ScanSearch,
    title: 'Инструменты анализа',
    description: 'Инспектор пикселей, измерение площадей и расстояний, пространственные закладки. Набор инструментов для точного анализа.',
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
          <h2 className={styles.features__title}>Возможности платформы</h2>
          <p className={styles.features__lead}>
            Инструменты для мониторинга пожаров, засух, ледников и водных ресурсов в одном месте.
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
