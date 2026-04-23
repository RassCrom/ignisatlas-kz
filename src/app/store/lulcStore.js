import { create } from 'zustand';

const useLulcStore = create((set) => ({
  visible: false,
  opacity: 1,
  isAdded: false,

  addLayer: () => set({ isAdded: true, visible: true }),
  removeLayer: () => set({ isAdded: false, visible: false }),
  toggleVisible: () => set((state) => ({ visible: !state.visible })),
  setOpacity: (opacity) => set({ opacity }),
}));

export default useLulcStore;
