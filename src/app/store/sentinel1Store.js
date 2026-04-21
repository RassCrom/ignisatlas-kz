import { create } from 'zustand';

const useSentinel1Store = create((set) => ({
  sentinel1Visible: false,
  sentinel1Opacity: 100,
  selectedBands1: 'OLCI-TRUE',
  startDate: '',
  endDate: '',
  cloudCoverage: 20,
  searchResults: [],
  isLoading: false,
  activeLayers1: [],

  setSentinel1Visible: (visible) => set({ sentinel1Visible: visible }),
  setSentinel1Opacity: (opacity) => set({ sentinel1Opacity: opacity }),
  setSelectedBands1: (bands) => set({ selectedBands1: bands }),
  setStartDate: (date) => set({ startDate: date }),
  setEndDate: (date) => set({ endDate: date }),
  setCloudCoverage: (coverage) => set({ cloudCoverage: coverage }),
  setSearchResults: (results) => set({ searchResults: results }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setActiveLayers1: (layers) => set({ activeLayers1: layers }),
  
  addActiveLayer1: (layer) => set((state) => {
    // prevent duplicates
    const exists = state.activeLayers1.some(existingLayer => existingLayer.id === layer.id);
    if (exists) {
      console.log('Layer already exists:', layer.id);
      return state;
    }
    return { activeLayers1: [...state.activeLayers1, layer] };
  }),
  
  removeActiveLayer1: (layerId) => set((state) => ({ 
    activeLayers1: state.activeLayers1.filter(layer => layer.id !== layerId) 
  })),

  clearActiveLayers1: () => set({ activeLayers1: [] }),
}));

export default useSentinel1Store;