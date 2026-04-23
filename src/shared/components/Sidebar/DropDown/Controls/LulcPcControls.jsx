import { useState, useCallback } from 'react';
import {
  Eye, EyeOff, Sliders, Layers, Plus, Trash2, Info,
  Loader2, Calendar, AlertCircle,
} from 'lucide-react';
import useLulcPcStore from 'src/app/store/lulcPcStore';
import { LULC_YEARS, LULC_CLASSES } from 'src/utils/lulcService';
import './FireControls/fireControls.scss';

const LulcPcControls = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const year          = useLulcPcStore((s) => s.year);
  const isAdded       = useLulcPcStore((s) => s.isAdded);
  const isLoading     = useLulcPcStore((s) => s.isLoading);
  const error         = useLulcPcStore((s) => s.error);
  const visible       = useLulcPcStore((s) => s.visible);
  const opacity       = useLulcPcStore((s) => s.opacity);
  const setYear       = useLulcPcStore((s) => s.setYear);
  const loadAndAdd    = useLulcPcStore((s) => s.loadAndAddLayer);
  const switchYear    = useLulcPcStore((s) => s.switchYear);
  const removeLayer   = useLulcPcStore((s) => s.removeLayer);
  const toggleVisible = useLulcPcStore((s) => s.toggleVisible);
  const setOpacity    = useLulcPcStore((s) => s.setOpacity);

  const handleOpacityChange = useCallback(
    (e) => setOpacity(Number(e.target.value) / 100),
    [setOpacity]
  );

  const handleAddToMap = useCallback(() => {
    loadAndAdd(year);
  }, [loadAndAdd, year]);

  const handleYearSwitch = useCallback(
    (e) => {
      const y = Number(e.target.value);
      if (isAdded) switchYear(y);
      else setYear(y);
    },
    [isAdded, switchYear, setYear]
  );

  /* ── Not yet added → year selector + add button ─── */
  if (!isAdded) {
    return (
      <div className="fire-controls">
        <div className="fire-controls__header">
          <div className="fire-controls__toggle" style={{ cursor: 'default', flex: 1 }}>
            <div className="fire-controls__toggle-icon">
              <Layers size={16} className="fire-controls__icon-inactive" />
            </div>
            <span className="fire-controls__toggle-label" style={{ fontSize: '11px' }}>
              ESRI LULC 10m
            </span>
          </div>
        </div>

        <div className="fire-controls__content" style={{ paddingTop: 6 }}>
          {/* Year selector */}
          <div className="fire-controls__section">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Calendar size={12} style={{ color: 'rgba(217,218,245,0.5)' }} />
              <span style={{ fontSize: '10px', color: 'rgba(217,218,245,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Выберите год
              </span>
            </div>
            <select
              value={year}
              onChange={handleYearSwitch}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 4,
                border: '1px solid rgba(136,139,224,0.15)',
                background: 'rgba(9,10,36,0.6)',
                color: 'rgba(217,218,245,0.9)',
                fontSize: '12px',
                cursor: 'pointer',
                colorScheme: 'dark',
              }}
            >
              {LULC_YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Add to map button */}
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

  /* ── Added → full management panel ─── */
  return (
    <div className="fire-controls">
      {/* Header */}
      <div className="fire-controls__header">
        <div className="fire-controls__toggle" onClick={toggleVisible}>
          <div className="fire-controls__toggle-icon">
            {visible
              ? <Eye size={16} className="fire-controls__icon-active" />
              : <EyeOff size={16} className="fire-controls__icon-inactive" />
            }
          </div>
          <span className="fire-controls__toggle-label" style={{ fontSize: '11px' }}>
            ESRI LULC 10m — {year}
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

          {/* Year switcher */}
          <div className="fire-controls__section">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Calendar size={12} style={{ color: 'rgba(217,218,245,0.5)' }} />
              <span style={{ fontSize: '10px', color: 'rgba(217,218,245,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Год наблюдения
              </span>
            </div>
            <select
              value={year}
              onChange={handleYearSwitch}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 4,
                border: '1px solid rgba(136,139,224,0.15)',
                background: 'rgba(9,10,36,0.6)',
                color: 'rgba(217,218,245,0.9)',
                fontSize: '12px',
                cursor: 'pointer',
                colorScheme: 'dark',
              }}
            >
              {LULC_YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: '10px', color: 'rgba(136,139,224,0.7)' }}>
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                Обновление тайлов…
              </div>
            )}
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: '10px', color: 'rgba(248,113,113,0.9)' }}>
                <AlertCircle size={12} />
                {error}
              </div>
            )}
          </div>

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
                ['Набор данных', 'Esri 10m Annual LULC v2'],
                ['Год', String(year)],
                ['Разрешение', '10 м'],
                ['Источник', 'Planetary Computer / Sentinel-2'],
                ['Классы', '9 классов LULC'],
                ['Лицензия', 'CC BY 4.0'],
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
                <div key={cls.value} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
              Esri / Impact Observatory — Planetary Computer
            </div>
          </div>

        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LulcPcControls;
