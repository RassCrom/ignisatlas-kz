import { useState } from 'react';
import {
  CloudSun,
  Database,
  Gauge,
  LineChart,
  MapPin,
  Sliders,
} from 'lucide-react';
import './FireControls/fireControls.scss';

const FORECAST_SOURCE = {
  name: 'Copernicus CDS C3S seasonal forecasts',
  url: 'https://cds.climate.copernicus.eu/datasets/seasonal-monthly-single-levels',
  cadence: 'Monthly issue, 1-6 month lead time',
  variables: 'total precipitation, 2m temperature, evaporation, runoff; bias-correct with ERA5-Land',
};

const DROUGHT_FORECAST = [
  { month: 'Jun', risk: 58, confidence: 72, precipitation: -18, temperature: 1.4, soil: -12, area: 328000 },
  { month: 'Jul', risk: 66, confidence: 69, precipitation: -24, temperature: 2.1, soil: -18, area: 416000 },
  { month: 'Aug', risk: 74, confidence: 64, precipitation: -31, temperature: 2.6, soil: -23, area: 538000 },
];

const FORECAST_REGIONS = [
  { name: 'Kyzylorda Region', risk: 82, trend: '+11', confidence: 68 },
  { name: 'Turkistan Region', risk: 76, trend: '+8', confidence: 65 },
  { name: 'Mangystau Region', risk: 71, trend: '+5', confidence: 62 },
  { name: 'Karaganda Region', risk: 64, trend: '+4', confidence: 70 },
];

const formatArea = (area) => `${Math.round(area).toLocaleString('ru-RU')} км²`;

const PanelSection = ({ icon: Icon, title, children }) => (
  <section className="drought-panel__section">
    <div className="drought-panel__section-header">
      <div className="drought-panel__section-title">
        <Icon size={13} />
        <span>{title}</span>
      </div>
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

const ForecastRiskChart = ({ items }) => {
  const maxRisk = Math.max(1, ...items.map((item) => item.risk));

  return (
    <div className="drought-panel__forecast-chart">
      {items.map((item) => (
        <div key={item.month} className="drought-panel__forecast-column">
          <div className="drought-panel__forecast-bar-wrap">
            <span
              className="drought-panel__forecast-confidence"
              style={{ bottom: `${Math.max(12, item.confidence)}%` }}
              title={`Confidence ${item.confidence}%`}
            />
            <span
              className="drought-panel__forecast-bar"
              style={{ height: `${Math.max(18, (item.risk / maxRisk) * 100)}%` }}
            />
          </div>
          <strong>{item.risk}</strong>
          <span>{item.month}</span>
        </div>
      ))}
    </div>
  );
};

const ForecastDriverGrid = ({ item }) => (
  <div className="drought-panel__driver-grid">
    <MetricCard label="Rain anomaly" value={`${item.precipitation}%`} tone="warning" caption="below normal" />
    <MetricCard label="Temp anomaly" value={`+${item.temperature} C`} tone="danger" caption="monthly mean" />
    <MetricCard label="Soil moisture" value={`${item.soil}%`} tone="warning" caption="root-zone proxy" />
    <MetricCard label="Risk area" value={formatArea(item.area)} caption="forecast" />
  </div>
);

const ForecastRegionList = ({ items }) => (
  <div className="drought-panel__forecast-region-list">
    {items.map((item) => (
      <div key={item.name} className="drought-panel__forecast-region">
        <div className="drought-panel__forecast-region-top">
          <span>{item.name}</span>
          <strong>{item.risk}</strong>
        </div>
        <div className="drought-panel__forecast-region-track" aria-hidden="true">
          <span style={{ width: `${item.risk}%` }} />
        </div>
        <div className="drought-panel__forecast-region-meta">
          <span>{item.trend} vs current</span>
          <span>{item.confidence}% confidence</span>
        </div>
      </div>
    ))}
  </div>
);

const SourceCard = ({ source }) => (
  <div className="drought-panel__source-card">
    <a href={source.url} target="_blank" rel="noreferrer">
      {source.name}
    </a>
    <span>{source.cadence}</span>
    <p>{source.variables}</p>
  </div>
);

const DroughtForecast = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const forecastPeak = DROUGHT_FORECAST[DROUGHT_FORECAST.length - 1];

  return (
    <div className="fire-controls drought-panel drought-panel--forecast-feature">
      <div className="fire-controls__header">
        <div className="fire-controls__toggle drought-panel__main-toggle">
          <span className="fire-controls__toggle-icon">
            <CloudSun size={16} className="fire-controls__icon-active" />
          </span>
          <span className="fire-controls__toggle-label">Прогноз засухи</span>
          <span className="drought-panel__status drought-panel__status--forecast">MOCK</span>
        </div>

        <button
          type="button"
          className={`fire-controls__expand-btn ${isExpanded ? 'fire-controls__expand-btn--expanded' : ''}`}
          onClick={() => setIsExpanded((value) => !value)}
          title="Forecast"
          aria-expanded={isExpanded}
        >
          <Sliders size={14} />
        </button>
      </div>

      {isExpanded && (
        <div className="fire-controls__content drought-panel__content">
          <div className="drought-panel__forecast-hero">
            <div>
              <span className="drought-panel__eyebrow">Mock seasonal outlook</span>
              <strong>3-month drought risk forecast</strong>
              <p>Hard-coded values visualize the future forecast workflow for Kazakhstan regions.</p>
            </div>
            <div className="drought-panel__forecast-score">
              <span>{forecastPeak.risk}</span>
              <small>{forecastPeak.month} risk</small>
            </div>
          </div>

          <PanelSection icon={LineChart} title="Risk trajectory">
            <ForecastRiskChart items={DROUGHT_FORECAST} />
            <div className="drought-panel__forecast-legend">
              <span><i /> Risk index</span>
              <span><i /> Confidence marker</span>
            </div>
          </PanelSection>

          <PanelSection icon={Gauge} title={`${forecastPeak.month} drivers`}>
            <ForecastDriverGrid item={forecastPeak} />
          </PanelSection>

          <PanelSection icon={MapPin} title="Regional hotspots">
            <ForecastRegionList items={FORECAST_REGIONS} />
          </PanelSection>

          <PanelSection icon={Database} title="Real forecast data source">
            <SourceCard source={FORECAST_SOURCE} />
          </PanelSection>
        </div>
      )}
    </div>
  );
};

export default DroughtForecast;
