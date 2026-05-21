let activeMap = null;

export const setMapInstance = (map) => {
  activeMap = map;
};

export const clearMapInstance = (map) => {
  if (!map || activeMap === map) {
    activeMap = null;
  }
};

export const getMapInstance = () => activeMap;

export const findLayerById = (layerId) => {
  const map = getMapInstance();
  if (!map?.getLayer) return null;
  return map.getLayer(layerId) || null;
};

export const removeLayerById = (layerId) => {
  const map = getMapInstance();
  if (map?.getLayer(layerId)) map.removeLayer(layerId);
};

export const removeSourceById = (sourceId) => {
  const map = getMapInstance();
  if (map?.getSource(sourceId)) map.removeSource(sourceId);
};
