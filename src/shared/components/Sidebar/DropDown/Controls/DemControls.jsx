import { useState, useCallback } from 'react';
import {
  Eye, EyeOff, Sliders, Mountain, Plus, Trash2, Info,
  Loader2, AlertCircle,
} from 'lucide-react';
import useDemStore from 'src/app/store/demStore';
import { DEM_RENDERERS, DEM_RENDERER_GRADIENTS } from 'src/utils/demService';
import './FireControls/fireControls.scss';

const SELECT_STYLE = {
  width: '100%',
  padding: '6px 8px',
  borderRadius: 4,
  border: '1px solid rgba(136,139,224,0.15)',
  background: 'rgba(9,10,36,0.6)',
  color: 'rgba(217,218,245,0.9)',
  fontSize: '12px',
  cursor: 'pointer',
  colorScheme: 'dark',
};

const SECTION_TITLE = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  marginBottom: 8,
  fontSize: '11px',
  color: 'rgba(217,218,245,0.6)',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const DemControls = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const renderer       = useDemStore((s) => s.renderer);
  const isAdded        = useDemStore((s) => s.isAdded);
  const isLoading      = useDemStore((s) => s.isLoading);
  const error          = useDemStore((s) => s.error);
  const visible        = useDemStore((s) => s.visible);
  const opacity        = useDemStore((s) => s.opacity);
  const setRenderer    = useDemStore((s) => s.setRenderer);
  const loadAndAdd     = useDemStore((s) => s.loadAndAddLayer);
  const switchRenderer = useDemStore((s) => s.switchRenderer);
  const removeLayer    = useDemStore((s) => s.removeLayer);
  const toggleVisible  = useDemStore((s) => s.toggleVisible);
  const setOpacity     = useDemStore((s) => s.setOpacity);

  const handleRendererChange = useCallback(
    (e) => {
      const r = e.target.value;
      // If the layer is already on the map, swap tiles immediately (no API call).
      if (isAdded) switchRenderer(r);
      else setRenderer(r);
    },
    [isAdded, switchRenderer, setRenderer]
  );

  const handleAddToMap = useCallback(() => {
    loadAndAdd(renderer);
  }, [loadAndAdd, renderer]);

  const handleOpacityChange = useCallback(
    (e) => setOpacity(Number(e.target.value) / 100),
    [setOpacity]
  );

  /* ── Not-yet-added state ─────────────────────────────── */
  if (!isAdded) {
    return (
      <div className="fire-controls">
        <div className="fire-controls__header">
          <div className="fire-controls__toggle" style={{ cursor: 'default', flex: 1 }}>
            <div className="fire-controls__toggle-icon">
              <Mountain size={16} className="fire-controls__icon-inactive" />
            </div>
            <span className="fire-controls__toggle-label" style={{ fontSize: '11px' }}>
              Copernicus DEM GLO-30
            </span>
          </div>
        </div>

        <div className="fire-controls__content" style={{ paddingTop: 6 }}>
          <div className="fire-controls__section">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Sliders size={12} style={{ color: 'rgba(217,218,245,0.5)' }} />
              <span style={{ fontSize: '10px', color: 'rgba(217,218,245,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Стиль рендера
              </span>
            </div>
            <select value={renderer} onChange={handleRendererChange} disabled={isLoading} style={SELECT_STYLE}>
              {DEM_RENDERERS.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAddToMap}
            disabled={isLoading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '7px 10px',
              borderRadius: 4,
              border: '1px solid rgba(52,211,153,0.3)',
              background: 'rgba(52,211,153,0.1)',
              color: 'rgba(52,211,153,0.9)',
              fontWeight: 600,
              fontSize: '11px',
              cursor: isLoading ? 'wait' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {isLoading
              ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Загрузка…</>
              : <><Plus size={14} /> Добавить на карту</>
            }
          </button>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: '10px', color: 'rgba(248,113,113,0.9)' }}>
              <AlertCircle size={12} />
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Active-layer state ──────────────────────────────── */
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
          <span className="fire-controls__toggle-label" style={{ fontSize: '11px' }}>
            Copernicus DEM GLO-30
          </span>
          <Mountain
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

      {isExpanded && (
        <div className="fire-controls__content">

          {/* Renderer selector */}
          <div className="fire-controls__section">
            <div style={SECTION_TITLE}>
              <Sliders size={12} />
              Стиль рендера
            </div>
            <select value={renderer} onChange={handleRendererChange} style={SELECT_STYLE}>
              {DEM_RENDERERS.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Metadata */}
          <div className="fire-controls__section">
            <div style={SECTION_TITLE}>
              <Info size={12} />
              Информация о слое
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                ['Набор данных', 'Copernicus DEM GLO-30'],
                ['Тип модели',  'DSM (поверхностная модель)'],
                ['Разрешение',  '~30 м'],
                ['Источник',    'ESA / TanDEM-X'],
                ['Провайдер',   'Microsoft Planetary Computer'],
                ['Лицензия',    'Copernicus Data License'],
              ].map(([key, val]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                  <span style={{ color: 'rgba(217,218,245,0.45)' }}>{key}</span>
                  <span style={{ color: 'rgba(217,218,245,0.75)', fontWeight: 500, textAlign: 'right', maxWidth: '55%' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Opacity slider */}
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

          {/* Elevation colour scale */}
          <div className="fire-controls__section">
            <div style={SECTION_TITLE}>
              <Mountain size={12} />
              Шкала высот
            </div>
            <div style={{
              width: '100%',
              height: 12,
              borderRadius: 3,
              background: DEM_RENDERER_GRADIENTS[renderer],
              border: '1px solid rgba(255,255,255,0.08)',
              marginBottom: 5,
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(217,218,245,0.4)' }}>
              <span>0 м</span>
              <span>1250</span>
              <span>2500</span>
              <span>3750</span>
              <span>5000 м</span>
            </div>
            <div style={{ marginTop: 8, fontSize: '10px', color: 'rgba(217,218,245,0.3)' }}>
              ESA / Copernicus — Planetary Computer
            </div>
          </div>

        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DemControls;
