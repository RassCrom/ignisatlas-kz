import { useState, useCallback } from 'react';
import { Eye, EyeOff, Sliders, Info, Leaf } from 'lucide-react';
import usePeatlandsStore from 'src/app/store/peatlandsStore';
import LayerInfoPopup from 'src/shared/components/Sidebar/Options/LayerInfoPopup';
import './FireControls/fireControls.scss';
import '../../Options/Options.scss'

const LEGEND = [
  { dn: 1, color: 'rgba(101,56,12,0.8)',  label: 'Торфяные почвы',      labelEn: 'Peat dominated' },
  { dn: 2, color: 'rgba(160,105,45,0.75)', label: 'Торф в мозаике почв', labelEn: 'Peat in soil mosaic' },
];

const PeatlandsControls = ({ option }) => {
  const [isExpanded, setIsExpanded]     = useState(false);
  const [showLayerInfo, setShowLayerInfo] = useState(false);

  const visible       = usePeatlandsStore((s) => s.visible);
  const opacity       = usePeatlandsStore((s) => s.opacity);
  const toggleVisible = usePeatlandsStore((s) => s.toggleVisible);
  const setOpacity    = usePeatlandsStore((s) => s.setOpacity);

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
          <span className="fire-controls__toggle-label">Торфяники</span>
          <Leaf
            size={16}
            className={`fire-controls__flame-icon ${visible ? 'fire-controls__flame-icon--active' : ''}`}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Info tooltip */}
          <div
            className='info-tooltip-container'
            onClick={() => setShowLayerInfo((v) => !v)}
          >
            <Info
              size={14}
              className="info-icon"
              style={{ cursor: 'pointer', color: 'rgba(136,139,224,0.6)' }}
            />
            {showLayerInfo && option && <LayerInfoPopup option={option} />}
          </div>

          <button
            className={`fire-controls__expand-btn ${isExpanded ? 'fire-controls__expand-btn--expanded' : ''}`}
            onClick={() => setIsExpanded((v) => !v)}
          >
            <Sliders size={14} />
          </button>
        </div>
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
              <Leaf size={12} />
              Типы торфяников
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {LEGEND.map(({ dn, color, label, labelEn }) => (
                <div key={dn} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 16, height: 10, borderRadius: 2, flexShrink: 0,
                    backgroundColor: color,
                    border: `1px solid ${color.replace(/[\d.]+\)$/, '1)')}`,
                  }} />
                  <span style={{ fontSize: '10px', color: 'rgba(217,218,245,0.5)', minWidth: 20, fontFamily: 'monospace' }}>
                    DN{dn}
                  </span>
                  <span style={{ fontSize: '10px', color: 'rgba(217,218,245,0.8)' }}>
                    {label}
                  </span>
                  <span style={{ fontSize: '9px', color: 'rgba(217,218,245,0.35)', marginLeft: 'auto' }}>
                    {labelEn}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 8, fontSize: '10px', color: 'rgba(217,218,245,0.35)' }}>
              1 188 полигонов · IIASA / GlobCover
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default PeatlandsControls;
