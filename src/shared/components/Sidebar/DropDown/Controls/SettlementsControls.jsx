import { useState, useCallback } from 'react';
import { Eye, EyeOff, Sliders, MapPin } from 'lucide-react';
import useSettlementsStore from 'src/app/store/settlementsStore';
import './FireControls/fireControls.scss';

const FCLASS_LEGEND = [
  { fclass: 'national_capital', label: 'Столица',  color: '#FFD700', shape: 'star'   },
  { fclass: 'city',             label: 'Город',    color: '#3b82f6', shape: 'circle' },
  { fclass: 'town',             label: 'Посёлок',  color: '#8b5cf6', shape: 'circle' },
  { fclass: 'village',          label: 'Село',     color: '#22c55e', shape: 'circle' },
  { fclass: 'suburb',           label: 'Пригород', color: '#94a3b8', shape: 'circle' },
];

const SettlementsControls = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const visible       = useSettlementsStore((state) => state.visible);
  const opacity       = useSettlementsStore((state) => state.opacity);
  const toggleVisible = useSettlementsStore((state) => state.toggleVisible);
  const setOpacity    = useSettlementsStore((state) => state.setOpacity);

  const handleOpacityChange = useCallback(
    (e) => setOpacity(Number(e.target.value) / 100),
    [setOpacity]
  );

  return (
    <div className="fire-controls">
      <div className="fire-controls__header">
        <div className="fire-controls__toggle" onClick={toggleVisible}>
          <div className="fire-controls__toggle-icon">
            {visible
              ? <Eye size={16} className="fire-controls__icon-active" />
              : <EyeOff size={16} className="fire-controls__icon-inactive" />
            }
          </div>
          <span className="fire-controls__toggle-label">Населённые пункты</span>
          <MapPin
            size={16}
            className={`fire-controls__flame-icon ${visible ? 'fire-controls__flame-icon--active' : ''}`}
          />
        </div>

        <button
          className={`fire-controls__expand-btn ${isExpanded ? 'fire-controls__expand-btn--expanded' : ''}`}
          onClick={() => setIsExpanded((v) => !v)}
        >
          <Sliders size={14} />
        </button>
      </div>

      {isExpanded && (
        <div className="fire-controls__content">

          {/* Opacity slider */}
          <div className="fire-controls__section">
            <div className="fire-modelling__control-row" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="fire-controls__label" style={{ margin: 0 }}>
                  Непрозрачность
                </span>
                <span style={{ fontSize: '10px', color: 'rgba(217,218,245,0.6)', fontWeight: 600 }}>
                  {Math.round(opacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(opacity * 100)}
                onChange={handleOpacityChange}
                className="fire-modelling__slider"
                style={{ marginTop: '6px' }}
              />
            </div>
          </div>

          {/* Legend */}
          <div className="fire-controls__section">
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginBottom: 8, fontSize: '11px',
              color: 'rgba(217,218,245,0.6)', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              <MapPin size={12} />
              Типы населённых пунктов
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {FCLASS_LEGEND.map(({ fclass, label, color, shape }) => (
                <div key={fclass} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 12,
                    height: 12,
                    borderRadius: shape === 'star' ? 0 : '50%',
                    backgroundColor: color,
                    flexShrink: 0,
                    display: 'inline-block',
                    clipPath: shape === 'star'
                      ? 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)'
                      : undefined,
                  }} />
                  <span style={{ fontSize: '11px', color: 'rgba(217,218,245,0.8)' }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 8, fontSize: '10px', color: 'rgba(217,218,245,0.35)' }}>
              Источник: OpenStreetMap
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default SettlementsControls;
