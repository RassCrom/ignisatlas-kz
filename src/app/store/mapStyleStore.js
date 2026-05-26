import { create } from 'zustand';

export const useMapStyleStore = create((set) => ({
  styleVersion: 0,
  bumpStyleVersion: () => set((s) => ({ styleVersion: s.styleVersion + 1 })),
}));
