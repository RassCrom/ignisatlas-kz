import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Users, FlaskConical, Layers } from "lucide-react";
import { useI18n } from "src/shared/i18n/I18nProvider";
import styles from "./Audience.module.scss";

const audienceIcons = [Users, FlaskConical, Layers];

const AudienceCard = ({ card, index, inView }) => {
  const xFrom = index % 2 === 0 ? -60 : 60;
  const Icon = audienceIcons[index] ?? Users;

  const cardVariants = {
    hidden: { opacity: 0, x: xFrom },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <motion.article
      className={styles.card}
      variants={cardVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
    >
      <div className={styles.card__icon}>
        <Icon size={28} strokeWidth={1.75} />
      </div>
      <div className={styles.card__body}>
        <div className={styles.card__top}>
          <h3 className={styles.card__title}>{card.title}</h3>
          <span className={styles.card__badge}>{card.badge}</span>
        </div>
        <p className={styles.card__desc}>{card.description}</p>
      </div>
    </motion.article>
  );
};

const Audience = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px 0px" });
  const { t } = useI18n();
  const audiences = t("landing.audience.cards", []);

  return (
    <section id="audience" className={styles.audience} ref={ref}>
      <div className={styles.audience__container}>
        <motion.header
          className={styles.audience__header}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h4 className={styles.audience__subtitle} aria-hidden="true">
            {t("landing.audience.eyebrow")}
          </h4>
          <h2 className={styles.audience__title}>{t("landing.audience.title")}</h2>
          <p className={styles.audience__lead}>{t("landing.audience.lead")}</p>
        </motion.header>

        <div className={styles.audience__cards}>
          {audiences.map((card, index) => (
            <AudienceCard key={card.title} card={card} index={index} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Audience;
