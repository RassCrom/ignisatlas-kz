import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FileText, Map, ArrowRight, Layers, BookOpen } from "lucide-react";
import { useI18n } from "src/shared/i18n/I18nProvider";
import Button from "../shared/Button/Button";
import styles from "./Research.module.scss";

const REPORT_URL = "/report";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};

const featureVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

const Research = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px 0px" });
  const { t } = useI18n();

  return (
    <section id="research" className={styles.research} ref={ref}>
      <div className={styles.research__container}>
        <motion.header
          className={styles.research__header}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className={styles.research__eyebrow}>
            <span className={styles.eyebrow__dot} aria-hidden="true" />
            <h4 className={styles.research__subtitle} aria-hidden="true">
              {t("landing.research.eyebrow")}
            </h4>
          </div>
          <h2 className={styles.research__title}>{t("landing.research.title")}</h2>
          <p className={styles.research__lead}>{t("landing.research.lead")}</p>
        </motion.header>

        <motion.div
          className={styles.research__grid}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {/* Primary card — Report */}
          <motion.article className={`${styles.card} ${styles["card--primary"]}`} variants={cardVariants}>
            <div className={styles.card__glow} aria-hidden="true" />

            <div className={styles.card__top}>
              <div className={styles.card__icon}>
                <FileText size={22} strokeWidth={1.75} />
              </div>
              <span className={`${styles.badge} ${styles["badge--available"]}`}>
                <span className={styles.badge__dot} aria-hidden="true" />
                {t("landing.research.available")}
              </span>
            </div>

            <div className={styles.card__body}>
              <h3 className={styles.card__title}>{t("landing.research.reportTitle")}</h3>
              <p className={styles.card__desc}>{t("landing.research.reportDesc")}</p>

              <ul className={styles.card__features} aria-label="Features">
                <motion.li variants={featureVariants}>
                  <Layers size={14} strokeWidth={1.8} />
                  <span>{t("landing.research.feature1")}</span>
                </motion.li>
                <motion.li variants={featureVariants}>
                  <BookOpen size={14} strokeWidth={1.8} />
                  <span>{t("landing.research.feature2")}</span>
                </motion.li>
              </ul>
            </div>

            <div className={styles.card__footer}>
              <Button href="/research" variant="secondary">
                {t("landing.research.library")}
              </Button>
              <Button href={REPORT_URL} target="_blank" rel="noopener noreferrer">
                {t("landing.research.readReport")}
                <ArrowRight size={15} strokeWidth={2} />
              </Button>
            </div>
          </motion.article>

          {/* Secondary card — Storytelling / WIP */}
          <motion.article
            className={`${styles.card} ${styles["card--soon"]}`}
            variants={cardVariants}
          >
            <div className={styles.card__top}>
              <div className={`${styles.card__icon} ${styles["card__icon--muted"]}`}>
                <Map size={22} strokeWidth={1.75} />
              </div>
              <span className={`${styles.badge} ${styles["badge--wip"]}`}>
                {t("landing.research.inProgress")}
              </span>
            </div>

            <div className={styles.card__body}>
              <h3 className={styles.card__title}>{t("landing.research.storyTitle")}</h3>
              <p className={styles.card__desc}>{t("landing.research.storyDesc")}</p>
            </div>

            <div className={styles.card__footer}>
              <Button disabled variant="secondary">
                {t("landing.research.soon")}
              </Button>
            </div>
          </motion.article>
        </motion.div>
      </div>
    </section>
  );
};

export default Research;
