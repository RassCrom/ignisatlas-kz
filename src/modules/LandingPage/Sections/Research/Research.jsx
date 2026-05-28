import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FileText, Map } from "lucide-react";
import { useI18n } from "src/shared/i18n/I18nProvider";
import Button from "../shared/Button/Button";
import styles from "./Research.module.scss";

const REPORT_URL = "/report";

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
          <h4 className={styles.research__subtitle} aria-hidden="true">{t("landing.research.eyebrow")}</h4>
          <h2 className={styles.research__title}>{t("landing.research.title")}</h2>
          <p className={styles.research__lead}>{t("landing.research.lead")}</p>
        </motion.header>

        <motion.div
          className={styles.research__grid}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          <motion.article className={styles.card} variants={cardVariants}>
            <div className={styles.card__top}>
              <div className={styles.card__icon}>
                <FileText size={24} strokeWidth={1.75} />
              </div>
              <span className={`${styles.badge} ${styles["badge--available"]}`}>
                {t("landing.research.available")}
              </span>
            </div>
            <h3 className={styles.card__title}>{t("landing.research.reportTitle")}</h3>
            <p className={styles.card__desc}>{t("landing.research.reportDesc")}</p>
            <div className={styles.card__footer}>
              <Button href="/research" variant="secondary">
                {t("landing.research.library")}
              </Button>
              <Button href={REPORT_URL} target="_blank" rel="noopener noreferrer">
                {t("landing.research.readReport")}
              </Button>
            </div>
          </motion.article>

          <motion.article
            className={`${styles.card} ${styles["card--soon"]}`}
            variants={cardVariants}
          >
            <div className={styles.card__top}>
              <div className={styles.card__icon}>
                <Map size={24} strokeWidth={1.75} />
              </div>
              <span className={`${styles.badge} ${styles["badge--wip"]}`}>
                {t("landing.research.inProgress")}
              </span>
            </div>
            <h3 className={styles.card__title}>{t("landing.research.storyTitle")}</h3>
            <p className={styles.card__desc}>{t("landing.research.storyDesc")}</p>
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
