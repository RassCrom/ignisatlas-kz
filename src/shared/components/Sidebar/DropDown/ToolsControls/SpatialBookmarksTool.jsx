import { useState, useCallback } from 'react';
import { BookmarkPlus, MapPin, Eye, EyeOff, Trash2, Navigation } from 'lucide-react';
import useBookmarksStore from 'src/app/store/bookmarksStore';
import styles from './ToolsControls.module.scss';
import dayjs from 'dayjs';

const MAX_DESC = 400;

const captureMapScreenshot = () =>
  new Promise((resolve) => {
    if (!window.mapInstance) return resolve(null);
    window.mapInstance.once('rendercomplete', () => {
      try {
        const mapEl = window.mapInstance.getTargetElement();
        const [w, h] = window.mapInstance.getSize();
        const out = document.createElement('canvas');
        out.width  = Math.round(w * 0.3);
        out.height = Math.round(h * 0.3);
        const ctx = out.getContext('2d');
        ctx.scale(0.3, 0.3);
        mapEl.querySelectorAll('.ol-layer canvas, canvas.ol-layer').forEach((c) => {
          if (!c.width) return;
          const op = c.parentNode.style.opacity;
          ctx.globalAlpha = op === '' ? 1 : Number(op);
          const m = c.style.transform.match(/^matrix\(([^)]*)\)$/);
          if (m) ctx.setTransform(...m[1].split(',').map(Number));
          ctx.drawImage(c, 0, 0);
        });
        ctx.globalAlpha = 1;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        resolve(out.toDataURL('image/jpeg', 0.6));
      } catch {
        resolve(null);
      }
    });
    window.mapInstance.renderSync();
  });

const SpatialBookmarksTool = () => {
  const store = useBookmarksStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [saving, setSaving] = useState(false);

  const handleSaveView = useCallback(async () => {
    if (!window.mapInstance) return;

    setSaving(true);
    const screenshot = await captureMapScreenshot();

    const view = window.mapInstance.getView();
    const center = view.getCenter();
    const zoom = view.getZoom();
    const extent = view.calculateExtent(window.mapInstance.getSize());

    const bookmarkTitle = title.trim() || `Bookmark ${store.bookmarks.length + 1}`;

    store.addBookmark(bookmarkTitle, date, description.trim(), center, zoom, extent, screenshot);

    setTitle('');
    setDescription('');
    setSaving(false);
  }, [store, title, date, description]);

  const handleNavigate = useCallback((bookmark) => {
    if (!window.mapInstance) return;
    window.mapInstance.getView().animate({
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
        <div className={styles.field}>
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESC))}
            placeholder="Optional notes about this view..."
            className={styles.textarea}
          />
          <span className={styles.charCount}>{description.length}/{MAX_DESC}</span>
        </div>

        <button className={styles.saveBtn} onClick={handleSaveView} disabled={saving}>
          <BookmarkPlus size={14} />
          {saving ? 'Saving...' : 'Save Current Map View'}
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
                <div className={styles.bookmarkCardBody}>
                  {bookmark.screenshot ? (
                    <img
                      src={bookmark.screenshot}
                      alt=""
                      className={styles.bookmarkThumb}
                      onClick={() => handleNavigate(bookmark)}
                    />
                  ) : (
                    <div
                      className={`${styles.bookmarkThumb} ${styles.bookmarkThumbPlaceholder}`}
                      onClick={() => handleNavigate(bookmark)}
                    >
                      <MapPin size={14} />
                    </div>
                  )}

                  <div className={styles.bookmarkInfo} onClick={() => handleNavigate(bookmark)}>
                    <div className={styles.bookmarkName}>{bookmark.title}</div>
                    <div className={styles.bookmarkDate}>
                      {dayjs(bookmark.date).format('DD MMM YYYY')}
                    </div>
                    {bookmark.description && (
                      <div className={styles.bookmarkDesc}>{bookmark.description}</div>
                    )}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpatialBookmarksTool;
