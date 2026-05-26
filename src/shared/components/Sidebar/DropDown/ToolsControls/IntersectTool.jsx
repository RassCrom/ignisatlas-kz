import { useCallback, useEffect, useRef, useState } from 'react';
import { Layers, Trash2, X } from 'lucide-react';
import { intersect, featureCollection, feature, area } from '@turf/turf';
import { showToast } from 'src/shared/utils/showToast';
import useAnalysisStore from 'src/app/store/analysisStore';
import { getMapInstance } from 'src/modules/MapPage/services/mapService';
import { startMapLibreDraw } from 'src/modules/MapPage/utils/maplibreDraw';
import { removeSourceWithLayers } from 'src/modules/MapPage/utils/maplibreHelpers';
import baseStyles from './ToolsControls.module.scss';
import styles from './AnalysisTools.module.scss';

const TOOL_ID = 'intersect_tool';
const SOURCES = {
  a: 'intersect-a-source',
  b: 'intersect-b-source',
  result: 'intersect-result-source',
};

const setSourceData = (map, sourceId, feature) => {
  map.getSource(sourceId)?.setData({
    type: 'FeatureCollection',
    features: feature ? [feature] : [],
  });
};

const addPolygonPairLayers = (map, sourceId, fillId, lineId, color) => {
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  }
  if (!map.getLayer(fillId)) {
    map.addLayer({ id: fillId, type: 'fill', source: sourceId, paint: { 'fill-color': `${color}33` } });
  }
  if (!map.getLayer(lineId)) {
    map.addLayer({
      id: lineId,
      type: 'line',
      source: sourceId,
      paint: { 'line-color': color, 'line-width': 2, 'line-dasharray': [2, 1] },
    });
  }
};

const ensureLayers = (map) => {
  addPolygonPairLayers(map, SOURCES.a, 'intersect-a-fill', 'intersect-a-line', '#6366f1');
  addPolygonPairLayers(map, SOURCES.b, 'intersect-b-fill', 'intersect-b-line', '#34d399');
  addPolygonPairLayers(map, SOURCES.result, 'intersect-result-fill', 'intersect-result-line', '#a78bfa');
};

