import { create } from 'zustand';
import { getCurrentDate } from 'src/shared/utils/dateDefaults';

const DEFAULT_DATE = getCurrentDate();

const useFuelMoistureStore = create((set, get) => ({
  selectedIndex: 'ndmi',
  date: DEFAULT_DATE,
  cloudCoverage: 30,
  pageSize: 20,

  searchResults: [],
  isLoading: false,
  error: null,
  totalResults: 0,
  sortBy: 'date',
  sortOrder: 'desc',

  activeLayers: [],
  globalOpacity: 82,
  activeTab: 'search',

  setSelectedIndex: (index) => set({ selectedIndex: index }),
  setDate: (date) => set({ date }),
  setCloudCoverage: (cloudCoverage) => set({ cloudCoverage }),
  setPageSize: (pageSize) => set({ pageSize }),
  setSearchResults: (results, total) => set({
    searchResults: results,
    totalResults: total ?? results.length,
  }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearSearch: () => set({ searchResults: [], totalResults: 0, error: null }),
  setGlobalOpacity: (globalOpacity) => set({ globalOpacity }),
  setActiveTab: (activeTab) => set({ activeTab, error: null }),

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

export default useFuelMoistureStore;
