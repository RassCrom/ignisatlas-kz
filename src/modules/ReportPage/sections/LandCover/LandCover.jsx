import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Section from "../../components/Section";
import ChartCard from "../../components/ChartCard";
import ToggleGroup from "../../components/ToggleGroup";
import CustomTooltip from "../../components/CustomTooltip";
import { landCoverData } from "./data";
import styles from "./LandCover.module.scss";

export default function LandCover() {
  const [sensor, setSensor] = useState("both");

  return (
    <Section id="landcover" className={styles.wrapper}>
      <h2 className={styles.title}>Земельный покров</h2>
      <p className={styles.subtitle}>Распределение по классам ESA WorldCover 2021</p>

      <ToggleGroup
        options={[
          { value: "both", label: "Оба сенсора" },
          { value: "modis", label: "MODIS" },
          { value: "viirs", label: "VIIRS" },
        ]}
        active={sensor}
        onChange={setSensor}
      />

      <ChartCard title="Нормализованная плотность по типам покрова" subtitle="VIIRS: аномально высокая плотность для застроенных территорий (4.444)">
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={landCoverData} margin={{ top: 10, right: 10, left: 10, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="type" tick={{ fill: "rgba(217,218,245,0.5)", fontSize: 11 }} angle={-40} textAnchor="end" interval={0} />
            <YAxis tick={{ fill: "rgba(217,218,245,0.5)", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: "rgba(217,218,245,0.6)", fontSize: 12 }} />
            {(sensor === "both" || sensor === "modis") && (
              <Bar dataKey="rm" name="MODIS" fill="#f97316" radius={[6, 6, 0, 0]} maxBarSize={36} />
            )}
            {(sensor === "both" || sensor === "viirs") && (
              <Bar dataKey="rv" name="VIIRS" fill="#4787E3" radius={[6, 6, 0, 0]} maxBarSize={36} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </Section>
  );
}
