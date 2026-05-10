import { useState, useEffect, useRef, useCallback } from 'react';
import { Layers, X, Trash2 } from 'lucide-react';
import * as turf from '@turf/turf';
import Draw from 'ol/interaction/Draw';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Stroke, Fill } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import { showToast } from 'src/shared/utils/showToast';
import useAnalysisStore from 'src/app/store/analysisStore';
import baseStyles from './ToolsControls.module.scss';
import styles from './AnalysisTools.module.scss';

const TOOL_ID = 'intersect_tool';

const makeDrawStyle = (color) =>
  new Style({
    fill: new Fill({ color: `${color}20` }),
    stroke: new Stroke({ color, width: 2, lineDash: [6, 4] }),
  });

const RESULT_STYLE = new Style({
  fill: new Fill({ color: 'rgba(167, 139, 250, 0.25)' }),
  stroke: new Stroke({ color: 'rgba(167, 139, 250, 0.85)', width: 2.5 }),
});

const STYLE_A = makeDrawStyle('rgba(99, 102, 241, 0.85)');
const STYLE_B = makeDrawStyle('rgba(52, 211, 153, 0.85)');

const geojsonFormat = new GeoJSON();

const IntersectTool = () => {
  const [step, setStep] = useState(1);        // 1 = pick A, 2 = pick B
  const [modeA, setModeA] = useState('draw'); // 'draw' | 'saved'
  const [modeB, setModeB] = useState('draw');
  const [savedIdA, setSavedIdA] = useState('');
  const [savedIdB, setSavedIdB] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [geojsonA, setGeojsonA] = useState(null);
  const [geojsonB, setGeojsonB] = useState(null);
  const [intersectionArea, setIntersectionArea] = useState(null);
  const [error, setError] = useState(null);

  const drawRef = useRef(null);
  const layerARef = useRef(null);
  const layerBRef = useRef(null);
  const resultLayerRef = useRef(null);
  const sourceARef = useRef(null);
  const sourceBRef = useRef(null);
  const resultSourceRef = useRef(null);

  const { drawnPolygons, activeToolId, setActiveTool } = useAnalysisStore();

  useEffect(() => {
    const map = window.mapInstance;
    if (!map) return;

    const mkLayer = (src, style, id, z) => {
      const l = new VectorLayer({ source: src, style, zIndex: z });
      l.set('id', id);
      map.addLayer(l);
      return l;
    };

    const srcA = new VectorSource();
    const srcB = new VectorSource();
    const srcR = new VectorSource();

    sourceARef.current = srcA;
    sourceBRef.current = srcB;
    resultSourceRef.current = srcR;
    layerARef.current = mkLayer(srcA, STYLE_A, 'intersect-a', 486);
    layerBRef.current = mkLayer(srcB, STYLE_B, 'intersect-b', 485);
    resultLayerRef.current = mkLayer(srcR, RESULT_STYLE, 'intersect-result', 487);

    return () => {
      [layerARef, layerBRef, resultLayerRef].forEach((r) => { if (r.current) map.removeLayer(r.current); });
    };
  }, []);

  const drawForStep = useCallback((targetStep, onDone) => {
    const map = window.mapInstance;
    if (!map || (activeToolId !== null && activeToolId !== TOOL_ID)) return;

    setActiveTool(TOOL_ID);
    setIsDrawing(true);

    const style = targetStep === 1 ? STYLE_A : STYLE_B;
    const draw = new Draw({ type: 'Polygon', style });
    drawRef.current = draw;

    draw.on('drawend', (e) => {
      const geom = e.feature.getGeometry();
      const geojson = geojsonFormat.writeGeometryObject(geom, {
        featureProjection: 'EPSG:3857',
        dataProjection: 'EPSG:4326',
      });

      const src = targetStep === 1 ? sourceARef.current : sourceBRef.current;
      src?.clear();
      const feat = geojsonFormat.readFeature({ type: 'Feature', geometry: geojson }, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });
      src?.addFeature(feat);

      map.removeInteraction(draw);
      drawRef.current = null;
      setIsDrawing(false);
      setActiveTool(null);
      onDone(geojson);
    });

    map.addInteraction(draw);
  }, [activeToolId, setActiveTool]);

  const cancelDrawing = useCallback(() => {
    const map = window.mapInstance;
    if (drawRef.current && map) {
      map.removeInteraction(drawRef.current);
      drawRef.current = null;
    }
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
    setError(null);
    setIntersectionArea(null);
    resultSourceRef.current?.clear();

    if (!geojsonA || !geojsonB) { setError('Both polygons are required.'); return; }

    try {
      const featA = turf.feature(geojsonA);
      const featB = turf.feature(geojsonB);
      const result = turf.intersect(turf.featureCollection([featA, featB]));

      if (!result) {
        showToast('Polygons do not intersect.', 'warning');
        return;
      }

      const olFeat = geojsonFormat.readFeature(result, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });
      resultSourceRef.current?.addFeature(olFeat);

      const areaM2 = turf.area(result);
      const label = areaM2 > 1e6
        ? `${(areaM2 / 1e6).toFixed(2)} km²`
        : `${areaM2.toFixed(0)} m²`;
      setIntersectionArea(label);
    } catch (e) {
      setError(e.message || 'Intersection failed.');
    }
  }, [geojsonA, geojsonB]);

  const clearAll = useCallback(() => {
    [sourceARef, sourceBRef, resultSourceRef].forEach((r) => r.current?.clear());
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

      {/* Step A */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className={styles.stepIndicator}>Step 1 — Polygon A</span>
        {geojsonA && <span style={{ fontSize: '0.65rem', color: 'rgba(52,211,153,0.8)' }}>✓ Ready</span>}
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
          <option value="">— select polygon A —</option>
          {drawnPolygons.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      )}

      {/* Step B — show once A is ready */}
      {step >= 2 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
            <span className={styles.stepIndicator}>Step 2 — Polygon B</span>
            {geojsonB && <span style={{ fontSize: '0.65rem', color: 'rgba(52,211,153,0.8)' }}>✓ Ready</span>}
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
              <option value="">— select polygon B —</option>
              {drawnPolygons.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </>
      )}

      {/* Compute */}
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
