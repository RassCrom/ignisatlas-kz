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

export default function Regions() {
  const [metric, setMetric] = useState("density");
  const [sensor, setSensor] = useState("modis");

  const chartData = regionsData.map((r) => ({
    name: r.short,
    full: r.name,
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
          { value: "density", label: "Плотность (точек/км²)" },
          { value: "absolute", label: "Абсолютное количество" },
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
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fill: "rgba(217,218,245,0.5)", fontSize: 11 }} angle={-45} textAnchor="end" interval={0} />
            <YAxis tick={{ fill: "rgba(217,218,245,0.5)", fontSize: 11 }} tickFormatter={metric === "absolute" ? fmtK : undefined} />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              name={metric === "density" ? "Плотность" : "Количество"}
              fill={sensor === "modis" ? "#f97316" : "#4787E3"}
              radius={[6, 6, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className={styles.stats}>
        <StatCard value="1.031" label="Макс. плотность MODIS (СКО)" accent="#f97316" />
        <StatCard value="2.12" label="Макс. плотность VIIRS (Шымкент)" accent="#4787E3" />
        <StatCard value="0.009" label="Мин. плотность (Мангистау)" accent="#6b7280" />
      </div>
    </Section>
  );
}
