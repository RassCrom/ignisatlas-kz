import { create } from 'zustand';

const useWindStore = create((set) => ({
  visible: false,
  opacity: 0.86,
  density: 'medium',
  minSpeed: 0,
  points: [],
  summary: null,
  fetchedAt: null,
  isLoading: false,
  error: null,
  selectedPointId: null,

  toggleVisible: () => set((state) => ({ visible: !state.visible })),
  setVisible: (visible) => set({ visible }),
  setOpacity: (opacity) => set({ opacity }),
  setDensity: (density) => set({ density }),
  setMinSpeed: (minSpeed) => set({ minSpeed }),
  setSelectedPointId: (selectedPointId) => set({ selectedPointId }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setWindData: ({ points, summary, fetchedAt }) => set({
    points,
    summary,
    fetchedAt,
    error: null,
  }),
  clearWindData: () => set({
    points: [],
    summary: null,
    fetchedAt: null,
    selectedPointId: null,
    error: null,
  }),
}));

export default useWindStore;
