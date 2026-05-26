import { useEffect, useMemo, useRef } from 'react';
import useHistoricalWildfireStore from 'src/app/store/historicalWildfireStore';
import {
  buildHistoricalWildfireFeatureCollection,
  getHistoricalWildfireCase,
} from 'src/utils/historicalWildfireCases';
import {
  addOrUpdateGeoJsonSource,
  removeSourceWithLayers,
  setLayerVisibility,
} from '../utils/maplibreHelpers';

const SOURCE_ID = 'historical-wildfire-source';
const FILL_LAYER_ID = 'historical-wildfire-fill';
const OUTLINE_LAYER_ID = 'historical-wildfire-outline';
const CENTER_LAYER_ID = 'historical-wildfire-center';

const fitCaseBounds = (map, wildfireCase) => {
  if (!map || !wildfireCase?.bbox) return;

  const canvas = map.getCanvas?.();
  const compact = (canvas?.clientWidth || 0) < 900;
  const padding = compact
    ? { top: 72, right: 48, bottom: 72, left: 72 }
    : { top: 96, right: 420, bottom: 84, left: 420 };

  map.fitBounds(
    [
      [wildfireCase.bbox[0], wildfireCase.bbox[1]],
      [wildfireCase.bbox[2], wildfireCase.bbox[3]],
    ],
    {
      padding,
      duration: 700,
      maxZoom: 9,
    }
  );
};

export const useHistoricalWildfireLayer = (mapInstance, isMapInitialized) => {
  const selectedCaseId = useHistoricalWildfireStore((state) => state.selectedCaseId);
  const layerVisible = useHistoricalWildfireStore((state) => state.layerVisible);
  const lastFocusedCaseIdRef = useRef(null);

  const selectedCase = useMemo(
    () => getHistoricalWildfireCase(selectedCaseId),
    [selectedCaseId]
  );

  const featureCollection = useMemo(
    () => buildHistoricalWildfireFeatureCollection(selectedCase),
    [selectedCase]
  );

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;

    addOrUpdateGeoJsonSource(mapInstance, SOURCE_ID, featureCollection);

    if (!mapInstance.getLayer(FILL_LAYER_ID)) {
      mapInstance.addLayer({
        id: FILL_LAYER_ID,
        type: 'fill',
        source: SOURCE_ID,
        filter: ['==', ['geometry-type'], 'Polygon'],
        layout: { visibility: 'none' },
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.28,
        },
      });
    }

    if (!mapInstance.getLayer(OUTLINE_LAYER_ID)) {
      mapInstance.addLayer({
        id: OUTLINE_LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        filter: ['==', ['geometry-type'], 'Polygon'],
        layout: { visibility: 'none' },
        paint: {
          'line-color': ['get', 'color'],
          'line-opacity': 0.95,
          'line-width': 2.2,
          'line-dasharray': [2, 1],
        },
      });
    }

    if (!mapInstance.getLayer(CENTER_LAYER_ID)) {
      mapInstance.addLayer({
        id: CENTER_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['==', ['geometry-type'], 'Point'],
        layout: { visibility: 'none' },
        paint: {
          'circle-radius': 6,
          'circle-color': ['get', 'color'],
          'circle-stroke-color': '#fff7ed',
          'circle-stroke-width': 2,
          'circle-opacity': 0.95,
        },
      });
    }

    return () => removeSourceWithLayers(mapInstance, SOURCE_ID);
  }, [featureCollection, isMapInitialized, mapInstance]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized || !mapInstance.getSource(SOURCE_ID)) return;
    mapInstance.getSource(SOURCE_ID)?.setData(featureCollection);
  }, [featureCollection, isMapInitialized, mapInstance]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    const visible = Boolean(selectedCase && layerVisible);
    setLayerVisibility(mapInstance, FILL_LAYER_ID, visible);
    setLayerVisibility(mapInstance, OUTLINE_LAYER_ID, visible);
    setLayerVisibility(mapInstance, CENTER_LAYER_ID, visible);
  }, [isMapInitialized, layerVisible, mapInstance, selectedCase]);

  useEffect(() => {
    if (!selectedCase) {
      lastFocusedCaseIdRef.current = null;
      return;
    }
    if (!mapInstance || !isMapInitialized) return;
    if (lastFocusedCaseIdRef.current === selectedCase.id) return;

    lastFocusedCaseIdRef.current = selectedCase.id;
    fitCaseBounds(mapInstance, selectedCase);
  }, [isMapInitialized, mapInstance, selectedCase]);
};

export { fitCaseBounds };
