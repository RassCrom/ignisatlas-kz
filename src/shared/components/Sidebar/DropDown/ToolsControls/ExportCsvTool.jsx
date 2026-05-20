import { useState, useCallback } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { getMapInstance } from 'src/modules/MapPage/services/mapService';
import baseStyles from './ToolsControls.module.scss';
import styles from './AnalysisTools.module.scss';

const getVectorLayers = () => {
  const map = getMapInstance();
  if (!map) return [];
  const result = [];

  const scan = (collection) => {
    collection.forEach((layer) => {
      if (layer.getLayers) {
        scan(layer.getLayers());
      } else if (layer instanceof VectorLayer) {
        const src = layer.getSource();
        if (src instanceof VectorSource && layer.getVisible()) {
          const id = layer.get('id') ?? `layer-${Math.random().toString(36).slice(2, 6)}`;
          const count = src.getFeatures().length;
          if (count > 0) result.push({ id, source: src, count });
        }
      }
    });
  };

  scan(map.getLayers());
  return result;
};

const featuresToCsv = (features) => {
  if (!features.length) return '';

  const allKeys = new Set();
  features.forEach((f) => {
    Object.keys(f.getProperties()).forEach((k) => {
      if (k !== 'geometry') allKeys.add(k);
    });
  });
  const keys = [...allKeys];

  const escape = (v) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const rows = [keys.join(',')];
  features.forEach((f) => {
    const props = f.getProperties();
    rows.push(keys.map((k) => escape(props[k] ?? '')).join(','));
  });
  return rows.join('\n');
};

const triggerDownload = (content, filename, mime) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const ExportCsvTool = () => {
  const [layers, setLayers] = useState([]);
  const [selected, setSelected] = useState({});

  const refresh = useCallback(() => {
    const found = getVectorLayers();
    setLayers(found);
    const init = {};
    found.forEach((l) => { init[l.id] = true; });
    setSelected(init);
  }, []);

  const toggle = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  const doExport = useCallback(() => {
    const allFeatures = layers
      .filter((l) => selected[l.id])
      .flatMap((l) => l.source.getFeatures());

    if (!allFeatures.length) return;

    const csv = featuresToCsv(allFeatures);
    triggerDownload(csv, `export_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
  }, [layers, selected]);

  const anySelected = layers.some((l) => selected[l.id]);

  return (
    <div className={styles.toolWrap}>
      <p className={baseStyles.toolDesc}>
        Экспорт атрибутов видимых векторных слоёв в CSV-файл.
      </p>

      <button className={styles.applyBtn} onClick={refresh}>
        <RefreshCw size={13} /> Найти слои
      </button>

      {layers.length === 0 && (
        <p className={baseStyles.toolDesc} style={{ textAlign: 'center', marginTop: '0.3rem' }}>
          Нет видимых векторных слоёв с объектами
        </p>
      )}

      {layers.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span className={styles.sectionLabel}>Выберите слои</span>
          {layers.map((l) => (
            <label key={l.id} className={styles.radioLabel} style={{ gap: '0.4rem' }}>
              <input
                type="checkbox"
                checked={!!selected[l.id]}
                onChange={() => toggle(l.id)}
              />
              <span>{l.id}</span>
              <span style={{ marginLeft: 'auto', color: 'rgba(217,218,245,0.35)', fontSize: '0.62rem' }}>
                {l.count} объ.
              </span>
            </label>
          ))}

          <button
            className={styles.activateBtn}
            onClick={doExport}
            disabled={!anySelected}
            style={{ marginTop: '0.2rem' }}
          >
            <Download size={13} /> Экспорт CSV
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportCsvTool;
