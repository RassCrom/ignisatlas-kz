import { create } from 'zustand';

const useProtectedAreasStore = create((set) => ({
  visible: false,
  opacity: 0.85,

  toggleVisible: () => set((s) => ({ visible: !s.visible })),
  setOpacity: (opacity) => set({ opacity }),
}));

export default useProtectedAreasStore;
