import { useState, useCallback } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import GeoJSONFormat from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import useAnalysisStore from 'src/app/store/analysisStore';
import { getMapInstance } from 'src/modules/MapPage/services/mapService';
import baseStyles from './ToolsControls.module.scss';
import styles from './AnalysisTools.module.scss';

const geojsonFormat = new GeoJSONFormat();

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

const triggerDownload = (content, filename) => {
  const blob = new Blob([content], { type: 'application/geo+json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const ExportGeojsonTool = () => {
  const [mapLayers, setMapLayers] = useState([]);
  const [selectedLayers, setSelectedLayers] = useState({});
  const [selectedPolys, setSelectedPolys] = useState({});

  const drawnPolygons = useAnalysisStore((s) => s.drawnPolygons);

  const refresh = useCallback(() => {
    const found = getVectorLayers();
    setMapLayers(found);
    const init = {};
    found.forEach((l) => { init[l.id] = true; });
    setSelectedLayers(init);
  }, []);

  const toggleLayer = (id) => setSelectedLayers((s) => ({ ...s, [id]: !s[id] }));
  const togglePoly = (id) => setSelectedPolys((s) => ({ ...s, [id]: !s[id] }));

  const doExport = useCallback(() => {
    const features = [];

    // From drawn polygons (already EPSG:4326 GeoJSON)
    drawnPolygons.forEach((p) => {
      if (!selectedPolys[p.id]) return;
      features.push({
        type: 'Feature',
        geometry: p.geojson,
        properties: { name: p.name, id: p.id },
      });
    });

    // From map vector layers (EPSG:3857 → 4326)
    mapLayers.filter((l) => selectedLayers[l.id]).forEach((l) => {
      l.source.getFeatures().forEach((feat) => {
        const obj = geojsonFormat.writeFeatureObject(feat, {
          featureProjection: 'EPSG:3857',
          dataProjection: 'EPSG:4326',
        });
        features.push(obj);
      });
    });

    if (!features.length) return;

    const fc = { type: 'FeatureCollection', features };
    triggerDownload(JSON.stringify(fc, null, 2), `export_${Date.now()}.geojson`);
  }, [drawnPolygons, selectedPolys, mapLayers, selectedLayers]);

  const hasAnything =
    drawnPolygons.some((p) => selectedPolys[p.id]) ||
    mapLayers.some((l) => selectedLayers[l.id]);

  return (
    <div className={styles.toolWrap}>
      <p className={baseStyles.toolDesc}>
        Экспорт геометрии в формат GeoJSON (EPSG:4326).
      </p>

      {drawnPolygons.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span className={styles.sectionLabel}>Нарисованные полигоны</span>
          {drawnPolygons.map((p) => (
            <label key={p.id} className={styles.radioLabel} style={{ gap: '0.4rem' }}>
              <input
                type="checkbox"
                checked={!!selectedPolys[p.id]}
                onChange={() => togglePoly(p.id)}
              />
              <span>{p.name}</span>
            </label>
          ))}
        </div>
      )}

      <button className={styles.applyBtn} onClick={refresh}>
        <RefreshCw size={13} /> Найти слои карты
      </button>

      {mapLayers.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span className={styles.sectionLabel}>Слои карты</span>
          {mapLayers.map((l) => (
            <label key={l.id} className={styles.radioLabel} style={{ gap: '0.4rem' }}>
              <input
                type="checkbox"
                checked={!!selectedLayers[l.id]}
                onChange={() => toggleLayer(l.id)}
              />
              <span>{l.id}</span>
              <span style={{ marginLeft: 'auto', color: 'rgba(217,218,245,0.35)', fontSize: '0.62rem' }}>
                {l.count} объ.
              </span>
            </label>
          ))}
        </div>
      )}

      {mapLayers.length === 0 && drawnPolygons.length === 0 && (
        <p className={baseStyles.toolDesc} style={{ textAlign: 'center' }}>
          Нет данных для экспорта
        </p>
      )}

      <button
        className={styles.activateBtn}
        onClick={doExport}
        disabled={!hasAnything}
      >
        <Download size={13} /> Экспорт GeoJSON
      </button>
    </div>
  );
};

export default ExportGeojsonTool;
