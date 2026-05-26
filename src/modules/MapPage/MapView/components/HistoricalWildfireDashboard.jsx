import {
  CalendarDays,
  Droplets,
  Eye,
  EyeOff,
  Flame,
  Focus,
  MapPin,
  ShieldAlert,
  X,
} from 'lucide-react';
import useHistoricalWildfireStore from 'src/app/store/historicalWildfireStore';
import { getMapInstance } from 'src/modules/MapPage/services/mapService';
import { fitCaseBounds } from 'src/modules/MapPage/hooks/useHistoricalWildfireLayer';
import { getHistoricalWildfireCase } from 'src/utils/historicalWildfireCases';
import { getHistoricalFloodCase } from 'src/utils/historicalFloodCases';
import styles from './HistoricalWildfireDashboard.module.scss';

const formatArea = (areaHa) => `${areaHa.toLocaleString('ru-RU')} га`;

const AreaBars = ({ items }) => {
  const maxValue = Math.max(...items.map((item) => item.areaHa), 1);

  return (
    <div className={styles.bars} aria-label="Динамика площади">
      {items.map((item) => (
        <div key={item.label} className={styles.barColumn}>
          <div className={styles.barTrack}>
            <span
              className={styles.bar}
              style={{ height: `${Math.max(12, (item.areaHa / maxValue) * 86)}px` }}
              title={`${item.label}: ${formatArea(item.areaHa)}`}
            />
          </div>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

const TerritoryRows = ({ items }) => (
  <div className={styles.territoryRows}>
    {items.map((item) => (
      <div key={item.label} className={styles.territoryRow}>
        <span className={styles.territoryName}>
          <span className={styles.dot} style={{ background: item.color }} />
          {item.label}
        </span>
        <span className={styles.track}>
          <span className={styles.fill} style={{ width: `${item.value}%`, background: item.color }} />
        </span>
        <strong>{item.value}%</strong>
      </div>
    ))}
  </div>
);

const HistoricalWildfireDashboard = () => {
  const selectedCaseId = useHistoricalWildfireStore((state) => state.selectedCaseId);
  const caseType = useHistoricalWildfireStore((state) => state.caseType);
  const dashboardOpen = useHistoricalWildfireStore((state) => state.dashboardOpen);
  const layerVisible = useHistoricalWildfireStore((state) => state.layerVisible);
  const clearSelection = useHistoricalWildfireStore((state) => state.clearSelection);
  const toggleLayerVisible = useHistoricalWildfireStore((state) => state.toggleLayerVisible);

  const selectedCase = selectedCaseId
    ? (caseType === 'flood' ? getHistoricalFloodCase(selectedCaseId) : getHistoricalWildfireCase(selectedCaseId))
    : null;

  if (!selectedCase || !dashboardOpen) return null;

  const isFlood = caseType === 'flood';
  const areaHa = isFlood ? selectedCase.affectedAreaHa : selectedCase.burnedAreaHa;
  const areaLabel = isFlood ? 'Площадь затопления' : 'Площадь пожара';

  const handleFocus = () => {
    fitCaseBounds(getMapInstance(), selectedCase);
  };

  return (
    <aside className={styles.dashboard} aria-label="Карточка исторического события">
      <header className={styles.header}>
        <div className={styles.titleWrap}>
          <span className={styles.icon} style={{ color: selectedCase.color }}>
            {isFlood ? <Droplets size={17} /> : <Flame size={17} />}
          </span>
          <div>
            <span className={styles.kicker}>
              {isFlood ? 'Исторический паводок' : 'Исторический пожар'}
            </span>
            <h2>{selectedCase.title}</h2>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={toggleLayerVisible}
            title={layerVisible ? 'Скрыть зону АОИ' : 'Показать зону АОИ'}
            aria-label={layerVisible ? 'Скрыть зону АОИ' : 'Показать зону АОИ'}
          >
            {layerVisible ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>
          <button type="button" onClick={handleFocus} title="Приблизить к АОИ" aria-label="Приблизить к АОИ">
            <Focus size={15} />
          </button>
          <button type="button" onClick={clearSelection} title="Закрыть" aria-label="Закрыть карточку">
            <X size={15} />
          </button>
        </div>
      </header>

      <div className={styles.metaGrid}>
        <div>
          <CalendarDays size={13} />
          <span>{selectedCase.period}</span>
        </div>
        <div>
          <MapPin size={13} />
          <span>{selectedCase.location}</span>
        </div>
        <div>
          <ShieldAlert size={13} />
          <span>{selectedCase.severity}</span>
        </div>
      </div>

      <div className={styles.statGrid}>
        {selectedCase.stats.map((stat) => (
          <div key={stat.label} className={styles.stat}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>{areaLabel}</h3>
          <span>{formatArea(areaHa)}</span>
        </div>
        <AreaBars items={selectedCase.timeline} />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Территория</h3>
          <span>{selectedCase.territory}</span>
        </div>
        <TerritoryRows items={selectedCase.landCover} />
      </section>

      <section className={styles.impact}>
        <h3>Дополнительные сведения</h3>
        <p>{selectedCase.impact}</p>
        <span>Источник: {selectedCase.sourceLabel}</span>
      </section>

      <p className={styles.note}>{selectedCase.sourceNote}</p>
    </aside>
  );
};

export default HistoricalWildfireDashboard;
