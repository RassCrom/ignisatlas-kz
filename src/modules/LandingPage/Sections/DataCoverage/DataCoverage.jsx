import { useRef, useEffect } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import styles from './DataCoverage.module.scss';

const stats = [
  { value: 1000000,  suffix: '+', label: 'точек пожаров в архиве' },
  { value: 2001,  suffix: '',  label: 'начало наблюдений' },
  { value: 2024,  suffix: '',  label: 'последнее обновление' },
  { value: 23,    suffix: '',  label: 'года истории данных' },
];

const StatCounter = ({ value, suffix, label, inView }) => {
  const count = useMotionValue(0);
  const display = useTransform(count, (v) =>
    Math.floor(v).toLocaleString('ru-RU')
  );

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, value, { duration: 2.2, ease: 'easeOut' });
    return controls.stop;
  }, [inView, value, count]);

  return (
    <div className={styles.stat}>
      <div className={styles.stat__value}>
        <motion.span>{display}</motion.span>
        {suffix && <span className={styles.stat__suffix}>{suffix}</span>}
      </div>
      <p className={styles.stat__label}>{label}</p>
    </div>
  );
};

const sensorVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
};

const pillVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const DataCoverage = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px 0px' });

  return (
    <section id="data" className={styles.data} ref={ref}>
      <div className={styles.data__container}>
        <motion.div
          className={styles.data__inner}
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <header className={styles.data__header}>
            <h4 className={styles.data__subtitle} aria-hidden="true">ДАННЫЕ</h4>
            <h2 className={styles.data__title}>Данные и покрытие</h2>
            <p className={styles.data__lead}>
              Геопортал работает на данных NASA FIRMS — одной из наиболее полных открытых баз спутниковых наблюдений пожаров в мире.
            </p>
          </header>

          <div className={styles.data__stats}>
            {stats.map((s) => (
              <StatCounter key={s.label} {...s} inView={inView} />
            ))}
          </div>

          <div className={styles.data__meta}>
            <motion.div
              className={styles.data__sensors}
              variants={sensorVariants}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
            >
              <motion.span className={styles.sensor} variants={pillVariants}>MODIS</motion.span>
              <motion.span className={styles.sensor} variants={pillVariants}>VIIRS</motion.span>
              <motion.span className={styles.sensor__sep} variants={pillVariants} aria-hidden="true">·</motion.span>
              <motion.span className={styles.coverage} variants={pillVariants}>
                Вся территория Казахстана
              </motion.span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DataCoverage;
