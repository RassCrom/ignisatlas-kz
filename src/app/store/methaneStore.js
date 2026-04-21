import { create } from "zustand";
import { createMethaneSlice } from "./slices/methaneSlice";

const useMethaneStore = create((set, get) => ({
    ...createMethaneSlice(set, get),
}));


export default useMethaneStore;