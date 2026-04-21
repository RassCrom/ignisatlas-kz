import PropTypes from 'prop-types';

/* ── Stage labels from dn (spread order) ───────── */

const getSpreadStage = (dn) => {
  if (dn == null) return null;
  const n = parseFloat(dn);
  if (isNaN(n)) return null;
  if (n <  3)  return ['🔴', 'Начало распространения'];
  if (n <  8)  return ['🟠', 'Активное распространение'];
  if (n < 14)  return ['🟡', 'Расширение фронта'];
  if (n < 20)  return ['🔵', 'Затухание'];
  return            ['⚫', 'Поздняя стадия'];
};

/* ── Area formatter ─────────────────────────────── */

const fmtHa  = (ha)  => ha  != null ? `${parseFloat(ha).toFixed(2)}`  : null;
const fmtKm2 = (km2) => km2 != null ? `${parseFloat(km2).toFixed(4)}` : null;

/* ── Close button (reuses fire popup css) ───────── */

const CloseBtn = ({ onClose }) => (
  <button className="ol-popup-closer" onClick={onClose} title="Закрыть" />
);
CloseBtn.propTypes = { onClose: PropTypes.func.isRequired };

/* ── Main component ─────────────────────────────── */

const FireModelPopup = ({ popupRef, content, onClose }) => (
  <div ref={popupRef} className="ol-popup">
    {content && (() => {
      const props  = content.properties || {};
      const stage  = getSpreadStage(props.dn);
      const haStr  = fmtHa(props.area_ha);
      const km2Str = fmtKm2(props.area_sqkm);
      const hasKpi = haStr || km2Str || props.dn != null;

      return (
        <div className="fire-popup fmp">
          <CloseBtn onClose={onClose} />

          {/* Header */}
          <div className="fire-popup-header fmp-header">
            <span className="fire-icon">🔥</span>
            <div className="fp-header-info">
              <span className="fp-title">Распространение пожара</span>
            </div>
            {content.accuracy && (
              <span className="fmp-accuracy-badge">{content.accuracy}</span>
            )}
          </div>

          {/* Stage chip */}
          {stage && (
            <div className="fp-date-chip">
              <span>{stage[0]}</span>
              <span>{stage[1]}</span>
              {props.dn != null && (
                <span className="fmp-dn-badge">шаг {props.dn}</span>
              )}
            </div>
          )}

          <div className="fire-popup-content">

            {/* KPI grid: area (ha) / area (km²) / step */}
            {hasKpi && (
              <div className="fp-kpi-grid">
                {haStr && (
                  <div className="fp-kpi">
                    <span className="fp-kpi-val">{haStr}</span>
                    <span className="fp-kpi-lbl">га</span>
                  </div>
                )}
                {km2Str && (
                  <div className="fp-kpi">
                    <span className="fp-kpi-val fp-kpi-val--sm">{km2Str}</span>
                    <span className="fp-kpi-lbl">км²</span>
                  </div>
                )}
                {props.dn != null && (
                  <div className="fp-kpi">
                    <span className="fp-kpi-val">{props.dn}</span>
                    <span className="fp-kpi-lbl">Стадия</span>
                  </div>
                )}
              </div>
            )}

            {/* Detail rows */}
            {props.locality_names && (
              <div className="fire-popup-row">
                <div className="fire-popup-label">Местность:</div>
                <div className="fire-popup-value">{props.locality_names}</div>
              </div>
            )}
            {props.satellite && (
              <div className="fire-popup-row">
                <div className="fire-popup-label">Спутник:</div>
                <div className="fire-popup-value">{props.satellite}</div>
              </div>
            )}
            {props.fireimageid && (
              <div className="fire-popup-row">
                <div className="fire-popup-label">ID снимка:</div>
                <div className="fire-popup-value fmp-id">{props.fireimageid}</div>
              </div>
            )}

          </div>

          {/* Timeline legend */}
          <div className="fire-popup-footer fmp-legend">
            <span className="fmp-legend-label">Начало</span>
            <div className="fmp-legend-bar" />
            <span className="fmp-legend-label">Конец</span>
          </div>
        </div>
      );
    })()}
  </div>
);

FireModelPopup.propTypes = {
  popupRef: PropTypes.object.isRequired,
  content:  PropTypes.shape({
    coordinate: PropTypes.array,
    accuracy:   PropTypes.string,
    properties: PropTypes.shape({
      dn:             PropTypes.number,
      area_ha:        PropTypes.number,
      area_sqkm:      PropTypes.number,
      locality_names: PropTypes.string,
      satellite:      PropTypes.string,
      fireimageid:    PropTypes.string,
    }),
  }),
  onClose: PropTypes.func.isRequired,
};

export default FireModelPopup;
