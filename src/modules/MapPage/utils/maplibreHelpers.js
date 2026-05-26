import maplibregl from 'maplibre-gl';

const EARTH_RADIUS = 6378137;
const MAX_LATITUDE = 85.0511287798066;
const pendingPaintUpdates = new WeakMap();
const pendingVisibilityUpdates = new WeakMap();

const getPendingMap = (registry, map) => {
  let pending = registry.get(map);
  if (!pending) {
    pending = new Map();
    registry.set(map, pending);
  }
  return pending;
};

const scheduleMapMutation = (registry, map, key, callback) => {
  if (!map) return;
  const pending = getPendingMap(registry, map);
  const existing = pending.get(key);
  if (existing) cancelAnimationFrame(existing.frame);

  const frame = requestAnimationFrame(() => {
    pending.delete(key);
    callback();
  });
  pending.set(key, { frame });
};

export const toLngLat = (coordinate) => {
  if (!coordinate) return null;
  const [x, y] = coordinate;

  if (Math.abs(x) <= 180 && Math.abs(y) <= 90) {
    return [x, y];
  }

  const lon = (x / EARTH_RADIUS) * (180 / Math.PI);
  const lat = (2 * Math.atan(Math.exp(y / EARTH_RADIUS)) - Math.PI / 2) * (180 / Math.PI);
  return [lon, Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, lat))];
};

export const fromLngLat = (coordinate) => {
  if (!coordinate) return null;
  const [lon, lat] = coordinate;
  const clampedLat = Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, lat));
  const x = EARTH_RADIUS * lon * Math.PI / 180;
  const y = EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + clampedLat * Math.PI / 360));
  return [x, y];
};

export const getMapCenter = (map) => {
  const center = map.getCenter();
  return [center.lng, center.lat];
};

export const getMapBoundsArray = (map) => {
  const bounds = map.getBounds();
  return [
    bounds.getWest(),
    bounds.getSouth(),
    bounds.getEast(),
    bounds.getNorth(),
  ];
};

export const waitForMapStyle = (map, callback) => {
  if (!map) return () => {};
  if (map.isStyleLoaded()) {
    callback();
    return () => {};
  }

  map.once('load', callback);
  return () => map.off('load', callback);
};

export const removeMapLayer = (map, layerId) => {
  if (map?.getLayer(layerId)) {
    map.removeLayer(layerId);
  }
};

export const removeMapSource = (map, sourceId) => {
  if (map?.getSource(sourceId)) {
    map.removeSource(sourceId);
  }
};

export const removeSourceWithLayers = (map, sourceId) => {
  if (!map?.getStyle()) return;
  const layers = map.getStyle().layers || [];
  layers
    .filter((layer) => layer.source === sourceId)
    .map((layer) => layer.id)
    .forEach((layerId) => removeMapLayer(map, layerId));
  removeMapSource(map, sourceId);
};

export const setLayerVisibility = (map, layerId, visible) => {
  if (!map?.getLayer(layerId)) return;
  scheduleMapMutation(pendingVisibilityUpdates, map, layerId, () => {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
    }
  });
};

export const setLayerOpacity = (map, layerId, opacity, type = 'fill') => {
  if (!map?.getLayer(layerId)) return;
  const paintProperty = {
    circle: 'circle-opacity',
    fill: 'fill-opacity',
    heatmap: 'heatmap-opacity',
    line: 'line-opacity',
    raster: 'raster-opacity',
    symbol: 'icon-opacity',
  }[type];
  if (!paintProperty) return;
  scheduleMapMutation(pendingPaintUpdates, map, `${layerId}:${paintProperty}`, () => {
    if (map.getLayer(layerId)) map.setPaintProperty(layerId, paintProperty, opacity);
  });
};

export const addOrUpdateGeoJsonSource = (map, sourceId, data) => {
  const existing = map.getSource(sourceId);
  if (existing?.setData) {
    existing.setData(data);
    return existing;
  }

  map.addSource(sourceId, {
    type: 'geojson',
    data,
  });
  return map.getSource(sourceId);
};

export const loadImageOnce = (map, id, url) =>
  new Promise((resolve) => {
    if (map.hasImage(id)) {
      resolve(true);
      return;
    }

    map.loadImage(url, (error, image) => {
      if (error || !image) {
        resolve(false);
        return;
      }
      if (!map.hasImage(id)) map.addImage(id, image);
      resolve(true);
    });
  });

export const createPopup = (options = {}) =>
  new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 18,
    maxWidth: '320px',
    ...options,
  });

export const isMapReady = (map) => !!map && map.isStyleLoaded();
