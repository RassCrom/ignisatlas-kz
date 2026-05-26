import { useMemo, useRef, useState } from 'react';
import {
  CloudSun,
  Database,
  Eye,
  EyeOff,
  Gauge,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Sliders,
  Wind,
} from 'lucide-react';
import useWindStore from 'src/app/store/windStore';
import { searchKazakhstanWind, WIND_SOURCE } from 'src/utils/windService';
import './FireControls/fireControls.scss';
import styles from './WindControls.module.scss';

const formatSpeed = (value) => (Number.isFinite(value) ? `${value.toFixed(1)} m/s` : 'N/A');

const formatTime = (iso) => {
  if (!iso) return 'Не загружено';
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const MetricCard = ({ label, value, caption, tone = 'default' }) => (
  <div className={`drought-panel__metric drought-panel__metric--${tone}`}>
    <span className="drought-panel__metric-label">{label}</span>
    <strong className="drought-panel__metric-value">{value}</strong>
    {caption && <span className="drought-panel__metric-caption">{caption}</span>}
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

const WindControls = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const abortRef = useRef(null);

  const visible = useWindStore((state) => state.visible);
  const opacity = useWindStore((state) => state.opacity);
  const density = useWindStore((state) => state.density);
  const minSpeed = useWindStore((state) => state.minSpeed);
  const points = useWindStore((state) => state.points);
  const summary = useWindStore((state) => state.summary);
  const fetchedAt = useWindStore((state) => state.fetchedAt);
  const isLoading = useWindStore((state) => state.isLoading);
  const error = useWindStore((state) => state.error);
  const selectedPointId = useWindStore((state) => state.selectedPointId);
  const setVisible = useWindStore((state) => state.setVisible);
  const setOpacity = useWindStore((state) => state.setOpacity);
  const setDensity = useWindStore((state) => state.setDensity);
  const setMinSpeed = useWindStore((state) => state.setMinSpeed);
  const setIsLoading = useWindStore((state) => state.setIsLoading);
  const setError = useWindStore((state) => state.setError);
  const setWindData = useWindStore((state) => state.setWindData);

  const selectedPoint = useMemo(
    () => points.find((point) => point.id === selectedPointId) || summary?.strongest || null,
    [points, selectedPointId, summary]
  );

  const filteredPoints = useMemo(
    () => points.filter((point) => (point.speed ?? 0) >= minSpeed),
    [minSpeed, points]
  );

  const loadWind = async (nextDensity = density) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const data = await searchKazakhstanWind({
        density: nextDensity,
        signal: controller.signal,
      });
      setWindData(data);
      setVisible(true);
    } catch (requestError) {
      if (requestError.name !== 'AbortError') {
        setError(requestError.message || 'Failed to load wind data');
      }
    } finally {
      if (abortRef.current === controller) {
        setIsLoading(false);
        abortRef.current = null;
      }
    }
  };

  const handleToggleVisible = () => {
    const nextVisible = !visible;
    setVisible(nextVisible);
    if (nextVisible && points.length === 0 && !isLoading) {
      loadWind();
    }
  };

  const handleDensityChange = (event) => {
    const nextDensity = event.target.value;
    setDensity(nextDensity);
    if (visible || points.length > 0) loadWind(nextDensity);
  };

  return (
    <div className="fire-controls drought-panel">
      <div className="fire-controls__header">
        <div className="fire-controls__toggle drought-panel__main-toggle" onClick={handleToggleVisible}>
          <span className="fire-controls__toggle-icon">
            {visible
              ? <Eye size={16} className="fire-controls__icon-active" />
              : <EyeOff size={16} className="fire-controls__icon-inactive" />}
          </span>
          <span className="fire-controls__toggle-label">Wind conditions</span>
          <span className={`drought-panel__status ${visible ? 'drought-panel__status--active' : ''}`}>
            {points.length ? 'LIVE' : 'API'}
          </span>
        </div>

        <button
          type="button"
          className={`fire-controls__expand-btn ${isExpanded ? 'fire-controls__expand-btn--expanded' : ''}`}
          onClick={() => setIsExpanded((value) => !value)}
          title="Wind controls"
          aria-expanded={isExpanded}
        >
          <Sliders size={14} />
        </button>
      </div>

      {isExpanded && (
        <div className="fire-controls__content drought-panel__content">
          <div className={styles.hero}>
            <div>
              <span className="drought-panel__eyebrow">Kazakhstan only</span>
              <strong>Current 10 m wind field</strong>
              <p>Live Open-Meteo wind vectors sampled across Kazakhstan regions.</p>
            </div>
            <button
              type="button"
              className={styles.refreshButton}
              onClick={() => loadWind()}
              disabled={isLoading}
            >
              {isLoading ? <LoaderCircle size={14} className={styles.spinner} /> : <RefreshCw size={14} />}
              <span>{isLoading ? 'Loading' : 'Refresh'}</span>
            </button>
          </div>

          <div className="drought-panel__metric-grid">
            <MetricCard
              label="Avg speed"
              value={formatSpeed(summary?.averageSpeed)}
              caption="10 m wind"
            />
            <MetricCard
              label="Max gust"
              value={formatSpeed(summary?.maxGust)}
              tone="warning"
              caption="sampled points"
            />
            <MetricCard
              label="Stations"
              value={String(filteredPoints.length)}
              caption={`of ${points.length || 0}`}
            />
            <MetricCard
              label="Updated"
              value={formatTime(fetchedAt)}
              caption="local time"
            />
          </div>

          <section className="drought-panel__section">
            <div className="drought-panel__section-header">
              <div className="drought-panel__section-title">
                <Sliders size={13} />
                <span>Layer controls</span>
              </div>
            </div>
            <div className="drought-panel__field-grid drought-panel__field-grid--two">
              <label className="drought-panel__field">
                <span>Density</span>
                <select value={density} onChange={handleDensityChange}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label className="drought-panel__field">
                <span>Opacity</span>
                <input
                  type="range"
                  min="0.2"
                  max="1"
                  step="0.05"
                  value={opacity}
                  onChange={(event) => setOpacity(Number(event.target.value))}
                />
                <small>{Math.round(opacity * 100)}%</small>
              </label>
            </div>
            <label className="drought-panel__field">
              <span>Minimum speed</span>
              <input
                type="range"
                min="0"
                max="18"
                step="1"
                value={minSpeed}
                onChange={(event) => setMinSpeed(Number(event.target.value))}
              />
              <small>{minSpeed} m/s and above</small>
            </label>
          </section>

          {selectedPoint && (
            <section className="drought-panel__section">
              <div className="drought-panel__section-header">
                <div className="drought-panel__section-title">
                  <MapPin size={13} />
                  <span>{selectedPoint.name}</span>
                </div>
              </div>
              <div className={styles.selectedGrid}>
                <span><Wind size={13} /> {selectedPoint.speedLabel}</span>
                <span><Gauge size={13} /> Gust {selectedPoint.gustLabel}</span>
                <span><CloudSun size={13} /> {selectedPoint.directionLabel} / {Math.round(selectedPoint.direction ?? 0)} deg</span>
              </div>
            </section>
          )}

          <section className="drought-panel__section">
            <div className="drought-panel__section-header">
              <div className="drought-panel__section-title">
                <Wind size={13} />
                <span>Speed legend</span>
              </div>
            </div>
            <div className={styles.legend}>
              <span><i className={styles.low} /> 0-6 m/s</span>
              <span><i className={styles.medium} /> 6-10 m/s</span>
              <span><i className={styles.high} /> 10-15 m/s</span>
              <span><i className={styles.extreme} /> 15+ m/s</span>
            </div>
          </section>

          <section className="drought-panel__section">
            <div className="drought-panel__section-header">
              <div className="drought-panel__section-title">
                <Database size={13} />
                <span>Real weather API source</span>
              </div>
            </div>
            <SourceCard source={WIND_SOURCE} />
          </section>

          {error && (
            <div className="error__message">{error}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default WindControls;
