import { useRef, useEffect } from "react";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useI18n } from "src/shared/i18n/I18nProvider";
import styles from "./DataCoverage.module.scss";

const StatCounter = ({ value, suffix, label, inView, locale }) => {
  const count = useMotionValue(0);
  const display = useTransform(count, (v) => Math.floor(v).toLocaleString(locale));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, value, { duration: 2.2, ease: "easeOut" });
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
  const inView = useInView(ref, { once: true, margin: "-80px 0px" });
  const { languageConfig, t } = useI18n();
  const stats = t("landing.data.stats", []);

  return (
    <section id="data" className={styles.data} ref={ref}>
      <div className={styles.data__container}>
        <motion.div
          className={styles.data__inner}
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <header className={styles.data__header}>
            <h4 className={styles.data__subtitle} aria-hidden="true">
              {t("landing.data.eyebrow")}
            </h4>
            <h2 className={styles.data__title}>{t("landing.data.title")}</h2>
            <p className={styles.data__lead}>{t("landing.data.lead")}</p>
          </header>

          <div className={styles.data__stats}>
            {stats.map((s) => (
              <StatCounter key={s.label} {...s} inView={inView} locale={languageConfig.locale} />
            ))}
          </div>

          <div className={styles.data__meta}>
            <motion.div
              className={styles.data__sensors}
              variants={sensorVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
            >
              <motion.span className={styles.sensor} variants={pillVariants}>MODIS</motion.span>
              <motion.span className={styles.sensor} variants={pillVariants}>VIIRS</motion.span>
              <motion.span className={styles.sensor} variants={pillVariants}>Sentinel-2</motion.span>
              <motion.span className={styles.sensor} variants={pillVariants}>Landsat</motion.span>
              <motion.span className={styles.sensor__sep} variants={pillVariants} aria-hidden="true">·</motion.span>
              <motion.span className={styles.coverage} variants={pillVariants}>
                {t("landing.data.coverage")}
              </motion.span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DataCoverage;
