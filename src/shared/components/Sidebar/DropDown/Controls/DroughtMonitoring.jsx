import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Calendar,
  Download,
  Droplets,
  Eye,
  EyeOff,
  Gauge,
  Leaf,
  MapPin,
  Pin,
  RotateCcw,
  Sliders,
  ThermometerSun,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import useDroughtStore from 'src/app/store/droughtStore';
import {
  DROUGHT_INDICES,
  DROUGHT_SEVERITIES,
  buildDroughtFeatureCollection,
  buildRegionDeltas,
  buildDroughtTrend,
  exportDroughtCsv,
  getPinnedRegionSnapshot,
  summarizeDrought,
} from 'src/utils/droughtMonitor';
import './FireControls/fireControls.scss';

const maxMonth = new Date().toISOString().slice(0, 7);

const tabs = [
  { id: 'overview', label: 'Обзор', icon: BarChart3 },
  { id: 'regions', label: 'Регионы', icon: MapPin },
  { id: 'settings', label: 'Настройки', icon: Sliders },
];

const downloadText = (filename, text) => {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

const formatArea = (area) => `${Math.round(area).toLocaleString('ru-RU')} км²`;

const deltaText = (delta) => {
  if (delta > 0) return `+${delta}`;
  return String(delta);
};

const getDeltaClass = (delta) => {
  if (delta > 0) return 'drought-panel__delta--bad';
  if (delta < 0) return 'drought-panel__delta--good';
  return 'drought-panel__delta--neutral';
};

const PanelSection = ({ icon: Icon, title, children, action }) => (
  <section className="drought-panel__section">
    <div className="drought-panel__section-header">
      <div className="drought-panel__section-title">
        <Icon size={13} />
        <span>{title}</span>
      </div>
      {action}
    </div>
    {children}
  </section>
);

const MetricCard = ({ label, value, tone = 'default', caption }) => (
  <div className={`drought-panel__metric drought-panel__metric--${tone}`}>
    <span className="drought-panel__metric-label">{label}</span>
    <strong className="drought-panel__metric-value">{value}</strong>
    {caption && <span className="drought-panel__metric-caption">{caption}</span>}
  </div>
);

const MiniTrendChart = ({ trend, maxValue, currentValue, compact = false }) => (
  <div className={`drought-panel__trend ${compact ? 'drought-panel__trend--compact' : ''}`}>
    {trend.map((item) => {
      const isCurrent = item.value === currentValue;
      const height = Math.max(compact ? 8 : 10, (item.value / maxValue) * (compact ? 38 : 54));
      return (
        <div key={item.month} className="drought-panel__trend-column">
          <div
            className={`drought-panel__trend-bar ${isCurrent ? 'drought-panel__trend-bar--active' : ''}`}
            style={{ height: `${height}px` }}
            title={`${item.month}: ${item.value}`}
          />
          <span>{item.label}</span>
        </div>
      );
    })}
  </div>
);

const SeverityAreaChart = ({ items }) => (
  <div className="drought-panel__severity-list">
    {items.map((item) => (
      <div key={item.id} className="drought-panel__severity-row">
        <div className="drought-panel__severity-meta">
          <span className="drought-panel__severity-dot" style={{ background: item.color }} />
          <span className="drought-panel__severity-name">{item.label}</span>
          <span className="drought-panel__severity-area">{formatArea(item.area)}</span>
        </div>
        <div className="drought-panel__severity-track">
          <div
            className="drought-panel__severity-fill"
            style={{ width: `${Math.max(2, item.pct)}%`, background: item.color }}
          />
        </div>
        <span className="drought-panel__severity-percent">{item.pct}%</span>
      </div>
    ))}
  </div>
);

const RegionScoreList = ({ emptyText, items, mode, onPin }) => (
  <div className="drought-panel__region-list">
    {items.map((item) => {
      const feature = item.feature || item;
      const props = feature.properties || {};
      const score = item.currentScore ?? props.drought_score;
      const delta = item.delta ?? 0;
      const fill = mode === 'score'
        ? score
        : Math.min(100, Math.max(8, Math.abs(delta) * 8));

      return (
        <button
          key={props.drought_region_code}
          type="button"
          className="drought-panel__region-row"
          onClick={() => onPin(props.drought_region_code)}
          title="Закрепить регион"
        >
          <span className="drought-panel__region-color" style={{ background: props.drought_color }} />
          <span className="drought-panel__region-name">{props.drought_region_name}</span>
          <span className={`drought-panel__delta ${getDeltaClass(delta)}`}>
            {mode === 'score' ? score : deltaText(delta)}
          </span>
          <span className="drought-panel__region-track" aria-hidden="true">
            <span
              className="drought-panel__region-fill"
              style={{
                width: `${fill}%`,
                background: mode === 'improving' ? '#34d399' : props.drought_color || '#fb923c',
              }}
            />
          </span>
        </button>
      );
    })}
    {items.length === 0 && (
      <div className="drought-panel__empty">{emptyText}</div>
    )}
  </div>
);

const PinnedRegionCard = ({ maxTrend, onClear, snapshot, trend }) => {
  if (!snapshot) {
    return (
      <div className="drought-panel__empty drought-panel__empty--pin">
        Нажмите регион на карте или в списке, чтобы закрепить его тренд.
      </div>
    );
  }

  const props = snapshot.feature.properties;

  return (
    <div className="drought-panel__pin-card">
      <div className="drought-panel__pin-header">
        <span className="drought-panel__pin-dot" style={{ background: props.drought_color }} />
        <div className="drought-panel__pin-title-wrap">
          <strong className="drought-panel__pin-title">{props.drought_region_name}</strong>
          <span className="drought-panel__pin-subtitle">
            {props.drought_severity_label} · {deltaText(snapshot.delta)} за месяц
          </span>
        </div>
        <button
          type="button"
          className="drought-panel__icon-button"
          onClick={onClear}
          title="Открепить регион"
          aria-label="Открепить регион"
        >
          <X size={14} />
        </button>
      </div>

      <div className="drought-panel__pin-stats">
        <MetricCard label="Индекс" value={snapshot.currentScore} />
        <MetricCard label="Было" value={snapshot.previousScore} tone="muted" />
        <MetricCard
          label="Δ"
          value={deltaText(snapshot.delta)}
          tone={snapshot.delta > 0 ? 'warning' : 'good'}
        />
      </div>

      <MiniTrendChart
        compact
        currentValue={snapshot.currentScore}
        maxValue={maxTrend}
        trend={trend}
      />
    </div>
  );
};

const DroughtMonitoring = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [regions, setRegions] = useState(null);

  const visible = useDroughtStore((state) => state.visible);
  const opacity = useDroughtStore((state) => state.opacity);
  const selectedIndex = useDroughtStore((state) => state.selectedIndex);
  const selectedMonth = useDroughtStore((state) => state.selectedMonth);
  const severityFilter = useDroughtStore((state) => state.severityFilter);
  const regionFilter = useDroughtStore((state) => state.regionFilter);
  const pinnedRegionCode = useDroughtStore((state) => state.pinnedRegionCode);
  const showOutlines = useDroughtStore((state) => state.showOutlines);
  const toggleVisible = useDroughtStore((state) => state.toggleVisible);
  const setOpacity = useDroughtStore((state) => state.setOpacity);
  const setSelectedIndex = useDroughtStore((state) => state.setSelectedIndex);
  const setSelectedMonth = useDroughtStore((state) => state.setSelectedMonth);
  const setSeverityFilter = useDroughtStore((state) => state.setSeverityFilter);
  const setRegionFilter = useDroughtStore((state) => state.setRegionFilter);
  const setPinnedRegionCode = useDroughtStore((state) => state.setPinnedRegionCode);
  const setShowOutlines = useDroughtStore((state) => state.setShowOutlines);
  const resetFilters = useDroughtStore((state) => state.resetFilters);

  useEffect(() => {
    let cancelled = false;
    fetch('/layers/regions.geojson')
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setRegions(data);
      })
      .catch((error) => console.error('Failed to load drought panel regions:', error));
    return () => {
      cancelled = true;
    };
  }, []);

  const droughtData = useMemo(() => buildDroughtFeatureCollection({
    regions,
    selectedIndex,
    selectedMonth,
    severityFilter,
    regionFilter,
  }), [regionFilter, regions, selectedIndex, selectedMonth, severityFilter]);

  const summary = useMemo(() => summarizeDrought(droughtData), [droughtData]);

  const trend = useMemo(() => buildDroughtTrend({
    regions,
    selectedIndex,
    selectedMonth,
    regionFilter,
  }), [regionFilter, regions, selectedIndex, selectedMonth]);

  const regionDeltas = useMemo(() => buildRegionDeltas({
    regions,
    selectedIndex,
    selectedMonth,
    severityFilter,
    regionFilter,
  }), [regionFilter, regions, selectedIndex, selectedMonth, severityFilter]);

  const worseningRegions = useMemo(() => (
    [...regionDeltas]
      .filter((item) => item.delta > 0)
      .sort((a, b) => b.delta - a.delta || b.currentScore - a.currentScore)
      .slice(0, 5)
  ), [regionDeltas]);

  const improvingRegions = useMemo(() => (
    [...regionDeltas]
      .filter((item) => item.delta < 0)
      .sort((a, b) => a.delta - b.delta || a.currentScore - b.currentScore)
      .slice(0, 5)
  ), [regionDeltas]);

  const pinnedSnapshot = useMemo(() => getPinnedRegionSnapshot({
    regions,
    selectedIndex,
    selectedMonth,
    pinnedRegionCode,
  }), [pinnedRegionCode, regions, selectedIndex, selectedMonth]);

  const pinnedTrend = useMemo(() => buildDroughtTrend({
    regions,
    selectedIndex,
    selectedMonth,
    regionFilter: pinnedRegionCode || regionFilter,
  }), [pinnedRegionCode, regionFilter, regions, selectedIndex, selectedMonth]);

  const regionOptions = useMemo(() => (
    (regions?.features || [])
      .map((feature) => ({
        code: feature.properties.ADM1_PCODE,
        name: feature.properties.ADM1_EN,
        label: droughtData.features.find((item) => item.properties.ADM1_PCODE === feature.properties.ADM1_PCODE)
          ?.properties.drought_region_name || feature.properties.ADM1_EN,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'ru'))
  ), [droughtData.features, regions]);

  const selectedIndexMeta = DROUGHT_INDICES.find((item) => item.id === selectedIndex) || DROUGHT_INDICES[0];
  const maxTrend = Math.max(1, ...trend.map((item) => item.value));
  const maxPinnedTrend = Math.max(1, ...pinnedTrend.map((item) => item.value));
  const topRegions = summary.ranked.slice(0, 5);

  const handleExport = useCallback(() => {
    const included = droughtData.features.filter((feature) => feature.properties.drought_included);
    downloadText(`drought-${selectedIndex}-${selectedMonth}.csv`, exportDroughtCsv(included));
  }, [droughtData.features, selectedIndex, selectedMonth]);

  const handlePinRegion = useCallback((regionCode) => {
    setPinnedRegionCode(regionCode);
    setActiveTab('overview');
  }, [setPinnedRegionCode]);

  return (
    <div className="fire-controls drought-panel">
      <div className="fire-controls__header">
        <button
          type="button"
          className="fire-controls__toggle drought-panel__main-toggle"
          onClick={toggleVisible}
          aria-pressed={visible}
        >
          <span className="fire-controls__toggle-icon">
            {visible
              ? <Eye size={16} className="fire-controls__icon-active" />
              : <EyeOff size={16} className="fire-controls__icon-inactive" />
            }
          </span>
          <span className="fire-controls__toggle-label">Мониторинг засухи</span>
          <span className={`drought-panel__status ${visible ? 'drought-panel__status--active' : ''}`}>
            {visible ? 'ON' : 'OFF'}
          </span>
          <Droplets
            size={16}
            className={`fire-controls__flame-icon ${visible ? 'fire-controls__flame-icon--active' : ''}`}
          />
        </button>

        <button
          type="button"
          className={`fire-controls__expand-btn ${isExpanded ? 'fire-controls__expand-btn--expanded' : ''}`}
          onClick={() => setIsExpanded((value) => !value)}
          title="Настройки"
          aria-expanded={isExpanded}
        >
          <Sliders size={14} />
        </button>
      </div>

      {isExpanded && (
        <div className="fire-controls__content drought-panel__content">
          <div className="drought-panel__tabs" role="tablist" aria-label="Разделы мониторинга засухи">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`drought-panel__tab ${activeTab === tab.id ? 'drought-panel__tab--active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'overview' && (
            <div className="drought-panel__tab-panel" role="tabpanel">
              <div className="drought-panel__hero">
                <div>
                  <span className="drought-panel__eyebrow">{selectedIndexMeta.label} · {selectedMonth}</span>
                  <strong>{selectedIndexMeta.name}</strong>
                  <p>{selectedIndexMeta.description}</p>
                </div>
                <div className="drought-panel__hero-score">
                  <span>{summary.averageScore}</span>
                  <small>средний индекс</small>
                </div>
              </div>

              <div className="drought-panel__metric-grid">
                <MetricCard label="Регионов" value={summary.regions} caption="в фильтре" />
                <MetricCard label="Сильная+" value={summary.severeRegions} tone="warning" caption="зона риска" />
                <MetricCard label="Экстремальная" value={summary.extremeRegions} tone="danger" caption="приоритет" />
                <MetricCard label="Площадь" value={formatArea(summary.totalArea)} caption="затронуто" />
              </div>

              <PanelSection
                icon={Pin}
                title="Закрепленный регион"
                action={pinnedSnapshot && (
                  <button
                    type="button"
                    className="drought-panel__ghost-action"
                    onClick={() => setActiveTab('regions')}
                  >
                    выбрать
                  </button>
                )}
              >
                <PinnedRegionCard
                  maxTrend={maxPinnedTrend}
                  onClear={() => setPinnedRegionCode(null)}
                  snapshot={pinnedSnapshot}
                  trend={pinnedTrend}
                />
              </PanelSection>

              <PanelSection icon={ThermometerSun} title="Тренд 6 месяцев">
                <MiniTrendChart trend={trend} maxValue={maxTrend} currentValue={summary.averageScore} />
              </PanelSection>

              <PanelSection icon={BarChart3} title="Площадь по классам">
                <SeverityAreaChart items={summary.severityArea || []} />
              </PanelSection>

              <div className="fire-controls__legend drought-panel__legend">
                <div className="fire-controls__legend-header">
                  <Gauge size={12} />
                  Шкала индекса засухи
                </div>
                <div
                  className="fire-controls__legend-gradient"
                  style={{ background: 'linear-gradient(to right, #1f9d55, #c8c83d, #e7a33a, #d6612f, #b92f2f)' }}
                />
                <div className="fire-controls__legend-labels">
                  <span>0</span><span>25</span><span>45</span><span>65</span><span>82+</span>
                </div>
                <div className="fire-controls__legend-description">
                  Зеленый — норма, красный — экстремальная засуха
                </div>
              </div>
            </div>
          )}

          {activeTab === 'regions' && (
            <div className="drought-panel__tab-panel" role="tabpanel">
              <PanelSection icon={TrendingUp} title="Топ ухудшения">
                <RegionScoreList
                  emptyText="Нет регионов с ухудшением за месяц."
                  items={worseningRegions}
                  mode="worsening"
                  onPin={handlePinRegion}
                />
              </PanelSection>

              <PanelSection icon={TrendingDown} title="Улучшающиеся регионы">
                <RegionScoreList
                  emptyText="Нет регионов с улучшением за месяц."
                  items={improvingRegions}
                  mode="improving"
                  onPin={handlePinRegion}
                />
              </PanelSection>

              <PanelSection icon={Leaf} title="Наиболее напряженные регионы">
                <RegionScoreList
                  emptyText="Нет регионов для выбранного порога."
                  items={topRegions}
                  mode="score"
                  onPin={handlePinRegion}
                />
              </PanelSection>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="drought-panel__tab-panel" role="tabpanel">
              <PanelSection icon={Activity} title="Индекс мониторинга">
                <div className="drought-panel__segmented">
                  {DROUGHT_INDICES.map((index) => (
                    <button
                      key={index.id}
                      type="button"
                      className={`drought-panel__segmented-btn ${selectedIndex === index.id ? 'drought-panel__segmented-btn--active' : ''}`}
                      onClick={() => setSelectedIndex(index.id)}
                      title={index.description}
                      aria-pressed={selectedIndex === index.id}
                    >
                      {index.label}
                    </button>
                  ))}
                </div>
                <p className="drought-panel__hint">{selectedIndexMeta.description}</p>
              </PanelSection>

              <PanelSection icon={Calendar} title="Период и территория">
                <div className="drought-panel__field-grid">
                  <label className="drought-panel__field">
                    <span>Месяц</span>
                    <input
                      type="month"
                      value={selectedMonth}
                      max={maxMonth}
                      onChange={(event) => setSelectedMonth(event.target.value)}
                    />
                  </label>
                  <label className="drought-panel__field">
                    <span>Регион</span>
                    <select
                      value={regionFilter}
                      onChange={(event) => setRegionFilter(event.target.value)}
                    >
                      <option value="all">Все регионы</option>
                      {regionOptions.map((region) => (
                        <option key={region.code} value={region.code}>
                          {region.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </PanelSection>

              <PanelSection icon={Gauge} title="Порог тревоги">
                <div className="drought-panel__segmented drought-panel__segmented--wrap">
                  {DROUGHT_SEVERITIES.map((severity) => (
                    <button
                      key={severity.id}
                      type="button"
                      className={`drought-panel__segmented-btn ${severityFilter === severity.id ? 'drought-panel__segmented-btn--active' : ''}`}
                      onClick={() => setSeverityFilter(severity.id)}
                      aria-pressed={severityFilter === severity.id}
                    >
                      {severity.label}
                    </button>
                  ))}
                </div>
              </PanelSection>

              <PanelSection icon={Eye} title="Отображение слоя">
                <div className="drought-panel__slider-row">
                  <span>Прозрачность</span>
                  <strong>{Math.round(opacity * 100)}%</strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(opacity * 100)}
                  onChange={(event) => setOpacity(Number(event.target.value) / 100)}
                  className="fire-modelling__slider"
                />
                <label className="drought-panel__check-row">
                  <input
                    type="checkbox"
                    checked={showOutlines}
                    onChange={(event) => setShowOutlines(event.target.checked)}
                  />
                  <span>Показывать границы регионов</span>
                </label>
              </PanelSection>

              <div className="drought-panel__actions">
                <button
                  type="button"
                  className="drought-panel__action-button drought-panel__action-button--primary"
                  onClick={handleExport}
                >
                  <Download size={13} />
                  CSV
                </button>
                <button
                  type="button"
                  className="drought-panel__action-button"
                  onClick={resetFilters}
                >
                  <RotateCcw size={13} />
                  Сброс
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DroughtMonitoring;
