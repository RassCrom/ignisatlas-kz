import { create } from "zustand";
import { createAdminBoundarySlice } from "./slices/adminBoundarySlice";

const useAdminBoundaryStore = create((set, get) => ({
    ...createAdminBoundarySlice(set, get),
}));


export default useAdminBoundaryStore;
