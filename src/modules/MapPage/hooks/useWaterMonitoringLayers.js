import { useEffect, useMemo, useRef } from 'react';
import { toast } from 'react-toastify';
import useWaterMonitoringStore from 'src/app/store/waterMonitoringStore';
import { useMapStyleStore } from 'src/app/store/mapStyleStore';
import {
  removeMapLayer,
  removeMapSource,
  removeSourceWithLayers,
  setLayerOpacity,
  setLayerVisibility,
} from '../utils/maplibreHelpers';

const WATER_SOURCE_ID = 'water-bodies-source';
const WATER_FILL_ID = 'water-bodies-fill';
const WATER_LINE_ID = 'water-bodies-line';
const WATER_HIGHLIGHT_ID = 'water-bodies-highlight';
const SATELLITE_LAYER_PREFIX = 'water-monitoring-';
const EMPTY_TEXT = '';

const getFeatureId = (feature) => {
  const props = feature?.properties || {};
  return props.osm_id || props.id || props.ID || props.name || props.fclass || null;
};

const textContainsFilter = (term, fields) => {
  const normalized = String(term || '').trim().toLowerCase();
  if (!normalized) return null;
  return [
    'in',
    normalized,
    [
      'downcase',
      [
        'to-string',
        ['coalesce', ...fields.map((field) => ['get', field]), EMPTY_TEXT],
      ],
    ],
  ];
};

const areaValueExpression = [
  'to-number',
  ['coalesce',
    ['get', 'area_km2'],
    ['get', 'area'],
    ['get', 'AREA_KM2'],
    ['get', 'Area_km2'],
    ['get', 'surface_area_km2'],
    ['get', 'water_area_km2'],
    0,
  ],
];

const buildWaterBodyFilter = (filters) => {
  const clauses = ['all'];
  if (filters.className && filters.className !== 'all') {
    clauses.push(['==', ['get', 'fclass'], filters.className]);
  }

  const minArea = Number(filters.minArea);
  if (Number.isFinite(minArea) && filters.minArea !== '') {
    clauses.push(['>=', areaValueExpression, minArea]);
  }

  const maxArea = Number(filters.maxArea);
  if (Number.isFinite(maxArea) && filters.maxArea !== '') {
    clauses.push(['<=', areaValueExpression, maxArea]);
  }

  const nameFilter = textContainsFilter(filters.name, ['name', 'Name', 'NAME', 'name_en', 'name_ru']);
  if (nameFilter) clauses.push(nameFilter);

  const regionFilter = textContainsFilter(filters.region, ['regions', 'region', 'oblast', 'OBLAST', 'adm1_name']);
  if (regionFilter) clauses.push(regionFilter);

  const districtFilter = textContainsFilter(filters.district, ['districts', 'district', 'rayon', 'RAYON', 'adm2_name']);
  if (districtFilter) clauses.push(districtFilter);

  return clauses.length === 1 ? null : clauses;
};

