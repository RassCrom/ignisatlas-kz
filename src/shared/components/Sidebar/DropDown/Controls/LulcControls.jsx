import { useState, useCallback } from 'react';
import { Eye, EyeOff, Sliders, Layers, Plus, Trash2, Info } from 'lucide-react';
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

  const visible       = useLulcStore((state) => state.visible);
  const opacity       = useLulcStore((state) => state.opacity);
  const isAdded       = useLulcStore((state) => state.isAdded);
  const toggleVisible = useLulcStore((state) => state.toggleVisible);
  const setOpacity    = useLulcStore((state) => state.setOpacity);
  const addLayer      = useLulcStore((state) => state.addLayer);
  const removeLayer   = useLulcStore((state) => state.removeLayer);

  const handleOpacityChange = useCallback(
    (e) => setOpacity(Number(e.target.value) / 100),
    [setOpacity]
  );

  /* ── Not yet added → show "Add to map" button ─── */
  if (!isAdded) {
    return (
      <div className="fire-controls">
        <div className="fire-controls__header">
          <div className="fire-controls__toggle" style={{ opacity: 0.6, cursor: 'default' }}>
            <div className="fire-controls__toggle-icon">
              <Layers size={16} className="fire-controls__icon-inactive" />
            </div>
            <span className="fire-controls__toggle-label" style={{ fontSize: '11px' }}>
              ESRI Land Cover (устаревший)
            </span>
          </div>
          <button
            className="fire-controls__expand-btn"
            onClick={addLayer}
            title="Добавить на карту"
            style={{ background: 'rgba(52,211,153,0.12)', borderColor: 'rgba(52,211,153,0.3)' }}
          >
            <Plus size={14} style={{ color: 'rgba(52,211,153,0.9)' }} />
          </button>
        </div>
      </div>
    );
  }

  /* ── Added → full controls ─── */
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
          <span className="fire-controls__toggle-label" style={{ fontSize: '11px' }}>
            ESRI Land Cover (устаревший)
          </span>
          <Layers
            size={16}
            className={`fire-controls__flame-icon ${visible ? 'fire-controls__flame-icon--active' : ''}`}
          />
        </div>

        <div style={{ display: 'flex', gap: '2px' }}>
          <button
            className={`fire-controls__expand-btn ${isExpanded ? 'fire-controls__expand-btn--expanded' : ''}`}
            onClick={() => setIsExpanded((v) => !v)}
          >
            <Sliders size={14} />
          </button>
          <button
            className="fire-controls__expand-btn"
            onClick={removeLayer}
            title="Удалить с карты"
            style={{ color: 'rgba(248,113,113,0.8)' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Expanded panel */}
      {isExpanded && (
        <div className="fire-controls__content">

          {/* Metadata */}
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
              <Info size={12} />
              Информация о слое
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                ['Набор данных', 'ESRI Sentinel-2 Land Cover'],
                ['Разрешение', '10 м'],
                ['Источник', 'ArcGIS ImageServer'],
                ['Классы', '9 классов LULC'],
                ['Фильтрация', 'Нет (все годы)'],
              ].map(([key, val]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                  <span style={{ color: 'rgba(217,218,245,0.45)' }}>{key}</span>
                  <span style={{ color: 'rgba(217,218,245,0.75)', fontWeight: 500, textAlign: 'right' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

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
              Источник: ESRI Sentinel-2 Land Cover (10 м) — ArcGIS ImageServer
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default LulcControls;
