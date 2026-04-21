import { create } from 'zustand';

const useSentinelStore = create((set) => ({
  sentinelVisible: false,
  sentinelOpacity: 80,
  selectedBands: 'true-color',
  startDate: '',
  endDate: '',
  cloudCoverage: 20,
  searchResults: [],
  isLoading: false,
  activeLayers: [],

  setSentinelVisible: (visible) => set({ sentinelVisible: visible }),
  setSentinelOpacity: (opacity) => set({ sentinelOpacity: opacity }),
  setSelectedBands: (bands) => set({ selectedBands: bands }),
  setStartDate: (date) => set({ startDate: date }),
  setEndDate: (date) => set({ endDate: date }),
  setCloudCoverage: (coverage) => set({ cloudCoverage: coverage }),
  setSearchResults: (results) => set({ searchResults: results }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setActiveLayers: (layers) => set({ activeLayers: layers }),
  
  addActiveLayer: (layer) => set((state) => {
    // prevent duplicates
    const exists = state.activeLayers.some(existingLayer => existingLayer.id === layer.id);
    if (exists) {
      console.log('Layer already exists:', layer.id);
      return state;
    }
    return { activeLayers: [...state.activeLayers, layer] };
  }),
  
  removeActiveLayer: (layerId) => set((state) => ({ 
    activeLayers: state.activeLayers.filter(layer => layer.id !== layerId) 
  })),

  clearActiveLayers: () => set({ activeLayers: [] }),
}));

export default useSentinelStore;