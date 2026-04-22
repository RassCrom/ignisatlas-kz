import { create } from 'zustand';

// Random ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

const useBookmarksStore = create((set, get) => ({
  bookmarks: [],

  addBookmark: (title, date, center, zoom, extent) => {
    const newBookmark = {
      id: generateId(),
      title,
      date,
      center,
      zoom,
      extent,
      visible: true,
      timestamp: Date.now()
    };
    
    set((state) => ({
      bookmarks: [...state.bookmarks, newBookmark]
    }));
  },

  removeBookmark: (id) => {
    set((state) => ({
      bookmarks: state.bookmarks.filter((b) => b.id !== id)
    }));
  },

  toggleBookmarkVisibility: (id) => {
    set((state) => ({
      bookmarks: state.bookmarks.map((b) =>
        b.id === id ? { ...b, visible: !b.visible } : b
      )
    }));
  },

  updateBookmark: (id, updates) => {
    set((state) => ({
      bookmarks: state.bookmarks.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      )
    }));
  }
}));

export default useBookmarksStore;
