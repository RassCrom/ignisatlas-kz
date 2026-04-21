import { useEffect, useState, useRef } from 'react';
import { Ruler, SquareIcon, XCircle, Trash2, Download, Copy } from 'lucide-react';

import { unByKey } from 'ol/Observable.js';
import Feature from 'ol/Feature.js';
import Overlay from 'ol/Overlay.js';
import LineString from 'ol/geom/LineString.js';
import Polygon from 'ol/geom/Polygon.js';
import Draw from 'ol/interaction/Draw.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import { getArea, getLength } from 'ol/sphere.js';
import CircleStyle from 'ol/style/Circle.js';
import Fill from 'ol/style/Fill.js';
import Stroke from 'ol/style/Stroke.js';
import Style from 'ol/style/Style.js';

import styles from './MeasurementTools.module.scss';

const MeasurementTools = ({ map }) => {
  const [showToolOptions, setShowToolOptions] = useState(false);
  const [type, setType] = useState('');
  const [measurementResults, setMeasurementResults] = useState([]);
  
  const sourceRef = useRef(null);
  const vectorRef = useRef(null);
  const drawRef = useRef(null);
  const measureStartCoordRef = useRef(null);
  const sketchRef = useRef(null);
  const helpTooltipRef = useRef(null);
  const helpTooltipElementRef = useRef(null);
  const measureTooltipRef = useRef(null);
  const measureTooltipElementRef = useRef(null);
  const listenerRef = useRef(null);

  const formatLength = (line) => {
    const length = getLength(line);
    if (length > 100) {
      return `${Math.round((length / 1000) * 100) / 100} km`;
    }
    return `${Math.round(length * 100) / 100} m`;
  };

  const formatArea = (polygon) => {
    const area = getArea(polygon);
    if (area > 10000) {
      return `${Math.round((area / 1000000) * 100) / 100} km<sup>2</sup>`;
    }
    return `${Math.round(area * 100) / 100} m<sup>2</sup>`;
  };

  const createMeasureTooltip = () => {
    if (measureTooltipElementRef.current) {
      measureTooltipElementRef.current.remove();
    }
    measureTooltipElementRef.current = document.createElement('div');
    measureTooltipElementRef.current.className = 'ol-tooltip ol-tooltip-measure';
    measureTooltipRef.current = new Overlay({
      element: measureTooltipElementRef.current,
      offset: [0, -15],
      positioning: 'bottom-center',
      stopEvent: false,
      insertFirst: false,
    });
    map.addOverlay(measureTooltipRef.current);
  };

  const createHelpTooltip = () => {
    if (helpTooltipElementRef.current) {
      helpTooltipElementRef.current.remove();
    }
    helpTooltipElementRef.current = document.createElement('div');
    helpTooltipElementRef.current.className = 'ol-tooltip hidden';
    helpTooltipRef.current = new Overlay({
      element: helpTooltipElementRef.current,
      offset: [15, 0],
      positioning: 'center-left',
    });
    map.addOverlay(helpTooltipRef.current);
  };

  const addDrawInteraction = () => {
    if (!map || !type) return;
    
    const style = new Style({
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.2)',
      }),
      stroke: new Stroke({
        color: 'rgba(0, 0, 0, 0.5)',
        lineDash: [10, 10],
        width: 2,
      }),
      image: new CircleStyle({
        radius: 5,
        stroke: new Stroke({
          color: 'rgba(0, 0, 0, 0.7)',
        }),
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)',
        }),
      }),
    });

    drawRef.current = new Draw({
      source: sourceRef.current,
      type: type,
      style: (feature) => {
        const geometryType = feature.getGeometry().getType();
        if (geometryType === type || geometryType === 'Point') {
          return style;
        }
      },
    });
    
    map.addInteraction(drawRef.current);

    // If triggered from context menu, pre-plant the starting coordinate
    const startCoord = measureStartCoordRef.current;
    if (startCoord) {
      measureStartCoordRef.current = null;
      setTimeout(() => {
        if (!drawRef.current) return;
        const startFeature = new Feature(new LineString([startCoord, startCoord]));
        drawRef.current.extend(startFeature);
      }, 50);
    }

    createMeasureTooltip();
    createHelpTooltip();
    
    drawRef.current.on('drawstart', (evt) => {
      sketchRef.current = evt.feature;
      let tooltipCoord = evt.coordinate;
      
      listenerRef.current = sketchRef.current.getGeometry().on('change', (evt) => {
        const geom = evt.target;
        let output;
        
        if (geom instanceof Polygon) {
          output = formatArea(geom);
          tooltipCoord = geom.getInteriorPoint().getCoordinates();
        } else if (geom instanceof LineString) {
          output = formatLength(geom);
          tooltipCoord = geom.getLastCoordinate();
        }
        
        if (measureTooltipElementRef.current) {
          measureTooltipElementRef.current.innerHTML = output;
          measureTooltipRef.current.setPosition(tooltipCoord);
        }
      });
    });
    
    drawRef.current.on('drawend', () => {
      if (measureTooltipElementRef.current) {
        measureTooltipElementRef.current.className = 'ol-tooltip ol-tooltip-static';
        measureTooltipRef.current.setOffset([0, -7]);
        
        // Save measurement result
        let result = measureTooltipElementRef.current.innerHTML;
        setMeasurementResults(prev => [...prev, { type, value: result }]);
      }
      
      sketchRef.current = null;
      measureTooltipElementRef.current = null;
      createMeasureTooltip();
      
      if (listenerRef.current) {
        unByKey(listenerRef.current);
        listenerRef.current = null;
      }
    });
  };

  const handlePointerMove = (evt) => {
    if (evt.dragging || !helpTooltipElementRef.current) return;
    
    let helpMsg = 'Нажмите, чтобы начать';

    if (sketchRef.current) {
      const geom = sketchRef.current.getGeometry();
      if (geom instanceof Polygon) {
        helpMsg = 'Нажмите, чтобы продолжить рисование';
      } else if (geom instanceof LineString) {
        helpMsg = 'Нажмите, чтобы продолжить линию';
      }
    }
    helpTooltipElementRef.current.innerHTML = helpMsg;
    helpTooltipRef.current.setPosition(evt.coordinate);
    helpTooltipElementRef.current.classList.remove('hidden');
  };

  // Remove help tooltip whenever there is no active drawing type.
  useEffect(() => {
    if (!type) {
      if (helpTooltipElementRef.current) {
        helpTooltipElementRef.current.remove();
        helpTooltipElementRef.current = null;
      }
      if (helpTooltipRef.current) {
        map.removeOverlay(helpTooltipRef.current);
        helpTooltipRef.current = null;
      }
    }
  }, [type, map]);

  const handleMouseOut = () => {
    if (helpTooltipElementRef.current) {
      helpTooltipElementRef.current.innerHTML = '';
      helpTooltipRef.current.setPosition(null);
      helpTooltipElementRef.current.classList.add('hidden');
    }
  };

  // Initialize the vector layer and source
  useEffect(() => {
    if (!map) return;

    sourceRef.current = new VectorSource();
    vectorRef.current = new VectorLayer({
      source: sourceRef.current,
      style: {
        'fill-color': 'rgba(255, 255, 255, 0.2)',
        'stroke-color': '#ffcc33',
        'stroke-width': 2,
        'circle-radius': 7,
        'circle-fill-color': '#ffcc33',
      },
    });
    
    map.addLayer(vectorRef.current);
    
    map.on('pointermove', handlePointerMove);
    map.getViewport().addEventListener('mouseout', handleMouseOut);
    
    return () => {
      map.removeLayer(vectorRef.current);
      
      if (helpTooltipRef.current) {
        map.removeOverlay(helpTooltipRef.current);
      }
      
      if (measureTooltipRef.current) {
        map.removeOverlay(measureTooltipRef.current);
      }
      
      map.un('pointermove', handlePointerMove);
      map.getViewport().removeEventListener('mouseout', handleMouseOut);
    };
  }, [map]);

  // Listen for measure-from-coordinate event dispatched by context menu
  useEffect(() => {
    const handler = (e) => {
      measureStartCoordRef.current = e.detail.coordinate;
      setShowToolOptions(true);
      setType('LineString');
    };
    window.addEventListener('cm:measure', handler);
    return () => window.removeEventListener('cm:measure', handler);
  }, []);

  // Handle drawing interaction based on type change
  useEffect(() => {
    if (!map || !sourceRef.current) return;
    
    if (drawRef.current) {
      map.removeInteraction(drawRef.current);
      drawRef.current = null;
    }
    
    if (type) {
      addDrawInteraction();
    }
    
    return () => {
      if (drawRef.current) {
        map.removeInteraction(drawRef.current);
        drawRef.current = null;
      }
      
      if (listenerRef.current) {
        unByKey(listenerRef.current);
        listenerRef.current = null;
      }
    };
  }, [map, type]);

  const clearAllMeasurements = () => {
    if (sourceRef.current) {
      sourceRef.current.clear();
    }
    
    const overlays = map.getOverlays().getArray();
    overlays.forEach(overlay => {
      const element = overlay.getElement();
      if (element && element.className && 
          (element.className.includes('ol-tooltip-measure') || 
           element.className.includes('ol-tooltip-static'))) {
        map.removeOverlay(overlay);
      }
    });
    
    setMeasurementResults([]);
  };

  const copyToClipboard = () => {
    if (measurementResults.length === 0) return;
    
    const textToCopy = measurementResults
      .map((result, index) => `${result.type === 'line' ? 'Distance' : 'Area'} ${index + 1}: ${result.value}`)
      .join('\n');
    
    navigator.clipboard.writeText(textToCopy);
  };

  const saveAsCsv = () => {
    if (measurementResults.length === 0) return;
    
    const csvContent = 'data:text/csv;charset=utf-8,' + 
      'Index,Type,Value\n' + 
      measurementResults
        .map((result, index) => `${index + 1},${result.type},${result.value}`)
        .join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'measurements.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.measureTools}>
      <button
        className={`${styles.measureButton} ${showToolOptions ? styles.active : ''}`}
        onClick={() => setShowToolOptions(v => !v)}
        aria-label="Инструменты измерений"
        title="Инструменты измерений"
      >
        <Ruler size={16} />
      </button>
      
      {showToolOptions && (
        <div className={styles.measurePanel}>
          <div className={styles.measurePanelHeader}>
            <h3>Инструменты измерений</h3>
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
              aria-label="Измерить расстояние"
              onClick={() => type !== 'LineString' ? setType('LineString') : setType('')}
            >
              <Ruler size={18} />
              <span>Расстояние</span>
            </button>

            <button
              className={`${styles.measuringOptionButton} ${type === 'Polygon' ? styles.active : ''}`}
              aria-label="Измерить площадь"
              onClick={() => type !== 'Polygon' ? setType('Polygon') : setType('')}
            >
              <SquareIcon size={18} />
              <span>Площадь</span>
            </button>
          </div>
          
          {measurementResults.length > 0 && (
            <div className={styles.measurementResults}>
              <h4>Результаты</h4>
              <ul>
                {measurementResults.map((result, index) => (
                  <li key={index} className={styles.measurementResult}>
                    <span className={styles.measurementLabel}>
                      {result.type === 'LineString' ? 'Расстояние' : 'Площадь'} {index + 1}:
                    </span>
                    <span 
                      className={styles.measurementValue} 
                      dangerouslySetInnerHTML={{ __html: result.value }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className={styles.measureActions}>
            <button
              className={styles.measureActionButton}
              aria-label="Очистить измерения"
              title="Очистить"
              disabled={measurementResults.length === 0}
              onClick={clearAllMeasurements}
            >
              <Trash2 size={16} />
            </button>

            <button
              className={styles.measureActionButton}
              aria-label="Скопировать в буфер"
              title="Скопировать"
              disabled={measurementResults.length === 0}
              onClick={copyToClipboard}
            >
              <Copy size={16} />
            </button>

            <button
              className={styles.measureActionButton}
              aria-label="Сохранить как CSV"
              title="Сохранить CSV"
              disabled={measurementResults.length === 0}
              onClick={saveAsCsv}
            >
              <Download size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeasurementTools;