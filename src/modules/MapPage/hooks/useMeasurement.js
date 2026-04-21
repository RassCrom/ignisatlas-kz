import { useRef, useState } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Draw from 'ol/interaction/Draw';
import Overlay from 'ol/Overlay';
import { unByKey } from 'ol/Observable';
import { LineString, Polygon } from 'ol/geom';
import { createMeasureStyle, formatLength, formatArea } from '../utils/measurement';

export const useMeasurement = (styles) => {
  const measurementLayer = useRef(null);
  const draw = useRef(null);
  const sketch = useRef(null);
  const helpTooltipElement = useRef(null);
  const helpTooltip = useRef(null);
  const measureTooltipElement = useRef(null);
  const measureTooltip = useRef(null);
  const listener = useRef(null);
  
  const [measureType, setMeasureType] = useState(null); // null, 'line' or 'area'
  const [isMeasuring, setIsMeasuring] = useState(false);
  
  const measureStyle = createMeasureStyle();

  // Create tooltips
  const createTooltips = (map) => {
    // Create help tooltip
    if (helpTooltipElement.current) {
      helpTooltipElement.current.parentNode.removeChild(helpTooltipElement.current);
    }
    helpTooltipElement.current = document.createElement('div');
    helpTooltipElement.current.className = styles.tooltipHelp;
    helpTooltip.current = new Overlay({
      element: helpTooltipElement.current,
      offset: [15, 0],
      positioning: 'center-left',
    });
    map.addOverlay(helpTooltip.current);

    // Create measure tooltip
    if (measureTooltipElement.current) {
      measureTooltipElement.current.parentNode.removeChild(measureTooltipElement.current);
    }
    measureTooltipElement.current = document.createElement('div');
    measureTooltipElement.current.className = `${styles.tooltipMeasure}`;
    measureTooltip.current = new Overlay({
      element: measureTooltipElement.current,
      offset: [0, -15],
      positioning: 'bottom-center',
    });
    map.addOverlay(measureTooltip.current);
  };

  // Start measuring
  const startMeasure = (map, type) => {
    setMeasureType(type);
    setIsMeasuring(true);
    
    // Create the measurement layer if it doesn't exist
    if (!measurementLayer.current) {
      measurementLayer.current = new VectorLayer({
        source: new VectorSource(),
        style: measureStyle,
        zIndex: 1000,
      });
      map.addLayer(measurementLayer.current);
    }
    
    // Clear previous measurements
    measurementLayer.current.getSource().clear();
    
    // Create tooltips
    createTooltips(map);
    
    // Add the draw interaction
    const drawType = type === 'line' ? 'LineString' : 'Polygon';
    draw.current = new Draw({
      source: measurementLayer.current.getSource(),
      type: drawType,
      style: measureStyle,
    });
    map.addInteraction(draw.current);
    
    let tooltipCoord = null;

    // Add pointer move event
    map.on('pointermove', pointerMoveHandler);
    
    // Handler for pointer movement
    function pointerMoveHandler(evt) {
      if (evt.dragging) {
        return;
      }
      
      let helpMsg = 'Click to start measuring';
      
      if (sketch.current) {
        const geom = sketch.current.getGeometry();
        if (geom instanceof Polygon) {
          helpMsg = 'Click to continue drawing the polygon';
        } else if (geom instanceof LineString) {
          helpMsg = 'Click to continue drawing the line';
        }
      }
      
      helpTooltipElement.current.innerHTML = helpMsg;
      helpTooltip.current.setPosition(evt.coordinate);
      
      helpTooltipElement.current.classList.remove(styles.hidden);
    }
    
    // When drawing starts
    draw.current.on('drawstart', (evt) => {
      // Set sketch
      sketch.current = evt.feature;
      
      // Update tooltip on each change
      tooltipCoord = evt.coordinate;
      
      listener.current = sketch.current.getGeometry().on('change', (e) => {
        const geom = e.target;
        let output;
        if (geom instanceof Polygon) {
          output = formatArea(geom);
          tooltipCoord = geom.getInteriorPoint().getCoordinates();
        } else if (geom instanceof LineString) {
          output = formatLength(geom);
          tooltipCoord = geom.getLastCoordinate();
        }
        measureTooltipElement.current.innerHTML = output;
        measureTooltip.current.setPosition(tooltipCoord);
      });
    });
    
    // When drawing ends
    draw.current.on('drawend', () => {
      measureTooltipElement.current.className = `${styles.tooltipMeasure} ${styles.tooltipStatic}`;
      measureTooltip.current.setOffset([0, -7]);
      
      // Unset sketch and remove listener
      sketch.current = null;
      if (listener.current) {
        unByKey(listener.current);
        listener.current = null;
      }
      
      // Create new tooltips for next measurement
      createTooltips(map);
    });
  };

  // Stop measuring
  const stopMeasuring = (map) => {
    // Remove draw interaction
    if (draw.current) {
      map.removeInteraction(draw.current);
      draw.current = null;
    }
    
    // Remove tooltips
    if (helpTooltip.current) {
      map.removeOverlay(helpTooltip.current);
      helpTooltip.current = null;
    }
    
    setMeasureType(null);
    setIsMeasuring(false);
    
    // Remove pointer move listener
    map.un('pointermove', 'pointerMoveHandler');
  };

  return {
    measureType,
    isMeasuring,
    startMeasure,
    stopMeasuring
  };
};