import { useState, useEffect, useRef, useCallback } from 'react';
import { Pentagon, X, Trash2, Copy, Download } from 'lucide-react';
import Draw from 'ol/interaction/Draw';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Overlay from 'ol/Overlay';
import { unByKey } from 'ol/Observable';
import { formatArea, createMeasureStyle } from 'src/modules/MapPage/utils/measurement';
import useAnalysisStore from 'src/app/store/analysisStore';
import baseStyles from './ToolsControls.module.scss';
import styles from './AnalysisTools.module.scss';

const TOOL_ID = 'measure_area';

const MeasureAreaTool = () => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [results, setResults] = useState([]);

  const drawRef = useRef(null);
  const layerRef = useRef(null);
  const sourceRef = useRef(null);
  const tooltipsRef = useRef([]);
  const sketchRef = useRef(null);
  const listenerRef = useRef(null);

  const activeToolId = useAnalysisStore((s) => s.activeToolId);
  const setActiveTool = useAnalysisStore((s) => s.setActiveTool);

  useEffect(() => {
    const map = window.mapInstance;
    if (!map) return;

    const source = new VectorSource();
    const layer = new VectorLayer({ source, style: createMeasureStyle(), zIndex: 490 });
    layer.set('id', 'measure-area-layer');
    map.addLayer(layer);
    sourceRef.current = source;
    layerRef.current = layer;

    return () => {
      map.removeLayer(layer);
      tooltipsRef.current.forEach((t) => map.removeOverlay(t));
      tooltipsRef.current = [];
    };
  }, []);

  const addTooltip = useCallback((map, coord, text) => {
    const el = document.createElement('div');
    el.className = 'ol-tooltip ol-tooltip-static';
    el.textContent = text;
    const overlay = new Overlay({ element: el, offset: [0, -15], positioning: 'bottom-center', stopEvent: false });
    overlay.setPosition(coord);
    map.addOverlay(overlay);
    tooltipsRef.current.push(overlay);
  }, []);

  const startDrawing = useCallback(() => {
    const map = window.mapInstance;
    if (!map || (activeToolId !== null && activeToolId !== TOOL_ID)) return;

    setActiveTool(TOOL_ID);
    setIsDrawing(true);

    const draw = new Draw({ source: sourceRef.current, type: 'Polygon', style: createMeasureStyle() });
    drawRef.current = draw;

    const tooltipElLive = document.createElement('div');
    tooltipElLive.className = 'ol-tooltip ol-tooltip-measure';
    const tooltipOverlay = new Overlay({
      element: tooltipElLive,
      offset: [0, -15],
      positioning: 'bottom-center',
    });
    map.addOverlay(tooltipOverlay);
    tooltipsRef.current.push(tooltipOverlay);

    draw.on('drawstart', (e) => {
      sketchRef.current = e.feature;
      listenerRef.current = sketchRef.current.getGeometry().on('change', (ge) => {
        const geom = ge.target;
        tooltipElLive.textContent = formatArea(geom);
        tooltipOverlay.setPosition(geom.getInteriorPoint().getCoordinates());
      });
    });

    draw.on('drawend', (e) => {
      const geom = e.feature.getGeometry();
      const value = formatArea(geom);
      const coord = geom.getInteriorPoint().getCoordinates();

      map.removeOverlay(tooltipOverlay);
      tooltipsRef.current = tooltipsRef.current.filter((t) => t !== tooltipOverlay);
      addTooltip(map, coord, value);

      if (listenerRef.current) unByKey(listenerRef.current);
      sketchRef.current = null;

      setResults((prev) => [...prev, { id: Date.now(), label: `Area ${prev.length + 1}`, value }]);

      map.removeInteraction(draw);
      drawRef.current = null;
      setIsDrawing(false);
      setActiveTool(null);
    });

    map.addInteraction(draw);
  }, [activeToolId, setActiveTool, addTooltip]);

  const cancelDrawing = useCallback(() => {
    const map = window.mapInstance;
    if (drawRef.current && map) {
      map.removeInteraction(drawRef.current);
      drawRef.current = null;
    }
    if (listenerRef.current) unByKey(listenerRef.current);
    setIsDrawing(false);
    setActiveTool(null);
  }, [setActiveTool]);

  const clearAll = useCallback(() => {
    const map = window.mapInstance;
    if (sourceRef.current) sourceRef.current.clear();
    tooltipsRef.current.forEach((t) => { if (map) map.removeOverlay(t); });
    tooltipsRef.current = [];
    setResults([]);
  }, []);

  const copyResults = useCallback(() => {
    const text = results.map((r) => `${r.label}: ${r.value}`).join('\n');
    navigator.clipboard?.writeText(text);
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
