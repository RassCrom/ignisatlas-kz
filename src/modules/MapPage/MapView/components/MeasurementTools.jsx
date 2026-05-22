import { useCallback, useEffect, useRef, useState } from 'react';
import { bbox, center } from '@turf/turf';
import maplibregl from 'maplibre-gl';
import { Copy, Download, Ruler, SquareIcon, Trash2, XCircle } from 'lucide-react';
import {
  formatArea,
  formatLength,
  midpointOnLine,
  startMapLibreDraw,
} from '../../utils/maplibreDraw.js';
import { removeSourceWithLayers } from '../../utils/maplibreHelpers.js';
import styles from './MeasurementTools.module.scss';

const SOURCE_ID = 'measurements-source';
const FILL_LAYER_ID = 'measurements-fill';
const LINE_LAYER_ID = 'measurements-line';
const POINT_LAYER_ID = 'measurements-points';

const getMeasurementLabel = (measurementType) =>
  measurementType === 'LineString' ? 'Distance' : 'Area';

const makeLabelElement = (value) => {
  const element = document.createElement('div');
  element.className = 'ol-tooltip ol-tooltip-static';
  element.textContent = value;
  return element;
};

const getLabelCoordinate = (feature) => {
  if (feature.geometry.type === 'LineString') return midpointOnLine(feature);
  const point = center(feature);
  return point.geometry.coordinates;
};

