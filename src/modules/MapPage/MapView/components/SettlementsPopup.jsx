import PropTypes from 'prop-types';

const FCLASS_LABELS = {
  national_capital: 'Столица',
  city:             'Город',
  town:             'Посёлок',
  village:          'Село',
  suburb:           'Пригород',
};

const FCLASS_ICONS = {
  national_capital: '🌟',
  city:             '🏙',
  town:             '🏘',
  village:          '🌾',
  suburb:           '🏡',
};

const FCLASS_GRADIENTS = {
  national_capital: 'rgba(180,120,0,.9), rgba(220,160,0,.85)',
  city:             'rgba(37,99,235,.9), rgba(6,182,212,.85)',
  town:             'rgba(109,40,217,.9), rgba(79,70,229,.85)',
  village:          'rgba(22,163,74,.9), rgba(21,128,61,.85)',
  suburb:           'rgba(71,85,105,.9), rgba(51,65,85,.85)',
};

const SettlementsPopup = ({ popupRef, content, onClose }) => (
  <div ref={popupRef} className="ol-popup">
    {content && (() => {
      const { name, population, fclass } = content;
      const icon      = FCLASS_ICONS[fclass]     || '📍';
      const gradient  = FCLASS_GRADIENTS[fclass]  || FCLASS_GRADIENTS.suburb;
      const typeLabel = FCLASS_LABELS[fclass]     || fclass;

      return (
        <div className="fire-popup">
          <button className="ol-popup-closer" onClick={onClose} title="Закрыть" />

          <div
            className="fire-popup-header"
            style={{ background: `linear-gradient(135deg, ${gradient})` }}
          >
            <span className="fire-icon">{icon}</span>
            <div className="fp-header-info">
              <span className="fp-title">{typeLabel}</span>
            </div>
          </div>

          <div className="fp-date-chip">
            <span>🏙</span>
            <span>{name || 'N/A'}</span>
          </div>

          <div className="fire-popup-content">
            <div className="fire-popup-row">
              <div className="fire-popup-label">Население:</div>
              <div className="fire-popup-value">
                {population
                  ? Number(population).toLocaleString('ru-RU') + ' чел.'
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      );
    })()}
  </div>
);

SettlementsPopup.propTypes = {
  popupRef: PropTypes.object.isRequired,
  content:  PropTypes.shape({
    name:       PropTypes.string,
    population: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    fclass:     PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
};

export default SettlementsPopup;
