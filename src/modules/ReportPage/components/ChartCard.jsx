import styles from "./ChartCard.module.scss";

export default function ChartCard({ title, subtitle, children }) {
  return (
    <div className={styles.card}>
      {title && <h3 className={styles.title}>{title}</h3>}
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      {children}
    </div>
  );
}
