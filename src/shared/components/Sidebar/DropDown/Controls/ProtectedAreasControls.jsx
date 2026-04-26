import { useState, useCallback } from 'react';
import { Eye, EyeOff, Sliders, Shield } from 'lucide-react';
import useProtectedAreasStore from 'src/app/store/protectedAreasStore';
import './FireControls/fireControls.scss';

const ProtectedAreasControls = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const visible       = useProtectedAreasStore((s) => s.visible);
  const opacity       = useProtectedAreasStore((s) => s.opacity);
  const toggleVisible = useProtectedAreasStore((s) => s.toggleVisible);
  const setOpacity    = useProtectedAreasStore((s) => s.setOpacity);

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
          <span className="fire-controls__toggle-label">ООПТ Казахстана</span>
          <Shield
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
              <Shield size={12} />
              Обозначения
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{
                width: 20, height: 12, borderRadius: 2, flexShrink: 0,
                backgroundColor: 'rgba(52,211,153,0.25)',
                border: '1.5px dashed rgba(52,211,153,0.75)',
              }} />
              <span style={{ fontSize: '11px', color: 'rgba(217,218,245,0.8)' }}>
                Особо охраняемые природные территории
              </span>
            </div>

            <div style={{ marginTop: 4, fontSize: '10px', color: 'rgba(217,218,245,0.35)' }}>
              90 объектов · UNEP-WCMC and IUCN (2026)
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default ProtectedAreasControls;
