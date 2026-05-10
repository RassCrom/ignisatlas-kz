import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Satellite, Globe, Map, Code2 } from 'lucide-react';
import styles from './TechStack.module.scss';

const techs = [
  { label: 'NASA FIRMS',                    Icon: Satellite },
  { label: 'MODIS',                         Icon: Satellite },
  { label: 'VIIRS',                         Icon: Satellite },
  { label: 'Microsoft Planetary Computer',  Icon: Globe },
  { label: 'Copernicus',                    Icon: Globe },
  { label: 'OpenLayers',                    Icon: Map },
  { label: 'React',                         Icon: Code2 },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } },
};

const pillVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.85 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
  },
};

const TechStack = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px 0px' });

  return (
    <section id="tech" className={styles.tech} ref={ref}>
      <div className={styles.tech__container}>
        <motion.header
          className={styles.tech__header}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h4 className={styles.tech__subtitle} aria-hidden="true">ТЕХНОЛОГИИ</h4>
          <h2 className={styles.tech__title}>Технологии и источники данных</h2>
          <p className={styles.tech__lead}>
            IgnisAtlas строится на открытых данных крупнейших космических агентств и современных веб-технологиях.
          </p>
        </motion.header>

        <motion.div
          className={styles.tech__pills}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {techs.map(({ label, Icon }) => (
            <motion.span
              key={label}
              className={styles.pill}
              variants={pillVariants}
              whileHover={{ scale: 1.06, transition: { duration: 0.15 } }}
            >
              <Icon size={14} strokeWidth={2} className={styles.pill__icon} />
              {label}
            </motion.span>
          ))}
        </motion.div>

        <motion.p
          className={styles.tech__note}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          Проект с открытым исходным кодом. Данные предоставляются по лицензиям NASA и ESA.
        </motion.p>
      </div>
    </section>
  );
};

export default TechStack;
