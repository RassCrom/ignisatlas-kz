import Section from "../../components/Section";
import StatCard from "../../components/StatCard";
import { useReportI18n } from "../../reportI18n";
import styles from "./Hero.module.scss";

const tags = ["MODIS", "VIIRS", "FIRMS", "QGIS", "Python", "ESA WorldCover"];

export default function Hero() {
  const { text } = useReportI18n();

  return (
    <Section id="hero" className={styles.hero}>
      <h1 className={styles.title}>{text.hero.title}</h1>
      <p className={styles.subtitle}>{text.hero.subtitle}</p>
      <div className={styles.stats}>
        <StatCard value={1122137} label={text.hero.stats.modis} accent="#E84025" />
        <StatCard value={1461877} label={text.hero.stats.viirs} accent="#4787E3" />
        <StatCard value={text.hero.stats.territoryValue} label={text.hero.stats.territory} accent="#34d399" />
      </div>
      <div className={styles.tags}>
        {tags.map((t) => (
          <span key={t} className={styles.tag}>{t}</span>
        ))}
      </div>
    </Section>
  );
}
