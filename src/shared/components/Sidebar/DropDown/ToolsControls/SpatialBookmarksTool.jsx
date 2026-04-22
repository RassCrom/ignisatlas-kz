import React, { useState, useCallback } from 'react';
import { BookmarkPlus, MapPin, Eye, EyeOff, Trash2, Navigation } from 'lucide-react';
import useBookmarksStore from 'src/app/store/bookmarksStore';
import styles from './ToolsControls.module.scss';
import dayjs from 'dayjs';

const SpatialBookmarksTool = () => {
  const store = useBookmarksStore();
  
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));

  const handleSaveView = useCallback(() => {
    if (!window.mapInstance) return;
    
    const view = window.mapInstance.getView();
    const center = view.getCenter();
    const zoom = view.getZoom();
    const extent = view.calculateExtent(window.mapInstance.getSize());

    const bookmarkTitle = title.trim() || `Bookmark ${store.bookmarks.length + 1}`;
    
    store.addBookmark(bookmarkTitle, date, center, zoom, extent);
    
    setTitle('');
  }, [store, title, date]);

  const handleNavigate = useCallback((bookmark) => {
    if (!window.mapInstance) return;
    const view = window.mapInstance.getView();
    
    view.animate({
      center: bookmark.center,
      zoom: bookmark.zoom,
      duration: 1000
    });
  }, []);

  return (
    <div className={styles.bookmarksContainer}>
      <div className={styles.creationPanel}>
        <div className={styles.field}>
          <label>Title</label>
          <input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="e.g., Interesting anomaly" 
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label>Context Date</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            className={styles.input}
          />
        </div>
        
        <button className={styles.saveBtn} onClick={handleSaveView}>
          <BookmarkPlus size={14} />
          Save Current Map View
        </button>
      </div>

      <div className={styles.listPanel}>
        <h4 className={styles.listTitle}>
          Saved Bookmarks 
          <span className={styles.badge}>{store.bookmarks.length}</span>
        </h4>
        
        {store.bookmarks.length === 0 ? (
          <div className={styles.emptyMsg}>
            <MapPin size={24} />
            <p>No bookmarks saved yet.</p>
          </div>
        ) : (
          <div className={styles.bookmarkList}>
            {store.bookmarks.map((bookmark) => (
              <div key={bookmark.id} className={styles.bookmarkCard}>
                <div className={styles.bookmarkInfo} onClick={() => handleNavigate(bookmark)}>
                  <div className={styles.bookmarkName}>{bookmark.title}</div>
                  <div className={styles.bookmarkDate}>
                    {dayjs(bookmark.date).format('DD MMM YYYY')}
                  </div>
                </div>
                
                <div className={styles.bookmarkActions}>
                  <button 
                    className={`${styles.iconBtn} ${bookmark.visible ? styles.active : ''}`}
                    onClick={(e) => { e.stopPropagation(); store.toggleBookmarkVisibility(bookmark.id); }}
                    title="Toggle Marker Visibility"
                  >
                    {bookmark.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button 
                    className={`${styles.iconBtn} ${styles.danger}`}
                    onClick={(e) => { e.stopPropagation(); store.removeBookmark(bookmark.id); }}
                    title="Delete Bookmark"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button 
                    className={styles.iconBtn}
                    onClick={() => handleNavigate(bookmark)}
                    title="Fly to location"
                  >
                    <Navigation size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpatialBookmarksTool;
