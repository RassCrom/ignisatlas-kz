import { create } from "zustand";
import { createFireSlice } from "./slices/fireSlice";

const useFireStore = create((set, get) => ({
    ...createFireSlice(set, get),
}));


export default useFireStore;
