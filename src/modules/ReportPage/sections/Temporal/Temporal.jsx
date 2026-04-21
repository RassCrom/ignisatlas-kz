import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from "recharts";
import Section from "../../components/Section";
import ChartCard from "../../components/ChartCard";
import ToggleGroup from "../../components/ToggleGroup";
import CustomTooltip from "../../components/CustomTooltip";
import { fmtK, fmt } from "../../shared/utils";
import { yearlyData, seasonData } from "./data";
import styles from "./Temporal.module.scss";

export default function Temporal() {
  const [view, setView] = useState("yearly");

  return (
    <Section id="temporal" className={styles.wrapper}>
      <h2 className={styles.title}>Временная динамика</h2>
      <p className={styles.subtitle}>Годовые и сезонные тренды пожарной активности</p>

      <ToggleGroup
        options={[
          { value: "yearly", label: "Годовая" },
          { value: "seasonal", label: "Сезонная" },
        ]}
        active={view}
        onChange={setView}
      />

      {view === "yearly" ? (
        <ChartCard title="Годовая динамика (2001–2024)" subtitle="Нисходящий тренд с пиком VIIRS в 2017 г. (~246 тыс. точек)">
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={yearlyData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="year" tick={{ fill: "rgba(217,218,245,0.5)", fontSize: 11 }} />
              <YAxis tick={{ fill: "rgba(217,218,245,0.5)", fontSize: 11 }} tickFormatter={fmtK} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: "rgba(217,218,245,0.6)", fontSize: 12 }} />
              <Bar dataKey="modis" name="MODIS" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={20} />
              <Bar dataKey="viirs" name="VIIRS" fill="#4787E3" radius={[4, 4, 0, 0]} maxBarSize={20} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : (
        <ChartCard title="Сезонное распределение (MODIS)" subtitle="Лето — пик (397 965), зима — минимум (5 575). Апрельский всплеск — сельхоз пал.">
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={seasonData} margin={{ top: 10, right: 30, left: 30, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="season" tick={{ fill: "rgba(217,218,245,0.6)", fontSize: 13 }} />
              <YAxis tick={{ fill: "rgba(217,218,245,0.5)", fontSize: 11 }} tickFormatter={fmtK} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="modis" name="MODIS" radius={[8, 8, 0, 0]} maxBarSize={80} />
            </BarChart>
          </ResponsiveContainer>
          <div className={styles.legend}>
            {seasonData.map((s) => (
              <div key={s.season} className={styles.legendItem}>
                <div className={styles.legendDot} style={{ background: s.color }} />
                <span>{s.season}: {fmt(s.modis)}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      )}
    </Section>
  );
}
