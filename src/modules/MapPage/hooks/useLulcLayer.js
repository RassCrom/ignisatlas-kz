import { useEffect, useRef } from 'react';
import ImageLayer from 'ol/layer/Image.js';
import ImageArcGISRest from 'ol/source/ImageArcGISRest.js';
import useLulcStore from 'src/app/store/lulcStore';
// ArcGIS Sentinel-2 10m Land Cover ImageServer
const LULC_URL =
  'https://ic.imagery1.arcgis.com/arcgis/rest/services/Sentinel2_10m_LandCover/ImageServer';

export const useLulcLayer = (mapInstance, isMapInitialized) => {
  const layerRef = useRef(null);

  const visible = useLulcStore((state) => state.visible);
  const opacity = useLulcStore((state) => state.opacity);

  /* ── Create layer once map is ready ────────────────────── */
  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;

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

    return () => {
      mapInstance.removeLayer(layer);
      layerRef.current = null;
    };
  }, [mapInstance, isMapInitialized]);

  /* ── Sync visibility ───────────────────────────────────── */
  useEffect(() => {
    layerRef.current?.setVisible(visible);
  }, [visible]);

  /* ── Sync opacity ──────────────────────────────────────── */
  useEffect(() => {
    layerRef.current?.setOpacity(opacity);
  }, [opacity]);
};