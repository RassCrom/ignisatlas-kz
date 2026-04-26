import { useState } from 'react';
import { Map } from 'lucide-react';
import { transformExtent } from 'ol/proj';
import styles from './ToolsControls.module.scss';

const REGIONS = [
  { name: "Абайская",               short: "АБА",  bbox: [75.5, 47.5, 83.2, 52.0] },
  { name: "Акмолинская",            short: "АКМ",  bbox: [66.0, 50.0, 76.5, 53.5] },
  { name: "Актюбинская",            short: "АКТ",  bbox: [52.5, 46.5, 63.5, 51.5] },
  { name: "Алматы",                 short: "АЛМг", bbox: [76.5, 42.7, 77.3, 43.5] },
  { name: "Алматинская",            short: "АЛМо", bbox: [76.0, 42.5, 85.0, 46.5] },
  { name: "Астана",                 short: "АСТ",  bbox: [71.0, 50.9, 71.9, 51.5] },
  { name: "Атырауская",             short: "АТР",  bbox: [49.0, 45.5, 56.0, 49.5] },
  { name: "Восточно-Казахстанская", short: "ВКО",  bbox: [80.5, 47.5, 87.5, 51.5] },
  { name: "Жамбылская",             short: "ЖАМ",  bbox: [68.0, 41.5, 76.0, 45.0] },
  { name: "Жетысуская",             short: "ЖЕТ",  bbox: [78.0, 43.0, 85.5, 47.0] },
  { name: "Западно-Казахстанская",  short: "ЗКО",  bbox: [48.5, 48.8, 57.5, 52.5] },
  { name: "Карагандинская",         short: "КРГ",  bbox: [67.5, 44.5, 78.5, 51.0] },
  { name: "Костанайская",           short: "КОС",  bbox: [57.5, 49.6, 68.0, 54.7] },
  { name: "Кызылординская",         short: "КЗО",  bbox: [57.0, 43.0, 67.0, 47.5] },
  { name: "Мангистауская",          short: "МАН",  bbox: [49.5, 43.0, 57.5, 47.5] },
  { name: "Павлодарская",           short: "ПВЛ",  bbox: [73.0, 50.7, 79.0, 55.0] },
  { name: "Северо-Казахстанская",   short: "СКО",  bbox: [66.2, 52.3, 77.5, 55.7] },
  { name: "Туркестанская",          short: "ТУР",  bbox: [63.0, 40.0, 71.5, 45.0] },
  { name: "Улытауская",             short: "УЛЫ",  bbox: [61.0, 44.5, 70.5, 49.5] },
  { name: "Шымкент",                short: "ШЫМ",  bbox: [68.7, 42.1, 70.1, 43.1] },
];

const GoToRegionTool = () => {
  const [selected, setSelected] = useState('');

  const handleGo = () => {
    if (!selected || !window.mapInstance) return;
    const region = REGIONS.find((r) => r.short === selected);
    if (!region) return;

    const extent = transformExtent(region.bbox, 'EPSG:4326', 'EPSG:3857');
    window.mapInstance.getView().fit(extent, {
      duration: 800,
      padding: [24, 24, 24, 24],
    });
  };

  return (
    <div className={styles.bookmarksContainer}>
      <div className={styles.creationPanel}>
        <div className={styles.field}>
          <label>Область / город</label>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className={styles.select}
          >
            <option value="" disabled>Выберите регион...</option>
            {REGIONS.map((r) => (
              <option key={r.short} value={r.short}>
                {r.name} ({r.short})
              </option>
            ))}
          </select>
        </div>

        <button
          className={styles.saveBtn}
          onClick={handleGo}
          disabled={!selected}
        >
          <Map size={14} />
          Перейти к региону
        </button>
      </div>
    </div>
  );
};

export default GoToRegionTool;
