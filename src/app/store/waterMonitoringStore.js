import { create } from 'zustand';
import { getCurrentDate } from 'src/shared/utils/dateDefaults';

const DEFAULT_DATE = getCurrentDate();

const useWaterMonitoringStore = create((set, get) => ({
  visible: false,
  opacity: 0.72,
  selectedWaterBody: null,
  activePanel: 'water-bodies',
  waterBodyFilters: {
    className: 'all',
    minArea: '',
    maxArea: '',
    region: '',
    district: '',
    name: '',
  },

  selectedIndex: 'mndwi',
  date: DEFAULT_DATE,
  cloudCoverage: 35,
  pageSize: 20,

  searchResults: [],
  isLoading: false,
  error: null,
  totalResults: 0,
  sortBy: 'date',
  sortOrder: 'desc',
  activeTab: 'search',

  activeLayers: [],
  globalOpacity: 82,

  toggleVisible: () => set((state) => ({ visible: !state.visible })),
  setVisible: (visible) => set({ visible }),
  setOpacity: (opacity) => set({ opacity }),
  setSelectedWaterBody: (selectedWaterBody) => set({ selectedWaterBody }),
  clearSelectedWaterBody: () => set({ selectedWaterBody: null }),
  setActivePanel: (activePanel) => set({ activePanel }),
  setWaterBodyFilter: (key, value) => set((state) => ({
    waterBodyFilters: { ...state.waterBodyFilters, [key]: value },
  })),
  resetWaterBodyFilters: () => set({
    waterBodyFilters: {
      className: 'all',
      minArea: '',
      maxArea: '',
      region: '',
      district: '',
      name: '',
    },
  }),

  setSelectedIndex: (selectedIndex) => set({ selectedIndex }),
  setDate: (date) => set({ date }),
  setCloudCoverage: (cloudCoverage) => set({ cloudCoverage }),
  setPageSize: (pageSize) => set({ pageSize }),
  setGlobalOpacity: (globalOpacity) => set({ globalOpacity }),
  setActiveTab: (activeTab) => set({ activeTab, error: null }),

  setSearchResults: (results, total) => set({
    searchResults: results,
    totalResults: total ?? results.length,
  }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearSearch: () => set({ searchResults: [], totalResults: 0, error: null }),

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

export default useWaterMonitoringStore;
