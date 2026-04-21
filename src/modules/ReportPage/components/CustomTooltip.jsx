import { fmt } from "../shared/utils";
import styles from "./CustomTooltip.module.scss";

export default function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <div className={styles.label}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} className={styles.row}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span className={styles.value}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}
