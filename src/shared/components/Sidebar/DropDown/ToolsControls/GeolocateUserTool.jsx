import { useState } from 'react';
import { Crosshair } from 'lucide-react';
import { fromLonLat } from 'ol/proj';
import { showToast } from 'src/shared/utils/showToast';
import styles from './ToolsControls.module.scss';

const GeolocateUserTool = () => {
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMsg('Геолокация не поддерживается браузером.');
      return;
    }
    if (!window.mapInstance) return;

    setStatus('loading');
    setErrorMsg('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const center = fromLonLat([pos.coords.longitude, pos.coords.latitude]);
        window.mapInstance.getView().animate({ center, zoom: 12, duration: 800 });
        showToast('Местоположение определено');
        setStatus('idle');
      },
      (err) => {
        setStatus('error');
        setErrorMsg(err.message || 'Не удалось определить местоположение.');
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className={styles.bookmarksContainer}>
      <div className={styles.creationPanel}>
        <p className={styles.toolDesc}>
          Определить текущее местоположение и центрировать карту по нему.
        </p>

        <button
          className={styles.saveBtn}
          onClick={handleLocate}
          disabled={status === 'loading'}
        >
          <Crosshair size={14} />
          {status === 'loading' ? 'Определение...' : 'Определить местоположение'}
        </button>

        {status === 'error' && (
          <p className={`${styles.statusMsg} ${styles.statusError}`}>{errorMsg}</p>
        )}
      </div>
    </div>
  );
};

export default GeolocateUserTool;
