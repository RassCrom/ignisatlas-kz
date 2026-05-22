import { create } from 'zustand';

const currentMonth = new Date().toISOString().slice(0, 7);

const useDroughtStore = create((set) => ({
  visible: false,
  opacity: 0.58,
  selectedIndex: 'vhi',
  selectedMonth: currentMonth,
  severityFilter: 'all',
  regionFilter: 'all',
  pinnedRegionCode: null,
  showOutlines: true,

  toggleVisible: () => set((state) => ({ visible: !state.visible })),
  setVisible: (visible) => set({ visible }),
  setOpacity: (opacity) => set({ opacity }),
  setSelectedIndex: (selectedIndex) => set({ selectedIndex }),
  setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
  setSeverityFilter: (severityFilter) => set({ severityFilter }),
  setRegionFilter: (regionFilter) => set({ regionFilter }),
  setPinnedRegionCode: (pinnedRegionCode) => set({ pinnedRegionCode }),
  setShowOutlines: (showOutlines) => set({ showOutlines }),
  resetFilters: () => set({
    selectedIndex: 'vhi',
    selectedMonth: currentMonth,
    severityFilter: 'all',
    regionFilter: 'all',
    pinnedRegionCode: null,
    opacity: 0.58,
    showOutlines: true,
  }),
}));

export default useDroughtStore;
