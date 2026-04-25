import { useEffect, useRef } from 'react';
import ImageLayer from 'ol/layer/Image.js';
import ImageArcGISRest from 'ol/source/ImageArcGISRest.js';
import useLulcStore from 'src/app/store/lulcStore';

// ArcGIS Sentinel-2 10m Land Cover ImageServer
const LULC_URL =
  'https://ic.imagery1.arcgis.com/arcgis/rest/services/Sentinel2_10m_LandCover/ImageServer';

export const useLulcLayer = (mapInstance, isMapInitialized) => {
  const layerRef = useRef(null);

  const isAdded = useLulcStore((state) => state.isAdded);
  const visible = useLulcStore((state) => state.visible);
  const opacity = useLulcStore((state) => state.opacity);

  /* ── Add / remove layer based on isAdded flag ─────────── */
  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;

    if (isAdded && !layerRef.current) {
      const layer = new ImageLayer({
        source: new ImageArcGISRest({
          url: LULC_URL,
          ratio: 1,
          crossOrigin: 'anonymous',
          params: {
            FORMAT: 'png32',
            TRANSPARENT: true,
          },
        }),
        visible,
        opacity,
      });

      layer.set('layerType', 'lulc');
      mapInstance.addLayer(layer);
      layerRef.current = layer;
    } else if (!isAdded && layerRef.current) {
      mapInstance.removeLayer(layerRef.current);
      layerRef.current = null;
    }
  }, [mapInstance, isMapInitialized, isAdded, opacity, visible]);

  /* ── Sync visibility ───────────────────────────────────── */
  useEffect(() => {
    layerRef.current?.setVisible(visible);
  }, [visible]);

  /* ── Sync opacity ──────────────────────────────────────── */
  useEffect(() => {
    layerRef.current?.setOpacity(opacity);
  }, [opacity]);
};