import { bbox } from '@turf/turf';
import { useEffect, useMemo, useRef, useCallback } from 'react';
import useAoiStore from 'src/app/store/aoiStore';
import {
  addOrUpdateGeoJsonSource,
  removeSourceWithLayers,
  setLayerVisibility,
} from '../utils/maplibreHelpers';
import { startMapLibreDraw } from '../utils/maplibreDraw';

export const useAoiDraw = (mapInstance, isMapInitialized) => {
  const drawCleanupRef = useRef(null);
  const aoiDrawMode = useAoiStore((s) => s.aoiDrawMode);
  const aoiGeometry = useAoiStore((s) => s.aoiGeometry);
  const aoiVisible = useAoiStore((s) => s.aoiVisible);
  const setAoi = useAoiStore((s) => s.setAoi);
  const clearAoiStore = useAoiStore((s) => s.clearAoi);
  const setAoiDrawMode = useAoiStore((s) => s.setAoiDrawMode);

  const aoiData = useMemo(() => ({
    type: 'FeatureCollection',
    features: aoiGeometry ? [{ type: 'Feature', geometry: aoiGeometry, properties: {} }] : [],
  }), [aoiGeometry]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    addOrUpdateGeoJsonSource(mapInstance, 'aoi-source', aoiData);
    if (!mapInstance.getLayer('aoi-fill')) {
      mapInstance.addLayer({
        id: 'aoi-fill',
        type: 'fill',
        source: 'aoi-source',
        layout: { visibility: aoiVisible ? 'visible' : 'none' },
        paint: {
          'fill-color': 'rgba(136, 139, 224, 0.1)',
          'fill-opacity': 1,
        },
      });
    }
    if (!mapInstance.getLayer('aoi-line')) {
      mapInstance.addLayer({
        id: 'aoi-line',
        type: 'line',
        source: 'aoi-source',
        layout: { visibility: aoiVisible ? 'visible' : 'none' },
        paint: {
          'line-color': 'rgba(136, 139, 224, 0.8)',
          'line-width': 2,
          'line-dasharray': [2, 2],
        },
      });
    }
    return () => removeSourceWithLayers(mapInstance, 'aoi-source');
  }, [aoiData, aoiVisible, isMapInitialized, mapInstance]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    addOrUpdateGeoJsonSource(mapInstance, 'aoi-source', aoiData);
  }, [aoiData, isMapInitialized, mapInstance]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    setLayerVisibility(mapInstance, 'aoi-fill', aoiVisible);
    setLayerVisibility(mapInstance, 'aoi-line', aoiVisible);
  }, [aoiVisible, isMapInitialized, mapInstance]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    drawCleanupRef.current?.();
    drawCleanupRef.current = null;
    if (!aoiDrawMode) return;

    drawCleanupRef.current = startMapLibreDraw(mapInstance, {
      idPrefix: 'aoi-draw-preview',
      type: 'Polygon',
      onComplete: (feature) => {
        const roundedBbox = bbox(feature).map((value) => Math.round(value * 1000000) / 1000000);
        setAoi(feature.geometry, roundedBbox);
        setAoiDrawMode(null);
      },
      onCancel: () => setAoiDrawMode(null),
    });

    return () => {
      drawCleanupRef.current?.();
      drawCleanupRef.current = null;
    };
  }, [aoiDrawMode, isMapInitialized, mapInstance, setAoi, setAoiDrawMode]);

  const clearAoi = useCallback(() => {
    clearAoiStore();
  }, [clearAoiStore]);

  return { clearAoi };
};
