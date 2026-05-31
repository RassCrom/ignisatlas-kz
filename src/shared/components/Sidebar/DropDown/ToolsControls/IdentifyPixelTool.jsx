import { useCallback, useEffect, useRef, useState } from 'react';
import { Crosshair, X } from 'lucide-react';
import useAnalysisStore from 'src/app/store/analysisStore';
import { getMapInstance } from 'src/modules/MapPage/services/mapService';
import { inspectRasterPixel } from 'src/utils/rasterPixelService';
import baseStyles from './ToolsControls.module.scss';
import styles from './AnalysisTools.module.scss';

const TOOL_ID = 'identify_pixel';

const visibleStyleLayers = (map, types) =>
  map.getStyle().layers
    .filter((layer) => types.includes(layer.type))
    .filter((layer) => map.getLayoutProperty(layer.id, 'visibility') !== 'none')
    .map((layer) => layer.id);

const getRasterTileUrl = (map, layerId) => {
  const style = map.getStyle();
  const layer = style.layers.find((item) => item.id === layerId);
  const source = typeof layer?.source === 'string' ? style.sources?.[layer.source] : layer?.source;
  return source?.tiles?.[0] || null;
};

const formatPixelValue = (value, unit) => {
  if (value == null || !Number.isFinite(Number(value))) return 'No data';
  const numericValue = Number(value);
  const formatted = Math.abs(numericValue) >= 100
    ? numericValue.toFixed(0)
    : numericValue.toFixed(4).replace(/\.?0+$/, '');
  return `${formatted}${unit ? ` ${unit}` : ''}`;
};

const IdentifyPixelTool = () => {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const listenerRef = useRef(null);
  const requestSeqRef = useRef(0);
  const { activeToolId, setActiveTool } = useAnalysisStore();
  const blocked = activeToolId !== null && activeToolId !== TOOL_ID;

  const handleClick = useCallback(async (e) => {
    const map = getMapInstance();
    if (!map) return;

    const lngLat = e.lngLat || { lng: e.coordinate?.[0], lat: e.coordinate?.[1] };
    const point = e.point || map.project(lngLat);
    const vectorLayerIds = visibleStyleLayers(map, ['fill', 'line', 'circle', 'symbol']);
    const rasterLayerIds = visibleStyleLayers(map, ['raster']);
    const vectorHits = vectorLayerIds.length
      ? map.queryRenderedFeatures(point, { layers: vectorLayerIds })
        .map((feature) => ({
          layerId: feature.layer?.id || 'unknown',
          props: feature.properties || {},
        }))
        .filter((feature) => Object.keys(feature.props).length > 0)
      : [];

    const requestSeq = requestSeqRef.current + 1;
    requestSeqRef.current = requestSeq;
    setIsLoading(true);

    const rasterHits = await Promise.all(rasterLayerIds.map(async (id) => {
      try {
        return {
          label: id,
          ...await inspectRasterPixel(getRasterTileUrl(map, id), lngLat),
        };
      } catch (error) {
        return {
          label: id,
          status: 'error',
          message: error.message || 'Failed to load pixel value.',
        };
      }
    }));

    if (requestSeq !== requestSeqRef.current) return;
    setResult({
      lon: Number(lngLat.lng).toFixed(6),
      lat: Number(lngLat.lat).toFixed(6),
      rasterHits,
      vectorHits,
    });
    setIsLoading(false);
  }, []);

  const activate = useCallback(() => {
    const map = getMapInstance();
    if (!map || blocked) return;
    setActiveTool(TOOL_ID);
    setIsActive(true);
    setResult(null);
    map.getCanvas().style.cursor = 'crosshair';
    listenerRef.current = handleClick;
    map.on('click', handleClick);
  }, [blocked, setActiveTool, handleClick]);

  const deactivate = useCallback(() => {
    const map = getMapInstance();
    if (map && listenerRef.current) {
      map.off('click', listenerRef.current);
      listenerRef.current = null;
      map.getCanvas().style.cursor = '';
    }
    setIsActive(false);
    setIsLoading(false);
    requestSeqRef.current += 1;
    setActiveTool(null);
  }, [setActiveTool]);

  useEffect(() => {
    const handleContextIdentify = async (ev) => {
      const coord = ev.detail.coordinate;
      const map = getMapInstance();
      if (!map) return;
      await handleClick({ coordinate: coord, point: map.project(coord), lngLat: { lng: coord[0], lat: coord[1] } });
    };

    window.addEventListener('cm:identify_pixel', handleContextIdentify);
    return () => {
      window.removeEventListener('cm:identify_pixel', handleContextIdentify);
      requestSeqRef.current += 1;
      const map = getMapInstance();
      if (map && listenerRef.current) {
        map.off('click', listenerRef.current);
        map.getCanvas().style.cursor = '';
      }
    };
  }, [handleClick]);

  return (
    <div className={styles.toolWrap}>
      <p className={baseStyles.toolDesc}>
        Click the map to inspect visible vector features and raster layers at that point.
      </p>

      {isActive ? (
        <button className={styles.cancelBtn} onClick={deactivate}>
          <X size={13} /> Deactivate
        </button>
      ) : (
        <button className={styles.activateBtn} onClick={activate} disabled={blocked}>
          <Crosshair size={13} /> Activate
        </button>
      )}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span className={styles.sectionLabel}>Coordinates</span>
            <div className={styles.resultRow}><span>Longitude</span><span>{result.lon}</span></div>
            <div className={styles.resultRow}><span>Latitude</span><span>{result.lat}</span></div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span className={styles.sectionLabel}>Raster layers</span>
            {result.rasterHits.length === 0 ? (
              <p className={baseStyles.toolDesc} style={{ margin: 0 }}>No visible raster layer at this point.</p>
            ) : (
              result.rasterHits.map((h) => (
                <div key={h.label} className={styles.rasterHit}>
                  <div className={styles.rasterName}>{h.label}</div>
                  {h.status === 'ready' && h.values.length > 0 ? (
                    h.values.map((item) => (
                      <div key={item.band} className={styles.resultRow}>
                        <span>{item.band}</span>
                        <span>{formatPixelValue(item.value, item.unit)}</span>
                      </div>
                    ))
                  ) : (
                    <p className={baseStyles.toolDesc} style={{ margin: 0 }}>
                      {h.message || 'No data at this point.'}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {result.vectorHits.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span className={styles.sectionLabel}>Vector features</span>
              {result.vectorHits.slice(0, 8).map((f, i) => (
                <div key={`${f.layerId}-${i}`} style={{
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
      {isLoading && (
        <div className={styles.loadingRow}>
          <span className={styles.spinner} />
          Loading pixel values…
        </div>
      )}
    </div>
  );
};

export default IdentifyPixelTool;
