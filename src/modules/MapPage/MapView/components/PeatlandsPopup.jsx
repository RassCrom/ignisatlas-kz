import PropTypes from 'prop-types';

const DN_LABELS = {
  1: { ru: 'Торфяные почвы',       color: 'rgba(101,56,12,0.9)'  },
  2: { ru: 'Торф в мозаике почв',  color: 'rgba(160,105,45,0.9)' },
};

const PeatlandsPopup = ({ popupRef, content, onClose }) => (
  <div ref={popupRef} className="ol-popup">
    {content && (() => {
      const info = DN_LABELS[content.dn] || { ru: 'Торфяник', color: 'rgba(130,80,28,0.9)' };

      return (
        <div className="fire-popup">
          <button className="ol-popup-closer" onClick={onClose} title="Закрыть" />

          <div
            className="fire-popup-header"
            style={{
              background: `linear-gradient(135deg, ${info.color}, rgba(80,40,8,0.85))`,
            }}
          >
            <div className="fp-header-info">
              <span className="fire-icon">🌿</span>
              <span style={{ marginTop: '2px', fontWeight: 700 }}>Торфяник</span>
            </div>
          </div>

          <div className="fp-date-chip">
            <span className="fp-title">{info.ru}</span>
          </div>

          <div className="fire-popup-content">
            <div className="fire-popup-row">
              <div className="fire-popup-label">Тип:</div>
              <div className="fire-popup-value" style={{ textTransform: 'capitalize' }}>
                {content.description || '—'}
              </div>
            </div>
            <div className="fire-popup-row">
              <div className="fire-popup-label">Код DN:</div>
              <div className="fire-popup-value">{content.dn ?? '—'}</div>
            </div>
          </div>
        </div>
      );
    })()}
  </div>
);

PeatlandsPopup.propTypes = {
  popupRef: PropTypes.object.isRequired,
  content:  PropTypes.shape({
    dn:          PropTypes.number,
    description: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
};

export default PeatlandsPopup;
