import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const generateId = () => Math.random().toString(36).substr(2, 9);

const useBookmarksStore = create(
  persist(
    (set) => ({
      bookmarks: [],

      addBookmark: (title, date, description, center, zoom, extent, screenshot) => {
        const newBookmark = {
          id: generateId(),
          title,
          date,
          description,
          center,
          zoom,
          extent,
          screenshot,
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
    }),
    { name: 'bookmarks-store' }
  )
);

export default useBookmarksStore;
