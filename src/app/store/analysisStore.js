import { create } from 'zustand';

const useAnalysisStore = create((set) => ({
  drawnPolygons: [],  // { id, name, geojson (EPSG:4326), visible }
  activeToolId: null, // prevents concurrent draw interactions

  addPolygon: (name, geojson) => {
    const id = `poly-${Date.now()}`;
    set((s) => ({ drawnPolygons: [...s.drawnPolygons, { id, name, geojson, visible: true }] }));
    return id;
  },

  removePolygon: (id) =>
    set((s) => ({ drawnPolygons: s.drawnPolygons.filter((p) => p.id !== id) })),

  togglePolygonVisibility: (id) =>
    set((s) => ({
      drawnPolygons: s.drawnPolygons.map((p) =>
        p.id === id ? { ...p, visible: !p.visible } : p
      ),
    })),

  setActiveTool: (id) => set({ activeToolId: id }),
}));

export default useAnalysisStore;
