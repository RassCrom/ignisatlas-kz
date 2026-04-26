import { useState, useCallback } from 'react';
import { Eye, EyeOff, Sliders, Globe } from 'lucide-react';
import useClimateZonesStore from 'src/app/store/climateZonesStore';
import './FireControls/fireControls.scss';

const LEGEND = [
  { koppen: 'BSk', color: '#CDAA54', desc: 'Cold semi-arid (steppe)' },
  { koppen: 'BWk', color: '#D4A96A', desc: 'Cold desert' },
  { koppen: 'Csa', color: '#A8C97F', desc: 'Hot-summer Mediterranean' },
  { koppen: 'Dfa', color: '#5B9BD5', desc: 'Hot-summer humid continental' },
  { koppen: 'Dfb', color: '#4472C4', desc: 'Warm-summer humid continental' },
  { koppen: 'Dfc', color: '#2E5FA3', desc: 'Subarctic / boreal' },
  { koppen: 'Dsa', color: '#70AD47', desc: 'Hot-summer continental, dry' },
  { koppen: 'Dsb', color: '#4EA72A', desc: 'Warm-summer continental, dry' },
  { koppen: 'Dsc', color: '#375623', desc: 'Subarctic, dry summer' },
  { koppen: 'Dwb', color: '#7030A0', desc: 'Warm continental, dry winter' },
  { koppen: 'ET',  color: '#B0C4DE', desc: 'Tundra' },
];

const ClimateZonesControls = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const visible       = useClimateZonesStore((s) => s.visible);
  const opacity       = useClimateZonesStore((s) => s.opacity);
  const toggleVisible = useClimateZonesStore((s) => s.toggleVisible);
  const setOpacity    = useClimateZonesStore((s) => s.setOpacity);

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
          <span className="fire-controls__toggle-label">Климатические зоны</span>
          <Globe
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

          <div className="fire-controls__section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="fire-controls__label" style={{ margin: 0 }}>Непрозрачность</span>
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

          <div className="fire-controls__section">
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
              fontSize: '11px', color: 'rgba(217,218,245,0.6)', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              <Globe size={12} />
              Классификация Кёппена
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {LEGEND.map(({ koppen, color, desc }) => (
                <div key={koppen} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 12, height: 12, borderRadius: 2,
                    backgroundColor: color, flexShrink: 0,
                    border: `1px solid ${color}cc`,
                  }} />
                  <span style={{ fontSize: '10px', color: 'rgba(217,218,245,0.5)', minWidth: 28, fontFamily: 'monospace' }}>
                    {koppen}
                  </span>
                  <span style={{ fontSize: '10px', color: 'rgba(217,218,245,0.75)' }}>
                    {desc}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 8, fontSize: '10px', color: 'rgba(217,218,245,0.35)' }}>
              Источник: Köppen–Geiger (1976–2000)
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default ClimateZonesControls;
