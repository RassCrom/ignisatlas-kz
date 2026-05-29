import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import Section from "../../components/Section";
import ChartCard from "../../components/ChartCard";
import CustomTooltip from "../../components/CustomTooltip";
import { useIsMobile } from "../../shared/useIsMobile";
import { useReportI18n } from "../../reportI18n";
import { countryData } from "./data";
import styles from "./Comparison.module.scss";

const KZ_COLOR   = "#E84025";
const CURSOR = { stroke: "rgba(255,255,255,0.07)", strokeWidth: 1, fill: "rgba(255,255,255,0.02)" };
const GRID   = { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.05)", horizontal: false };

export default function Comparison() {
  const isMobile = useIsMobile();
  const { text } = useReportI18n();
  const chartData = countryData.map((item, index) => ({
    ...item,
    country: text.comparison.countries[index] ?? item.country,
  }));

  return (
    <Section id="compare" className={styles.wrapper}>
      <h2 className={styles.title}>{text.comparison.title}</h2>
      <p className={styles.subtitle}>{text.comparison.subtitle}</p>

      <ChartCard title={text.comparison.chartTitle}>
        <ResponsiveContainer width="100%" height={isMobile ? 520 : 450}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={isMobile ? { top: 4, right: 8, left: 0, bottom: 4 } : { top: 5, right: 40, left: 10, bottom: 5 }}
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
              tick={{ fill: "rgba(217,218,245,0.5)", fontSize: isMobile ? 10 : 11 }}
            />
            <YAxis
              type="category" dataKey="country"
              tick={{ fill: "rgba(217,218,245,0.6)", fontSize: isMobile ? 10 : 12 }}
              width={isMobile ? 86 : 140}
            />
            <Tooltip content={<CustomTooltip />} cursor={CURSOR} />
            <Bar
              dataKey="density" name={text.common.density}
              radius={[0, 6, 6, 0]} maxBarSize={isMobile ? 18 : 24}
              activeBar={{ strokeWidth: 1.5, stroke: "rgba(255,255,255,0.25)" }}
            >
              {chartData.map((c, i) => (
                <Cell
                  key={i}
                  fill={i === 5 ? "url(#kzGrad)" : "url(#restGrad)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </Section>
  );
}
