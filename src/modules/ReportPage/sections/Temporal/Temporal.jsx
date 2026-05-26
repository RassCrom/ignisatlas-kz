import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ComposedChart, Cell,
} from "recharts";
import Section from "../../components/Section";
import ChartCard from "../../components/ChartCard";
import ToggleGroup from "../../components/ToggleGroup";
import CustomTooltip from "../../components/CustomTooltip";
import { fmtK, fmt } from "../../shared/utils";
import { yearlyData, seasonData, monthlyData } from "./data";
import styles from "./Temporal.module.scss";

const MODIS = "#E84025";
const VIIRS = "#4787E3";
const CURSOR = { stroke: "rgba(255,255,255,0.07)", strokeWidth: 1, fill: "rgba(255,255,255,0.02)" };
const GRID   = { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.05)", vertical: false };
const TICK_X = { fill: "rgba(217,218,245,0.5)", fontSize: 11 };
const TICK_Y = { fill: "rgba(217,218,245,0.45)", fontSize: 11 };
const LEGEND = { color: "rgba(217,218,245,0.6)", fontSize: 12 };

export default function Temporal() {
  const [view, setView] = useState("yearly");

  return (
    <Section id="temporal" className={styles.wrapper}>
      <h2 className={styles.title}>Временная динамика</h2>
      <p className={styles.subtitle}>Годовые и сезонные тренды пожарной активности</p>

      <ToggleGroup
        options={[
          { value: "yearly",   label: "Годовая"  },
          { value: "seasonal", label: "Сезонная" },
          { value: "monthly",  label: "Месячная" },
        ]}
        active={view}
        onChange={setView}
      />

      {view === "yearly" && (
        <ChartCard
          title="Годовая динамика (2001–2024)"
          subtitle="Нисходящий тренд с пиком VIIRS в 2017 г. (~246 тыс. точек)"
        >
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={yearlyData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="modisGradY" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={MODIS} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={MODIS} stopOpacity={0.55} />
                </linearGradient>
                <linearGradient id="viirsGradY" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={VIIRS} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={VIIRS} stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="year" tick={TICK_X} />
              <YAxis tick={TICK_Y} tickFormatter={fmtK} />
              <Tooltip content={<CustomTooltip />} cursor={CURSOR} />
              <Legend wrapperStyle={LEGEND} />
              <Bar
                dataKey="modis" name="MODIS" fill="url(#modisGradY)"
                radius={[4, 4, 0, 0]} maxBarSize={18}
                activeBar={{ fill: "#FF6A4A", stroke: "rgba(232,64,37,0.5)", strokeWidth: 1.5 }}
              />
              <Bar
                dataKey="viirs" name="VIIRS" fill="url(#viirsGradY)"
                radius={[4, 4, 0, 0]} maxBarSize={18}
                activeBar={{ fill: "#6BA3F5", stroke: "rgba(71,135,227,0.5)", strokeWidth: 1.5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {view === "seasonal" && (
        <ChartCard
          title="Сезонное распределение (MODIS)"
          subtitle="Лето — пик (397 965), зима — минимум (5 575). Апрельский всплеск — сельхоз пал."
        >
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={seasonData} margin={{ top: 10, right: 30, left: 30, bottom: 20 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="season" tick={{ ...TICK_X, fontSize: 13 }} />
              <YAxis tick={TICK_Y} tickFormatter={fmtK} />
              <Tooltip content={<CustomTooltip />} cursor={CURSOR} />
              <Bar
                dataKey="modis" name="MODIS" radius={[8, 8, 0, 0]} maxBarSize={80}
                activeBar={{ strokeWidth: 2, stroke: "rgba(255,255,255,0.3)" }}
              >
                {seasonData.map((e, i) => (
                  <Cell key={i} fill={e.color} fillOpacity={0.9} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className={styles.legend}>
            {seasonData.map((s) => (
              <div key={s.season} className={styles.legendItem}>
                <div className={styles.legendDot} style={{ background: s.color }} />
                <span>{s.season}: <strong>{fmt(s.modis)}</strong></span>
              </div>
            ))}
          </div>
        </ChartCard>
      )}

      {view === "monthly" && (
        <ChartCard
          title="Месячное распределение (MODIS)"
          subtitle="Пик активности — апрель и сентябрь. Зимние месяцы — минимум."
        >
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="month" tick={{ ...TICK_X, fontSize: 12 }} />
              <YAxis tick={TICK_Y} tickFormatter={fmtK} />
              <Tooltip content={<CustomTooltip />} cursor={CURSOR} />
              <Bar
                dataKey="modis" name="MODIS" radius={[5, 5, 0, 0]} maxBarSize={38}
                activeBar={{ strokeWidth: 2, stroke: "rgba(255,255,255,0.3)" }}
              >
                {monthlyData.map((e, i) => (
                  <Cell key={i} fill={e.color} fillOpacity={0.9} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className={styles.legend}>
            {monthlyData.map((m) => (
              <div key={m.month} className={styles.legendItem}>
                <div className={styles.legendDot} style={{ background: m.color }} />
                <span>{m.month}: <strong>{fmt(m.modis)}</strong></span>
              </div>
            ))}
          </div>
        </ChartCard>
      )}
    </Section>
  );
}
