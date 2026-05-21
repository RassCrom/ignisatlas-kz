import { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Pencil, Save, Trash2, X } from 'lucide-react';
import useAnalysisStore from 'src/app/store/analysisStore';
import { getMapInstance } from 'src/modules/MapPage/services/mapService';
import { startMapLibreDraw } from 'src/modules/MapPage/utils/maplibreDraw';
import { removeSourceWithLayers } from 'src/modules/MapPage/utils/maplibreHelpers';
import baseStyles from './ToolsControls.module.scss';
import styles from './AnalysisTools.module.scss';

const TOOL_ID = 'draw_polygon';
const SOURCE_ID = 'draw-polygon-preview-source';
const FILL_LAYER_ID = 'draw-polygon-preview-fill';
const LINE_LAYER_ID = 'draw-polygon-preview-line';

const ensurePreviewLayer = (map) => {
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
      paint: { 'fill-color': 'rgba(52, 211, 153, 0.1)' },
    });
  }
  if (!map.getLayer(LINE_LAYER_ID)) {
    map.addLayer({
      id: LINE_LAYER_ID,
      type: 'line',
      source: SOURCE_ID,
      paint: {
        'line-color': 'rgba(52, 211, 153, 0.7)',
        'line-width': 2,
        'line-dasharray': [2, 1],
      },
    });
  }
};

const DrawPolygonTool = () => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [pendingGeojson, setPendingGeojson] = useState(null);
  const [pendingName, setPendingName] = useState('');
  const drawCleanupRef = useRef(null);

  const { drawnPolygons, addPolygon, removePolygon, togglePolygonVisibility, activeToolId, setActiveTool } =
    useAnalysisStore();

  useEffect(() => {
    const map = getMapInstance();
    if (!map) return undefined;
    ensurePreviewLayer(map);
    return () => {
      drawCleanupRef.current?.();
      removeSourceWithLayers(map, SOURCE_ID);
    };
  }, []);

  const setPreview = useCallback((feature) => {
    const map = getMapInstance();
    ensurePreviewLayer(map);
    map.getSource(SOURCE_ID)?.setData({
      type: 'FeatureCollection',
      features: feature ? [feature] : [],
    });
  }, []);

  const startDrawing = useCallback(() => {
    const map = getMapInstance();
    if (!map || (activeToolId !== null && activeToolId !== TOOL_ID)) return;

    setPendingGeojson(null);
    setPendingName('');
    setPreview(null);
    setActiveTool(TOOL_ID);
    setIsDrawing(true);

    drawCleanupRef.current = startMapLibreDraw(map, {
      idPrefix: 'draw-polygon-tool',
      type: 'Polygon',
      minPoints: 3,
      onComplete: (feature) => {
        setPreview(feature);
        setPendingGeojson(feature.geometry);
        setPendingName(`Polygon ${Date.now().toString().slice(-4)}`);
        setIsDrawing(false);
        setActiveTool(null);
      },
      onCancel: () => {
        setIsDrawing(false);
        setActiveTool(null);
      },
    });
  }, [activeToolId, setActiveTool, setPreview]);

  const cancelDrawing = useCallback(() => {
    drawCleanupRef.current?.();
    drawCleanupRef.current = null;
    setIsDrawing(false);
    setActiveTool(null);
  }, [setActiveTool]);

  const savePolygon = useCallback(() => {
    if (!pendingGeojson) return;
    addPolygon(pendingName.trim() || 'Polygon', pendingGeojson);
    setPendingGeojson(null);
    setPendingName('');
    setPreview(null);
  }, [pendingGeojson, pendingName, addPolygon, setPreview]);

  const discardPending = useCallback(() => {
    setPendingGeojson(null);
    setPendingName('');
    setPreview(null);
  }, [setPreview]);

  const blocked = activeToolId !== null && activeToolId !== TOOL_ID;

  return (
    <div className={styles.toolWrap}>
      <p className={baseStyles.toolDesc}>
        Draw a polygon and save it for reuse in Buffer and Intersect tools.
      </p>

      {isDrawing ? (
        <button className={styles.cancelBtn} onClick={cancelDrawing}>
          <X size={13} /> Cancel
        </button>
      ) : (
        <button className={styles.activateBtn} onClick={startDrawing} disabled={blocked || !!pendingGeojson}>
          <Pencil size={13} /> Draw Polygon
        </button>
      )}

      {pendingGeojson && (
        <div className={styles.pendingForm}>
          <span className={styles.sectionLabel}>Name this polygon</span>
          <input
            className={baseStyles.input}
            value={pendingName}
            onChange={(e) => setPendingName(e.target.value)}
            placeholder="e.g., Study Area"
            autoFocus
          />
          <div className={styles.actionRow}>
            <button onClick={savePolygon} style={{ color: 'rgba(52,211,153,0.9)' }}>
              <Save size={12} /> Save
            </button>
            <button onClick={discardPending} style={{ color: 'rgba(248,113,113,0.8)' }}>
              <X size={12} /> Discard
            </button>
          </div>
        </div>
      )}

      {drawnPolygons.length > 0 && (
        <>
          <span className={styles.sectionLabel}>Saved Polygons ({drawnPolygons.length})</span>
          <div className={styles.polyList}>
            {drawnPolygons.map((p) => (
              <div key={p.id} className={styles.polyRow}>
                <span className={styles.polyName}>{p.name}</span>
                <button
                  className={`${styles.iconBtn} ${p.visible ? styles.active : ''}`}
                  onClick={() => togglePolygonVisibility(p.id)}
                  title="Toggle visibility"
                >
                  {p.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <button
                  className={`${styles.iconBtn} ${styles.danger}`}
                  onClick={() => removePolygon(p.id)}
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {drawnPolygons.length === 0 && !pendingGeojson && !isDrawing && (
        <p className={styles.emptyNote}>No polygons saved yet.</p>
      )}
    </div>
  );
};

export default DrawPolygonTool;
