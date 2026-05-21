import { useEffect, useMemo } from 'react';
import useSentinelExplorerStore from 'src/app/store/sentinelExplorerStore';
import {
  addOrUpdateGeoJsonSource,
  removeSourceWithLayers,
} from '../utils/maplibreHelpers';

export const useFootprintPreview = (mapInstance, isMapInitialized) => {
  const hoveredFootprint = useSentinelExplorerStore((s) => s.hoveredFootprint);

  const data = useMemo(() => ({
    type: 'FeatureCollection',
    features: hoveredFootprint
      ? [{ type: 'Feature', geometry: hoveredFootprint, properties: {} }]
      : [],
  }), [hoveredFootprint]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    addOrUpdateGeoJsonSource(mapInstance, 'footprint-preview-source', data);
    if (!mapInstance.getLayer('footprint-preview-fill')) {
      mapInstance.addLayer({
        id: 'footprint-preview-fill',
        type: 'fill',
        source: 'footprint-preview-source',
        paint: {
          'fill-color': 'rgba(52, 211, 153, 0.08)',
          'fill-opacity': 1,
        },
      });
    }
    if (!mapInstance.getLayer('footprint-preview-line')) {
      mapInstance.addLayer({
        id: 'footprint-preview-line',
        type: 'line',
        source: 'footprint-preview-source',
        paint: {
          'line-color': 'rgba(52, 211, 153, 0.7)',
          'line-width': 2,
        },
      });
    }
    return () => removeSourceWithLayers(mapInstance, 'footprint-preview-source');
  }, [isMapInitialized, mapInstance]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    addOrUpdateGeoJsonSource(mapInstance, 'footprint-preview-source', data);
  }, [data, isMapInitialized, mapInstance]);
};
