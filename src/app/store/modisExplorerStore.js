import { create } from 'zustand';

const useModisExplorerStore = create((set, get) => ({
  // ── Product & Filter State ───────────────────────────────
  selectedProduct: 'all', // 'all' | 'modis-14A1-061' | 'modis-14A2-061' | 'modis-09A1-061' | 'modis-43A4-061'
  startDate: '',
  endDate: '',
  cloudCoverage: 100, // MODIS fire anomalies often have missing or 100% cloud cover listed, better to start at 100
  selectedBands: 'default',

  // ── Search Results ───────────────────────────────────────
  searchResults: [],
  isLoading: false,
  error: null,
  totalResults: 0,
  sortBy: 'date',
  sortOrder: 'desc',

  // ── Pagination ───────────────────────────────────────────
  page: 1,
  pageSize: 20,

  // ── Active Map Layers ────────────────────────────────────
  activeLayers: [],
  globalOpacity: 80,

  // ── Hovered footprint ────────────────────────────────────
  hoveredFootprint: null,

  // ── Active tab ───────────────────────────────────────────
  activeTab: 'search',

  // ═══ Actions ═══════════════════════════════════════════════

  setSelectedProduct: (product) => set({ selectedProduct: product }),
  setStartDate: (date) => set({ startDate: date }),
  setEndDate: (date) => set({ endDate: date }),
  setCloudCoverage: (value) => set({ cloudCoverage: value }),
  setSelectedBands: (bands) => set({ selectedBands: bands }),

  setSearchResults: (results, total) => set({
    searchResults: results,
    totalResults: total ?? results.length,
  }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearSearch: () => set({ searchResults: [], totalResults: 0, error: null, page: 1 }),

  setSortBy: (field) => {
    const state = get();
    if (state.sortBy === field) {
      set({ sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      set({ sortBy: field, sortOrder: field === 'date' ? 'desc' : 'asc' });
    }
  },

  setPage: (page) => set({ page }),
  nextPage: () => set((s) => ({ page: s.page + 1 })),
  prevPage: () => set((s) => ({ page: Math.max(1, s.page - 1) })),

  addActiveLayer: (layer) => set((state) => {
    if (state.activeLayers.some((l) => l.id === layer.id)) return state;
    return { activeLayers: [...state.activeLayers, layer] };
  }),
  removeActiveLayer: (layerId) => set((state) => ({
    activeLayers: state.activeLayers.filter((l) => l.id !== layerId),
  })),
  toggleLayerVisibility: (layerId) => set((state) => ({
    activeLayers: state.activeLayers.map((l) =>
      l.id === layerId ? { ...l, visible: !l.visible } : l
    ),
  })),
  updateLayerOpacity: (layerId, opacity) => set((state) => ({
    activeLayers: state.activeLayers.map((l) =>
      l.id === layerId ? { ...l, opacity } : l
    ),
  })),
  reorderLayers: (fromIndex, toIndex) => set((state) => {
    const layers = [...state.activeLayers];
    const [moved] = layers.splice(fromIndex, 1);
    layers.splice(toIndex, 0, moved);
    return { activeLayers: layers };
  }),
  clearActiveLayers: () => set({ activeLayers: [] }),
  setGlobalOpacity: (opacity) => set({ globalOpacity: opacity }),

  setHoveredFootprint: (geometry) => set({ hoveredFootprint: geometry }),
  clearHoveredFootprint: () => set({ hoveredFootprint: null }),
  setActiveTab: (tab) => set({ activeTab: tab, error: null }),
}));

export default useModisExplorerStore;
