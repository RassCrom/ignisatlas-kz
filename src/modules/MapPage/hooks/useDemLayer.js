import { useEffect, useRef } from 'react';
import TileLayer from 'ol/layer/Tile.js';
import XYZ from 'ol/source/XYZ.js';
import useDemStore from 'src/app/store/demStore';

export const useDemLayer = (mapInstance, isMapInitialized) => {
  const layerRef = useRef(null);

  const isAdded = useDemStore((s) => s.isAdded);
  const tileUrl = useDemStore((s) => s.tileUrl);
  const visible = useDemStore((s) => s.visible);
  const opacity = useDemStore((s) => s.opacity);

  /* ── Create / remove layer ───────────────────────────── */
  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;

    if (isAdded && tileUrl && !layerRef.current) {
      const layer = new TileLayer({
        source: new XYZ({ url: tileUrl, crossOrigin: 'anonymous', maxZoom: 14 }),
        visible,
        opacity,
      });
      layer.set('layerType', 'dem_pc');
      mapInstance.addLayer(layer);
      layerRef.current = layer;
    } else if (!isAdded && layerRef.current) {
      mapInstance.removeLayer(layerRef.current);
      layerRef.current = null;
    }
  }, [mapInstance, isMapInitialized, isAdded, tileUrl]);

  /* ── Swap source when renderer changes (tileUrl update) ─ */
  useEffect(() => {
    if (!layerRef.current || !tileUrl) return;
    const currentUrl = layerRef.current.getSource()?.getUrls()?.[0];
    if (currentUrl !== tileUrl) {
      layerRef.current.setSource(
        new XYZ({ url: tileUrl, crossOrigin: 'anonymous', maxZoom: 14 })
      );
    }
  }, [tileUrl]);

  /* ── Sync visibility / opacity ───────────────────────── */
  useEffect(() => { layerRef.current?.setVisible(visible); }, [visible]);
  useEffect(() => { layerRef.current?.setOpacity(opacity); }, [opacity]);
};
