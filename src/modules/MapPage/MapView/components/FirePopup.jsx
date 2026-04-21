import PropTypes from 'prop-types';

/* ── Shared close button ─────────────────────────── */

const CloseBtn = ({ onClose }) => (
  <button className="ol-popup-closer" onClick={onClose} title="Закрыть" />
);
CloseBtn.propTypes = { onClose: PropTypes.func.isRequired };

/* ── Cluster popup ───────────────────────────────── */

const ClusterPopup = ({ content, onClose, onWeather }) => (
  <div className="fire-popup fire-cluster">
    <CloseBtn onClose={onClose} />
    <div className="fire-popup-header">
      <span className="fire-icon">🔥</span>
      <span>Скопление очагов</span>
      <span className="cluster-count">{content.count}</span>
    </div>

    <div className="fire-popup-content">
      <div className="fire-popup-row">
        <div className="fire-popup-label">Точек:</div>
        <div className="fire-popup-value">{content.count}</div>
      </div>
      {content.dateRange?.start && (
        <div className="fire-popup-row">
          <div className="fire-popup-label">Период:</div>
          <div className="fire-popup-value">
            {content.dateRange.start} — {content.dateRange.end}
          </div>
        </div>
      )}
    </div>

    <div className="fire-popup-footer fp-actions">
      <button className="fp-btn fp-btn--weather" onClick={() => onWeather?.(content.coordinate)}>
        ☁ Погода здесь
      </button>
    </div>
  </div>
);
ClusterPopup.propTypes = {
  content: PropTypes.shape({
    count:      PropTypes.number,
    coordinate: PropTypes.array,
    dateRange:  PropTypes.shape({ start: PropTypes.string, end: PropTypes.string }),
  }).isRequired,
  onClose:   PropTypes.func.isRequired,
  onWeather: PropTypes.func,
};

/* ── Single fire point popup ─────────────────────── */

const FirePointPopup = ({ content, onClose, onWeather, onFireModel }) => {
  const { name, date, confidence, power, model, fireImageId, isTechnogenic, extra } = content;
  const hasKpi = power || (confidence?.raw && !isNaN(parseFloat(confidence.raw))) || model;

  return (
    <div className="fire-popup">
      <CloseBtn onClose={onClose} />

      {/* Header */}
      <div className="fire-popup-header">
        <span className="fire-icon">🔥</span>
        <div className="fp-header-info">
          <span className="fp-title">{name}</span>
        </div>
        {confidence && (
          <span className={`confidence-badge confidence-${confidence.level}`}>
            {confidence.label}
          </span>
        )}
      </div>

      {/* Date chip */}
      {date && (
        <div className="fp-date-chip">
          <span>📅</span>
          <span>{date}</span>
        </div>
      )}

      <div className="fire-popup-content">

        {/* KPI row: power / confidence / model */}
        {hasKpi && (
          <div className="fp-kpi-grid">
            {power && (
              <div className="fp-kpi">
                <span className="fp-kpi-val">{parseFloat(power).toFixed(1)}</span>
                <span className="fp-kpi-lbl">МВт FRP</span>
              </div>
            )}
            {confidence?.raw && !isNaN(parseFloat(confidence.raw)) && (
              <div className="fp-kpi">
                <span className="fp-kpi-val">{parseFloat(confidence.raw).toFixed(0)}%</span>
                <span className="fp-kpi-lbl">Точность</span>
              </div>
            )}
            {model && (
              <div className="fp-kpi">
                <span className="fp-kpi-val fp-kpi-val--sm">{model}</span>
                <span className="fp-kpi-lbl">Модель</span>
              </div>
            )}
          </div>
        )}

        {/* Extra props */}
        {extra?.length > 0 && (
          <div className={hasKpi ? 'fp-extra' : ''}>
            {extra.map(({ key, value }) => (
              <div key={key} className="fire-popup-row">
                <div className="fire-popup-label">{key}:</div>
                <div className="fire-popup-value">{value}</div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Footer actions */}
      <div className="fire-popup-footer fp-actions">
        <button className="fp-btn fp-btn--weather" onClick={() => onWeather?.(content.coordinate)}>
          ☁ Погода здесь
        </button>
        {!isTechnogenic && fireImageId && onFireModel && (
          <button className="fp-btn fp-btn--model" onClick={() => onFireModel(fireImageId)}>
            🔥 Модель пожара
          </button>
        )}
      </div>
    </div>
  );
};
FirePointPopup.propTypes = {
  content: PropTypes.shape({
    name:           PropTypes.string,
    date:           PropTypes.string,
    coordinate:     PropTypes.array,
    confidence:     PropTypes.shape({ level: PropTypes.string, label: PropTypes.string, raw: PropTypes.string }),
    power:          PropTypes.string,
    model:          PropTypes.string,
    fireImageId:    PropTypes.string,
    isTechnogenic:  PropTypes.bool,
    extra:          PropTypes.arrayOf(PropTypes.shape({ key: PropTypes.string, value: PropTypes.string })),
  }).isRequired,
  onClose:      PropTypes.func.isRequired,
  onWeather:    PropTypes.func,
  onFireModel:  PropTypes.func,
};

/* ── Main wrapper ────────────────────────────────── */

/**
 * FirePopup — anchored OL overlay popup for fire features.
 * Receives a structured `content` object from PopupManager (not an HTML string).
 */
const FirePopup = ({ popupRef, content, onClose, onWeather, onFireModel }) => (
  <div ref={popupRef} className="ol-popup">
    {content?.type === 'fire-cluster' && (
      <ClusterPopup content={content} onClose={onClose} onWeather={onWeather} />
    )}
    {content?.type === 'fire-point' && (
      <FirePointPopup
        content={content}
        onClose={onClose}
        onWeather={onWeather}
        onFireModel={onFireModel}
      />
    )}
  </div>
);
FirePopup.propTypes = {
  popupRef:    PropTypes.object.isRequired,
  content:     PropTypes.object,
  onClose:     PropTypes.func.isRequired,
  onWeather:   PropTypes.func,
  onFireModel: PropTypes.func,
};

export default FirePopup;
