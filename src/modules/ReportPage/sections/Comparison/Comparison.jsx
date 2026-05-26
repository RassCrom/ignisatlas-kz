import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import Section from "../../components/Section";
import ChartCard from "../../components/ChartCard";
import CustomTooltip from "../../components/CustomTooltip";
import { countryData } from "./data";
import styles from "./Comparison.module.scss";

const KZ_COLOR   = "#E84025";
const CURSOR = { stroke: "rgba(255,255,255,0.07)", strokeWidth: 1, fill: "rgba(255,255,255,0.02)" };
const GRID   = { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.05)", horizontal: false };

export default function Comparison() {
  return (
    <Section id="compare" className={styles.wrapper}>
      <h2 className={styles.title}>Межстрановое сравнение</h2>
      <p className={styles.subtitle}>Казахстан — лидер Центральной Азии, в 4–16 раз превышает показатели соседей</p>

      <ChartCard title="Нормализованная плотность (MODIS, точки / млн км²)">
        <ResponsiveContainer width="100%" height={450}>
          <BarChart
            data={countryData}
            layout="vertical"
            margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
          >
            <defs>
              <linearGradient id="kzGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={KZ_COLOR} stopOpacity={0.7} />
                <stop offset="100%" stopColor={KZ_COLOR} stopOpacity={1} />
              </linearGradient>
              <linearGradient id="restGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#4787E3" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#4787E3" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid {...GRID} />
            <XAxis
              type="number"
              tick={{ fill: "rgba(217,218,245,0.5)", fontSize: 11 }}
            />
            <YAxis
              type="category" dataKey="country"
              tick={{ fill: "rgba(217,218,245,0.6)", fontSize: 12 }}
              width={140}
            />
            <Tooltip content={<CustomTooltip />} cursor={CURSOR} />
            <Bar
              dataKey="density" name="Плотность"
              radius={[0, 6, 6, 0]} maxBarSize={24}
              activeBar={{ strokeWidth: 1.5, stroke: "rgba(255,255,255,0.25)" }}
            >
              {countryData.map((c, i) => (
                <Cell
                  key={i}
                  fill={c.country === "Казахстан" ? "url(#kzGrad)" : "url(#restGrad)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </Section>
  );
}
