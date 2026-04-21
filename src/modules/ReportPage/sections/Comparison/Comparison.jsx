import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import Section from "../../components/Section";
import ChartCard from "../../components/ChartCard";
import CustomTooltip from "../../components/CustomTooltip";
import { countryData } from "./data";
import styles from "./Comparison.module.scss";

export default function Comparison() {
  return (
    <Section id="compare" className={styles.wrapper}>
      <h2 className={styles.title}>Межстрановое сравнение</h2>
      <p className={styles.subtitle}>Казахстан — лидер Центральной Азии, в 4–16 раз превышает показатели соседей</p>

      <ChartCard title="Нормализованная плотность (MODIS, точки / млн км²)">
        <ResponsiveContainer width="100%" height={450}>
          <BarChart data={countryData} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis type="number" tick={{ fill: "rgba(217,218,245,0.5)", fontSize: 11 }} />
            <YAxis type="category" dataKey="country" tick={{ fill: "rgba(217,218,245,0.6)", fontSize: 12 }} width={110} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="density" name="Плотность" radius={[0, 6, 6, 0]} maxBarSize={24}>
              {countryData.map((c, i) => (
                <Cell key={i} fill={c.country === "Казахстан" ? "#ec4899" : "rgba(71,135,227,0.6)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </Section>
  );
}