const IntersectTool = () => {
  const [step, setStep] = useState(1);
  const [modeA, setModeA] = useState('draw');
  const [modeB, setModeB] = useState('draw');
  const [savedIdA, setSavedIdA] = useState('');
  const [savedIdB, setSavedIdB] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [geojsonA, setGeojsonA] = useState(null);
  const [geojsonB, setGeojsonB] = useState(null);
  const [intersectionArea, setIntersectionArea] = useState(null);
  const [error, setError] = useState(null);
  const drawCleanupRef = useRef(null);

  const { drawnPolygons, activeToolId, setActiveTool } = useAnalysisStore();

  useEffect(() => {
    const map = getMapInstance();
    if (!map) return undefined;
    ensureLayers(map);
    return () => {
      drawCleanupRef.current?.();
      Object.values(SOURCES).forEach((sourceId) => removeSourceWithLayers(map, sourceId));
    };
  }, []);

  const drawForStep = useCallback((targetStep, onDone) => {
    const map = getMapInstance();
    if (!map || (activeToolId !== null && activeToolId !== TOOL_ID)) return;
    ensureLayers(map);
    setActiveTool(TOOL_ID);
    setIsDrawing(true);

    drawCleanupRef.current = startMapLibreDraw(map, {
      idPrefix: `intersect-${targetStep}-draw`,
      type: 'Polygon',
      minPoints: 3,
      onComplete: (feature) => {
        setSourceData(map, targetStep === 1 ? SOURCES.a : SOURCES.b, feature);
        setIsDrawing(false);
        setActiveTool(null);
        onDone(feature.geometry);
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

  const handleDrawA = useCallback(() => {
    drawForStep(1, (geojson) => { setGeojsonA(geojson); setStep(2); });
  }, [drawForStep]);

  const handleDrawB = useCallback(() => {
    drawForStep(2, (geojson) => { setGeojsonB(geojson); });
  }, [drawForStep]);

  const handleSavedA = useCallback((id) => {
    setSavedIdA(id);
    const poly = drawnPolygons.find((p) => p.id === id);
    if (poly) {
      setGeojsonA(poly.geojson);
      setStep(2);
    }
  }, [drawnPolygons]);

  const handleSavedB = useCallback((id) => {
    setSavedIdB(id);
    const poly = drawnPolygons.find((p) => p.id === id);
    if (poly) setGeojsonB(poly.geojson);
  }, [drawnPolygons]);

  const compute = useCallback(() => {
    const map = getMapInstance();
    if (!map) return;
    setError(null);
    setIntersectionArea(null);
    setSourceData(map, SOURCES.result, null);

    if (!geojsonA || !geojsonB) {
      setError('Both polygons are required.');
      return;
    }

    try {
      const result = intersect(featureCollection([
        feature(geojsonA),
        feature(geojsonB),
      ]));

      if (!result) {
        showToast('Polygons do not intersect.', 'warning');
        return;
      }

      ensureLayers(map);
      setSourceData(map, SOURCES.result, result);
      const areaM2 = area(result);
      setIntersectionArea(areaM2 > 1e6 ? `${(areaM2 / 1e6).toFixed(2)} km2` : `${areaM2.toFixed(0)} m2`);
    } catch (e) {
      setError(e.message || 'Intersection failed.');
    }
  }, [geojsonA, geojsonB]);

  const clearAll = useCallback(() => {
    const map = getMapInstance();
    if (map) Object.values(SOURCES).forEach((sourceId) => setSourceData(map, sourceId, null));
    setGeojsonA(null);
    setGeojsonB(null);
    setSavedIdA('');
    setSavedIdB('');
    setIntersectionArea(null);
    setError(null);
    setStep(1);
  }, []);

  const blocked = activeToolId !== null && activeToolId !== TOOL_ID;

  return (
    <div className={styles.toolWrap}>
      <p className={baseStyles.toolDesc}>
        Compute the geometric intersection of two polygons.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className={styles.stepIndicator}>Step 1 - Polygon A</span>
        {geojsonA && <span style={{ fontSize: '0.65rem', color: 'rgba(52,211,153,0.8)' }}>Ready</span>}
      </div>

      <div className={styles.radioGroup}>
        <label className={styles.radioLabel}>
          <input type="radio" value="draw" checked={modeA === 'draw'} onChange={() => setModeA('draw')} />
          Draw
        </label>
        <label className={styles.radioLabel}>
          <input type="radio" value="saved" checked={modeA === 'saved'} onChange={() => setModeA('saved')} />
          Saved
        </label>
      </div>

      {modeA === 'draw' ? (
        isDrawing && step === 1 ? (
          <button className={styles.cancelBtn} onClick={cancelDrawing}><X size={13} /> Cancel</button>
        ) : (
          <button className={styles.activateBtn} onClick={handleDrawA} disabled={blocked || (isDrawing && step !== 1)}>
            {geojsonA ? 'Redraw A' : 'Draw Polygon A'}
          </button>
        )
      ) : (
        <select className={baseStyles.select} value={savedIdA} onChange={(e) => handleSavedA(e.target.value)}>
          <option value="">- select polygon A -</option>
          {drawnPolygons.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      )}

      {step >= 2 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
            <span className={styles.stepIndicator}>Step 2 - Polygon B</span>
            {geojsonB && <span style={{ fontSize: '0.65rem', color: 'rgba(52,211,153,0.8)' }}>Ready</span>}
          </div>

          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input type="radio" value="draw" checked={modeB === 'draw'} onChange={() => setModeB('draw')} />
              Draw
            </label>
            <label className={styles.radioLabel}>
              <input type="radio" value="saved" checked={modeB === 'saved'} onChange={() => setModeB('saved')} />
              Saved
            </label>
          </div>

          {modeB === 'draw' ? (
            isDrawing && step === 2 ? (
              <button className={styles.cancelBtn} onClick={cancelDrawing}><X size={13} /> Cancel</button>
            ) : (
              <button className={styles.activateBtn} onClick={handleDrawB} disabled={blocked || (isDrawing && step !== 2)}>
                {geojsonB ? 'Redraw B' : 'Draw Polygon B'}
              </button>
            )
          ) : (
            <select className={baseStyles.select} value={savedIdB} onChange={(e) => handleSavedB(e.target.value)}>
              <option value="">- select polygon B -</option>
              {drawnPolygons.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </>
      )}

      {geojsonA && geojsonB && (
        <button className={styles.applyBtn} onClick={compute} disabled={isDrawing}>
          <Layers size={13} /> Compute Intersection
        </button>
      )}

      {intersectionArea && (
        <div className={styles.resultRow}>
          <span>Intersection area</span>
          <span>{intersectionArea}</span>
        </div>
      )}

      {error && <p className={`${baseStyles.statusMsg} ${baseStyles.statusError}`}>{error}</p>}

      {(geojsonA || geojsonB || intersectionArea) && (
        <button className={styles.cancelBtn} onClick={clearAll}>
          <Trash2 size={13} /> Clear All
        </button>
      )}
    </div>
  );
};

export default IntersectTool;