export const useWaterMonitoringLayers = (mapInstance, isMapInitialized) => {
  const styleVersion = useMapStyleStore((s) => s.styleVersion);
  const visible = useWaterMonitoringStore((state) => state.visible);
  const opacity = useWaterMonitoringStore((state) => state.opacity);
  const selectedWaterBody = useWaterMonitoringStore((state) => state.selectedWaterBody);
  const setSelectedWaterBody = useWaterMonitoringStore((state) => state.setSelectedWaterBody);
  const activeLayers = useWaterMonitoringStore((state) => state.activeLayers);
  const waterBodyFilters = useWaterMonitoringStore((state) => state.waterBodyFilters);

  const selectedName = selectedWaterBody?.properties?.name || '';
  const waterBodyFilter = useMemo(
    () => buildWaterBodyFilter(waterBodyFilters),
    [waterBodyFilters]
  );

  const selectedFilter = useMemo(
    () => (selectedName
      ? ['all', ...(waterBodyFilter ? [waterBodyFilter] : []), ['==', ['get', 'name'], selectedName]]
      : ['==', ['get', 'name'], '__none__']),
    [selectedName, waterBodyFilter]
  );

  // Show a transient "zoom in" hint the moment the layer is turned on
  const prevVisibleRef = useRef(visible);
  useEffect(() => {
    const wasVisible = prevVisibleRef.current;
    prevVisibleRef.current = visible;
    if (visible && !wasVisible) {
      toast.info('Zoom in to see individual water bodies', {
        position: 'bottom-center',
        autoClose: 4000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        theme: 'dark',
        toastId: 'water-zoom-hint',   // prevent duplicates on rapid toggles
      });
    }
  }, [visible]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;

    if (!mapInstance.getSource(WATER_SOURCE_ID)) {
      mapInstance.addSource(WATER_SOURCE_ID, {
        type: 'vector',
        url: 'pmtiles:///layers/water_bodies.pmtiles',
      });
    }

    if (!mapInstance.getLayer(WATER_FILL_ID)) {
      mapInstance.addLayer({
        id: WATER_FILL_ID,
        type: 'fill',
        source: WATER_SOURCE_ID,
        'source-layer': 'water_bodies',
        layout: { visibility: 'none' },
        paint: {
          'fill-color': [
            'match',
            ['get', 'fclass'],
            'reservoir', '#38bdf8',
            'water', '#2563eb',
            'riverbank', '#0ea5e9',
            '#3b82f6',
          ],
          'fill-opacity': 0.34,
        },
      });
      mapInstance.addLayer({
        id: WATER_LINE_ID,
        type: 'line',
        source: WATER_SOURCE_ID,
        'source-layer': 'water_bodies',
        layout: { visibility: 'none' },
        paint: {
          'line-color': '#7dd3fc',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4, 0.3,
            8, 0.9,
            12, 1.5,
          ],
          'line-opacity': 0.82,
        },
      });
      mapInstance.addLayer({
        id: WATER_HIGHLIGHT_ID,
        type: 'line',
        source: WATER_SOURCE_ID,
        'source-layer': 'water_bodies',
        filter: ['==', ['get', 'name'], '__none__'],
        layout: { visibility: 'none' },
        paint: {
          'line-color': '#facc15',
          'line-width': 2.5,
          'line-opacity': 0.95,
        },
      });
    }

    return () => removeSourceWithLayers(mapInstance, WATER_SOURCE_ID);
  }, [isMapInitialized, mapInstance, styleVersion]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    setLayerVisibility(mapInstance, WATER_FILL_ID, visible);
    setLayerVisibility(mapInstance, WATER_LINE_ID, visible);
    setLayerVisibility(mapInstance, WATER_HIGHLIGHT_ID, visible && !!selectedName);
  }, [isMapInitialized, mapInstance, selectedName, visible]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    setLayerOpacity(mapInstance, WATER_FILL_ID, opacity, 'fill');
    setLayerOpacity(mapInstance, WATER_LINE_ID, opacity, 'line');
  }, [isMapInitialized, mapInstance, opacity]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized || !mapInstance.getLayer(WATER_HIGHLIGHT_ID)) return;
    if (mapInstance.getLayer(WATER_FILL_ID)) mapInstance.setFilter(WATER_FILL_ID, waterBodyFilter);
    if (mapInstance.getLayer(WATER_LINE_ID)) mapInstance.setFilter(WATER_LINE_ID, waterBodyFilter);
    mapInstance.setFilter(WATER_HIGHLIGHT_ID, selectedFilter);
  }, [isMapInitialized, mapInstance, selectedFilter, waterBodyFilter]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;

    const handleClick = (event) => {
      const feature = mapInstance.queryRenderedFeatures(event.point, { layers: [WATER_FILL_ID] })[0];
      if (!feature) return;
      setSelectedWaterBody({
        id: getFeatureId(feature) || feature.id,
        properties: feature.properties || {},
        lngLat: [event.lngLat.lng, event.lngLat.lat],
      });
    };

    const handleMove = (event) => {
      mapInstance.getCanvas().style.cursor =
        visible && mapInstance.queryRenderedFeatures(event.point, { layers: [WATER_FILL_ID] }).length
          ? 'pointer'
          : '';
    };

    mapInstance.on('click', handleClick);
    mapInstance.on('mousemove', handleMove);
    return () => {
      mapInstance.off('click', handleClick);
      mapInstance.off('mousemove', handleMove);
    };
  }, [isMapInitialized, mapInstance, setSelectedWaterBody, visible]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;

    const renderableLayers = activeLayers.filter((layer) => layer.tileUrl);
    const activeLayerIds = new Set(renderableLayers.map((layer) => layer.layerId || layer.id));
    const styleLayers = mapInstance.getStyle()?.layers || [];

    styleLayers
      .filter((layer) => layer.id.startsWith(SATELLITE_LAYER_PREFIX) && !activeLayerIds.has(layer.id))
      .forEach((layer) => {
        removeMapLayer(mapInstance, layer.id);
        removeMapSource(mapInstance, `${layer.id}-source`);
      });

    renderableLayers.forEach((layer) => {
      const layerId = layer.layerId || layer.id;
      const sourceId = layer.sourceId || `${layerId}-source`;

      if (!mapInstance.getSource(sourceId)) {
        mapInstance.addSource(sourceId, {
          type: 'raster',
          tiles: [layer.tileUrl],
          tileSize: 256,
          maxzoom: 18,
          attribution: 'Microsoft Planetary Computer',
        });
      }

      if (!mapInstance.getLayer(layerId)) {
        mapInstance.addLayer({
          id: layerId,
          type: 'raster',
          source: sourceId,
          layout: { visibility: layer.visible ? 'visible' : 'none' },
          paint: {
            'raster-opacity': (layer.opacity ?? 82) / 100,
            'raster-fade-duration': 120,
          },
        });
      }

      setLayerVisibility(mapInstance, layerId, layer.visible);
      setLayerOpacity(mapInstance, layerId, (layer.opacity ?? 82) / 100, 'raster');
    });
  }, [activeLayers, isMapInitialized, mapInstance]);

  useEffect(() => {
    if (!mapInstance) return undefined;
    return () => {
      const styleLayers = mapInstance.getStyle()?.layers || [];
      styleLayers
        .filter((layer) => layer.id.startsWith(SATELLITE_LAYER_PREFIX))
        .forEach((layer) => {
          removeMapLayer(mapInstance, layer.id);
          removeMapSource(mapInstance, `${layer.id}-source`);
        });
    };
  }, [mapInstance]);
};
