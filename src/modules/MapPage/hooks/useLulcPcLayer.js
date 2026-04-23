import { useEffect, useRef } from 'react';
import TileLayer from 'ol/layer/Tile.js';
import XYZ from 'ol/source/XYZ.js';
import useLulcPcStore from 'src/app/store/lulcPcStore';

export const useLulcPcLayer = (mapInstance, isMapInitialized) => {
  const layerRef = useRef(null);

  const isAdded = useLulcPcStore((state) => state.isAdded);
  const tileUrl = useLulcPcStore((state) => state.tileUrl);
  const visible = useLulcPcStore((state) => state.visible);
  const opacity = useLulcPcStore((state) => state.opacity);

  /* ── Create / remove layer based on isAdded ──────────── */
  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;

    if (isAdded && tileUrl && !layerRef.current) {
      const layer = new TileLayer({
        source: new XYZ({
          url: tileUrl,
          crossOrigin: 'anonymous',
          maxZoom: 14,
        }),
        visible,
        opacity,
      });

      layer.set('layerType', 'lulc_pc');
      mapInstance.addLayer(layer);
      layerRef.current = layer;
    } else if (!isAdded && layerRef.current) {
      mapInstance.removeLayer(layerRef.current);
      layerRef.current = null;
    }
  }, [mapInstance, isMapInitialized, isAdded, tileUrl]);

  /* ── Swap tile source on year change (tileUrl update) ── */
  useEffect(() => {
    if (!layerRef.current || !tileUrl) return;

    const currentUrl = layerRef.current.getSource()?.getUrls()?.[0];
    if (currentUrl !== tileUrl) {
      layerRef.current.setSource(
        new XYZ({
          url: tileUrl,
          crossOrigin: 'anonymous',
          maxZoom: 14,
        })
      );
    }
  }, [tileUrl]);

  /* ── Sync visibility ───────────────────────────────────── */
  useEffect(() => {
    layerRef.current?.setVisible(visible);
  }, [visible]);

  /* ── Sync opacity ──────────────────────────────────────── */
  useEffect(() => {
    layerRef.current?.setOpacity(opacity);
  }, [opacity]);
};
