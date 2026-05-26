import { create } from 'zustand';

const useHistoricalWildfireStore = create((set) => ({
  selectedCaseId: null,
  caseType: 'wildfire',
  layerVisible: true,
  dashboardOpen: false,

  selectCase: (caseId, caseType = 'wildfire') => set({
    selectedCaseId: caseId,
    caseType,
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
