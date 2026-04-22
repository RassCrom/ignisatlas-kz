import { create } from 'zustand';

/**
 * Shared AOI (Area of Interest) store.
 * Used by both Sentinel Explorer and Landsat Explorer.
 */
const useAoiStore = create((set) => ({
  aoiGeometry: null,     // GeoJSON geometry (Polygon)
  aoiBbox: null,         // [minLon, minLat, maxLon, maxLat]
  aoiDrawMode: null,     // 'box' | 'polygon' | null
  aoiVisible: true,      // Visibility of the drawn polygon on the map

  setAoi: (geometry, bbox) => set({ aoiGeometry: geometry, aoiBbox: bbox, aoiVisible: true }),
  clearAoi: () => set({ aoiGeometry: null, aoiBbox: null }),
  setAoiDrawMode: (mode) => set({ aoiDrawMode: mode }),
  toggleAoiVisibility: () => set((state) => ({ aoiVisible: !state.aoiVisible })),
}));

export default useAoiStore;
