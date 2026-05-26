import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  Flame,
  Focus,
  Info,
  MapPin,
} from 'lucide-react';
import useHistoricalWildfireStore from 'src/app/store/historicalWildfireStore';
import { HISTORICAL_WILDFIRE_CASES, getHistoricalWildfireCase } from 'src/utils/historicalWildfireCases';
import './FireControls/fireControls.scss';
import styles from './HistoricalWildfiresControls.module.scss';

const maxBurnedArea = Math.max(...HISTORICAL_WILDFIRE_CASES.map((item) => item.burnedAreaHa));

const formatArea = (areaHa) => `${areaHa.toLocaleString('en-US')} ha`;

const MiniBars = ({ items }) => {
  const maxValue = Math.max(...items.map((item) => item.areaHa), 1);

  return (
    <div className={styles.miniBars} aria-label="Burned area timeline">
      {items.map((item) => (
        <div key={item.label} className={styles.miniBarColumn}>
          <div className={styles.miniBarTrack}>
            <span
              className={styles.miniBar}
              style={{ height: `${Math.max(10, (item.areaHa / maxValue) * 58)}px` }}
              title={`${item.label}: ${formatArea(item.areaHa)}`}
            />
          </div>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

const LandCoverRows = ({ items }) => (
  <div className={styles.landCoverRows}>
    {items.map((item) => (
      <div key={item.label} className={styles.landCoverRow}>
        <div className={styles.landCoverLabel}>
          <span className={styles.landCoverDot} style={{ background: item.color }} />
          <span>{item.label}</span>
        </div>
        <div className={styles.landCoverTrack}>
          <span
            className={styles.landCoverFill}
            style={{ width: `${item.value}%`, background: item.color }}
          />
        </div>
        <strong>{item.value}%</strong>
      </div>
    ))}
  </div>
);

const HistoricalWildfiresControls = () => {
  const selectedCaseId = useHistoricalWildfireStore((state) => state.selectedCaseId);
  const layerVisible = useHistoricalWildfireStore((state) => state.layerVisible);
  const selectCase = useHistoricalWildfireStore((state) => state.selectCase);
  const toggleLayerVisible = useHistoricalWildfireStore((state) => state.toggleLayerVisible);
  const selectedCase = getHistoricalWildfireCase(selectedCaseId) || HISTORICAL_WILDFIRE_CASES[0];

  return (
    <div className="fire-controls">
      <div className="fire-controls__header">
        <div className="fire-controls__toggle">
          <div className="fire-controls__toggle-icon">
            <Flame size={16} className="fire-controls__icon-active" />
          </div>
          <span className="fire-controls__toggle-label">Historical wildfires</span>
        </div>
      </div>

      <div className="fire-controls__content">
        <div className={styles.panel}>
          <section className={styles.intro}>
            <h3>
              <BarChart3 size={15} />
              Real wildfire cases
            </h3>
            <p>
              Select a past event to focus the map, draw its placeholder AOI, and open the case dashboard.
            </p>
          </section>

          <div className={styles.caseList}>
            {HISTORICAL_WILDFIRE_CASES.map((wildfireCase) => {
              const isActive = selectedCaseId === wildfireCase.id;
              const width = Math.max(8, (wildfireCase.burnedAreaHa / maxBurnedArea) * 100);

              return (
                <button
                  key={wildfireCase.id}
                  type="button"
                  className={`${styles.caseCard} ${isActive ? styles.caseCardActive : ''}`}
                  onClick={() => selectCase(wildfireCase.id)}
                  aria-pressed={isActive}
                >
                  <span className={styles.caseTop}>
                    <span className={styles.caseIcon} style={{ color: wildfireCase.color }}>
                      <Flame size={15} />
                    </span>
                    <span className={styles.caseText}>
                      <strong>{wildfireCase.title}</strong>
                      <span>{wildfireCase.location}</span>
                    </span>
                    {isActive && <CheckCircle2 size={15} className={styles.activeIcon} />}
                  </span>

                  <span className={styles.caseMeta}>
                    <span><CalendarDays size={12} /> {wildfireCase.period}</span>
                    <span><MapPin size={12} /> {formatArea(wildfireCase.burnedAreaHa)}</span>
                  </span>

                  <span className={styles.areaTrack} aria-hidden="true">
                    <span
                      className={styles.areaFill}
                      style={{ width: `${width}%`, background: wildfireCase.color }}
                    />
                  </span>
                </button>
              );
            })}
          </div>

          <section className={styles.dashboardPreview}>
            <div className={styles.previewHeader}>
              <div>
                <span className={styles.kicker}>Selected case</span>
                <h4>{selectedCase.title}</h4>
              </div>
              <button
                type="button"
                className={styles.iconButton}
                onClick={toggleLayerVisible}
                title={layerVisible ? 'Hide AOI layer' : 'Show AOI layer'}
                aria-label={layerVisible ? 'Hide AOI layer' : 'Show AOI layer'}
              >
                {layerVisible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>

            <div className={styles.statGrid}>
              {selectedCase.stats.map((stat) => (
                <div key={stat.label} className={styles.stat}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>

            <div className={styles.chartBlock}>
              <div className={styles.blockTitle}>
                <Focus size={13} />
                Burned area progression
              </div>
              <MiniBars items={selectedCase.timeline} />
            </div>

            <div className={styles.chartBlock}>
              <div className={styles.blockTitle}>
                <Info size={13} />
                Territory mix
              </div>
              <LandCoverRows items={selectedCase.landCover} />
            </div>

            <div className={styles.note}>{selectedCase.sourceNote}</div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HistoricalWildfiresControls;
