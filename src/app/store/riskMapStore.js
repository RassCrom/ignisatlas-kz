import { create } from 'zustand';

const useRiskMapStore = create((set) => ({
    riskDates: [],
    isVisible: false,

    setDates: (dates) => set({ riskDates: dates }),

    setIsVisible: (isVisible) => set({ isVisible }),

    addDate: (newDate) => set((state) => ({
        riskDates: [...state.riskDates, {
            id: Date.now(),
            date: newDate,
            addedAt: new Date().toISOString(),
            isVisible: true,
            opacity: 1
        }],
        isVisible: true
    })),

    removeDate: (id) => set((state) => ({
        riskDates: state.riskDates.filter((item) => item.id !== id),
    })),

    updateDateVisibility: (id, isVisible) => set((state) => ({
        riskDates: state.riskDates.map((item) =>
            item.id === id ? { ...item, isVisible } : item
        )
    })),

    updateDateOpacity: (id, opacity) => set((state) => ({
        riskDates: state.riskDates.map((item) =>
            item.id === id ? { ...item, opacity } : item
        )
    }))
}));

export default useRiskMapStore;
