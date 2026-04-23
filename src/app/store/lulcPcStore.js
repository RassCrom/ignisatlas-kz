import { create } from 'zustand';
import { fetchLulcTileUrl } from 'src/utils/lulcService';

const useLulcPcStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────
  year: 2023,
  isAdded: false,
  isLoading: false,
  error: null,
  tileUrl: null,
  visible: true,
  opacity: 1,

  // ── Actions ────────────────────────────────────────────

  setYear: (year) => set({ year }),

  loadAndAddLayer: async (year) => {
    set({ isLoading: true, error: null });
    try {
      const tileUrl = await fetchLulcTileUrl(year);
      set({ tileUrl, year, isAdded: true, isLoading: false, visible: true });
    } catch (err) {
      set({ error: err.message || 'Failed to load LULC tiles', isLoading: false });
    }
  },

  switchYear: async (year) => {
    const state = get();
    if (!state.isAdded) return;
    set({ isLoading: true, error: null, year });
    try {
      const tileUrl = await fetchLulcTileUrl(year);
      set({ tileUrl, isLoading: false });
    } catch (err) {
      set({ error: err.message || 'Failed to switch year', isLoading: false });
    }
  },

  removeLayer: () => set({
    isAdded: false,
    tileUrl: null,
    error: null,
  }),

  toggleVisible: () => set((state) => ({ visible: !state.visible })),
  setOpacity: (opacity) => set({ opacity }),
}));

export default useLulcPcStore;
