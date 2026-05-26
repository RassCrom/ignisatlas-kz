import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Droplets,
  Eye,
  EyeOff,
  Focus,
  Info,
  MapPin,
} from 'lucide-react';
import useHistoricalWildfireStore from 'src/app/store/historicalWildfireStore';
import { HISTORICAL_FLOOD_CASES, getHistoricalFloodCase } from 'src/utils/historicalFloodCases';
import './FireControls/fireControls.scss';
import styles from './HistoricalWildfiresControls.module.scss';

const formatArea = (areaHa) => `${areaHa.toLocaleString('ru-RU')} га`;

const MiniBars = ({ items }) => {
  const maxValue = Math.max(...items.map((item) => item.areaHa), 1);

  return (
    <div className={styles.miniBars} aria-label="Динамика площади затопления">
      {items.map((item) => (
        <div key={item.label} className={styles.miniBarColumn}>
          <div className={styles.miniBarTrack}>
            <span
              className={styles.miniBar}
              style={{ height: `${Math.max(10, (item.areaHa / maxValue) * 58)}px`, background: '#60a5fa' }}
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

const HistoricalFloodsControls = () => {
  const selectedCaseId = useHistoricalWildfireStore((state) => state.selectedCaseId);
  const caseType = useHistoricalWildfireStore((state) => state.caseType);
  const layerVisible = useHistoricalWildfireStore((state) => state.layerVisible);
  const selectCase = useHistoricalWildfireStore((state) => state.selectCase);
  const toggleLayerVisible = useHistoricalWildfireStore((state) => state.toggleLayerVisible);

  const maxArea = Math.max(...HISTORICAL_FLOOD_CASES.map((c) => c.affectedAreaHa));
  const selectedCase = selectedCaseId && caseType === 'flood'
    ? getHistoricalFloodCase(selectedCaseId)
    : HISTORICAL_FLOOD_CASES[0];

  return (
    <div className="fire-controls">
      <div className="fire-controls__header">
        <div className="fire-controls__toggle">
          <div className="fire-controls__toggle-icon">
            <Droplets size={16} className="fire-controls__icon-active" style={{ color: '#60a5fa' }} />
          </div>
          <span className="fire-controls__toggle-label">Исторические паводки</span>
        </div>
      </div>

      <div className="fire-controls__content">
        <div className={styles.panel}>
          <section className={styles.intro}>
            <h3><BarChart3 size={15} /> Реальные случаи паводков</h3>
            <p>Выберите паводковое событие, чтобы показать зону затопления и открыть карточку.</p>
          </section>

          <div className={styles.caseList}>
            {HISTORICAL_FLOOD_CASES.map((eventCase) => {
              const isActive = selectedCaseId === eventCase.id && caseType === 'flood';
              const width = Math.max(8, (eventCase.affectedAreaHa / maxArea) * 100);

              return (
                <button
                  key={eventCase.id}
                  type="button"
                  className={`${styles.caseCard} ${isActive ? styles.caseCardActive : ''}`}
                  onClick={() => selectCase(eventCase.id, 'flood')}
                  aria-pressed={isActive}
                >
                  <span className={styles.caseTop}>
                    <span className={styles.caseIcon} style={{ color: eventCase.color }}>
                      <Droplets size={15} />
                    </span>
                    <span className={styles.caseText}>
                      <strong>{eventCase.title}</strong>
                      <span>{eventCase.location}</span>
                    </span>
                    {isActive && <CheckCircle2 size={15} className={styles.activeIcon} />}
                  </span>
                  <span className={styles.caseMeta}>
                    <span><CalendarDays size={12} /> {eventCase.period}</span>
                    <span><MapPin size={12} /> {formatArea(eventCase.affectedAreaHa)}</span>
                  </span>
                  <span className={styles.areaTrack} aria-hidden="true">
                    <span
                      className={styles.areaFill}
                      style={{ width: `${width}%`, background: eventCase.color }}
                    />
                  </span>
                </button>
              );
            })}
          </div>

          {selectedCase && (
            <section className={styles.dashboardPreview}>
              <div className={styles.previewHeader}>
                <div>
                  <span className={styles.kicker}>Выбранный случай</span>
                  <h4>{selectedCase.title}</h4>
                </div>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={toggleLayerVisible}
                  title={layerVisible ? 'Скрыть зону АОИ' : 'Показать зону АОИ'}
                  aria-label={layerVisible ? 'Скрыть зону АОИ' : 'Показать зону АОИ'}
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
                <div className={styles.blockTitle}><Focus size={13} /> Динамика площади затопления</div>
                <MiniBars items={selectedCase.timeline} />
              </div>

              <div className={styles.chartBlock}>
                <div className={styles.blockTitle}><Info size={13} /> Состав территории</div>
                <LandCoverRows items={selectedCase.landCover} />
              </div>

              <div className={styles.note}>{selectedCase.sourceNote}</div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoricalFloodsControls;
