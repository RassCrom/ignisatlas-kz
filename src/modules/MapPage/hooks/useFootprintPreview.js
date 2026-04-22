import { useEffect, useRef } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { Style, Stroke, Fill } from 'ol/style';
import useSentinelExplorerStore from 'src/app/store/sentinelExplorerStore';

const FOOTPRINT_STYLE = new Style({
  stroke: new Stroke({
    color: 'rgba(52, 211, 153, 0.7)',
    width: 2,
  }),
  fill: new Fill({
    color: 'rgba(52, 211, 153, 0.08)',
  }),
});

const geojsonFormat = new GeoJSON();

/**
 * Hook that shows a temporary footprint overlay on the map
 * when hovering over search result cards.
 */
export const useFootprintPreview = (mapInstance, isMapInitialized) => {
  const sourceRef = useRef(null);
  const layerRef = useRef(null);

  const hoveredFootprint = useSentinelExplorerStore((s) => s.hoveredFootprint);

  // Initialize the vector layer
  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;

    const source = new VectorSource();
    const layer = new VectorLayer({
      source,
      style: FOOTPRINT_STYLE,
      zIndex: 998,
    });
    layer.set('id', 'footprint-preview-layer');

    mapInstance.addLayer(layer);
    sourceRef.current = source;
    layerRef.current = layer;

    return () => {
      if (mapInstance) {
        mapInstance.removeLayer(layer);
      }
      sourceRef.current = null;
      layerRef.current = null;
    };
  }, [mapInstance, isMapInitialized]);

  // Update footprint when hoveredFootprint changes
  useEffect(() => {
    if (!sourceRef.current) return;

    sourceRef.current.clear();

    if (hoveredFootprint) {
      try {
        const features = geojsonFormat.readFeatures(
          { type: 'Feature', geometry: hoveredFootprint },
          { featureProjection: 'EPSG:3857', dataProjection: 'EPSG:4326' }
        );
        sourceRef.current.addFeatures(features);
      } catch (e) {
        console.warn('Failed to render footprint preview:', e);
      }
    }
  }, [hoveredFootprint]);
};
