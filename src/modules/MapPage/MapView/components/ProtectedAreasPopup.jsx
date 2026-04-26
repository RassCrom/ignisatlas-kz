import PropTypes from 'prop-types';

const IUCN_LABELS = {
  'Ia':   'Ia — Строгий природный резерват',
  'Ib':   'Ib — Дикая природа',
  'II':   'II — Национальный парк',
  'III':  'III — Природный памятник',
  'IV':   'IV — Управление видами/местообитаниями',
  'V':    'V — Охраняемый ландшафт',
  'VI':   'VI — Охраняемый природный ресурс',
  'N/A':  'Не применимо',
};

const ProtectedAreasPopup = ({ popupRef, content, onClose }) => (
  <div ref={popupRef} className="ol-popup">
    {content && (() => {
      const { name, nameEng, desig, iucnCat, statusYr, repArea, mangAuth } = content;
      const displayName = name || nameEng || 'Охраняемая территория';
      const iucnLabel = IUCN_LABELS[iucnCat] || iucnCat || '—';

      return (
        <div className="fire-popup">
          <button className="ol-popup-closer" onClick={onClose} title="Закрыть" />

          <div
            className="fire-popup-header"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.9), rgba(5,150,105,0.85))' }}
          >
            <div className="fp-header-info">
              <span className="fire-icon">🌿</span>
              <span style={{ marginTop: '2px', fontSize: '12px', lineHeight: 1.3 }}>
                {displayName}
              </span>
            </div>
          </div>

          <div className="fp-date-chip">
            <span className="fp-title">{desig || 'Охраняемая территория'}</span>
            {statusYr && (
              <span style={{ marginLeft: 6, opacity: 0.6, fontSize: '10px' }}>
                с {statusYr} г.
              </span>
            )}
          </div>

          <div className="fire-popup-content">
            <div className="fire-popup-row">
              <div className="fire-popup-label">Категория МСОП:</div>
              <div className="fire-popup-value">{iucnLabel}</div>
            </div>
            {repArea > 0 && (
              <div className="fire-popup-row">
                <div className="fire-popup-label">Площадь:</div>
                <div className="fire-popup-value">
                  {Number(repArea).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} км²
                </div>
              </div>
            )}
            {mangAuth && (
              <div className="fire-popup-row">
                <div className="fire-popup-label">Управление:</div>
                <div className="fire-popup-value" style={{ maxWidth: 180, fontSize: '10px' }}>
                  {mangAuth}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    })()}
  </div>
);

ProtectedAreasPopup.propTypes = {
  popupRef: PropTypes.object.isRequired,
  content:  PropTypes.shape({
    name:     PropTypes.string,
    nameEng:  PropTypes.string,
    desig:    PropTypes.string,
    iucnCat:  PropTypes.string,
    statusYr: PropTypes.number,
    repArea:  PropTypes.number,
    mangAuth: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
};

export default ProtectedAreasPopup;
