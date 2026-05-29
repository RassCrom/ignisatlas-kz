import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Section from "../../components/Section";
import ChartCard from "../../components/ChartCard";
import CustomTooltip from "../../components/CustomTooltip";
import { useIsMobile } from "../../shared/useIsMobile";
import { useReportI18n } from "../../reportI18n";
import { infraData } from "./data";
import styles from "./Infrastructure.module.scss";

const MODIS  = "#E84025";
const VIIRS  = "#4787E3";
const CURSOR = { stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 };
const GRID   = { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.05)", vertical: false };

export default function Infrastructure() {
  const isMobile = useIsMobile();
  const { text } = useReportI18n();
  const chartData = infraData.map((item, index) => ({
    ...item,
    dist: text.infrastructure.distances[index] ?? item.dist,
  }));

  return (
    <Section id="infra" className={styles.wrapper}>
      <h2 className={styles.title}>{text.infrastructure.title}</h2>
      <p className={styles.subtitle}>{text.infrastructure.subtitle}</p>

      <ChartCard title={text.infrastructure.chartTitle}>
        <ResponsiveContainer width="100%" height={isMobile ? 320 : 380}>
          <LineChart data={chartData} margin={isMobile ? { top: 8, right: 10, left: 0, bottom: 8 } : { top: 10, right: 30, left: 30, bottom: 20 }}>
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
            <XAxis dataKey="dist" tick={{ fill: "rgba(217,218,245,0.6)", fontSize: isMobile ? 10 : 12 }} interval={0} />
            <YAxis tick={{ fill: "rgba(217,218,245,0.45)", fontSize: isMobile ? 10 : 11 }} width={isMobile ? 30 : undefined} />
            <Tooltip content={<CustomTooltip />} cursor={CURSOR} />
            <Legend wrapperStyle={{ color: "rgba(217,218,245,0.6)", fontSize: isMobile ? 10 : 12 }} />
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
        <strong>{text.infrastructure.insightTitle}</strong>
        {text.infrastructure.insight}
      </div>
    </Section>
  );
}
