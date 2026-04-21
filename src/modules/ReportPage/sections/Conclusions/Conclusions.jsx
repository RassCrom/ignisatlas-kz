import Section from "../../components/Section";
import styles from "./Conclusions.module.scss";

const conclusions = [
  { num: "01", title: "Степные регионы — зоны риска", text: "СКО, Костанайская и Акмолинская области стабильно лидируют по показателям обоих спутниковых сенсоров." },
  { num: "02", title: "Двухфазная сезонность", text: "Весенний пик (апрель) — сельскохозяйственный пал, летний — климатические факторы." },
  { num: "03", title: "Концентрация на низких высотах", text: "Более 80% аномалий — на высотах 0–500 м, зоны интенсивного хозяйственного использования." },
  { num: "04", title: "Различия MODIS и VIIRS", text: "VIIRS фиксирует компактные промышленные источники тепла, MODIS — крупные растительные пожары." },
  { num: "05", title: "Лидер Центральной Азии", text: "Плотность пожаров в Казахстане в 4–16 раз превышает показатели соседних государств." },
];

export default function Conclusions() {
  return (
    <Section id="conclusions" className={styles.wrapper}>
      <h2 className={styles.title}>Выводы</h2>

      {conclusions.map((c, i) => (
        <div key={i} className={styles.card}>
          <div className={styles.num}>{c.num}</div>
          <div>
            <div className={styles.cardTitle}>{c.title}</div>
            <div className={styles.cardText}>{c.text}</div>
          </div>
        </div>
      ))}

      <div className={styles.footer}>
        <p className={styles.sources}>
          Источник данных: NASA FIRMS · ESA WorldCover 2021 · OpenStreetMap · NASADEM · HDX
        </p>
        <p className={styles.period}>
          Период исследования: 2001–2024 · MODIS (MCD14ML) · VIIRS (VNP14IMGTDL/VJ114IMGTDL)
        </p>
      </div>
    </Section>
  );
}
