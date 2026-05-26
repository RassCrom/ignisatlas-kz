import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Section from "../../components/Section";
import ChartCard from "../../components/ChartCard";
import ToggleGroup from "../../components/ToggleGroup";
import CustomTooltip from "../../components/CustomTooltip";
import { landCoverData } from "./data";
import styles from "./LandCover.module.scss";

const MODIS  = "#E84025";
const VIIRS  = "#4787E3";
const CURSOR = { stroke: "rgba(255,255,255,0.07)", strokeWidth: 1, fill: "rgba(255,255,255,0.02)" };
const GRID   = { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.05)", vertical: false };

export default function LandCover() {
  const [sensor, setSensor] = useState("both");

  return (
    <Section id="landcover" className={styles.wrapper}>
      <h2 className={styles.title}>Земельный покров</h2>
      <p className={styles.subtitle}>Распределение по классам ESA WorldCover 2021</p>

      <ToggleGroup
        options={[
          { value: "both",  label: "Оба сенсора" },
          { value: "modis", label: "MODIS" },
          { value: "viirs", label: "VIIRS" },
        ]}
        active={sensor}
        onChange={setSensor}
      />

      <ChartCard
        title="Нормализованная плотность по типам покрова"
        subtitle="VIIRS: аномально высокая плотность для застроенных территорий (4.444)"
      >
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={landCoverData} margin={{ top: 10, right: 10, left: 10, bottom: 80 }}>
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
            <XAxis
              dataKey="type"
              tick={{ fill: "rgba(217,218,245,0.5)", fontSize: 11 }}
              angle={-40} textAnchor="end" interval={0}
            />
            <YAxis tick={{ fill: "rgba(217,218,245,0.45)", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} cursor={CURSOR} />
            <Legend wrapperStyle={{ color: "rgba(217,218,245,0.6)", fontSize: 12 }} />
            {(sensor === "both" || sensor === "modis") && (
              <Bar
                dataKey="rm" name="MODIS" fill="url(#lcModisGrad)"
                radius={[5, 5, 0, 0]} maxBarSize={34}
                activeBar={{ fill: "#FF6A4A", stroke: "rgba(232,64,37,0.5)", strokeWidth: 1.5 }}
              />
            )}
            {(sensor === "both" || sensor === "viirs") && (
              <Bar
                dataKey="rv" name="VIIRS" fill="url(#lcViirsGrad)"
                radius={[5, 5, 0, 0]} maxBarSize={34}
                activeBar={{ fill: "#6BA3F5", stroke: "rgba(71,135,227,0.5)", strokeWidth: 1.5 }}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </Section>
  );
}
