import { useRef, useState, useEffect } from "react";
import styles from "./Section.module.scss";

export default function Section({ id, children, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id={id}
      className={`${styles.section} ${visible ? styles.visible : ""} ${className}`}
    >
      {children}
    </section>
  );
}
