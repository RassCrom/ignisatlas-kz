import { useCallback, useEffect, useRef, useState } from 'react';
import { center } from '@turf/turf';
import maplibregl from 'maplibre-gl';
import { Copy, Download, Pentagon, Trash2, X } from 'lucide-react';
import { getMapInstance } from 'src/modules/MapPage/services/mapService';
import {
  formatArea,
  startMapLibreDraw,
} from 'src/modules/MapPage/utils/maplibreDraw';
import { removeSourceWithLayers } from 'src/modules/MapPage/utils/maplibreHelpers';
import useAnalysisStore from 'src/app/store/analysisStore';
import baseStyles from './ToolsControls.module.scss';
import styles from './AnalysisTools.module.scss';

const TOOL_ID = 'measure_area';
const SOURCE_ID = 'measure-area-source';
const FILL_LAYER_ID = 'measure-area-fill';
const LINE_LAYER_ID = 'measure-area-line';

const ensureLayer = (map) => {
  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }
  if (!map.getLayer(FILL_LAYER_ID)) {
    map.addLayer({
      id: FILL_LAYER_ID,
      type: 'fill',
      source: SOURCE_ID,
      paint: {
        'fill-color': 'rgba(72, 149, 239, 0.18)',
      },
    });
  }
  if (!map.getLayer(LINE_LAYER_ID)) {
    map.addLayer({
      id: LINE_LAYER_ID,
      type: 'line',
      source: SOURCE_ID,
      paint: {
        'line-color': '#4895ef',
        'line-width': 2,
      },
    });
  }
};

const labelElement = (text) => {
  const element = document.createElement('div');
  element.className = 'ol-tooltip ol-tooltip-static';
  element.textContent = text;
  return element;
};

const MeasureAreaTool = () => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [results, setResults] = useState([]);
  const drawCleanupRef = useRef(null);
  const featuresRef = useRef([]);
  const markersRef = useRef([]);

  const activeToolId = useAnalysisStore((s) => s.activeToolId);
  const setActiveTool = useAnalysisStore((s) => s.setActiveTool);

  useEffect(() => {
    const map = getMapInstance();
    if (!map) return undefined;
    ensureLayer(map);
    return () => {
      drawCleanupRef.current?.();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      removeSourceWithLayers(map, SOURCE_ID);
    };
  }, []);

  const updateSource = useCallback(() => {
    const source = getMapInstance()?.getSource(SOURCE_ID);
    source?.setData({
      type: 'FeatureCollection',
      features: featuresRef.current,
    });
  }, []);

  const startDrawing = useCallback(() => {
    const map = getMapInstance();
    if (!map || (activeToolId !== null && activeToolId !== TOOL_ID)) return;
    ensureLayer(map);
    setActiveTool(TOOL_ID);
    setIsDrawing(true);

    drawCleanupRef.current = startMapLibreDraw(map, {
      idPrefix: 'measure-area-draw',
      type: 'Polygon',
      minPoints: 3,
      onComplete: (feature) => {
        const value = formatArea(feature);
        const id = Date.now();
        featuresRef.current = [...featuresRef.current, { ...feature, id }];
        updateSource();
        markersRef.current.push(new maplibregl.Marker({
          element: labelElement(value),
          anchor: 'bottom',
        }).setLngLat(center(feature).geometry.coordinates).addTo(map));
        setResults((prev) => [...prev, { id, label: `Area ${prev.length + 1}`, value }]);
        setIsDrawing(false);
        setActiveTool(null);
      },
      onCancel: () => {
        setIsDrawing(false);
        setActiveTool(null);
      },
    });
  }, [activeToolId, setActiveTool, updateSource]);

  const cancelDrawing = useCallback(() => {
    drawCleanupRef.current?.();
    drawCleanupRef.current = null;
    setIsDrawing(false);
    setActiveTool(null);
  }, [setActiveTool]);

  const clearAll = useCallback(() => {
    featuresRef.current = [];
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    updateSource();
    setResults([]);
  }, [updateSource]);

  const copyResults = useCallback(() => {
    navigator.clipboard?.writeText(results.map((r) => `${r.label}: ${r.value}`).join('\n'));
  }, [results]);

  const downloadCsv = useCallback(() => {
    const csv = ['Label,Value', ...results.map((r) => `${r.label},${r.value}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'areas.csv';
    a.click();
  }, [results]);

  const blocked = activeToolId !== null && activeToolId !== TOOL_ID;

  return (
    <div className={styles.toolWrap}>
      <p className={baseStyles.toolDesc}>
        Draw a polygon on the map to calculate its area.
      </p>

      {isDrawing ? (
        <button className={styles.cancelBtn} onClick={cancelDrawing}>
          <X size={13} /> Cancel
        </button>
      ) : (
        <button className={styles.activateBtn} onClick={startDrawing} disabled={blocked}>
          <Pentagon size={13} /> Start Drawing
        </button>
      )}

      {results.length > 0 && (
        <>
          <span className={styles.sectionLabel}>Results</span>
          <div className={styles.resultList}>
            {results.map((r) => (
              <div key={r.id} className={styles.resultRow}>
                <span>{r.label}</span>
                <span>{r.value}</span>
              </div>
            ))}
          </div>
          <div className={styles.actionRow}>
            <button onClick={clearAll}><Trash2 size={12} /> Clear</button>
            <button onClick={copyResults}><Copy size={12} /> Copy</button>
            <button onClick={downloadCsv}><Download size={12} /> CSV</button>
          </div>
        </>
      )}
    </div>
  );
};

export default MeasureAreaTool;
