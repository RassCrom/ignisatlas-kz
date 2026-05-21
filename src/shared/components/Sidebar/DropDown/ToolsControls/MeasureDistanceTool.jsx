import { useCallback, useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { Copy, Download, Ruler, Trash2, X } from 'lucide-react';
import { getMapInstance } from 'src/modules/MapPage/services/mapService';
import {
  formatLength,
  midpointOnLine,
  startMapLibreDraw,
} from 'src/modules/MapPage/utils/maplibreDraw';
import { removeSourceWithLayers } from 'src/modules/MapPage/utils/maplibreHelpers';
import useAnalysisStore from 'src/app/store/analysisStore';
import baseStyles from './ToolsControls.module.scss';
import styles from './AnalysisTools.module.scss';

const TOOL_ID = 'measure_distance';
const SOURCE_ID = 'measure-distance-source';
const LAYER_ID = 'measure-distance-layer';

const ensureLayer = (map) => {
  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }
  if (!map.getLayer(LAYER_ID)) {
    map.addLayer({
      id: LAYER_ID,
      type: 'line',
      source: SOURCE_ID,
      paint: {
        'line-color': '#4895ef',
        'line-width': 2,
        'line-dasharray': [2, 1],
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

const MeasureDistanceTool = () => {
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
      idPrefix: 'measure-distance-draw',
      type: 'LineString',
      minPoints: 2,
      onComplete: (feature) => {
        const value = formatLength(feature);
        const id = Date.now();
        featuresRef.current = [...featuresRef.current, { ...feature, id }];
        updateSource();
        markersRef.current.push(new maplibregl.Marker({
          element: labelElement(value),
          anchor: 'bottom',
        }).setLngLat(midpointOnLine(feature)).addTo(map));
        setResults((prev) => [...prev, { id, label: `Segment ${prev.length + 1}`, value }]);
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
    a.download = 'distances.csv';
    a.click();
  }, [results]);

  const blocked = activeToolId !== null && activeToolId !== TOOL_ID;

  return (
    <div className={styles.toolWrap}>
      <p className={baseStyles.toolDesc}>
        Click on the map to draw a line and measure its length.
      </p>

      {isDrawing ? (
        <button className={styles.cancelBtn} onClick={cancelDrawing}>
          <X size={13} /> Cancel
        </button>
      ) : (
        <button className={styles.activateBtn} onClick={startDrawing} disabled={blocked}>
          <Ruler size={13} /> Start Drawing
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
            <button onClick={clearAll} title="Clear all"><Trash2 size={12} /> Clear</button>
            <button onClick={copyResults} title="Copy to clipboard"><Copy size={12} /> Copy</button>
            <button onClick={downloadCsv} title="Download CSV"><Download size={12} /> CSV</button>
          </div>
        </>
      )}
    </div>
  );
};

export default MeasureDistanceTool;
