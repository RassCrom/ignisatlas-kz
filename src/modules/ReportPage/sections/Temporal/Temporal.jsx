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
import { useIsMobile } from "../../shared/useIsMobile";
import { useReportI18n } from "../../reportI18n";
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
  const isMobile = useIsMobile();
  const { text } = useReportI18n();
  const localizedSeasonData = seasonData.map((item, index) => ({
    ...item,
    season: text.temporal.seasons[index] ?? item.season,
  }));
  const localizedMonthlyData = monthlyData.map((item, index) => ({
    ...item,
    month: text.temporal.months[index] ?? item.month,
  }));

  return (
    <Section id="temporal" className={styles.wrapper}>
      <h2 className={styles.title}>{text.temporal.title}</h2>
      <p className={styles.subtitle}>{text.temporal.subtitle}</p>

      <ToggleGroup
        options={[
          { value: "yearly", label: text.temporal.yearly },
          { value: "seasonal", label: text.temporal.seasonal },
          { value: "monthly", label: text.temporal.monthly },
        ]}
        active={view}
        onChange={setView}
      />

      {view === "yearly" && (
        <ChartCard
          title={text.temporal.yearlyTitle}
          subtitle={text.temporal.yearlySubtitle}
        >
          <ResponsiveContainer width="100%" height={isMobile ? 320 : 400}>
            <ComposedChart data={yearlyData} margin={isMobile ? { top: 8, right: 4, left: 0, bottom: 8 } : { top: 10, right: 10, left: 10, bottom: 20 }}>
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
              <XAxis dataKey="year" tick={{ ...TICK_X, fontSize: isMobile ? 9 : 11 }} interval={isMobile ? 2 : 0} />
              <YAxis tick={TICK_Y} tickFormatter={fmtK} />
              <Tooltip content={<CustomTooltip />} cursor={CURSOR} />
              <Legend wrapperStyle={{ ...LEGEND, fontSize: isMobile ? 10 : 12 }} />
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
          title={text.temporal.seasonalTitle}
          subtitle={text.temporal.seasonalSubtitle}
        >
          <ResponsiveContainer width="100%" height={isMobile ? 300 : 360}>
            <BarChart data={localizedSeasonData} margin={isMobile ? { top: 8, right: 8, left: 0, bottom: 8 } : { top: 10, right: 30, left: 30, bottom: 20 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="season" tick={{ ...TICK_X, fontSize: 13 }} />
              <YAxis tick={TICK_Y} tickFormatter={fmtK} />
              <Tooltip content={<CustomTooltip />} cursor={CURSOR} />
              <Bar
                dataKey="modis" name="MODIS" radius={[8, 8, 0, 0]} maxBarSize={80}
                activeBar={{ strokeWidth: 2, stroke: "rgba(255,255,255,0.3)" }}
              >
                {localizedSeasonData.map((e, i) => (
                  <Cell key={i} fill={e.color} fillOpacity={0.9} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className={styles.legend}>
            {localizedSeasonData.map((s) => (
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
          title={text.temporal.monthlyTitle}
          subtitle={text.temporal.monthlySubtitle}
        >
          <ResponsiveContainer width="100%" height={isMobile ? 320 : 360}>
            <BarChart data={localizedMonthlyData} margin={isMobile ? { top: 8, right: 4, left: 0, bottom: 8 } : { top: 10, right: 20, left: 20, bottom: 20 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="month" tick={{ ...TICK_X, fontSize: isMobile ? 10 : 12 }} interval={0} />
              <YAxis tick={TICK_Y} tickFormatter={fmtK} />
              <Tooltip content={<CustomTooltip />} cursor={CURSOR} />
              <Bar
                dataKey="modis" name="MODIS" radius={[5, 5, 0, 0]} maxBarSize={38}
                activeBar={{ strokeWidth: 2, stroke: "rgba(255,255,255,0.3)" }}
              >
                {localizedMonthlyData.map((e, i) => (
                  <Cell key={i} fill={e.color} fillOpacity={0.9} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className={styles.legend}>
            {localizedMonthlyData.map((m) => (
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
