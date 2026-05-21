import { useCallback, useEffect, useRef, useState } from 'react';
import { CircleDashed, Trash2, X } from 'lucide-react';
import * as turf from '@turf/turf';
import useAnalysisStore from 'src/app/store/analysisStore';
import { getMapInstance } from 'src/modules/MapPage/services/mapService';
import { startMapLibreDraw } from 'src/modules/MapPage/utils/maplibreDraw';
import { removeSourceWithLayers } from 'src/modules/MapPage/utils/maplibreHelpers';
import baseStyles from './ToolsControls.module.scss';
import styles from './AnalysisTools.module.scss';

const TOOL_ID = 'buffer_tool';
const INPUT_SOURCE_ID = 'buffer-input-source';
const INPUT_LAYER_ID = 'buffer-input-layer';
const RESULT_SOURCE_ID = 'buffer-result-source';
const RESULT_FILL_ID = 'buffer-result-fill';
const RESULT_LINE_ID = 'buffer-result-line';

const setSourceData = (map, sourceId, feature) => {
  map.getSource(sourceId)?.setData({
    type: 'FeatureCollection',
    features: feature ? [feature] : [],
  });
};

const ensureLayers = (map) => {
  if (!map.getSource(INPUT_SOURCE_ID)) {
    map.addSource(INPUT_SOURCE_ID, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  }
  if (!map.getLayer(INPUT_LAYER_ID)) {
    map.addLayer({
      id: INPUT_LAYER_ID,
      type: 'line',
      source: INPUT_SOURCE_ID,
      paint: { 'line-color': 'rgba(52, 211, 153, 0.7)', 'line-width': 2, 'line-dasharray': [2, 1] },
    });
  }
  if (!map.getSource(RESULT_SOURCE_ID)) {
    map.addSource(RESULT_SOURCE_ID, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  }
  if (!map.getLayer(RESULT_FILL_ID)) {
    map.addLayer({
      id: RESULT_FILL_ID,
      type: 'fill',
      source: RESULT_SOURCE_ID,
      paint: { 'fill-color': 'rgba(45, 212, 191, 0.15)' },
    });
  }
  if (!map.getLayer(RESULT_LINE_ID)) {
    map.addLayer({
      id: RESULT_LINE_ID,
      type: 'line',
      source: RESULT_SOURCE_ID,
      paint: { 'line-color': 'rgba(45, 212, 191, 0.8)', 'line-width': 2 },
    });
  }
};

const BufferTool = () => {
  const [mode, setMode] = useState('draw');
  const [selectedPolyId, setSelectedPolyId] = useState('');
  const [distance, setDistance] = useState(10);
  const [units, setUnits] = useState('kilometers');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnGeojson, setDrawnGeojson] = useState(null);
  const [bufferArea, setBufferArea] = useState(null);
  const [error, setError] = useState(null);
  const drawCleanupRef = useRef(null);

  const { drawnPolygons, activeToolId, setActiveTool } = useAnalysisStore();

  useEffect(() => {
    const map = getMapInstance();
    if (!map) return undefined;
    ensureLayers(map);
    return () => {
      drawCleanupRef.current?.();
      removeSourceWithLayers(map, INPUT_SOURCE_ID);
      removeSourceWithLayers(map, RESULT_SOURCE_ID);
    };
  }, []);

  const startDrawInput = useCallback(() => {
    const map = getMapInstance();
    if (!map || (activeToolId !== null && activeToolId !== TOOL_ID)) return;

    ensureLayers(map);
    setActiveTool(TOOL_ID);
    setIsDrawing(true);
    setDrawnGeojson(null);
    setSourceData(map, INPUT_SOURCE_ID, null);
    setSourceData(map, RESULT_SOURCE_ID, null);
    setBufferArea(null);

    drawCleanupRef.current = startMapLibreDraw(map, {
      idPrefix: 'buffer-input-draw',
      type: 'Polygon',
      minPoints: 3,
      onComplete: (feature) => {
        setSourceData(map, INPUT_SOURCE_ID, feature);
        setDrawnGeojson(feature.geometry);
        setIsDrawing(false);
        setActiveTool(null);
      },
      onCancel: () => {
        setIsDrawing(false);
        setActiveTool(null);
      },
    });
  }, [activeToolId, setActiveTool]);

  const cancelDrawing = useCallback(() => {
    drawCleanupRef.current?.();
    drawCleanupRef.current = null;
    setIsDrawing(false);
    setActiveTool(null);
  }, [setActiveTool]);

  const applyBuffer = useCallback(() => {
    const map = getMapInstance();
    if (!map) return;
    setError(null);

    let inputGeojson = mode === 'draw' ? drawnGeojson : null;
    if (mode === 'saved') {
      inputGeojson = drawnPolygons.find((p) => p.id === selectedPolyId)?.geojson;
    }

    if (!inputGeojson) {
      setError('No input polygon selected.');
      return;
    }

    try {
      const feature = turf.feature(inputGeojson);
      const buffered = turf.buffer(feature, Number(distance), { units });
      if (!buffered) {
        setError('Buffer failed. Check input geometry.');
        return;
      }

      ensureLayers(map);
      setSourceData(map, RESULT_SOURCE_ID, buffered);
      const areaM2 = turf.area(buffered);
      setBufferArea(areaM2 > 1e6 ? `${(areaM2 / 1e6).toFixed(2)} km2` : `${areaM2.toFixed(0)} m2`);
    } catch (e) {
      setError(e.message || 'Buffer computation failed.');
    }
  }, [mode, drawnGeojson, drawnPolygons, selectedPolyId, distance, units]);

  const clearResult = useCallback(() => {
    const map = getMapInstance();
    if (map) {
      setSourceData(map, RESULT_SOURCE_ID, null);
      setSourceData(map, INPUT_SOURCE_ID, null);
    }
    setDrawnGeojson(null);
    setBufferArea(null);
    setError(null);
  }, []);

  const blocked = activeToolId !== null && activeToolId !== TOOL_ID;
  const hasInput = mode === 'draw' ? !!drawnGeojson : !!selectedPolyId;

  return (
    <div className={styles.toolWrap}>
      <p className={baseStyles.toolDesc}>
        Create a buffer zone around a polygon at a specified distance.
      </p>

      <span className={styles.sectionLabel}>Input Polygon</span>
      <div className={styles.radioGroup}>
        <label className={styles.radioLabel}>
          <input type="radio" value="draw" checked={mode === 'draw'} onChange={() => setMode('draw')} />
          Draw new
        </label>
        <label className={styles.radioLabel}>
          <input type="radio" value="saved" checked={mode === 'saved'} onChange={() => setMode('saved')} />
          Use saved
        </label>
      </div>

      {mode === 'draw' && (
        isDrawing ? (
          <button className={styles.cancelBtn} onClick={cancelDrawing}><X size={13} /> Cancel</button>
        ) : (
          <button className={styles.activateBtn} onClick={startDrawInput} disabled={blocked}>
            <CircleDashed size={13} /> {drawnGeojson ? 'Redraw Polygon' : 'Draw Polygon'}
          </button>
        )
      )}

      {mode === 'saved' && (
        <select className={baseStyles.select} value={selectedPolyId} onChange={(e) => setSelectedPolyId(e.target.value)}>
          <option value="">- select a saved polygon -</option>
          {drawnPolygons.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      )}

      <span className={styles.sectionLabel}>Buffer Parameters</span>
      <div className={styles.inlineRow}>
        <input
          type="number"
          min={0.001}
          step={1}
          value={distance}
          onChange={(e) => setDistance(e.target.value)}
          className={baseStyles.input}
          style={{ width: '80px' }}
        />
        <select className={styles.unitSelect} value={units} onChange={(e) => setUnits(e.target.value)}>
          <option value="meters">m</option>
          <option value="kilometers">km</option>
          <option value="miles">mi</option>
        </select>
      </div>

      <button className={styles.applyBtn} onClick={applyBuffer} disabled={!hasInput || isDrawing}>
        Apply Buffer
      </button>

      {bufferArea && (
        <div className={styles.resultRow}>
          <span>Buffered area</span>
          <span>{bufferArea}</span>
        </div>
      )}

      {error && <p className={`${baseStyles.statusMsg} ${baseStyles.statusError}`}>{error}</p>}

      {(bufferArea || drawnGeojson) && (
        <button className={styles.cancelBtn} onClick={clearResult} style={{ marginTop: '0.1rem' }}>
          <Trash2 size={13} /> Clear
        </button>
      )}
    </div>
  );
};

export default BufferTool;
