import { Plus, Minus, Home } from 'lucide-react';
import { flyHome } from '../../utils/flyHome';
import BasemapSwitcher from './BasemapSwitcher';
import MeasurementTools from './MeasurementTools';
import styles from './MapToolbar.module.scss';

const MapToolbar = ({ map, currentBasemap, onBasemapChange }) => {
  const view = map?.getView();

  const zoomIn = () => {
    if (!view) return;
    view.animate({ zoom: view.getZoom() + 1, duration: 200 });
  };

  const zoomOut = () => {
    if (!view) return;
    view.animate({ zoom: view.getZoom() - 1, duration: 200 });
  };

  return (
    <div className={styles.toolbar}>
      <div className={styles.group}>
        <button className={styles.btn} onClick={zoomIn} title="Приблизить">
          <Plus size={16} />
        </button>
        <div className={styles.divider} />
        <button className={styles.btn} onClick={zoomOut} title="Отдалить">
          <Minus size={16} />
        </button>
      </div>

      <div className={styles.group}>
        <button className={styles.btn} onClick={() => flyHome(view)} title="На главный вид">
          <Home size={16} />
        </button>
      </div>

      <div className={styles.group}>
        <BasemapSwitcher currentBasemap={currentBasemap} onBasemapChange={onBasemapChange} />
        <div className={styles.divider} />
        <MeasurementTools map={map} />
      </div>
    </div>
  );
};

export default MapToolbar;