const MeasurementTools = ({ map }) => {
  const [showToolOptions, setShowToolOptions] = useState(false);
  const [type, setType] = useState('');
  const [measurementResults, setMeasurementResults] = useState([]);
  const drawCleanupRef = useRef(null);
  const featuresRef = useRef([]);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!map || map.getSource(SOURCE_ID)) return;

    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    map.addLayer({
      id: FILL_LAYER_ID,
      type: 'fill',
      source: SOURCE_ID,
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: {
        'fill-color': 'rgba(255, 204, 51, 0.18)',
      },
    });
    map.addLayer({
      id: LINE_LAYER_ID,
      type: 'line',
      source: SOURCE_ID,
      paint: {
        'line-color': '#ffcc33',
        'line-width': 2,
        'line-dasharray': [2, 1],
      },
    });
    map.addLayer({
      id: POINT_LAYER_ID,
      type: 'circle',
      source: SOURCE_ID,
      paint: {
        'circle-color': '#ffcc33',
        'circle-radius': 4,
        'circle-stroke-color': '#1f2937',
        'circle-stroke-width': 1,
      },
    });

    return () => {
      drawCleanupRef.current?.();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      featuresRef.current = [];
      removeSourceWithLayers(map, SOURCE_ID);
    };
  }, [map]);

  const updateSource = useCallback(() => {
    const source = map?.getSource(SOURCE_ID);
    source?.setData({
      type: 'FeatureCollection',
      features: featuresRef.current,
    });
  }, [map]);

  const addMeasurement = useCallback((feature) => {
    const value = feature.geometry.type === 'LineString'
      ? formatLength(feature)
      : formatArea(feature);
    const id = `${Date.now()}-${featuresRef.current.length}`;
    const savedFeature = {
      ...feature,
      id,
      properties: {
        ...(feature.properties || {}),
        measurementId: id,
        measurementValue: value,
      },
    };

    featuresRef.current = [...featuresRef.current, savedFeature];
    updateSource();

    const marker = new maplibregl.Marker({
      element: makeLabelElement(value),
      anchor: 'bottom',
    })
      .setLngLat(getLabelCoordinate(savedFeature))
      .addTo(map);
    markersRef.current.push(marker);

    setMeasurementResults((prev) => [
      ...prev,
      { id, type: savedFeature.geometry.type, value },
    ]);
  }, [map, updateSource]);

  useEffect(() => {
    if (!map) return;
    drawCleanupRef.current?.();
    drawCleanupRef.current = null;

    if (!type) return;

    drawCleanupRef.current = startMapLibreDraw(map, {
      idPrefix: `measurement-${type.toLowerCase()}`,
      type,
      minPoints: type === 'LineString' ? 2 : 3,
      onComplete: addMeasurement,
      onCancel: () => setType(''),
    });

    return () => {
      drawCleanupRef.current?.();
      drawCleanupRef.current = null;
    };
  }, [addMeasurement, map, type]);

  useEffect(() => {
    const handler = () => {
      setShowToolOptions(true);
      setType('LineString');
    };
    window.addEventListener('cm:measure', handler);
    return () => window.removeEventListener('cm:measure', handler);
  }, []);

  const clearAllMeasurements = () => {
    featuresRef.current = [];
    updateSource();
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    setMeasurementResults([]);
  };

  const copyToClipboard = () => {
    if (measurementResults.length === 0) return;
    const textToCopy = measurementResults
      .map((result, index) => `${getMeasurementLabel(result.type)} ${index + 1}: ${result.value}`)
      .join('\n');
    navigator.clipboard.writeText(textToCopy);
  };

  const saveAsCsv = () => {
    if (measurementResults.length === 0) return;
    const csvContent = `Index,Type,Value\n${measurementResults
      .map((result, index) => `${index + 1},${result.type},${result.value}`)
      .join('\n')}`;
    const encodedUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'measurements.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const zoomToMeasurements = () => {
    if (!map || featuresRef.current.length === 0) return;
    const extent = bbox({ type: 'FeatureCollection', features: featuresRef.current });
    map.fitBounds([[extent[0], extent[1]], [extent[2], extent[3]]], {
      padding: 80,
      duration: 600,
      maxZoom: 16,
    });
  };

  return (
    <div className={styles.measureTools}>
      <button
        className={`${styles.measureButton} ${showToolOptions ? styles.active : ''}`}
        onClick={() => setShowToolOptions((v) => !v)}
        aria-label="Measurement tools"
        title="Measurement tools"
      >
        <Ruler size={16} />
      </button>

      {showToolOptions && (
        <div className={styles.measurePanel}>
          <div className={styles.measurePanelHeader}>
            <h3>Measurement tools</h3>
            <button
              className={styles.measurePanelClose}
              onClick={() => {
                setShowToolOptions(false);
                setType('');
              }}
              aria-label="Close measurement panel"
            >
              <XCircle size={16} />
            </button>
          </div>

          <div className={styles.measureButtonGroup}>
            <button
              className={`${styles.measuringOptionButton} ${type === 'LineString' ? styles.active : ''}`}
              aria-label="Measure distance"
              onClick={() => (type !== 'LineString' ? setType('LineString') : setType(''))}
            >
              <Ruler size={18} />
              <span>Distance</span>
            </button>

            <button
              className={`${styles.measuringOptionButton} ${type === 'Polygon' ? styles.active : ''}`}
              aria-label="Measure area"
              onClick={() => (type !== 'Polygon' ? setType('Polygon') : setType(''))}
            >
              <SquareIcon size={18} />
              <span>Area</span>
            </button>
          </div>

          {type && (
            <div className={styles.measureInstructions}>
              <span>
                Click on the map to place points. Double-click or press Enter to finish. Press Esc to cancel.
              </span>
            </div>
          )}

          {measurementResults.length > 0 && (
            <div className={styles.measurementResults}>
              <h4>Results</h4>
              <ul>
                {measurementResults.map((result, index) => (
                  <li key={result.id} className={styles.measurementResult}>
                    <span className={styles.measurementLabel}>
                      {getMeasurementLabel(result.type)} {index + 1}:
                    </span>
                    <span className={styles.measurementValue}>{result.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.measureActions}>
            <button
              className={styles.measureActionButton}
              aria-label="Clear measurements"
              title="Clear"
              disabled={measurementResults.length === 0}
              onClick={clearAllMeasurements}
            >
              <Trash2 size={16} />
            </button>
            <button
              className={styles.measureActionButton}
              aria-label="Copy measurements"
              title="Copy"
              disabled={measurementResults.length === 0}
              onClick={copyToClipboard}
            >
              <Copy size={16} />
            </button>
            <button
              className={styles.measureActionButton}
              aria-label="Export measurements as CSV"
              title="Save CSV"
              disabled={measurementResults.length === 0}
              onClick={saveAsCsv}
            >
              <Download size={16} />
            </button>
            <button
              className={styles.measureActionButton}
              aria-label="Zoom to measurements"
              title="Zoom to measurements"
              disabled={measurementResults.length === 0}
              onClick={zoomToMeasurements}
            >
              <SquareIcon size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeasurementTools;
