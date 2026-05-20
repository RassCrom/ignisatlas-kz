import { useState, useEffect, useRef, useCallback } from 'react';
import { Pencil, X, Eye, EyeOff, Trash2, Save } from 'lucide-react';
import Draw from 'ol/interaction/Draw';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Style, Stroke, Fill } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import useAnalysisStore from 'src/app/store/analysisStore';
import { getMapInstance } from 'src/modules/MapPage/services/mapService';
import baseStyles from './ToolsControls.module.scss';
import styles from './AnalysisTools.module.scss';

const TOOL_ID = 'draw_polygon';

const PREVIEW_STYLE = new Style({
  fill: new Fill({ color: 'rgba(52, 211, 153, 0.1)' }),
  stroke: new Stroke({ color: 'rgba(52, 211, 153, 0.7)', width: 2, lineDash: [6, 4] }),
});

const geojsonFormat = new GeoJSON();

const DrawPolygonTool = () => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [pendingGeojson, setPendingGeojson] = useState(null);
  const [pendingName, setPendingName] = useState('');

  const drawRef = useRef(null);
  const previewSourceRef = useRef(null);
  const previewLayerRef = useRef(null);

  const { drawnPolygons, addPolygon, removePolygon, togglePolygonVisibility, activeToolId, setActiveTool } =
    useAnalysisStore();

  // Temporary preview layer for the just-drawn polygon while naming it
  useEffect(() => {
    const map = getMapInstance();
    if (!map) return;

    const source = new VectorSource();
    const layer = new VectorLayer({ source, style: PREVIEW_STYLE, zIndex: 498 });
    layer.set('id', 'draw-polygon-preview');
    map.addLayer(layer);
    previewSourceRef.current = source;
    previewLayerRef.current = layer;

    return () => { map.removeLayer(layer); };
  }, []);

  const startDrawing = useCallback(() => {
    const map = getMapInstance();
    if (!map || (activeToolId !== null && activeToolId !== TOOL_ID)) return;

    setPendingGeojson(null);
    setPendingName('');
    if (previewSourceRef.current) previewSourceRef.current.clear();

    setActiveTool(TOOL_ID);
    setIsDrawing(true);

    const draw = new Draw({ type: 'Polygon', style: PREVIEW_STYLE });
    drawRef.current = draw;

    draw.on('drawend', (e) => {
      const geom = e.feature.getGeometry();
      const geojson = geojsonFormat.writeGeometryObject(geom, {
        featureProjection: 'EPSG:3857',
        dataProjection: 'EPSG:4326',
      });

      // Show preview on the temporary layer
      const feat = geojsonFormat.readFeature({ type: 'Feature', geometry: geojson }, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });
      previewSourceRef.current?.addFeature(feat);

      setPendingGeojson(geojson);
      setPendingName(`Polygon ${Date.now().toString().slice(-4)}`);

      map.removeInteraction(draw);
      drawRef.current = null;
      setIsDrawing(false);
      setActiveTool(null);
    });

    map.addInteraction(draw);
  }, [activeToolId, setActiveTool]);

  const cancelDrawing = useCallback(() => {
    const map = getMapInstance();
    if (drawRef.current && map) {
      map.removeInteraction(drawRef.current);
      drawRef.current = null;
    }
    setIsDrawing(false);
    setActiveTool(null);
  }, [setActiveTool]);

  const savePolygon = useCallback(() => {
    if (!pendingGeojson) return;
    addPolygon(pendingName.trim() || 'Polygon', pendingGeojson);
    setPendingGeojson(null);
    setPendingName('');
    if (previewSourceRef.current) previewSourceRef.current.clear();
  }, [pendingGeojson, pendingName, addPolygon]);

  const discardPending = useCallback(() => {
    setPendingGeojson(null);
    setPendingName('');
    if (previewSourceRef.current) previewSourceRef.current.clear();
  }, []);

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
