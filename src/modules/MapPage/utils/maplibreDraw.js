import { distance, area as turfArea, along, length as turfLength } from '@turf/turf';

const makeFeatureCollection = (coordinates, geometryType) => ({
  type: 'FeatureCollection',
  features: coordinates.length
    ? [{
        type: 'Feature',
        geometry: {
          type: geometryType,
          coordinates:
            geometryType === 'Polygon'
              ? [[...coordinates, coordinates[0]].filter(Boolean)]
              : coordinates,
        },
        properties: {},
      }]
    : [],
});

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
      paint: {
        'fill-color': '#34d399',
        'fill-opacity': 0.12,
      },
    });
  }

  return map.getSource(sourceId);
};

const removeDrawLayers = (map, idPrefix) => {
  [`${idPrefix}-fill`, `${idPrefix}-line`].forEach((layerId) => {
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
  const canvas = map.getCanvas();
  const previousCursor = canvas.style.cursor;
  canvas.style.cursor = 'crosshair';

  const updatePreview = () => {
    const geometryType = type === 'Polygon' ? 'Polygon' : 'LineString';
    const previewCoords = pointerCoordinate
      ? [...coordinates, pointerCoordinate]
      : coordinates;
    source.setData(makeFeatureCollection(previewCoords, geometryType));
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
    coordinates.push([event.lngLat.lng, event.lngLat.lat]);
    updatePreview();
  };

  const move = (event) => {
    pointerCoordinate = [event.lngLat.lng, event.lngLat.lat];
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
    finish();
  };

  const cleanup = () => {
    map.off('click', click);
    map.off('mousemove', move);
    map.off('dblclick', dblclick);
    window.removeEventListener('keydown', keydown);
    removeDrawLayers(map, idPrefix);
    canvas.style.cursor = previousCursor;
  };

  map.on('click', click);
  map.on('mousemove', move);
  map.on('dblclick', dblclick);
  window.addEventListener('keydown', keydown);

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
