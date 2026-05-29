import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Section from "../../components/Section";
import ChartCard from "../../components/ChartCard";
import CustomTooltip from "../../components/CustomTooltip";
import { fmt } from "../../shared/utils";
import { useIsMobile } from "../../shared/useIsMobile";
import { useReportI18n } from "../../reportI18n";
import { elevationData } from "./data";
import styles from "./Elevation.module.scss";

const MODIS  = "#E84025";
const VIIRS  = "#4787E3";
const CURSOR = { stroke: "rgba(255,255,255,0.07)", strokeWidth: 1, fill: "rgba(255,255,255,0.02)" };
const GRID   = { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.05)", vertical: false };

export default function Elevation() {
  const isMobile = useIsMobile();
  const { text } = useReportI18n();

  return (
    <Section id="elevation" className={styles.wrapper}>
      <h2 className={styles.title}>{text.elevation.title}</h2>
      <p className={styles.subtitle}>{text.elevation.subtitle}</p>

      <ChartCard title={text.elevation.chartTitle}>
        <ResponsiveContainer width="100%" height={isMobile ? 320 : 380}>
          <BarChart data={elevationData} margin={isMobile ? { top: 8, right: 6, left: 0, bottom: 8 } : { top: 10, right: 30, left: 30, bottom: 20 }}>
            <defs>
              <linearGradient id="elModisGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={MODIS} stopOpacity={0.95} />
                <stop offset="100%" stopColor={MODIS} stopOpacity={0.5} />
              </linearGradient>
              <linearGradient id="elViirsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={VIIRS} stopOpacity={0.95} />
                <stop offset="100%" stopColor={VIIRS} stopOpacity={0.5} />
              </linearGradient>
            </defs>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="zone" tick={{ fill: "rgba(217,218,245,0.6)", fontSize: isMobile ? 10 : 12 }} interval={0} />
            <YAxis tick={{ fill: "rgba(217,218,245,0.45)", fontSize: isMobile ? 10 : 11 }} width={isMobile ? 30 : undefined} />
            <Tooltip content={<CustomTooltip />} cursor={CURSOR} />
            <Legend wrapperStyle={{ color: "rgba(217,218,245,0.6)", fontSize: isMobile ? 10 : 12 }} />
            <Bar
              dataKey="rm" name="MODIS" fill="url(#elModisGrad)"
              radius={[6, 6, 0, 0]} maxBarSize={48}
              activeBar={{ fill: "#FF6A4A", stroke: "rgba(232,64,37,0.5)", strokeWidth: 1.5 }}
            />
            <Bar
              dataKey="rv" name="VIIRS" fill="url(#elViirsGrad)"
              radius={[6, 6, 0, 0]} maxBarSize={48}
              activeBar={{ fill: "#6BA3F5", stroke: "rgba(71,135,227,0.5)", strokeWidth: 1.5 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className={styles.cards}>
        {elevationData.slice(0, 3).map((e) => (
          <div key={e.zone} className={styles.card}>
            <div className={styles.cardZone}>{e.zone} {text.elevation.meters}</div>
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
