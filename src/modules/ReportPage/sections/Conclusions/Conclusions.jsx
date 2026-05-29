import Section from "../../components/Section";
import { useReportI18n } from "../../reportI18n";
import styles from "./Conclusions.module.scss";

export default function Conclusions() {
  const { text } = useReportI18n();

  return (
    <Section id="conclusions" className={styles.wrapper}>
      <h2 className={styles.title}>{text.conclusions.title}</h2>

      {text.conclusions.items.map(([title, itemText], i) => (
        <div key={i} className={styles.card}>
          <div className={styles.num}>{String(i + 1).padStart(2, "0")}</div>
          <div>
            <div className={styles.cardTitle}>{title}</div>
            <div className={styles.cardText}>{itemText}</div>
          </div>
        </div>
      ))}

      <div className={styles.footer}>
        <p className={styles.sources}>{text.conclusions.sources}</p>
        <p className={styles.period}>{text.conclusions.period}</p>
      </div>
    </Section>
  );
}
