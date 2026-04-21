import { useEffect, useRef } from 'react';
import ImageLayer from 'ol/layer/Image';
import ImageStatic from 'ol/source/ImageStatic';
import { transformExtent } from 'ol/proj';
import useHLSStore from 'src/app/store/hlsStore';

/**
 * Watches HLS store activeLayers and manages corresponding OpenLayers ImageStatic
 * layers on window.mapInstance. Thumbnails are rendered as georeferenced overlays
 * at each item's STAC bbox.
 */
export const useHLSLayers = () => {
  const { activeLayers } = useHLSStore();
  // Map from config.id -> OL layer instance
  const olLayersRef = useRef({});

  useEffect(() => {
    const map = window.mapInstance;
    if (!map) return;

    const activeIds = new Set(activeLayers.map((l) => l.id));

    // Remove stale layers that are no longer in the store
    Object.entries(olLayersRef.current).forEach(([id, layer]) => {
      if (!activeIds.has(id)) {
        map.removeLayer(layer);
        delete olLayersRef.current[id];
      }
    });

    // Add new or sync existing layers
    activeLayers.forEach((config) => {
      const existing = olLayersRef.current[config.id];

      if (existing) {
        // Sync visibility and opacity in place
        existing.setVisible(config.visible !== false);
        existing.setOpacity(config.opacity ?? 0.85);
        return;
      }

      // Need a bbox and a thumbnail URL to create a georeferenced layer
      if (!config.bbox || !config.thumbnailUrl) return;

      try {
        const extent = transformExtent(
          config.bbox,   // [west, south, east, north] in EPSG:4326
          'EPSG:4326',
          'EPSG:3857'
        );

        const layer = new ImageLayer({
          source: new ImageStatic({
            url: config.thumbnailUrl,
            imageExtent: extent,
            projection: 'EPSG:3857',
            crossOrigin: 'anonymous',
          }),
          opacity: config.opacity ?? 0.85,
          zIndex: 500,
          properties: {
            hlsId: config.id,
            attribution: 'NASA LP DAAC / HLS L30',
          },
        });

        layer.setVisible(config.visible !== false);
        map.addLayer(layer);

        // Zoom the view to the image footprint
        map
          .getView()
          .fit(extent, { padding: [80, 80, 80, 80], duration: 1000, maxZoom: 12 });

        olLayersRef.current[config.id] = layer;
      } catch (err) {
        console.error('[useHLSLayers] Failed to add layer:', config.id, err);
      }
    });
  }, [activeLayers]);

  // Remove all layers when the hook unmounts
  useEffect(() => {
    return () => {
      const map = window.mapInstance;
      if (!map) return;
      Object.values(olLayersRef.current).forEach((layer) =>
        map.removeLayer(layer)
      );
      olLayersRef.current = {};
    };
  }, []);
};
