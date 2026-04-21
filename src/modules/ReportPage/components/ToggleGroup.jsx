import styles from "./ToggleGroup.module.scss";

export default function ToggleGroup({ options, active, onChange }) {
  return (
    <div className={styles.group}>
      {options.map((o) => (
        <button
          key={o.value}
          className={`${styles.btn} ${active === o.value ? styles.active : styles.inactive}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
