export const createAdminBoundarySlice = (set, get) => ({
    layerVisibility: {
        country_boundaries: false,
        region_boundaries: false,
        district_boundaries: false,
    },
  
    layerOpacity: {
        country_boundaries: 0.1,
        region_boundaries: 1.0,
        district_boundaries: 1.0,
    },

    changeBoundaryVisibility: (level) =>
        set((state) => ({
            layerVisibility: {
            ...state.layerVisibility,
            [level]: !state.layerVisibility[level],
            }
        })),

    changeFirst: () =>
        set((state) => ({
            layerVisibility: {
                ...state.layerVisibility,
                country_boundaries: !state.layerVisibility.country_boundaries
            }
        })),

    changeSecond: () =>
        set((state) => ({
            layerVisibility: {
                ...state.layerVisibility,
                region_boundaries: !state.layerVisibility.region_boundaries
            }
        })),

    changeThird: () =>
        set((state) => ({
            layerVisibility: {
                ...state.layerVisibility,
                district_boundaries: !state.layerVisibility.district_boundaries
            }
        })),

    toggleVisibility: (layerId) =>
        set((state) => ({
            layerVisibility: {
                ...state.layerVisibility,
                [layerId]: !state.layerVisibility[layerId]
            }
        })),

    changeOpacity: (layerId, newValue) =>
        set((state) => ({
            layerOpacity: {
                ...state.layerOpacity,
                [layerId]: newValue
            }
        })),

    resetLayerSettings: () =>
        set({
            layerVisibility: {
                adminBoundary0: false,
                country_boundaries: false,
                region_boundaries: false,
                district_boundaries: false,
                adminBoundary4: false,
            },
            layerOpacity: {
                adminBoundary0: 1.0,
                country_boundaries: 1.0,
                region_boundaries: 1.0,
                district_boundaries: 1.0,
                adminBoundary4: 1.0,
            },
        }),
})