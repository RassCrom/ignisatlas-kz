import { Plus, Minus, Home } from 'lucide-react';
import { flyHome } from '../../utils/flyHome';
import BasemapSwitcher from './BasemapSwitcher';
import MeasurementTools from './MeasurementTools';
import { useI18n } from 'src/shared/i18n/I18nProvider';
import styles from './MapToolbar.module.scss';

const MapToolbar = ({ map, currentBasemap, onBasemapChange }) => {
  const { t } = useI18n();

  const zoomIn = () => {
    if (!map) return;
    map.zoomTo(map.getZoom() + 1, { duration: 200 });
  };

  const zoomOut = () => {
    if (!map) return;
    map.zoomTo(map.getZoom() - 1, { duration: 200 });
  };

  return (
    <div className={styles.toolbar}>
      <div className={styles.group}>
        <button className={styles.btn} onClick={zoomIn} title={t("map.controls.zoomIn")}>
          <Plus size={16} />
        </button>
        <div className={styles.divider} />
        <button className={styles.btn} onClick={zoomOut} title={t("map.controls.zoomOut")}>
          <Minus size={16} />
        </button>
      </div>

      <div className={styles.group}>
        <button className={styles.btn} onClick={() => flyHome(map)} title={t("map.controls.homeView")}>
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
