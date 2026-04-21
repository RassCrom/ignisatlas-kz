import PropTypes from 'prop-types';

/* ── Layer identity config ──────────────────────────── */

const LAYER_ICONS = {
  ava_ss:           '🚨',
  fire_departments: '🚒',
  fire_hydrants:    '💧',
  hospitals:        '🏥',
  kaz_avia:         '✈️',
  oso:              '🏛',
  ps:               '📍',
  fire_trains:      '🚂',
};

// Gradient colours per layer — 135deg, two stops
const HEADER_GRADIENT = {
  fire_departments: 'rgba(220,38,38,.88), rgba(249,115,22,.82)',
  hospitals:        'rgba(16,185,129,.88), rgba(5,150,105,.82)',
  fire_hydrants:    'rgba(37,99,235,.88),  rgba(6,182,212,.82)',
  kaz_avia:         'rgba(99,102,241,.88), rgba(37,99,235,.82)',
  ava_ss:           'rgba(234,88,12,.88),  rgba(245,158,11,.82)',
  fire_trains:      'rgba(79,70,229,.88),  rgba(124,58,237,.82)',
  oso:              'rgba(109,40,217,.88), rgba(79,70,229,.82)',
  ps:               'rgba(20,184,166,.88), rgba(16,185,129,.82)',
};
const DEFAULT_GRADIENT = 'rgba(99,102,241,.88), rgba(79,70,229,.82)';

/* ── Property display ───────────────────────────────── */

// Internal / redundant keys → skip in generic rows
const SKIP_PROPS = new Set([
  'geometry',
  'name',    'Name',    'NAME',
  'address', 'Address', 'ADDRESS',
  'KATO', 'KATO_obl', 'KATO_rai', 'Kato_obl',
  'USL', 'UNIT_ID', 'DIC_MES_OR',
  'region', 'district', 'Forma_sobs', 'Tip',
]);

// Russian labels for known property keys
const PROP_LABELS = {
  staff:      'Личный состав',
  tech_base:  'Техника (осн.)',
  tech_spec:  'Техника (спец.)',
  tech_anc:   'Техника (вспом.)',
  Contacts:   'Контакты',
  Chislo_koe: 'Койко-мест',
  Posesh_v_s: 'Посещений/сут.',
  AVIAPARK:   'Авиапарк',
};

/* ── Helpers ────────────────────────────────────────── */

// Case-insensitive property lookup
const findProp = (props, ...keys) => {
  for (const k of keys) {
    if (props[k] != null && props[k] !== '') return String(props[k]);
  }
  return null;
};

/* ── Component ──────────────────────────────────────── */

const EmergencyPopup = ({ popupRef, content, onClose }) => (
  <div ref={popupRef} className="ol-popup">
    {content && (() => {
      const { layerId, layerName, properties: props } = content;

      const icon       = LAYER_ICONS[layerId]     || '📌';
      const gradient   = HEADER_GRADIENT[layerId] || DEFAULT_GRADIENT;
      const name       = findProp(props, 'name', 'Name', 'NAME');
      const address    = findProp(props, 'address', 'Address', 'ADDRESS');

      // Collect labeled extra rows, skipping empties and unlabeled keys
      const extraRows = Object.entries(props)
        .filter(([key, val]) =>
          !SKIP_PROPS.has(key) &&
          val != null && val !== '' &&
          PROP_LABELS[key]
        )
        .map(([key, val]) => ({ label: PROP_LABELS[key], value: String(val) }));

      return (
        <div className="fire-popup emp">
          <button className="ol-popup-closer" onClick={onClose} title="Закрыть" />

          {/* Header — layer-specific colour */}
          <div
            className="fire-popup-header"
            style={{ background: `linear-gradient(135deg, ${gradient})` }}
          >
            <span className="fire-icon">{icon}</span>
            <div className="fp-header-info">
              <span className="fp-title">{layerName}</span>
            </div>
          </div>

          {/* Facility name chip */}
          {name && (
            <div className="fp-date-chip emp-name-chip">
              <span>🏢</span>
              <span>{name}</span>
            </div>
          )}

          <div className="fire-popup-content">

            {/* Address */}
            {address && (
              <div className="fire-popup-row">
                <div className="fire-popup-label">Адрес:</div>
                <div className="fire-popup-value emp-address">{address}</div>
              </div>
            )}

            {/* Labeled props (staff, beds, equipment, etc.) */}
            {extraRows.map(({ label, value }) => (
              <div key={label} className="fire-popup-row">
                <div className="fire-popup-label">{label}:</div>
                <div className="fire-popup-value">{value}</div>
              </div>
            ))}

          </div>
        </div>
      );
    })()}
  </div>
);

EmergencyPopup.propTypes = {
  popupRef:  PropTypes.object.isRequired,
  content:   PropTypes.shape({
    layerId:    PropTypes.string,
    layerName:  PropTypes.string,
    properties: PropTypes.object,
  }),
  onClose:   PropTypes.func.isRequired,
};

export default EmergencyPopup;
