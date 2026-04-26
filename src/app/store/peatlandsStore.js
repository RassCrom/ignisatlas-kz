import { create } from 'zustand';

const usePeatlandsStore = create((set) => ({
  visible: false,
  opacity: 0.8,

  toggleVisible: () => set((s) => ({ visible: !s.visible })),
  setOpacity: (opacity) => set({ opacity }),
}));

export default usePeatlandsStore;
