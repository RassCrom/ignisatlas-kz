import PropTypes from 'prop-types';

const KOPPEN_GROUPS = {
  B: { label: 'Засушливый климат', labelEn: 'Arid / Semi-arid' },
  C: { label: 'Умеренный климат', labelEn: 'Temperate' },
  D: { label: 'Континентальный климат', labelEn: 'Continental' },
  E: { label: 'Полярный климат', labelEn: 'Polar / Tundra' },
};

const getGroup = (koppen) => KOPPEN_GROUPS[koppen?.[0]] || { label: 'Климат', labelEn: 'Climate' };

const ClimateZonesPopup = ({ popupRef, content, onClose }) => (
  <div ref={popupRef} className="ol-popup">
    {content && (() => {
      const { koppen, koppenDesc, color } = content;
      const group = getGroup(koppen);

      return (
        <div className="fire-popup">
          <button className="ol-popup-closer" onClick={onClose} title="Закрыть" />

          <div
            className="fire-popup-header"
            style={{ background: `linear-gradient(135deg, ${color}cc, ${color}99)` }}
          >
            <div className="fp-header-info">
              <span className="fire-icon">🌍</span>
              <span style={{ marginTop: '2px', fontWeight: 700 }}>{koppen}</span>
            </div>
          </div>

          <div className="fp-date-chip">
            <span className="fp-title">{group.label}</span>
          </div>

          <div className="fire-popup-content">
            <div className="fire-popup-row">
              <div className="fire-popup-label">Код Кёппена:</div>
              <div className="fire-popup-value">{koppen || '—'}</div>
            </div>
            <div className="fire-popup-row">
              <div className="fire-popup-label">Описание:</div>
              <div className="fire-popup-value" style={{ maxWidth: 180 }}>
                {koppenDesc || '—'}
              </div>
            </div>
            <div className="fire-popup-row">
              <div className="fire-popup-label">Группа:</div>
              <div className="fire-popup-value">{group.labelEn}</div>
            </div>
          </div>
        </div>
      );
    })()}
  </div>
);

ClimateZonesPopup.propTypes = {
  popupRef: PropTypes.object.isRequired,
  content:  PropTypes.shape({
    koppen:     PropTypes.string,
    koppenDesc: PropTypes.string,
    color:      PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
};

export default ClimateZonesPopup;
