import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createMenuSlice } from "./slices/menuSlice";
import { createMapFilterSlices } from "./slices/mapFilterSlice";
import { createMapLayerSlice } from "./slices/mapLayerSlice";

const useMenuStore = create(
  persist(
    (set, get) => ({
      ...createMenuSlice(set, get),
      ...createMapFilterSlices(set, get),
      ...createMapLayerSlice(set, get),
    }),
    { name: "menu-store" }
  )
);

export default useMenuStore;
