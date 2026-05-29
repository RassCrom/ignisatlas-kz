import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Section from "../../components/Section";
import ChartCard from "../../components/ChartCard";
import ToggleGroup from "../../components/ToggleGroup";
import CustomTooltip from "../../components/CustomTooltip";
import { useIsMobile } from "../../shared/useIsMobile";
import { useReportI18n } from "../../reportI18n";
import { landCoverData } from "./data";
import styles from "./LandCover.module.scss";

const MODIS  = "#E84025";
const VIIRS  = "#4787E3";
const CURSOR = { stroke: "rgba(255,255,255,0.07)", strokeWidth: 1, fill: "rgba(255,255,255,0.02)" };
const GRID   = { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.05)", vertical: false };

export default function LandCover() {
  const [sensor, setSensor] = useState("both");
  const isMobile = useIsMobile();
  const { text } = useReportI18n();
  const chartData = landCoverData.map((item, index) => ({
    ...item,
    type: text.landCover.types[index] ?? item.type,
  }));

  return (
    <Section id="landcover" className={styles.wrapper}>
      <h2 className={styles.title}>{text.landCover.title}</h2>
      <p className={styles.subtitle}>{text.landCover.subtitle}</p>

      <ToggleGroup
        options={[
          { value: "both", label: text.common.bothSensors },
          { value: "modis", label: text.common.modis },
          { value: "viirs", label: text.common.viirs },
        ]}
        active={sensor}
        onChange={setSensor}
      />

      <ChartCard
        title={text.landCover.chartTitle}
        subtitle={text.landCover.chartSubtitle}
      >
        <ResponsiveContainer width="100%" height={isMobile ? 430 : 420}>
          <BarChart
            data={chartData}
            layout={isMobile ? "vertical" : "horizontal"}
            margin={isMobile ? { top: 8, right: 8, left: 8, bottom: 8 } : { top: 10, right: 10, left: 10, bottom: 80 }}
          >
            <defs>
              <linearGradient id="lcModisGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={MODIS} stopOpacity={0.95} />
                <stop offset="100%" stopColor={MODIS} stopOpacity={0.5} />
              </linearGradient>
              <linearGradient id="lcViirsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={VIIRS} stopOpacity={0.95} />
                <stop offset="100%" stopColor={VIIRS} stopOpacity={0.5} />
              </linearGradient>
            </defs>
            <CartesianGrid {...GRID} />
            {isMobile ? (
              <>
                <XAxis type="number" tick={{ fill: "rgba(217,218,245,0.45)", fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="type"
                  width={96}
                  interval={0}
                  tick={{ fill: "rgba(217,218,245,0.62)", fontSize: 10 }}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey="type"
                  tick={{ fill: "rgba(217,218,245,0.5)", fontSize: 11 }}
                  angle={-40} textAnchor="end" interval={0}
                />
                <YAxis tick={{ fill: "rgba(217,218,245,0.45)", fontSize: 11 }} />
              </>
            )}
            <Tooltip content={<CustomTooltip />} cursor={CURSOR} />
            <Legend wrapperStyle={{ color: "rgba(217,218,245,0.6)", fontSize: isMobile ? 10 : 12 }} />
            {(sensor === "both" || sensor === "modis") && (
              <Bar
                dataKey="rm" name="MODIS" fill="url(#lcModisGrad)"
                radius={isMobile ? [0, 5, 5, 0] : [5, 5, 0, 0]} maxBarSize={isMobile ? 14 : 34}
                activeBar={{ fill: "#FF6A4A", stroke: "rgba(232,64,37,0.5)", strokeWidth: 1.5 }}
              />
            )}
            {(sensor === "both" || sensor === "viirs") && (
              <Bar
                dataKey="rv" name="VIIRS" fill="url(#lcViirsGrad)"
                radius={isMobile ? [0, 5, 5, 0] : [5, 5, 0, 0]} maxBarSize={isMobile ? 14 : 34}
                activeBar={{ fill: "#6BA3F5", stroke: "rgba(71,135,227,0.5)", strokeWidth: 1.5 }}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </Section>
  );
}
