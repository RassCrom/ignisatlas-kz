import { distance, area as turfArea, along, length as turfLength } from '@turf/turf';
import maplibregl from 'maplibre-gl';

const makePointFeature = (coordinate, index, isPointer = false) => ({
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: coordinate,
  },
  properties: { kind: isPointer ? 'pointer' : 'vertex', index },
});

const makeLineFeature = (coordinates) => ({
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates,
  },
  properties: { kind: 'line' },
});

const makePolygonFeature = (coordinates) => ({
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[...coordinates, coordinates[0]]],
  },
  properties: { kind: 'polygon' },
});

const makeFeatureCollection = (coordinates, geometryType, pointerCoordinate) => {
  const previewCoords = pointerCoordinate
    ? [...coordinates, pointerCoordinate]
    : coordinates;
  const features = [];

  coordinates.forEach((coordinate, index) => {
    features.push(makePointFeature(coordinate, index));
  });

  if (pointerCoordinate) {
    features.push(makePointFeature(pointerCoordinate, coordinates.length, true));
  }

  if (previewCoords.length >= 2) {
    features.push(makeLineFeature(
      geometryType === 'Polygon' && previewCoords.length >= 3
        ? [...previewCoords, previewCoords[0]]
        : previewCoords
    ));
  }

  if (geometryType === 'Polygon' && previewCoords.length >= 3) {
    features.push(makePolygonFeature(previewCoords));
  }

  return { type: 'FeatureCollection', features };
};

const createTooltipElement = () => {
  const element = document.createElement('div');
  element.className = 'draw-tooltip';
  return element;
};

const getTooltipText = ({ type, count, minPoints }) => {
  if (count === 0) {
    return type === 'Polygon'
      ? 'Click to place the first polygon point. Esc cancels.'
      : 'Click to place the first line point. Esc cancels.';
  }
  if (count < minPoints) {
    const remaining = minPoints - count;
    return remaining === 1
      ? 'Place one more point. Esc cancels.'
      : `Place ${remaining} more points. Esc cancels.`;
  }
  return type === 'Polygon'
    ? 'Click to add points. Double-click or press Enter to finish. Esc cancels.'
    : 'Click to extend the line. Double-click or press Enter to finish. Esc cancels.';
};

const ensureDrawLayers = (map, idPrefix) => {
  const sourceId = `${idPrefix}-source`;
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }

  const lineId = `${idPrefix}-line`;
  if (!map.getLayer(lineId)) {
    map.addLayer({
      id: lineId,
      type: 'line',
      source: sourceId,
      filter: ['==', ['get', 'kind'], 'line'],
      paint: {
        'line-color': '#34d399',
        'line-width': 2,
        'line-dasharray': [2, 2],
      },
    });
  }

  const fillId = `${idPrefix}-fill`;
  if (!map.getLayer(fillId)) {
    map.addLayer({
      id: fillId,
      type: 'fill',
      source: sourceId,
      filter: ['==', ['get', 'kind'], 'polygon'],
      paint: {
        'fill-color': '#34d399',
        'fill-opacity': 0.12,
      },
    });
  }

  const pointId = `${idPrefix}-points`;
  if (!map.getLayer(pointId)) {
    map.addLayer({
      id: pointId,
      type: 'circle',
      source: sourceId,
      filter: ['in', ['get', 'kind'], ['literal', ['vertex', 'pointer']]],
      paint: {
        'circle-color': [
          'case',
          ['==', ['get', 'kind'], 'pointer'],
          'rgba(52, 211, 153, 0.45)',
          '#34d399',
        ],
        'circle-radius': [
          'case',
          ['==', ['get', 'kind'], 'pointer'],
          4,
          5,
        ],
        'circle-stroke-color': '#06111f',
        'circle-stroke-width': 2,
      },
    });
  }

  if (map.getLayer(fillId) && map.getLayer(lineId)) {
    map.moveLayer(fillId, lineId);
  }
  if (map.getLayer(pointId)) {
    map.moveLayer(pointId);
  }

  return map.getSource(sourceId);
};

