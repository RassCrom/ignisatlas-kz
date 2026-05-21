import { useCallback, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { getMapInstance } from 'src/modules/MapPage/services/mapService';
import baseStyles from './ToolsControls.module.scss';
import styles from './AnalysisTools.module.scss';

const getVisibleVectorLayers = () => {
  const map = getMapInstance();
  if (!map?.getStyle()) return [];
  return map.getStyle().layers
    .filter((layer) => ['fill', 'line', 'circle', 'symbol'].includes(layer.type))
    .filter((layer) => map.getLayoutProperty(layer.id, 'visibility') !== 'none')
    .map((layer) => ({ id: layer.id, count: map.queryRenderedFeatures({ layers: [layer.id] }).length }));
};

const featuresToCsv = (features) => {
  if (!features.length) return '';
  const allKeys = new Set();
  features.forEach((f) => Object.keys(f.properties || {}).forEach((k) => allKeys.add(k)));
  const keys = [...allKeys];
  const escape = (v) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    keys.join(','),
    ...features.map((f) => keys.map((k) => escape(f.properties?.[k] ?? '')).join(',')),
  ].join('\n');
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
    const found = getVisibleVectorLayers();
    setLayers(found);
    setSelected(Object.fromEntries(found.map((l) => [l.id, true])));
  }, []);

  const toggle = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  const doExport = useCallback(() => {
    const map = getMapInstance();
    if (!map) return;
    const allFeatures = layers
      .filter((l) => selected[l.id])
      .flatMap((l) => map.queryRenderedFeatures({ layers: [l.id] })
        .map((feature) => ({ properties: { ...(feature.properties || {}), sourceLayer: l.id } })));
    if (!allFeatures.length) return;
    triggerDownload(featuresToCsv(allFeatures), `export_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
  }, [layers, selected]);

  const anySelected = layers.some((l) => selected[l.id]);

  return (
    <div className={styles.toolWrap}>
      <p className={baseStyles.toolDesc}>
        Export attributes from visible rendered vector layers to CSV.
      </p>

      <button className={styles.applyBtn} onClick={refresh}>
        <RefreshCw size={13} /> Find layers
      </button>

      {layers.length === 0 && (
        <p className={baseStyles.toolDesc} style={{ textAlign: 'center', marginTop: '0.3rem' }}>
          No visible vector layers with objects
        </p>
      )}

      {layers.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span className={styles.sectionLabel}>Choose layers</span>
          {layers.map((l) => (
            <label key={l.id} className={styles.radioLabel} style={{ gap: '0.4rem' }}>
              <input type="checkbox" checked={!!selected[l.id]} onChange={() => toggle(l.id)} />
              <span>{l.id}</span>
              <span style={{ marginLeft: 'auto', color: 'rgba(217,218,245,0.35)', fontSize: '0.62rem' }}>
                {l.count} obj.
              </span>
            </label>
          ))}

          <button className={styles.activateBtn} onClick={doExport} disabled={!anySelected} style={{ marginTop: '0.2rem' }}>
            <Download size={13} /> Export CSV
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportCsvTool;
