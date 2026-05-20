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
  if (!map) return null;

  return map.getLayers().getArray().find((layer) => layer.get('id') === layerId) || null;
};
