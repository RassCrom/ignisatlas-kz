import { X } from 'lucide-react';
import useWaterMonitoringStore from 'src/app/store/waterMonitoringStore';
import styles from './WaterBodyDetailsPanel.module.scss';

const EMPTY = '—';

const firstValue = (props, keys) => {
  for (const key of keys) {
    const value = props?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return EMPTY;
};

const formatNumber = (value, suffix = '') => {
  if (value === EMPTY) return EMPTY;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return `${numeric.toLocaleString('en-US', { maximumFractionDigits: 2 })}${suffix}`;
};

const getAreaValue = (props, year) => firstValue(props, [
  `area_${year}`,
  `area${year}`,
  `area_km2_${year}`,
  `surface_area_${year}`,
  `water_area_${year}`,
  `mndwi_area_${year}`,
  `y${year}`,
]);

const getAreaHistory = (props) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, index) => currentYear - 4 + index);
  const values = years.map((year) => {
    const value = getAreaValue(props, year);
    const numeric = Number(value);
    return {
      year,
      value: Number.isFinite(numeric) ? numeric : null,
    };
  });
  const max = Math.max(0, ...values.map((item) => item.value || 0));
  return values.map((item) => ({
    ...item,
    height: item.value && max > 0 ? Math.max(8, (item.value / max) * 100) : 0,
  }));
};

const WaterBodyDetailsPanel = () => {
  const selectedWaterBody = useWaterMonitoringStore((state) => state.selectedWaterBody);
  const clearSelectedWaterBody = useWaterMonitoringStore((state) => state.clearSelectedWaterBody);

  if (!selectedWaterBody) return null;

  const props = selectedWaterBody.properties || {};
  const name = firstValue(props, ['name', 'Name', 'NAME', 'name_en', 'name_ru']);
  const waterClass = firstValue(props, ['fclass', 'class', 'water_class', 'type', 'TYPE']);
  const area = firstValue(props, ['area_km2', 'area', 'AREA_KM2', 'Area_km2', 'mndwi_area_km2']);
  const regions = firstValue(props, ['regions', 'region', 'oblast', 'OBLAST', 'adm1_name']);
  const districts = firstValue(props, ['districts', 'district', 'rayon', 'RAYON', 'adm2_name']);
  const rivers = firstValue(props, ['rivers', 'connected_rivers', 'inflow', 'outflow', 'river_names']);
  const avgDepth = firstValue(props, ['avg_depth', 'average_depth', 'mean_depth_m', 'avg_depth_m']);
  const maxDepth = firstValue(props, ['max_depth', 'maximum_depth', 'max_depth_m']);
  const chart = getAreaHistory(props);

  return (
    <aside className={styles.panel} aria-label="Water body details">
      <div className={styles.header}>
        <div className={styles.title}>
          <div className={styles.eyebrow}>Water body</div>
          <div className={styles.name}>{name}</div>
        </div>
        <button className={styles.close} onClick={clearSelectedWaterBody} aria-label="Close water body details">
          <X size={16} />
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.grid}>
          <div className={styles.metric}>
            <div className={styles.label}>Class</div>
            <div className={styles.value}>{waterClass}</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.label}>Area</div>
            <div className={styles.value}>{formatNumber(area, area === EMPTY ? '' : ' km²')}</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.label}>Regions</div>
            <div className={styles.value}>{regions}</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.label}>Districts</div>
            <div className={styles.value}>{districts}</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.label}>Connected rivers</div>
            <div className={styles.value}>{rivers}</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.label}>Depth</div>
            <div className={styles.value}>
              Avg {formatNumber(avgDepth, avgDepth === EMPTY ? '' : ' m')} / Max {formatNumber(maxDepth, maxDepth === EMPTY ? '' : ' m')}
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Surface area, last 5 years</div>
          <div className={styles.chart}>
            {chart.map((item) => (
              <div key={item.year} className={styles.barWrap}>
                <div className={styles.barValue}>
                  {item.value == null ? EMPTY : item.value.toLocaleString('en-US', { maximumFractionDigits: 1 })}
                </div>
                {item.value == null ? (
                  <div className={styles.barEmpty} />
                ) : (
                  <div className={styles.bar} style={{ height: `${item.height}%` }} />
                )}
                <div className={styles.barLabel}>{item.year}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default WaterBodyDetailsPanel;
