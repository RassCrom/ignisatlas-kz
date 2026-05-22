import PropTypes from 'prop-types';

const DroughtPopup = ({ popupRef, content, onClose }) => (
  <div ref={popupRef} className="ol-popup">
    {content && (
      <div className="fire-popup">
        <button className="ol-popup-closer" onClick={onClose} title="Закрыть" />

        <div
          className="fire-popup-header"
          style={{ background: 'linear-gradient(135deg, rgba(214,97,47,0.92), rgba(146,64,14,0.88))' }}
        >
          <div className="fp-header-info">
            <span className="fire-icon">DR</span>
            <span style={{ marginTop: '2px', fontSize: '12px', lineHeight: 1.3 }}>
              {content.drought_region_name}
            </span>
          </div>
        </div>

        <div className="fp-date-chip">
          <span className="fp-title">{content.drought_severity_label}</span>
          <span style={{ marginLeft: 6, opacity: 0.65, fontSize: '10px' }}>
            score {content.drought_score}
          </span>
        </div>

        <div className="fire-popup-content">
          <div className="fire-popup-row">
            <div className="fire-popup-label">NDVI anomaly:</div>
            <div className="fire-popup-value">{content.drought_ndvi_anomaly}%</div>
          </div>
          <div className="fire-popup-row">
            <div className="fire-popup-label">LST anomaly:</div>
            <div className="fire-popup-value">
              {Number(content.drought_lst_anomaly) > 0 ? '+' : ''}{content.drought_lst_anomaly} C
            </div>
          </div>
          <div className="fire-popup-row">
            <div className="fire-popup-label">Soil moisture:</div>
            <div className="fire-popup-value">{content.drought_soil_moisture}%</div>
          </div>
        </div>
      </div>
    )}
  </div>
);

DroughtPopup.propTypes = {
  popupRef: PropTypes.object.isRequired,
  content: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

export default DroughtPopup;
