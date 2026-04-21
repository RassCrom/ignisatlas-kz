export const createMapLayerSlice = (set, get) => ({
    visibleLayers: [],
  
    addLayer: (layer) =>
      set((state) => ({
        visibleLayers: [...state.visibleLayers, layer],
      })),
  
    removeLayer: (layerId) =>
      set((state) => ({
        visibleLayers: state.visibleLayers.filter((layer) => layer.id !== layerId),
      })),
  
    toggleLayer: (layer) => {
      const { visibleLayers } = get();
      const isVisible = visibleLayers.find((l) => l.id === layer.id);
      if (isVisible) {
        set({
          visibleLayers: visibleLayers.filter((l) => l.id !== layer.id),
        });
      } else {
        set({
          visibleLayers: [...visibleLayers, layer],
        });
      }
    },
  });
  