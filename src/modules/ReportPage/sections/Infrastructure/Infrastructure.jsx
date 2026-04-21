import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Section from "../../components/Section";
import ChartCard from "../../components/ChartCard";
import CustomTooltip from "../../components/CustomTooltip";
import { infraData } from "./data";
import styles from "./Infrastructure.module.scss";

export default function Infrastructure() {
  return (
    <Section id="infra" className={styles.wrapper}>
      <h2 className={styles.title}>Близость к инфраструктуре</h2>
      <p className={styles.subtitle}>MODIS: максимум на 1–10 км; VIIRS: максимум в населённых пунктах</p>

      <ChartCard title="Плотность по дистанционным зонам">
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={infraData} margin={{ top: 10, right: 30, left: 30, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="dist" tick={{ fill: "rgba(217,218,245,0.6)", fontSize: 12 }} />
            <YAxis tick={{ fill: "rgba(217,218,245,0.5)", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: "rgba(217,218,245,0.6)", fontSize: 12 }} />
            <Line type="monotone" dataKey="rm" name="MODIS" stroke="#f97316" strokeWidth={3} dot={{ r: 5, fill: "#f97316" }} />
            <Line type="monotone" dataKey="rv" name="VIIRS" stroke="#4787E3" strokeWidth={3} dot={{ r: 5, fill: "#4787E3" }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className={styles.insight}>
        <strong>Ключевое наблюдение: </strong>
        VIIRS фиксирует rv = 2.497 непосредственно в населённых пунктах (375 м), тогда как MODIS достигает максимума rm = 0.515 на расстоянии 10 км — зоне крупных растительных пожаров.
      </div>
    </Section>
  );
}
