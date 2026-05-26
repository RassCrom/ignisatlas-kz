export const createMenuSlice = (set) => ({
  // default values
  isMenuOpen: false,
  openTabIndex: null,
  expandedItems: {},

  setTabIndex: (tabIndex) => {
    set(() => ({
      openTabIndex: tabIndex,
    }))
  },
  toggleMenu: () => {
    set((state) => ({
      isMenuOpen: !state.isMenuOpen,
    }))
  },
  toggleExpandedItem: (id) => {
    set((state) => ({
      expandedItems: { ...state.expandedItems, [id]: !state.expandedItems[id] },
    }))
  },
});
