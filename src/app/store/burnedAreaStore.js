import { create } from 'zustand';

// Latest month returned by the Planetary Computer MCD64A1 collection during
// integration testing. Users can still choose other archive months manually.
const DEFAULT_MONTH = '2025-07';

const useBurnedAreaStore = create((set, get) => ({
  selectedDataset: 'Burn_Date',
  month: DEFAULT_MONTH,

  searchResults: [],
  isLoading: false,
  error: null,
  totalResults: 0,
  sortBy: 'date',
  sortOrder: 'desc',
  pageSize: 40,

  activeLayers: [],
  globalOpacity: 82,
  activeTab: 'search',

  setSelectedDataset: (dataset) => set({ selectedDataset: dataset }),
  setMonth: (month) => set({ month }),
  setSearchResults: (results, total) => set({
    searchResults: results,
    totalResults: total ?? results.length,
  }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearSearch: () => set({ searchResults: [], totalResults: 0, error: null }),
  setGlobalOpacity: (opacity) => set({ globalOpacity: opacity }),
  setActiveTab: (tab) => set({ activeTab: tab, error: null }),

  setSortBy: (field) => {
    const state = get();
    if (state.sortBy === field) {
      set({ sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      set({ sortBy: field, sortOrder: field === 'date' ? 'desc' : 'asc' });
    }
  },

  addActiveLayer: (layer) => set((state) => {
    if (state.activeLayers.some((item) => item.id === layer.id)) return state;
    return { activeLayers: [...state.activeLayers, layer] };
  }),
  removeActiveLayer: (layerId) => set((state) => ({
    activeLayers: state.activeLayers.filter((layer) => layer.id !== layerId),
  })),
  toggleLayerVisibility: (layerId) => set((state) => ({
    activeLayers: state.activeLayers.map((layer) =>
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ),
  })),
  setAllLayersVisible: (visible) => set((state) => ({
    activeLayers: state.activeLayers.map((layer) => ({ ...layer, visible })),
  })),
  updateLayerOpacity: (layerId, opacity) => set((state) => ({
    activeLayers: state.activeLayers.map((layer) =>
      layer.id === layerId ? { ...layer, opacity } : layer
    ),
  })),
  reorderLayers: (fromIndex, toIndex) => set((state) => {
    const layers = [...state.activeLayers];
    const [moved] = layers.splice(fromIndex, 1);
    layers.splice(toIndex, 0, moved);
    return { activeLayers: layers };
  }),
  clearActiveLayers: () => set({ activeLayers: [] }),
}));

export default useBurnedAreaStore;
