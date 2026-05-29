import Section from "../../components/Section";
import { useReportI18n } from "../../reportI18n";
import styles from "./Abstract.module.scss";

export default function Abstract() {
  const { text } = useReportI18n();

  return (
    <Section id="abstract" className={styles.abstract}>
      <h2 className={styles.title}>{text.abstract.title}</h2>
      <div className={styles.grid}>
        <p>{text.abstract.p1}</p>
        <p>{text.abstract.p2}</p>
      </div>
    </Section>
  );
}
