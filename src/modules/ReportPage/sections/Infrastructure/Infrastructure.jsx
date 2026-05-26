import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Section from "../../components/Section";
import ChartCard from "../../components/ChartCard";
import CustomTooltip from "../../components/CustomTooltip";
import { infraData } from "./data";
import styles from "./Infrastructure.module.scss";

const MODIS  = "#E84025";
const VIIRS  = "#4787E3";
const CURSOR = { stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 };
const GRID   = { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.05)", vertical: false };

export default function Infrastructure() {
  return (
    <Section id="infra" className={styles.wrapper}>
      <h2 className={styles.title}>Близость к инфраструктуре</h2>
      <p className={styles.subtitle}>MODIS: максимум на 1–10 км; VIIRS: максимум в населённых пунктах</p>

      <ChartCard title="Плотность по дистанционным зонам">
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={infraData} margin={{ top: 10, right: 30, left: 30, bottom: 20 }}>
            <defs>
              <linearGradient id="infModisGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={MODIS} stopOpacity={0.8} />
                <stop offset="100%" stopColor="#FF8C42" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="infViirsGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={VIIRS} stopOpacity={0.8} />
                <stop offset="100%" stopColor="#22D3EE" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="dist" tick={{ fill: "rgba(217,218,245,0.6)", fontSize: 12 }} />
            <YAxis tick={{ fill: "rgba(217,218,245,0.45)", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} cursor={CURSOR} />
            <Legend wrapperStyle={{ color: "rgba(217,218,245,0.6)", fontSize: 12 }} />
            <Line
              type="monotone" dataKey="rm" name="MODIS"
              stroke={MODIS} strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: MODIS, stroke: "rgba(232,64,37,0.3)", strokeWidth: 8 }}
            />
            <Line
              type="monotone" dataKey="rv" name="VIIRS"
              stroke={VIIRS} strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: VIIRS, stroke: "rgba(71,135,227,0.3)", strokeWidth: 8 }}
            />
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
