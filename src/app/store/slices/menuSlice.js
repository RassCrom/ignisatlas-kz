export const createMenuSlice = (set, get) => ({
  // default values
  isMenuOpen: false,
  openTabIndex: null,

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
});
