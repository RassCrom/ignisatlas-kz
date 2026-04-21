import { create } from 'zustand';

const useHLSStore = create((set) => ({
  // Search params
  startDate: '',
  endDate: '',
  cloudCover: 30,
  platform: 'all', // 'all' | 'landsat-8' | 'landsat-9'

  // UI state
  isLoading: false,
  searchResults: [],
  error: null,

  // Active map layers
  activeLayers: [],

  // Setters
  setStartDate: (v) => set({ startDate: v }),
  setEndDate: (v) => set({ endDate: v }),
  setCloudCover: (v) => set({ cloudCover: v }),
  setPlatform: (v) => set({ platform: v }),
  setIsLoading: (v) => set({ isLoading: v }),
  setSearchResults: (v) => set({ searchResults: v }),
  setError: (v) => set({ error: v }),

  // Layer management
  addActiveLayer: (layer) =>
    set((state) => ({ activeLayers: [...state.activeLayers, layer] })),
  removeActiveLayer: (id) =>
    set((state) => ({
      activeLayers: state.activeLayers.filter((l) => l.id !== id),
    })),
  clearActiveLayers: () => set({ activeLayers: [] }),
  toggleLayerVisibility: (id) =>
    set((state) => ({
      activeLayers: state.activeLayers.map((l) =>
        l.id === id ? { ...l, visible: !l.visible } : l
      ),
    })),
  updateLayerOpacity: (id, opacity) =>
    set((state) => ({
      activeLayers: state.activeLayers.map((l) =>
        l.id === id ? { ...l, opacity } : l
      ),
    })),
}));

export default useHLSStore;
