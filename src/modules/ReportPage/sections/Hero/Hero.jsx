import Section from "../../components/Section";
import StatCard from "../../components/StatCard";
import styles from "./Hero.module.scss";

const tags = ["MODIS", "VIIRS", "FIRMS", "QGIS", "Python", "ESA WorldCover"];

export default function Hero() {
  return (
    <Section id="hero" className={styles.hero}>
      <h1 className={styles.title}>
        Пространственно-временной анализ пожарной активности в Казахстане
      </h1>
      <p className={styles.subtitle}>
        Комплексное исследование по данным MODIS и VIIRS за 2001–2024 гг. с использованием спутниковых данных NASA FIRMS
      </p>
      <div className={styles.stats}>
        <StatCard value={1122137} label="Точек MODIS (2001–2024)" accent="#f97316" />
        <StatCard value={1461877} label="Точек VIIRS (2012–2024)" accent="#4787E3" />
        <StatCard value="2.72 млн" label="км² территории" accent="#34d399" />
      </div>
      <div className={styles.tags}>
        {tags.map((t) => (
          <span key={t} className={styles.tag}>{t}</span>
        ))}
      </div>
    </Section>
  );
}
