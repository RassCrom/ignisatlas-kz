import { create } from 'zustand';

const useMapStore = create((set) => ({
    fireModelLayer: null,

    setFireModelLayer: (fireModelLayer) => set({ fireModelLayer })
}));

export default useMapStore;