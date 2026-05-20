export const createFireSlice = (set) => ({
    fireLayerVisible: false,
  
    setFireLayerVisible: () =>
      set((state) => ({
        fireLayerVisible: !state.fireLayerVisible
      }))
  });
  
