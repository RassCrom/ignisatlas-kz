import { create } from 'zustand';

const useLulcStore = create((set) => ({
  visible: false,
  opacity: 1,

  toggleVisible: () => set((state) => ({ visible: !state.visible })),
  setOpacity: (opacity) => set({ opacity }),
}));

export default useLulcStore;
