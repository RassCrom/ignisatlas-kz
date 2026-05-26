import { useEffect, useMemo, useRef } from 'react';
import useAnalysisStore from 'src/app/store/analysisStore';
import useAdminBoundaryStore from 'src/app/store/adminBoundaryStore';
import { useLayersStore } from 'src/app/store/layersStore';
import { useMapStyleStore } from 'src/app/store/mapStyleStore';
import {
  addOrUpdateGeoJsonSource,
  removeSourceWithLayers,
  setLayerOpacity,
  setLayerVisibility,
} from '../utils/maplibreHelpers';

const addGeoJsonUrl = (map, sourceId, url) => {
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: 'geojson',
      data: url,
    });
  }
};

const addLineLayer = (map, id, source, paint, visible = false) => {
  if (map.getLayer(id)) return;
  map.addLayer({
    id,
    type: 'line',
    source,
    layout: { visibility: visible ? 'visible' : 'none' },
    paint,
  });
};

const addFillLayer = (map, id, source, paint, visible = false) => {
  if (map.getLayer(id)) return;
  map.addLayer({
    id,
    type: 'fill',
    source,
    layout: { visibility: visible ? 'visible' : 'none' },
    paint,
  });
};

const addCircleLayer = (map, id, source, paint, visible = false) => {
  if (map.getLayer(id)) return;
  map.addLayer({
    id,
    type: 'circle',
    source,
    layout: { visibility: visible ? 'visible' : 'none' },
    paint,
  });
};

const emergencyColors = {
  ava_ss: '#38bdf8',
  fire_departments: '#f97316',
  fire_hydrants: '#60a5fa',
  hospitals: '#ef4444',
  kaz_avia: '#c4b5fd',
  oso: '#facc15',
  ps: '#22c55e',
  fire_trains: '#fb7185',
};

export const useAnalysisLayers = (mapInstance, isMapInitialized) => {
  const drawnPolygons = useAnalysisStore((s) => s.drawnPolygons);
  const adminVis = useAdminBoundaryStore((s) => s.layerVisibility);
  const adminOpacity = useAdminBoundaryStore((s) => s.layerOpacity);
  const emergencyLayers = useLayersStore((s) => s.layers);
  const styleVersion = useMapStyleStore((s) => s.styleVersion);
  const emergencyLayerConfigsRef = useRef(useLayersStore.getState().layers);
  const emergencySourceIds = useMemo(
    () => emergencyLayerConfigsRef.current.map((layer) => `${layer.id}-source`),
    []
  );

  const analysisFeatureCollection = useMemo(() => ({
    type: 'FeatureCollection',
    features: drawnPolygons
      .filter((polygon) => polygon.visible)
      .map((polygon) => ({
        type: 'Feature',
        id: polygon.id,
        geometry: polygon.geojson,
        properties: { id: polygon.id, name: polygon.name },
      })),
  }), [drawnPolygons]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;

    addGeoJsonUrl(mapInstance, 'blanket-source', '/layers/blanket.geojson');
    addFillLayer(mapInstance, 'blanket-layer', 'blanket-source', {
      'fill-color': 'rgba(13, 14, 14, 0.95)',
      'fill-opacity': 1,
    }, true);

    const boundaryIds = [
      ['country_boundaries', '1'],
      ['region_boundaries', '2'],
      ['district_boundaries', '3'],
    ];

    boundaryIds.forEach(([id, level]) => {
      addGeoJsonUrl(mapInstance, `${id}-source`, `/layers/KAZ_OSM_BORDER_LVL${level}.geojson`);
      addLineLayer(mapInstance, id, `${id}-source`, {
        'line-color': '#4999E8',
        'line-width': 1,
        'line-opacity': 1,
      });
    });

    emergencyLayerConfigsRef.current.forEach((cfg) => {
      addGeoJsonUrl(mapInstance, `${cfg.id}-source`, `/layers/kchs/${cfg.geojsonFile}`);
      addCircleLayer(mapInstance, cfg.id, `${cfg.id}-source`, {
        'circle-color': emergencyColors[cfg.id] || '#f8fafc',
        'circle-radius': 5,
        'circle-stroke-color': '#fff',
        'circle-stroke-width': 1,
        'circle-opacity': 1,
      });
    });

    addOrUpdateGeoJsonSource(mapInstance, 'analysis-polygons-source', {
      type: 'FeatureCollection',
      features: [],
    });
    addFillLayer(mapInstance, 'analysis-polygons-fill', 'analysis-polygons-source', {
      'fill-color': 'rgba(136, 139, 224, 0.15)',
      'fill-opacity': 1,
    }, true);
    addLineLayer(mapInstance, 'analysis-polygons-line', 'analysis-polygons-source', {
      'line-color': 'rgba(136, 139, 224, 0.7)',
      'line-width': 2,
    }, true);

    return () => {
      [
        'blanket-source',
        'country_boundaries-source',
        'region_boundaries-source',
        'district_boundaries-source',
        'analysis-polygons-source',
        ...emergencySourceIds,
      ].forEach((sourceId) => removeSourceWithLayers(mapInstance, sourceId));
    };
  }, [emergencySourceIds, mapInstance, isMapInitialized, styleVersion]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    addOrUpdateGeoJsonSource(mapInstance, 'analysis-polygons-source', analysisFeatureCollection);
  }, [analysisFeatureCollection, isMapInitialized, mapInstance]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    Object.entries(adminVis).forEach(([id, visible]) => setLayerVisibility(mapInstance, id, visible));
  }, [adminVis, isMapInitialized, mapInstance]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    Object.entries(adminOpacity).forEach(([id, opacity]) => setLayerOpacity(mapInstance, id, opacity, 'line'));
  }, [adminOpacity, isMapInitialized, mapInstance]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    emergencyLayers.forEach((layer) => setLayerVisibility(mapInstance, layer.id, layer.visible));
  }, [emergencyLayers, isMapInitialized, mapInstance]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    emergencyLayers.forEach((layer) => {
      setLayerOpacity(mapInstance, layer.id, layer.opacity ?? 1, 'circle');
    });
  }, [emergencyLayers, isMapInitialized, mapInstance]);
};
