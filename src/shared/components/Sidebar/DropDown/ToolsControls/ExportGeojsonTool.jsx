import { useCallback, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import useAnalysisStore from 'src/app/store/analysisStore';
import { getMapInstance } from 'src/modules/MapPage/services/mapService';
import baseStyles from './ToolsControls.module.scss';
import styles from './AnalysisTools.module.scss';

const triggerDownload = (content, filename) => {
  const blob = new Blob([content], { type: 'application/geo+json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const getVisibleVectorLayers = () => {
  const map = getMapInstance();
  if (!map?.getStyle()) return [];
  return map.getStyle().layers
    .filter((layer) => ['fill', 'line', 'circle', 'symbol'].includes(layer.type))
    .filter((layer) => map.getLayoutProperty(layer.id, 'visibility') !== 'none')
    .map((layer) => ({ id: layer.id, count: map.queryRenderedFeatures({ layers: [layer.id] }).length }));
};

const ExportGeojsonTool = () => {
  const [mapLayers, setMapLayers] = useState([]);
  const [selectedLayers, setSelectedLayers] = useState({});
  const [selectedPolys, setSelectedPolys] = useState({});
  const drawnPolygons = useAnalysisStore((s) => s.drawnPolygons);

  const refresh = useCallback(() => {
    const found = getVisibleVectorLayers();
    setMapLayers(found);
    setSelectedLayers(Object.fromEntries(found.map((l) => [l.id, true])));
  }, []);

  const toggleLayer = (id) => setSelectedLayers((s) => ({ ...s, [id]: !s[id] }));
  const togglePoly = (id) => setSelectedPolys((s) => ({ ...s, [id]: !s[id] }));

  const doExport = useCallback(() => {
    const map = getMapInstance();
    const features = [];

    drawnPolygons.forEach((p) => {
      if (!selectedPolys[p.id]) return;
      features.push({ type: 'Feature', geometry: p.geojson, properties: { name: p.name, id: p.id } });
    });

    if (map) {
      mapLayers.filter((l) => selectedLayers[l.id]).forEach((layer) => {
        map.queryRenderedFeatures({ layers: [layer.id] }).forEach((feature) => {
          if (!feature.geometry) return;
          features.push({
            type: 'Feature',
            geometry: feature.geometry,
            properties: { ...(feature.properties || {}), sourceLayer: layer.id },
          });
        });
      });
    }

    if (!features.length) return;
    triggerDownload(JSON.stringify({ type: 'FeatureCollection', features }, null, 2), `export_${Date.now()}.geojson`);
  }, [drawnPolygons, selectedPolys, mapLayers, selectedLayers]);

  const hasAnything = drawnPolygons.some((p) => selectedPolys[p.id]) || mapLayers.some((l) => selectedLayers[l.id]);

  return (
    <div className={styles.toolWrap}>
      <p className={baseStyles.toolDesc}>
        Export drawn polygons and visible rendered vector features as GeoJSON (EPSG:4326).
      </p>

      {drawnPolygons.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span className={styles.sectionLabel}>Drawn polygons</span>
          {drawnPolygons.map((p) => (
            <label key={p.id} className={styles.radioLabel} style={{ gap: '0.4rem' }}>
              <input type="checkbox" checked={!!selectedPolys[p.id]} onChange={() => togglePoly(p.id)} />
              <span>{p.name}</span>
            </label>
          ))}
        </div>
      )}

      <button className={styles.applyBtn} onClick={refresh}>
        <RefreshCw size={13} /> Find map layers
      </button>

      {mapLayers.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span className={styles.sectionLabel}>Map layers</span>
          {mapLayers.map((l) => (
            <label key={l.id} className={styles.radioLabel} style={{ gap: '0.4rem' }}>
              <input type="checkbox" checked={!!selectedLayers[l.id]} onChange={() => toggleLayer(l.id)} />
              <span>{l.id}</span>
              <span style={{ marginLeft: 'auto', color: 'rgba(217,218,245,0.35)', fontSize: '0.62rem' }}>
                {l.count} obj.
              </span>
            </label>
          ))}
        </div>
      )}

      {mapLayers.length === 0 && drawnPolygons.length === 0 && (
        <p className={baseStyles.toolDesc} style={{ textAlign: 'center' }}>No data to export</p>
      )}

      <button className={styles.activateBtn} onClick={doExport} disabled={!hasAnything}>
        <Download size={13} /> Export GeoJSON
      </button>
    </div>
  );
};

export default ExportGeojsonTool;
