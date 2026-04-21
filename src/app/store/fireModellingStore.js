import { create } from 'zustand';

/**
 * Each stored item:
 * {
 *   id: number, // Date.now() or custom id
 *   layer: ol/layer/Layer instance (or null until provided),
 *   opacity: number,
 *   visible: boolean,
 * }
 */
const useFireModellingStore = create((set) => ({
    mapInstance: null,
    fireModellingLayers: {},
    total_area: null,

    setTotalArea: (total_area) =>
        set({ total_area }),

    setMapInstance: (mapInstance) =>
        set({ mapInstance }),
    
    setFireModellingLayers: (fireModellingLayers) =>
        set({ fireModellingLayers }),

    addFireModellingLayer: (layerData) =>
        set((state) => ({
        fireModellingLayers: {
            ...state.fireModellingLayers,
            [layerData.id]: layerData,
        },
        })),

    removeFireModellingLayer: (id) =>
        set((state) => {
        const updatedLayers = { ...state.fireModellingLayers };
        delete updatedLayers[id];
        return { fireModellingLayers: updatedLayers };
        }),

    updateFireModellingLayer: (id, updates) =>
        set((state) => ({
            fireModellingLayers: {
            ...state.fireModellingLayers,
            [id]: {
                ...state.fireModellingLayers[id],
                ...updates
            }
            }
        })),
}));

export default useFireModellingStore;
