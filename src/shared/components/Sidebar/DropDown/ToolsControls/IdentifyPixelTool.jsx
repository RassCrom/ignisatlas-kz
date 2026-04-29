import { useState, useEffect, useRef, useCallback } from 'react';
import { Crosshair, X } from 'lucide-react';
import { toLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import { LULC_CLASSES } from 'src/utils/lulcService';
import useAnalysisStore from 'src/app/store/analysisStore';
import baseStyles from './ToolsControls.module.scss';
import styles from './AnalysisTools.module.scss';

const TOOL_ID = 'identify_pixel';

// ── URL parsing ──────────────────────────────────────────────────────────────

const parseUrlParams = (layer) => {
  try {
    const src = layer.getSource?.();
    const url = src?.getUrls?.()[0] ?? src?.getUrl?.() ?? '';
    if (!url || !url.includes('?')) return {};
    const [baseUrl, queryStr] = url.split('?');
    const p = new URLSearchParams(queryStr);
    const colormap = p.get('colormap_name');
    const rescaleParts = p.get('rescale')?.split(',').map(Number);
    const rescale = rescaleParts?.length === 2 ? rescaleParts : null;
    return { baseUrl, colormap, rescale, searchParams: p };
  } catch { return {}; }
};

// ── Pixel decoding ────────────────────────────────────────────────────────────

// LULC io-lulc-9-class: find closest class by color distance
const hexToRgb = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const findLulcClass = (r, g, b) => {
  let bestClass = null;
  let bestDist = Infinity;
  for (const cls of LULC_CLASSES) {
    const [cr, cg, cb] = hexToRgb(cls.color);
    const dist = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
    if (dist < bestDist) { bestDist = dist; bestClass = cls; }
  }
  return bestClass;
};

// Decode RGBA to a human-readable value string
const decodePixel = (r, g, b, a, layer) => {
  const { colormap, rescale } = parseUrlParams(layer);

  // Discrete LULC class colormap
  if (colormap === 'io-lulc-9-class') {
    const cls = findLulcClass(r, g, b);
    if (cls) return { value: cls.label, detail: `Класс ${cls.value}`, exact: true };
    return { value: `${r} / ${g} / ${b}`, detail: 'bands', exact: false };
  }

  // Grayscale linear: exact physical value
  if (colormap === 'gray' && rescale) {
    const [minVal, maxVal] = rescale;
    const physVal = (r / 255) * (maxVal - minVal) + minVal;
    const layerType = layer.get('layerType');
    const unit = layerType === 'dem_pc' ? ' м' : '';
    return { value: `${Math.round(physVal)}${unit}`, detail: colormap, exact: true };
  }

  // All other colormaps: show raw channel values as numbers
  const alphaPct = Math.round((a / 255) * 100);
  return {
    value: `${r} / ${g} / ${b}`,
    detail: colormap ? `colormap: ${colormap}` : 'bands (R/G/B)',
    exact: false,
    alpha: alphaPct < 100 ? `${alphaPct}%` : null,
  };
};

// ── TiTiler Point API ─────────────────────────────────────────────────────────

const fetchPointData = async (lon, lat, layer) => {
  try {
    const { baseUrl, searchParams } = parseUrlParams(layer);
    if (!baseUrl || !baseUrl.includes('/tiles/')) return null;

    const pointBase = baseUrl.replace(/\/tiles\/.*?$/, `/point/${lon},${lat}`);
    const params = new URLSearchParams(searchParams.toString());
    
    if (params.has('expression')) {
      params.set('asset_as_band', 'True');
    }
    
    // Remove tile-specific params
    params.delete('colormap_name');
    params.delete('rescale');
    params.delete('color_formula');
    params.delete('format');
    
    const res = await fetch(`${pointBase}?${params.toString()}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (json && json.values && json.values.length > 0) {
      return json.values[0];
    }
  } catch { return null; }
  return null;
};

const formatSemanticValue = (rawVal, layer) => {
  const layerId = layer.get('id') || '';
  
  if (layerId.startsWith('lst_')) {
    let tempK = layerId.includes('_LC') 
      ? rawVal * 0.00341802 + 149 
      : rawVal * 0.02;
    const tempC = tempK - 273.15;
    return { value: `${tempC.toFixed(1)} °C`, detail: 'LST', exact: true };
  }
  
  if (layerId.includes('_ndvi_')) {
    return { value: rawVal.toFixed(2), detail: 'NDVI', exact: true };
  }
  
  if (layerId.includes('_ndwi_')) {
    return { value: rawVal.toFixed(2), detail: 'NDWI', exact: true };
  }
  
  if (layerId.startsWith('sentinel_pc_')) {
    const parts = layerId.split('_');
    const preset = parts[3] || 'Index';
    return { value: rawVal.toFixed(4), detail: preset.toUpperCase(), exact: true };
  }
  
  return { value: Number(rawVal).toFixed(2), detail: 'Value', exact: true };
};

// ── Layer collection ──────────────────────────────────────────────────────────

const collectRasterLayers = (collection) => {
  const result = [];
  collection.forEach((layer) => {
    if (layer.getLayers) {
      result.push(...collectRasterLayers(layer.getLayers()));
    } else if (
      layer.getVisible() &&
      !(layer instanceof VectorLayer) &&
      typeof layer.getData === 'function'
    ) {
      result.push(layer);
    }
  });
  return result;
};

const layerLabel = (layer) =>
  layer.get('layerType') ?? layer.get('id') ?? 'Raster Layer';

// ── Component ─────────────────────────────────────────────────────────────────

const IdentifyPixelTool = () => {
  const [isActive, setIsActive] = useState(false);
  const [result, setResult] = useState(null);

  const listenerRef = useRef(null);
  const { activeToolId, setActiveTool } = useAnalysisStore();
  const blocked = activeToolId !== null && activeToolId !== TOOL_ID;

  const handleClick = useCallback(async (e) => {
    const map = window.mapInstance;
    if (!map) return;

    const [lon, lat] = toLonLat(e.coordinate, 'EPSG:3857');

    // Vector feature attributes
    const vectorHits = [];
    map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
      const props = feature.getProperties();
      const cleaned = Object.fromEntries(
        Object.entries(props).filter(([k]) => k !== 'geometry')
      );
      if (Object.keys(cleaned).length > 0) {
        vectorHits.push({ layerId: layer?.get('id') ?? 'unknown', props: cleaned });
      }
    }, { hitTolerance: 8 });

    setResult({ lon: lon.toFixed(6), lat: lat.toFixed(6), rasterHits: null, vectorHits });

    // Raster pixel values
    const rasterHits = [];
    const layers = collectRasterLayers(map.getLayers());
    
    await Promise.all(layers.map(async (layer) => {
      try {
        const data = layer.getData(e.pixel);
        if (!data || data[3] === 0) return;

        const [r, g, b, a] = data;
        
        // Try to fetch exact point data from TiTiler
        const rawVal = await fetchPointData(lon, lat, layer);
        if (rawVal !== null) {
          rasterHits.push({
            label: layerLabel(layer),
            decoded: formatSemanticValue(rawVal, layer),
          });
          return;
        }

        rasterHits.push({
          label: layerLabel(layer),
          decoded: decodePixel(r, g, b, a, layer),
        });
      } catch { /* cross-origin tile — skip */ }
    }));

    setResult((prev) => prev ? { ...prev, rasterHits } : null);
  }, []);

  const activate = useCallback(() => {
    const map = window.mapInstance;
    if (!map || blocked) return;
    setActiveTool(TOOL_ID);
    setIsActive(true);
    setResult(null);
    map.getTargetElement().style.cursor = 'crosshair';
    listenerRef.current = handleClick;
    map.on('singleclick', handleClick);
  }, [blocked, setActiveTool, handleClick]);

  const deactivate = useCallback(() => {
    const map = window.mapInstance;
    if (map && listenerRef.current) {
      map.un('singleclick', listenerRef.current);
      listenerRef.current = null;
      map.getTargetElement().style.cursor = '';
    }
    setIsActive(false);
    setActiveTool(null);
  }, [setActiveTool]);

  useEffect(() => {
    return () => {
      const map = window.mapInstance;
      if (map && listenerRef.current) {
        map.un('singleclick', listenerRef.current);
        map.getTargetElement().style.cursor = '';
      }
    };
  }, []);

  return (
    <div className={styles.toolWrap}>
      <p className={baseStyles.toolDesc}>
        Кликните на карту — инструмент покажет значение пикселя всех видимых растровых слоёв.
      </p>

      {isActive ? (
        <button className={styles.cancelBtn} onClick={deactivate}>
          <X size={13} /> Деактивировать
        </button>
      ) : (
        <button className={styles.activateBtn} onClick={activate} disabled={blocked}>
          <Crosshair size={13} /> Активировать
        </button>
      )}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

          {/* Coordinates */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span className={styles.sectionLabel}>Координаты</span>
            <div className={styles.resultRow}>
              <span>Долгота</span><span>{result.lon}°</span>
            </div>
            <div className={styles.resultRow}>
              <span>Широта</span><span>{result.lat}°</span>
            </div>
          </div>

          {/* Raster pixel values */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span className={styles.sectionLabel}>Растровые слои</span>

            {!result.rasterHits ? (
              <p className={baseStyles.toolDesc} style={{ margin: 0 }}>
                Чтение данных...
              </p>
            ) : result.rasterHits.length === 0 ? (
              <p className={baseStyles.toolDesc} style={{ margin: 0 }}>
                Нет растровых данных в выбранной точке
              </p>
            ) : (
              result.rasterHits.map((h, i) => (
                <div key={i} style={{
                  background: 'rgba(9,10,36,0.4)',
                  border: '1px solid rgba(136,139,224,0.12)',
                  borderRadius: '0.35rem',
                  padding: '0.35rem 0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.15rem',
                }}>
                  <div style={{ fontWeight: 600, fontSize: '0.7rem', color: 'rgba(136,139,224,0.85)' }}>
                    {h.label}
                  </div>
                  <div className={styles.resultRow}>
                    <span>Значение</span>
                    <span style={{
                      fontFamily: 'monospace',
                      color: h.decoded.exact ? 'rgba(52,211,153,0.9)' : 'rgba(217,218,245,0.8)',
                    }}>
                      {h.decoded.value}
                    </span>
                  </div>
                  <div className={styles.resultRow} style={{ fontSize: '0.62rem' }}>
                    <span style={{ color: 'rgba(217,218,245,0.3)' }}>{h.decoded.detail}</span>
                    {h.decoded.alpha && (
                      <span style={{ color: 'rgba(217,218,245,0.3)' }}>α {h.decoded.alpha}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Vector features */}
          {result.vectorHits.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span className={styles.sectionLabel}>Векторные объекты</span>
              {result.vectorHits.map((f, i) => (
                <div key={i} style={{
                  background: 'rgba(9,10,36,0.4)',
                  border: '1px solid rgba(136,139,224,0.12)',
                  borderRadius: '0.35rem',
                  padding: '0.35rem 0.5rem',
                }}>
                  <div style={{ fontWeight: 600, fontSize: '0.7rem', color: 'rgba(136,139,224,0.8)', marginBottom: '0.2rem' }}>
                    {f.layerId}
                  </div>
                  {Object.entries(f.props).slice(0, 8).map(([k, v]) => (
                    <div key={k} className={styles.resultRow} style={{ fontSize: '0.65rem' }}>
                      <span style={{ color: 'rgba(217,218,245,0.45)' }}>{k}</span>
                      <span>{String(v).slice(0, 40)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IdentifyPixelTool;