const removeDrawLayers = (map, idPrefix) => {
  [`${idPrefix}-points`, `${idPrefix}-fill`, `${idPrefix}-line`].forEach((layerId) => {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
  });
  const sourceId = `${idPrefix}-source`;
  if (map.getSource(sourceId)) map.removeSource(sourceId);
};

export const startMapLibreDraw = (map, options = {}) => {
  const {
    idPrefix = `draw-${Date.now()}`,
    type = 'Polygon',
    minPoints = type === 'Polygon' ? 3 : 2,
    onComplete,
    onCancel,
  } = options;

  const source = ensureDrawLayers(map, idPrefix);
  const coordinates = [];
  let pointerCoordinate = null;
  let isCleanedUp = false;
  const canvas = map.getCanvas();
  const previousCursor = canvas.style.cursor;
  canvas.style.cursor = 'crosshair';
  canvas.classList.add('map-drawing-cursor');
  const wasDoubleClickZoomEnabled = map.doubleClickZoom?.isEnabled?.() ?? false;
  map.doubleClickZoom?.disable();

  const tooltipElement = createTooltipElement();
  const tooltip = new maplibregl.Marker({
    element: tooltipElement,
    anchor: 'left',
    offset: [14, 0],
  });

  const updateTooltip = () => {
    tooltipElement.textContent = getTooltipText({
      type,
      count: coordinates.length,
      minPoints,
    });
    tooltipElement.dataset.ready = coordinates.length >= minPoints ? 'true' : 'false';
  };

  const updatePreview = () => {
    const geometryType = type === 'Polygon' ? 'Polygon' : 'LineString';
    source.setData(makeFeatureCollection(coordinates, geometryType, pointerCoordinate));
    updateTooltip();
  };

  const finish = () => {
    if (coordinates.length < minPoints) return;
    cleanup();
    const geometry = type === 'Polygon'
      ? { type: 'Polygon', coordinates: [[...coordinates, coordinates[0]]] }
      : { type: 'LineString', coordinates };
    onComplete?.({ type: 'Feature', geometry, properties: {} });
  };

  const click = (event) => {
    if (event.originalEvent?.detail > 1) return;
    coordinates.push([event.lngLat.lng, event.lngLat.lat]);
    updatePreview();
  };

  const move = (event) => {
    pointerCoordinate = [event.lngLat.lng, event.lngLat.lat];
    tooltip.setLngLat(pointerCoordinate).addTo(map);
    updatePreview();
  };

  const keydown = (event) => {
    if (event.key === 'Enter') finish();
    if (event.key === 'Escape') {
      cleanup();
      onCancel?.();
    }
  };

  const dblclick = (event) => {
    event.preventDefault();
    event.originalEvent?.preventDefault?.();
    finish();
  };

  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    map.off('click', click);
    map.off('mousemove', move);
    map.off('dblclick', dblclick);
    window.removeEventListener('keydown', keydown);
    tooltip.remove();
    removeDrawLayers(map, idPrefix);
    canvas.style.cursor = previousCursor;
    canvas.classList.remove('map-drawing-cursor');
    if (wasDoubleClickZoomEnabled) map.doubleClickZoom?.enable();
  };

  map.on('click', click);
  map.on('mousemove', move);
  map.on('dblclick', dblclick);
  window.addEventListener('keydown', keydown);
  updateTooltip();

  return cleanup;
};

export const formatLength = (lineFeature) => {
  const km = turfLength(lineFeature, { units: 'kilometers' });
  if (km >= 1) return `${km.toFixed(2)} km`;
  return `${(km * 1000).toFixed(2)} m`;
};

export const formatArea = (polygonFeature) => {
  const sqm = turfArea(polygonFeature);
  if (sqm >= 1000000) return `${(sqm / 1000000).toFixed(2)} km²`;
  return `${sqm.toFixed(2)} m²`;
};

export const midpointOnLine = (lineFeature) => {
  const km = turfLength(lineFeature, { units: 'kilometers' });
  return along(lineFeature, km / 2, { units: 'kilometers' }).geometry.coordinates;
};

export const distanceBetween = (a, b) =>
  distance(a, b, { units: 'kilometers' });
