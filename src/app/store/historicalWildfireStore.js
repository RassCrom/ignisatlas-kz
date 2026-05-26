import { create } from 'zustand';

const useHistoricalWildfireStore = create((set) => ({
  selectedCaseId: null,
  layerVisible: true,
  dashboardOpen: true,

  selectCase: (caseId) => set({
    selectedCaseId: caseId,
    layerVisible: true,
    dashboardOpen: true,
  }),

  clearSelection: () => set({
    selectedCaseId: null,
    dashboardOpen: false,
  }),

  toggleLayerVisible: () => set((state) => ({
    layerVisible: !state.layerVisible,
  })),

  setLayerVisible: (layerVisible) => set({ layerVisible }),
  setDashboardOpen: (dashboardOpen) => set({ dashboardOpen }),
}));

export default useHistoricalWildfireStore;
