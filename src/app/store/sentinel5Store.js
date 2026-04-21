import { create } from 'zustand';

const useSentinel5Store = create((set) => ({
  sentinel5Visible: false,
  sentinel5Opacity: 100,
  selectedBands5: 'NO2',
  startDate: '',
  endDate: '',
  cloudCoverage: 20,
  searchResults: [],
  isLoading: false,
  activeLayers5: [],

  setSentinel5Visible: (visible) => set({ sentinel5Visible: visible }),
  setSentinel5Opacity: (opacity) => set({ sentinel5Opacity: opacity }),
  setSelectedBands5: (bands) => set({ selectedBands5: bands }),
  setStartDate: (date) => set({ startDate: date }),
  setEndDate: (date) => set({ endDate: date }),
  setCloudCoverage: (coverage) => set({ cloudCoverage: coverage }),
  setSearchResults: (results) => set({ searchResults: results }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setActiveLayers5: (layers) => set({ activeLayers5: layers }),
  
  addActiveLayer5: (layer) => set((state) => {
    // prevent duplicates
    const exists = state.activeLayers5.some(existingLayer => existingLayer.id === layer.id);
    if (exists) {
      console.log('Layer already exists:', layer.id);
      return state;
    }
    return { activeLayers5: [...state.activeLayers5, layer] };
  }),
  
  removeActiveLayer5: (layerId) => set((state) => ({ 
    activeLayers5: state.activeLayers5.filter(layer => layer.id !== layerId) 
  })),

  clearActiveLayers5: () => set({ activeLayers5: [] }),
}));

export default useSentinel5Store;