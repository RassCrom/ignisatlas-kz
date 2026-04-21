import { useState, useCallback } from 'react';
import { Eye, EyeOff, Sliders, Layers } from 'lucide-react';
import useLulcStore from 'src/app/store/lulcStore';
import './FireControls/fireControls.scss';

// ESRI Sentinel-2 10m Land Cover class colours (official palette)
const LULC_CLASSES = [
  { label: 'Вода',                     color: '#419BDF' },
  { label: 'Деревья',                  color: '#397D49' },
  { label: 'Затопленная растит.',       color: '#88B053' },
  { label: 'Сельхозугодья',            color: '#DDE9AA' },
  { label: 'Застройка',                color: '#C4281B' },
  { label: 'Голый грунт',              color: '#A59B8F' },
  { label: 'Снег / лёд',               color: '#A8EBFF' },
  { label: 'Облака',                   color: '#616161' },
  { label: 'Степь / пастбища',         color: '#E49635' },
];

const LulcControls = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const visible      = useLulcStore((state) => state.visible);
  const opacity      = useLulcStore((state) => state.opacity);
  const toggleVisible = useLulcStore((state) => state.toggleVisible);
  const setOpacity   = useLulcStore((state) => state.setOpacity);

  const handleOpacityChange = useCallback(
    (e) => setOpacity(Number(e.target.value) / 100),
    [setOpacity]
  );

  return (
    <div className="fire-controls">
      {/* Header row */}
      <div className="fire-controls__header">
        <div className="fire-controls__toggle" onClick={toggleVisible}>
          <div className="fire-controls__toggle-icon">
            {visible
              ? <Eye size={16} className="fire-controls__icon-active" />
              : <EyeOff size={16} className="fire-controls__icon-inactive" />
            }
          </div>
          <span className="fire-controls__toggle-label">
            Использование земель (LULC)
          </span>
          <Layers
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

      {/* Expanded panel */}
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 8,
                fontSize: '11px',
                color: 'rgba(217,218,245,0.6)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <Layers size={12} />
              Классы землепользования
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {LULC_CLASSES.map((cls) => (
                <div key={cls.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      backgroundColor: cls.color,
                      flexShrink: 0,
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ fontSize: '11px', color: 'rgba(217,218,245,0.8)' }}>
                    {cls.label}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 8, fontSize: '10px', color: 'rgba(217,218,245,0.35)' }}>
              Источник: ESRI Sentinel-2 Land Cover (10 м)
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default LulcControls;
