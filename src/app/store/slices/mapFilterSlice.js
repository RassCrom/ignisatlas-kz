export const createMapFilterSlices = (set, get) => ({
  // default values
  states: {
    layers: {
      mapProvider: 'osm',
    },
    tools: {
      country_border: false,
      region_border: false,
    }
  },

  // check filters
  toggleState: (sectionKey, elemKey) => {
    set((state) => ({
      states: {
        ...state.states,
        [sectionKey]: {
          ...state.states[sectionKey],
          [elemKey]: !state.states[sectionKey][elemKey],
        },
      },
    }));
  },

  // radio filters
  setState: (sectionKey, elemKey, value) => {
    set((state) => ({
      states: {
        ...state.states,
        [sectionKey]: {
          ...state.states[sectionKey],
          [elemKey]: value,
        },
      },
    }));
  },
});