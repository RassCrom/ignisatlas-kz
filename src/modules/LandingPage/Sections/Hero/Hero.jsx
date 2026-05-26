import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Button from "../shared/Button/Button";
import styles from "./Hero.module.scss";

const TAGLINE = "Спутниковый мониторинг окружающей среды в Казахстане";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.6 },
  },
};

const wordVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

const subtitleVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", delay: 0.2 },
  },
};

const actionsVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut", delay: 0.4 },
  },
};

const Hero = () => {
  const heroRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);

  const rawWords = TAGLINE.split(" ");
  // Keep "в Казахстане" together to prevent orphaned wrap
  const words = rawWords.reduce((acc, w, i) => {
    if (w === "Казахстане" && rawWords[i - 1] === "в") {
      acc[acc.length - 1] = acc[acc.length - 1] + " " + w;
    } else {
      acc.push(w);
    }
    return acc;
  }, []);

  return (
    <section className={styles.hero} ref={heroRef}>
      <motion.div
        className={styles.hero__bg}
        style={shouldReduceMotion ? undefined : { y: bgY }}
        aria-hidden="true"
      >
        <img
          src="/hero.webp"
          srcSet="/hero-800.webp 800w, /hero.webp 1600w"
          sizes="100vw"
          fetchPriority="high"
          decoding="async"
          alt=""
          className={styles.hero__bgImg}
        />
      </motion.div>
      <div className={styles.hero__overlay} aria-hidden="true" />

      <div className={styles.hero__container}>
        <div className={styles.hero__content}>
          <motion.div
            initial={{ opacity: 0, scale: 0.85, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className={styles.hero__title}>
              <span className={styles.hero__runes} aria-hidden="true">𐰔𐰐 𐱅𐰘𐰜𐰓</span>
              <span className={styles.hero__brand}>Tabiat Küzeti</span>
            </h1>
          </motion.div>

          <motion.p
            className={styles.hero__tagline}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {words.map((word, i) => (
              <motion.span
                key={i}
                className={styles.hero__word}
                variants={wordVariants}
              >
                {word}
              </motion.span>
            ))}
          </motion.p>

          <motion.p
            className={styles.hero__subtitle}
            variants={subtitleVariants}
            initial="hidden"
            animate="visible"
          >
            NASA · ESA Copernicus · Sentinel · Landsat · 2001–2024
          </motion.p>

          <motion.div
            className={styles.hero__actions}
            variants={actionsVariants}
            initial="hidden"
            animate="visible"
          >
            <Button
              href="/map"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Открыть геопортал
            </Button>

            <Button
              href="/report"
              variant="secondary"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Аналитика
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
