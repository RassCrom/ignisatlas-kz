import { X } from 'lucide-react';
import useGlacierMonitoringStore from 'src/app/store/glacierMonitoringStore';
import styles from './WaterBodyDetailsPanel.module.scss';

const EMPTY = '-';

const firstValue = (props, keys) => {
  for (const key of keys) {
    const value = props?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return EMPTY;
};

const formatCoordinate = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return EMPTY;
  return numeric.toFixed(5);
};

const GlacierDetailsPanel = () => {
  const selectedGlacier = useGlacierMonitoringStore((state) => state.selectedGlacier);
  const clearSelectedGlacier = useGlacierMonitoringStore((state) => state.clearSelectedGlacier);

  if (!selectedGlacier) return null;

  const props = selectedGlacier.properties || {};
  const name = firstValue(props, ['name', 'Name', 'NAME']);
  const glacierClass = firstValue(props, ['fclass', 'class', 'type', 'TYPE']);
  const osmId = firstValue(props, ['osm_id', 'id', 'ID']);
  const code = firstValue(props, ['code', 'CODE']);
  const [lng, lat] = selectedGlacier.lngLat || [];

  return (
    <aside className={styles.panel} aria-label="Glacier details">
      <div className={styles.header}>
        <div className={styles.title}>
          <div className={styles.eyebrow}>Glacier</div>
          <div className={styles.name}>{name === EMPTY ? `OSM ${osmId}` : name}</div>
        </div>
        <button className={styles.close} onClick={clearSelectedGlacier} aria-label="Close glacier details">
          <X size={16} />
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.grid}>
          <div className={styles.metric}>
            <div className={styles.label}>Class</div>
            <div className={styles.value}>{glacierClass}</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.label}>OSM ID</div>
            <div className={styles.value}>{osmId}</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.label}>Code</div>
            <div className={styles.value}>{code}</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.label}>Name</div>
            <div className={styles.value}>{name}</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.label}>Longitude</div>
            <div className={styles.value}>{formatCoordinate(lng)}</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.label}>Latitude</div>
            <div className={styles.value}>{formatCoordinate(lat)}</div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Inventory source</div>
          <div className={styles.metric}>
            <div className={styles.value}>
              Glacier geometry comes from the local glacier GeoJSON. Use the satellite glacier tab to add NDSI,
              NDMI, SWIR, or true-color Planetary Computer rasters for the same area.
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default GlacierDetailsPanel;
