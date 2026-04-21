import { useState, useRef, useEffect } from "react";
import { fmt } from "../shared/utils";
import styles from "./StatCard.module.scss";

function AnimatedNumber({ value, duration = 1500 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const animate = (now) => {
            const p = Math.min((now - start) / duration, 1);
            setDisplay(Math.floor((1 - Math.pow(1 - p, 3)) * value));
            if (p < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [value, duration]);

  return <span ref={ref}>{fmt(display)}</span>;
}

export default function StatCard({ value, label, accent = "#ec4899" }) {
  return (
    <div className={styles.card}>
      <div className={styles.value} style={{ color: accent }}>
        {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
      </div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}
