import { create } from 'zustand';

const useSentinel3Store = create((set) => ({
  sentinel3Visible: false,
  sentinel3Opacity: 100,
  selectedBands3: 'IW_VV',
  startDate: '',
  endDate: '',
  cloudCoverage: 20,
  searchResults: [],
  isLoading: false,
  activeLayers3: [],

  setSentinel3Visible: (visible) => set({ sentinel3Visible: visible }),
  setSentinel3Opacity: (opacity) => set({ sentinel3Opacity: opacity }),
  setSelectedBands3: (bands) => set({ selectedBands3: bands }),
  setStartDate: (date) => set({ startDate: date }),
  setEndDate: (date) => set({ endDate: date }),
  setCloudCoverage: (coverage) => set({ cloudCoverage: coverage }),
  setSearchResults: (results) => set({ searchResults: results }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setActiveLayers3: (layers) => set({ activeLayers3: layers }),
  
  addActiveLayer3: (layer) => set((state) => {
    // prevent duplicates
    const exists = state.activeLayers3.some(existingLayer => existingLayer.id === layer.id);
    if (exists) {
      console.log('Layer already exists:', layer.id);
      return state;
    }
    return { activeLayers3: [...state.activeLayers3, layer] };
  }),
  
  removeActiveLayer3: (layerId) => set((state) => ({ 
    activeLayers3: state.activeLayers3.filter(layer => layer.id !== layerId) 
  })),

  clearActiveLayers3: () => set({ activeLayers3: [] }),
}));

export default useSentinel3Store;