import { create } from 'zustand';
import { fetchDemTileUrl, buildDemTileUrl } from 'src/utils/demService';

const useDemStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────
  searchid:  null,
  renderer:  'terrain',
  isAdded:   false,
  isLoading: false,
  error:     null,
  tileUrl:   null,
  visible:   true,
  opacity:   1,

  // ── Actions ────────────────────────────────────────────

  // Update renderer selection before the layer is added (no tile fetch).
  setRenderer: (renderer) => set({ renderer }),

  loadAndAddLayer: async (renderer) => {
    set({ isLoading: true, error: null });
    try {
      const { searchid, tileUrl } = await fetchDemTileUrl(renderer);
      set({ searchid, tileUrl, renderer, isAdded: true, isLoading: false, visible: true });
    } catch (err) {
      set({ error: err.message || 'Failed to load DEM tiles', isLoading: false });
    }
  },

  // Rebuild the tile URL from the cached searchid — no network call.
  switchRenderer: (renderer) => {
    const { searchid } = get();
    if (!searchid) return;
    set({ renderer, tileUrl: buildDemTileUrl(searchid, renderer) });
  },

  removeLayer: () => set({ isAdded: false, tileUrl: null, searchid: null, error: null }),

  toggleVisible: () => set((s) => ({ visible: !s.visible })),
  setOpacity:    (opacity) => set({ opacity }),
}));

export default useDemStore;
