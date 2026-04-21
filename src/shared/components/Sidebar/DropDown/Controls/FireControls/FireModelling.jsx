import { useState, useEffect, useRef } from 'react';
import { Style } from 'ol/style';
import {
  Layers,
  Eye,
  EyeOff,
  Sliders,
  Trash2,
  RotateCcw,
  Play,
  Pause,
  SkipBack,
  Maximize2,
  MapPin,
} from 'lucide-react';

import './fireControls.scss';
import useFireModellingStore from 'src/app/store/fireModellingStore';

/* ── helpers ───────────────────────────────────────────── */

const formatDateTime = (date) =>
  date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatArea = (raw) => {
  if (!raw && raw !== 0) return null;
  const num = parseFloat(raw);
  if (isNaN(num)) return String(raw);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)} км²`;
  if (num >= 10_000)    return `${(num / 10_000).toFixed(1)} га`;
  return `${Math.round(num)} м²`;
};

/* ── component ─────────────────────────────────────────── */

const FireModelling = () => {
  const [isExpanded, setIsExpanded]   = useState(false);
  const [isVisible,  setIsVisible]    = useState(false);
  const [animatingLayers, setAnimatingLayers] = useState({});
  const animationIntervals = useRef({});
  const prevLayerCountRef  = useRef(0);

  const {
    fireModellingLayers,
    removeFireModellingLayer,
    updateFireModellingLayer,
    mapInstance,
    total_area,
  } = useFireModellingStore();

  const modellingLayers = Object.values(fireModellingLayers).map(layer => ({
    id:      layer.id,
    name:    layer.name    || `Слой ${layer.id}`,
    type:    layer.type    || 'Модель пожара',
    color:   layer.color   || '#ff6b6b',
    opacity: layer.opacity,
    visible: layer.visible,
    addedAt: new Date(layer.id),
    metadata: layer.metadata || {},
  }));

  /* Auto-enable eye when a new layer is added */
  useEffect(() => {
    if (modellingLayers.length > prevLayerCountRef.current) {
      setIsVisible(true);
    }
    prevLayerCountRef.current = modellingLayers.length;
  }, [modellingLayers.length]);

  /* Cleanup animation intervals on unmount */
  useEffect(() => {
    const intervals = animationIntervals.current;
    return () => {
      Object.keys(intervals).forEach(id => clearInterval(intervals[id]));
    };
  }, []);

  /* ── handlers ─────────────────────────────────────────── */

  const handleToggleVisibility = () => {
    const next = !isVisible;
    setIsVisible(next);
    Object.keys(fireModellingLayers).forEach(id => {
      updateFireModellingLayer(id, { visible: next });
      if (fireModellingLayers[id].layer) {
        fireModellingLayers[id].layer.setVisible(next);
      }
    });
  };

  const handleLayerVisibilityToggle = (id) => {
    const layer = fireModellingLayers[id];
    if (!layer) return;
    const next = !layer.visible;
    updateFireModellingLayer(id, { visible: next });
    if (layer.layer) layer.layer.setVisible(next);
  };

  const handleOpacityChange = (id, value) => {
    const opacity = value / 100;
    updateFireModellingLayer(id, { opacity });
    if (fireModellingLayers[id]?.layer) {
      fireModellingLayers[id].layer.setOpacity(opacity);
    }
  };

  const handleResetLayer = (id) => {
    updateFireModellingLayer(id, { opacity: 1, visible: true });
    const layer = fireModellingLayers[id]?.layer;
    if (layer) { layer.setOpacity(1); layer.setVisible(true); }
  };

  const handleDeleteLayer = (id) => {
    const layer = fireModellingLayers[id];
    if (layer?.layer && mapInstance) mapInstance.removeLayer(layer.layer);
    removeFireModellingLayer(id);
  };

  const handleZoomToLayer = (id) => {
    const layer = fireModellingLayers[id];
    if (!layer?.layer || !mapInstance) return;
    try {
      const source = layer.layer.getSource();
      const extent = source.getExtent();
      if (extent && extent.every(isFinite)) {
        mapInstance.getView().fit(extent, {
          padding: [80, 80, 80, 80],
          duration: 800,
          maxZoom: 14,
        });
      }
    } catch { /* source may not be ready */ }
  };

  /* ── animation ────────────────────────────────────────── */

  const startAnimation = (layerId) => {
    const layer = fireModellingLayers[layerId];
    if (!layer?.layer) return;
    const features = layer.layer.getSource().getFeatures();
    const maxDn = Math.max(...features.map(f => f.get('dn') || 0));

    setAnimatingLayers(prev => ({
      ...prev,
      [layerId]: { isPlaying: true, currentFrame: 0, maxFrame: maxDn },
    }));

    animationIntervals.current[layerId] = setInterval(() => {
      setAnimatingLayers(prev => {
        const anim = prev[layerId];
        if (!anim) return prev;
        const next = anim.currentFrame >= anim.maxFrame ? 0 : anim.currentFrame + 1;
        features.forEach(f => {
          const dn = f.get('dn') || 0;
          f.setStyle(dn <= next ? undefined : new Style({}));
        });
        return { ...prev, [layerId]: { ...anim, currentFrame: next } };
      });
    }, 500);
  };

  const pauseAnimation = (layerId) => {
    clearInterval(animationIntervals.current[layerId]);
    delete animationIntervals.current[layerId];
    setAnimatingLayers(prev => ({ ...prev, [layerId]: { ...prev[layerId], isPlaying: false } }));
  };

  const resetAnimation = (layerId) => {
    pauseAnimation(layerId);
    const layer = fireModellingLayers[layerId];
    if (layer?.layer) {
      layer.layer.getSource().getFeatures().forEach(f => f.setStyle(undefined));
    }
    setAnimatingLayers(prev => { const u = { ...prev }; delete u[layerId]; return u; });
  };

  const setAnimationFrame = (layerId, frame) => {
    const layer = fireModellingLayers[layerId];
    if (!layer?.layer) return;
    layer.layer.getSource().getFeatures().forEach(f => {
      f.setStyle((f.get('dn') || 0) <= frame ? undefined : new Style({}));
    });
    setAnimatingLayers(prev => ({ ...prev, [layerId]: { ...prev[layerId], currentFrame: frame } }));
  };

  /* ── derived ──────────────────────────────────────────── */

  const visibleCount = modellingLayers.filter(l => l.visible).length;
  const hiddenCount  = modellingLayers.length - visibleCount;
  const avgOpacity   = modellingLayers.length > 0
    ? Math.round(modellingLayers.reduce((s, l) => s + l.opacity, 0) / modellingLayers.length * 100)
    : 0;

  /* ── render ───────────────────────────────────────────── */

  return (
    <div className="fire-controls">

      {/* ── Header ── */}
      <div className="fire-controls__header">
        <div className="fire-controls__toggle" onClick={handleToggleVisibility}>
          <div className="fire-controls__toggle-icon">
            {isVisible
              ? <Eye size={15} className="fire-controls__icon-active" />
              : <EyeOff size={15} className="fire-controls__icon-inactive" />}
          </div>
          <span className="fire-controls__toggle-label">Моделирование пожара</span>
          {modellingLayers.length > 0 && (
            <span className="fire-controls__count-badge">{modellingLayers.length}</span>
          )}
          <Layers
            size={15}
            className={`fire-controls__flame-icon${isVisible ? ' fire-controls__flame-icon--active' : ''}`}
          />
        </div>

        <button
          className={`fire-controls__expand-btn${isExpanded ? ' fire-controls__expand-btn--expanded' : ''}`}
          onClick={() => setIsExpanded(!isExpanded)}
          title="Настройки слоёв"
        >
          <Sliders size={13} />
        </button>
      </div>

      {/* ── Expanded panel ── */}
      {isExpanded && (
        <div className="fire-controls__content">

          {modellingLayers.length > 0 ? (
            <div className="fire-modelling__layers-container">

              <div className="fire-modelling__section-header">
                <Layers size={11} />
                <span>Слои моделирования ({modellingLayers.length})</span>
              </div>

              <div className="fire-modelling__layers">
                {modellingLayers.map(layer => {
                  const anim = animatingLayers[layer.id];

                  return (
                    <div key={layer.id} className="fire-modelling__layer-card">

                      {/* Row 1: dot + name + actions */}
                      <div className="fire-modelling__card-header">
                        <div
                          className="fire-modelling__layer-dot"
                          style={{ backgroundColor: layer.color }}
                        />
                        <span className="fire-modelling__layer-name">{layer.name}</span>
                        <div className="fire-modelling__card-actions">
                          <button
                            onClick={() => handleZoomToLayer(layer.id)}
                            className="fire-modelling__icon-btn"
                            title="Приблизить к слою"
                          >
                            <Maximize2 size={12} />
                          </button>
                          <button
                            onClick={() => handleLayerVisibilityToggle(layer.id)}
                            className={`fire-modelling__icon-btn${layer.visible ? ' fire-modelling__icon-btn--eye-on' : ''}`}
                            title={layer.visible ? 'Скрыть слой' : 'Показать слой'}
                          >
                            {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                          </button>
                          <button
                            onClick={() => handleDeleteLayer(layer.id)}
                            className="fire-modelling__icon-btn fire-modelling__icon-btn--danger"
                            title="Удалить слой"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Row 2: meta */}
                      <div className="fire-modelling__card-meta">
                        <MapPin size={10} />
                        {layer.type}
                        {total_area ? ` · ${formatArea(total_area)}` : ''}
                        <span className="fire-modelling__card-time">
                          {formatDateTime(layer.addedAt)}
                        </span>
                      </div>

                      {/* Opacity slider */}
                      <div className="fire-modelling__control-row">
                        <span className="fire-modelling__control-label">
                          Прозрачность: {Math.round(layer.opacity * 100)}%
                        </span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={Math.round(layer.opacity * 100)}
                          onChange={(e) => handleOpacityChange(layer.id, e.target.value)}
                          className="fire-modelling__slider"
                        />
                      </div>

                      {/* Animation controls */}
                      <div className="fire-modelling__anim-row">
                        {anim ? (
                          <>
                            <button
                              onClick={() => resetAnimation(layer.id)}
                              className="fire-modelling__anim-btn"
                              title="Сбросить анимацию"
                            >
                              <SkipBack size={11} /> Сброс
                            </button>
                            <button
                              onClick={() => anim.isPlaying
                                ? pauseAnimation(layer.id)
                                : startAnimation(layer.id)
                              }
                              className="fire-modelling__anim-btn fire-modelling__anim-btn--primary"
                              title={anim.isPlaying ? 'Пауза' : 'Воспроизвести'}
                            >
                              {anim.isPlaying
                                ? <><Pause size={11} /> Пауза</>
                                : <><Play  size={11} /> Воспроизвести</>}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startAnimation(layer.id)}
                            className="fire-modelling__anim-btn fire-modelling__anim-btn--primary"
                            title="Анимировать распространение"
                          >
                            <Play size={11} /> Анимировать
                          </button>
                        )}
                        <button
                          onClick={() => handleResetLayer(layer.id)}
                          className="fire-modelling__anim-btn fire-modelling__anim-btn--icon"
                          title="Сбросить настройки слоя"
                        >
                          <RotateCcw size={11} />
                        </button>
                      </div>

                      {/* Frame scrubber (shown during animation) */}
                      {anim && (
                        <div className="fire-modelling__control-row">
                          <span className="fire-modelling__control-label">
                            Кадр: {anim.currentFrame} / {anim.maxFrame}
                          </span>
                          <input
                            type="range"
                            min="0"
                            max={anim.maxFrame}
                            value={anim.currentFrame}
                            onChange={(e) => setAnimationFrame(layer.id, parseInt(e.target.value))}
                            className="fire-modelling__slider"
                          />
                        </div>
                      )}

                      {/* Metadata key-value rows */}
                      {Object.keys(layer.metadata).length > 0 && (
                        <div className="fire-modelling__metadata">
                          {Object.entries(layer.metadata).map(([key, value]) => (
                            <div key={key} className="fire-modelling__meta-row">
                              <span className="fire-modelling__meta-key">
                                {key.charAt(0).toUpperCase() + key.slice(1)}
                              </span>
                              <span className="fire-modelling__meta-val">{value}</span>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

              {/* Summary bar */}
              <div className="fire-modelling__summary">
                <div className="fire-modelling__summary-item">
                  <span className="fire-modelling__summary-label">Всего</span>
                  <span className="fire-modelling__summary-value">{modellingLayers.length}</span>
                </div>
                <div className="fire-modelling__summary-item">
                  <span className="fire-modelling__summary-label">Видимых</span>
                  <span className="fire-modelling__summary-value fire-modelling__summary-value--green">{visibleCount}</span>
                </div>
                <div className="fire-modelling__summary-item">
                  <span className="fire-modelling__summary-label">Скрытых</span>
                  <span className="fire-modelling__summary-value fire-modelling__summary-value--muted">{hiddenCount}</span>
                </div>
                <div className="fire-modelling__summary-item">
                  <span className="fire-modelling__summary-label">Прозр.</span>
                  <span className="fire-modelling__summary-value">{avgOpacity}%</span>
                </div>
              </div>

            </div>
          ) : (
            /* Empty state */
            <div className="fire-modelling__empty">
              <Layers size={28} className="fire-modelling__empty-icon" />
              <p className="fire-modelling__empty-title">Нет слоёв моделирования</p>
              <p className="fire-modelling__empty-desc">
                Добавьте модели распространения пожара, зоны эвакуации или слои анализа погоды для начала работы.
              </p>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default FireModelling;
