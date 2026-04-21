export const createFireSlice = (set, get) => ({
    fireLayerVisible: false,
  
    setFireLayerVisible: () =>
      set((state) => ({
        fireLayerVisible: !state.fireLayerVisible
      }))
  });
  