import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Flame, CloudSun, MountainSnow, Droplets, Satellite, ScanSearch } from "lucide-react";
import { useI18n } from "src/shared/i18n/I18nProvider";
import styles from "./Features.module.scss";

const featureIcons = [Flame, CloudSun, MountainSnow, Droplets, Satellite, ScanSearch];

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
  const inView = useInView(ref, { once: true, margin: "-80px 0px" });
  const { t } = useI18n();
  const features = t("landing.features.cards", []);

  return (
    <section id="features" className={styles.features} ref={ref}>
      <div className={styles.features__container}>
        <header className={styles.features__header}>
          <h4 className={styles.features__subtitle} aria-hidden="true">
            {t("landing.features.eyebrow")}
          </h4>
          <h2 className={styles.features__title}>{t("landing.features.title")}</h2>
          <p className={styles.features__lead}>{t("landing.features.lead")}</p>
        </header>

        <motion.div
          className={styles.features__grid}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {features.map(({ title, description }, index) => {
            const Icon = featureIcons[index] ?? ScanSearch;

            return (
              <motion.article
                key={title}
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
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
