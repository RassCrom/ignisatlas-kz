import { create } from 'zustand';

const useSettlementsStore = create((set) => ({
  visible: false,
  opacity: 1,

  toggleVisible: () => set((state) => ({ visible: !state.visible })),
  setOpacity: (opacity) => set({ opacity }),
}));

export default useSettlementsStore;
