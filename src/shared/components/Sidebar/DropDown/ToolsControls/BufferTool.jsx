import { useState, useEffect, useRef, useCallback } from 'react';
import { CircleDashed, X, Trash2 } from 'lucide-react';
import * as turf from '@turf/turf';
import Draw from 'ol/interaction/Draw';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Stroke, Fill } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import { formatArea } from 'src/modules/MapPage/utils/measurement';
import useAnalysisStore from 'src/app/store/analysisStore';
import baseStyles from './ToolsControls.module.scss';
import styles from './AnalysisTools.module.scss';

const TOOL_ID = 'buffer_tool';

const INPUT_STYLE = new Style({
  fill: new Fill({ color: 'rgba(52, 211, 153, 0.08)' }),
  stroke: new Stroke({ color: 'rgba(52, 211, 153, 0.6)', width: 2, lineDash: [6, 4] }),
});

const BUFFER_STYLE = new Style({
  fill: new Fill({ color: 'rgba(45, 212, 191, 0.15)' }),
  stroke: new Stroke({ color: 'rgba(45, 212, 191, 0.8)', width: 2 }),
});

const geojsonFormat = new GeoJSON();

const BufferTool = () => {
  const [mode, setMode] = useState('draw'); // 'draw' | 'saved'
  const [selectedPolyId, setSelectedPolyId] = useState('');
  const [distance, setDistance] = useState(10);
  const [units, setUnits] = useState('kilometers');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnGeojson, setDrawnGeojson] = useState(null);
  const [bufferArea, setBufferArea] = useState(null);
  const [error, setError] = useState(null);

  const drawRef = useRef(null);
  const inputSourceRef = useRef(null);
  const inputLayerRef = useRef(null);
  const resultSourceRef = useRef(null);
  const resultLayerRef = useRef(null);

  const { drawnPolygons, activeToolId, setActiveTool } = useAnalysisStore();

  useEffect(() => {
    const map = window.mapInstance;
    if (!map) return;

    const iSrc = new VectorSource();
    const iLay = new VectorLayer({ source: iSrc, style: INPUT_STYLE, zIndex: 488 });
    iLay.set('id', 'buffer-input-layer');
    map.addLayer(iLay);

    const rSrc = new VectorSource();
    const rLay = new VectorLayer({ source: rSrc, style: BUFFER_STYLE, zIndex: 487 });
    rLay.set('id', 'buffer-result-layer');
    map.addLayer(rLay);

    inputSourceRef.current = iSrc;
    inputLayerRef.current = iLay;
    resultSourceRef.current = rSrc;
    resultLayerRef.current = rLay;

    return () => {
      map.removeLayer(iLay);
      map.removeLayer(rLay);
    };
  }, []);

  const startDrawInput = useCallback(() => {
    const map = window.mapInstance;
    if (!map || (activeToolId !== null && activeToolId !== TOOL_ID)) return;

    setActiveTool(TOOL_ID);
    setIsDrawing(true);
    setDrawnGeojson(null);
    inputSourceRef.current?.clear();
    resultSourceRef.current?.clear();
    setBufferArea(null);

    const draw = new Draw({ type: 'Polygon', style: INPUT_STYLE });
    drawRef.current = draw;

    draw.on('drawend', (e) => {
      const geom = e.feature.getGeometry();
      const geojson = geojsonFormat.writeGeometryObject(geom, {
        featureProjection: 'EPSG:3857',
        dataProjection: 'EPSG:4326',
      });
      const feat = geojsonFormat.readFeature({ type: 'Feature', geometry: geojson }, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });
      inputSourceRef.current?.addFeature(feat);
      setDrawnGeojson(geojson);

      map.removeInteraction(draw);
      drawRef.current = null;
      setIsDrawing(false);
      setActiveTool(null);
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

  const applyBuffer = useCallback(() => {
    setError(null);

    let inputGeojson = null;
    if (mode === 'draw') {
      inputGeojson = drawnGeojson;
    } else {
      const poly = drawnPolygons.find((p) => p.id === selectedPolyId);
      if (poly) inputGeojson = poly.geojson;
    }

    if (!inputGeojson) {
      setError('No input polygon selected.');
      return;
    }

    try {
      const feature = turf.feature(inputGeojson);
      const buffered = turf.buffer(feature, Number(distance), { units });
      if (!buffered) { setError('Buffer failed. Check input geometry.'); return; }

      resultSourceRef.current?.clear();
      const olFeature = geojsonFormat.readFeature(buffered, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857',
      });
      resultSourceRef.current?.addFeature(olFeature);

      const areaM2 = turf.area(buffered);
      const label = areaM2 > 1e6
        ? `${(areaM2 / 1e6).toFixed(2)} km²`
        : `${areaM2.toFixed(0)} m²`;
      setBufferArea(label);
    } catch (e) {
      setError(e.message || 'Buffer computation failed.');
    }
  }, [mode, drawnGeojson, drawnPolygons, selectedPolyId, distance, units]);

  const clearResult = useCallback(() => {
    resultSourceRef.current?.clear();
    inputSourceRef.current?.clear();
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
        <select
          className={baseStyles.select}
          value={selectedPolyId}
          onChange={(e) => setSelectedPolyId(e.target.value)}
        >
          <option value="">— select a saved polygon —</option>
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
        <select
          className={styles.unitSelect}
          value={units}
          onChange={(e) => setUnits(e.target.value)}
        >
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
