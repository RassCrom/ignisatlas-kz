import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Section from "../../components/Section";
import ChartCard from "../../components/ChartCard";
import ToggleGroup from "../../components/ToggleGroup";
import StatCard from "../../components/StatCard";
import CustomTooltip from "../../components/CustomTooltip";
import { fmtK } from "../../shared/utils";
import { regionsData } from "./data";
import styles from "./Regions.module.scss";

const MODIS = "#E84025";
const VIIRS = "#4787E3";
const CURSOR = { stroke: "rgba(255,255,255,0.07)", strokeWidth: 1, fill: "rgba(255,255,255,0.02)" };
const GRID   = { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.05)", vertical: false };

export default function Regions() {
  const [metric, setMetric] = useState("density");
  const [sensor, setSensor] = useState("modis");

  const gradId  = sensor === "modis" ? "regModisGrad" : "regViirsGrad";
  const activeC = sensor === "modis" ? "#FF6A4A" : "#6BA3F5";
  const glowC   = sensor === "modis" ? "rgba(232,64,37,0.5)" : "rgba(71,135,227,0.5)";

  const chartData = regionsData.map((r) => ({
    name:  r.short,
    full:  r.name,
    value: metric === "density"
      ? (sensor === "modis" ? r.rm : r.rv)
      : (sensor === "modis" ? r.modis : r.viirs),
  }));

  return (
    <Section id="regions" className={styles.wrapper}>
      <h2 className={styles.title}>Пространственное распределение</h2>
      <p className={styles.subtitle}>Плотность термальных аномалий по 20 административным единицам Казахстана</p>

      <ToggleGroup
        options={[
          { value: "density",  label: "Плотность (точек/км²)" },
          { value: "absolute", label: "Абсолютное количество"  },
        ]}
        active={metric}
        onChange={setMetric}
      />
      <ToggleGroup
        options={[
          { value: "modis", label: "MODIS" },
          { value: "viirs", label: "VIIRS" },
        ]}
        active={sensor}
        onChange={setSensor}
      />

      <ChartCard>
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 90 }}>
            <defs>
              <linearGradient id="regModisGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={MODIS} stopOpacity={0.95} />
                <stop offset="100%" stopColor={MODIS} stopOpacity={0.5} />
              </linearGradient>
              <linearGradient id="regViirsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={VIIRS} stopOpacity={0.95} />
                <stop offset="100%" stopColor={VIIRS} stopOpacity={0.5} />
              </linearGradient>
            </defs>
            <CartesianGrid {...GRID} />
            <XAxis
              dataKey="name"
              tick={{ fill: "rgba(217,218,245,0.5)", fontSize: 11 }}
              angle={-45} textAnchor="end" interval={0}
            />
            <YAxis
              tick={{ fill: "rgba(217,218,245,0.45)", fontSize: 11 }}
              tickFormatter={metric === "absolute" ? fmtK : undefined}
            />
            <Tooltip content={<CustomTooltip />} cursor={CURSOR} />
            <Bar
              dataKey="value"
              name={metric === "density" ? "Плотность" : "Количество"}
              fill={`url(#${gradId})`}
              radius={[5, 5, 0, 0]}
              maxBarSize={34}
              activeBar={{ fill: activeC, stroke: glowC, strokeWidth: 1.5 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className={styles.stats}>
        <StatCard value="1.031" label="Макс. плотность MODIS (СКО)"      accent={MODIS} />
        <StatCard value="2.12"  label="Макс. плотность VIIRS (Шымкент)"  accent={VIIRS} />
        <StatCard value="0.009" label="Мин. плотность (Мангистау)"        accent="#6b7280" />
      </div>
    </Section>
  );
}
