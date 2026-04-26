import { useState } from 'react';
import { Navigation } from 'lucide-react';
import { fromLonLat } from 'ol/proj';
import styles from './ToolsControls.module.scss';

const CoordinateSearchTool = () => {
  const [lat, setLat]       = useState('');
  const [lon, setLon]       = useState('');
  const [zoom, setZoom]     = useState(12);
  const [error, setError]   = useState('');

  const handleGo = () => {
    setError('');
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);

    if (lat.trim() === '' || lon.trim() === '') {
      setError('Введите широту и долготу.');
      return;
    }
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      setError('Широта должна быть в диапазоне −90…90.');
      return;
    }
    if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
      setError('Долгота должна быть в диапазоне −180…180.');
      return;
    }
    if (!window.mapInstance) return;

    window.mapInstance.getView().animate({
      center: fromLonLat([lonNum, latNum]),
      zoom,
      duration: 800,
    });
  };

  return (
    <div className={styles.bookmarksContainer}>
      <div className={styles.creationPanel}>
        <div className={styles.field}>
          <label>Широта (°N)</label>
          <input
            type="number"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="напр. 51.18"
            min={-90}
            max={90}
            step="any"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label>Долгота (°E)</label>
          <input
            type="number"
            value={lon}
            onChange={(e) => setLon(e.target.value)}
            placeholder="напр. 71.45"
            min={-180}
            max={180}
            step="any"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label>Масштаб — {zoom}</label>
          <div className={styles.zoomRow}>
            <span className={styles.toolDesc} style={{ margin: 0 }}>3</span>
            <input
              type="range"
              min={3}
              max={18}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className={styles.zoomSlider}
            />
            <span className={styles.toolDesc} style={{ margin: 0 }}>18</span>
          </div>
        </div>

        {error && <p className={`${styles.statusMsg} ${styles.statusError}`}>{error}</p>}

        <button className={styles.saveBtn} onClick={handleGo}>
          <Navigation size={14} />
          Перейти к координатам
        </button>
      </div>
    </div>
  );
};

export default CoordinateSearchTool;
