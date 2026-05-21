import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Button from "../shared/Button/Button";
import styles from "./Hero.module.scss";

const TAGLINE = "Спутниковый мониторинг лесных пожаров в Казахстане";

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

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  delay: (i * 0.37).toFixed(2),
  left: `${6 + ((i * 6.5) % 88)}%`,
  size: 3 + (i % 3),
  duration: 3.5 + (i % 3) * 1.2,
}));

const Hero = () => {
  const heroRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);

  const words = TAGLINE.split(" ");

  return (
    <section className={styles.hero} ref={heroRef}>
      <motion.div
        className={styles.hero__bg}
        style={shouldReduceMotion ? undefined : { y: bgY }}
        aria-hidden="true"
      />
      <div className={styles.hero__overlay} aria-hidden="true" />

      {!shouldReduceMotion && (
        <div className={styles.particles} aria-hidden="true">
          {PARTICLES.map((p) => (
            <span
              key={p.id}
              className={styles.particle}
              style={{
                "--delay": `${p.delay}s`,
                "--duration": `${p.duration}s`,
                left: p.left,
                width: `${p.size}px`,
                height: `${p.size}px`,
                bottom: `${10 + ((p.id * 5) % 30)}%`,
              }}
            />
          ))}
        </div>
      )}

      <div className={styles.hero__container}>
        <div className={styles.hero__content}>
          <motion.div
            initial={{ opacity: 0, scale: 0.85, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className={styles.hero__title}>
              <span className={styles.hero__brand}>IgnisAtlas</span>
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
            Открытые данные NASA FIRMS · MODIS · VIIRS · 2001–2024
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
              href="#features"
              variant="secondary"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Возможности
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
