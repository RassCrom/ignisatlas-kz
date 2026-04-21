import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Section from "../../components/Section";
import ChartCard from "../../components/ChartCard";
import CustomTooltip from "../../components/CustomTooltip";
import { fmt } from "../../shared/utils";
import { elevationData } from "./data";
import styles from "./Elevation.module.scss";

export default function Elevation() {
  return (
    <Section id="elevation" className={styles.wrapper}>
      <h2 className={styles.title}>Высотная зональность</h2>
      <p className={styles.subtitle}>Более 80% термальных аномалий — на высотах 0–500 м н.у.м.</p>

      <ChartCard title="Нормализованная плотность по высотным поясам">
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={elevationData} margin={{ top: 10, right: 30, left: 30, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="zone" tick={{ fill: "rgba(217,218,245,0.6)", fontSize: 12 }} />
            <YAxis tick={{ fill: "rgba(217,218,245,0.5)", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: "rgba(217,218,245,0.6)", fontSize: 12 }} />
            <Bar dataKey="rm" name="MODIS" fill="#f97316" radius={[6, 6, 0, 0]} maxBarSize={50} />
            <Bar dataKey="rv" name="VIIRS" fill="#4787E3" radius={[6, 6, 0, 0]} maxBarSize={50} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className={styles.cards}>
        {elevationData.slice(0, 3).map((e) => (
          <div key={e.zone} className={styles.card}>
            <div className={styles.cardZone}>{e.zone} м</div>
            <div className={styles.cardMeta}>
              MODIS: {fmt(e.modis)} · VIIRS: {fmt(e.viirs)}
            </div>
            <div className={styles.bar}>
              <div className={styles.barFill} style={{ width: `${(e.rm / 0.616) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
