import { useEffect, useMemo } from 'react';
import useGlacierMonitoringStore from 'src/app/store/glacierMonitoringStore';
import {
  removeMapLayer,
  removeMapSource,
  removeSourceWithLayers,
  setLayerOpacity,
  setLayerVisibility,
} from '../utils/maplibreHelpers';

const GLACIER_SOURCE_ID = 'glacier-inventory-source';
const GLACIER_FILL_ID = 'glacier-inventory-fill';
const GLACIER_LINE_ID = 'glacier-inventory-line';
const GLACIER_HIGHLIGHT_ID = 'glacier-inventory-highlight';
const SATELLITE_LAYER_PREFIX = 'glacier-monitoring-';
const EMPTY_TEXT = '';

const getFeatureId = (feature) => {
  const props = feature?.properties || {};
  return props.osm_id || props.id || props.ID || props.name || feature?.id || null;
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

const buildGlacierFilter = (filters) => {
  const clauses = ['all'];
  if (filters.className && filters.className !== 'all') {
    clauses.push(['==', ['get', 'fclass'], filters.className]);
  }

  const nameFilter = textContainsFilter(filters.name, ['name', 'Name', 'NAME']);
  if (nameFilter) clauses.push(nameFilter);

  const osmFilter = textContainsFilter(filters.osmId, ['osm_id', 'id', 'ID']);
  if (osmFilter) clauses.push(osmFilter);

  return clauses.length === 1 ? null : clauses;
};

export const useGlacierMonitoringLayers = (mapInstance, isMapInitialized) => {
  const visible = useGlacierMonitoringStore((state) => state.visible);
  const opacity = useGlacierMonitoringStore((state) => state.opacity);
  const selectedGlacier = useGlacierMonitoringStore((state) => state.selectedGlacier);
  const setSelectedGlacier = useGlacierMonitoringStore((state) => state.setSelectedGlacier);
  const activeLayers = useGlacierMonitoringStore((state) => state.activeLayers);
  const glacierFilters = useGlacierMonitoringStore((state) => state.glacierFilters);

  const selectedId = String(selectedGlacier?.properties?.osm_id || selectedGlacier?.id || '');
  const glacierFilter = useMemo(
    () => buildGlacierFilter(glacierFilters),
    [glacierFilters]
  );

  const selectedFilter = useMemo(
    () => (selectedId
      ? ['all', ...(glacierFilter ? [glacierFilter] : []), ['==', ['to-string', ['get', 'osm_id']], selectedId]]
      : ['==', ['get', 'osm_id'], '__none__']),
    [glacierFilter, selectedId]
  );

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;

    if (!mapInstance.getSource(GLACIER_SOURCE_ID)) {
      mapInstance.addSource(GLACIER_SOURCE_ID, {
        type: 'geojson',
        data: '/layers/glaciers.geojson',
        generateId: true,
      });
    }

    if (!mapInstance.getLayer(GLACIER_FILL_ID)) {
      mapInstance.addLayer({
        id: GLACIER_FILL_ID,
        type: 'fill',
        source: GLACIER_SOURCE_ID,
        layout: { visibility: 'none' },
        paint: {
          'fill-color': [
            'case',
            ['has', 'name'],
            '#93c5fd',
            '#bae6fd',
          ],
          'fill-opacity': 0.38,
        },
      });
      mapInstance.addLayer({
        id: GLACIER_LINE_ID,
        type: 'line',
        source: GLACIER_SOURCE_ID,
        layout: { visibility: 'none' },
        paint: {
          'line-color': '#e0f2fe',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4, 0.4,
            8, 1,
            12, 1.7,
          ],
          'line-opacity': 0.84,
        },
      });
      mapInstance.addLayer({
        id: GLACIER_HIGHLIGHT_ID,
        type: 'line',
        source: GLACIER_SOURCE_ID,
        filter: ['==', ['get', 'osm_id'], '__none__'],
        layout: { visibility: 'none' },
        paint: {
          'line-color': '#facc15',
          'line-width': 2.6,
          'line-opacity': 0.95,
        },
      });
    }

    return () => removeSourceWithLayers(mapInstance, GLACIER_SOURCE_ID);
  }, [isMapInitialized, mapInstance]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    setLayerVisibility(mapInstance, GLACIER_FILL_ID, visible);
    setLayerVisibility(mapInstance, GLACIER_LINE_ID, visible);
    setLayerVisibility(mapInstance, GLACIER_HIGHLIGHT_ID, visible && !!selectedId);
  }, [isMapInitialized, mapInstance, selectedId, visible]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    setLayerOpacity(mapInstance, GLACIER_FILL_ID, opacity, 'fill');
    setLayerOpacity(mapInstance, GLACIER_LINE_ID, opacity, 'line');
  }, [isMapInitialized, mapInstance, opacity]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized || !mapInstance.getLayer(GLACIER_HIGHLIGHT_ID)) return;
    if (mapInstance.getLayer(GLACIER_FILL_ID)) mapInstance.setFilter(GLACIER_FILL_ID, glacierFilter);
    if (mapInstance.getLayer(GLACIER_LINE_ID)) mapInstance.setFilter(GLACIER_LINE_ID, glacierFilter);
    mapInstance.setFilter(GLACIER_HIGHLIGHT_ID, selectedFilter);
  }, [glacierFilter, isMapInitialized, mapInstance, selectedFilter]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;

    const handleClick = (event) => {
      const feature = mapInstance.queryRenderedFeatures(event.point, { layers: [GLACIER_FILL_ID] })[0];
      if (!feature) return;
      setSelectedGlacier({
        id: getFeatureId(feature) || feature.id,
        properties: feature.properties || {},
        lngLat: [event.lngLat.lng, event.lngLat.lat],
      });
    };

    const handleMove = (event) => {
      mapInstance.getCanvas().style.cursor =
        visible && mapInstance.queryRenderedFeatures(event.point, { layers: [GLACIER_FILL_ID] }).length
          ? 'pointer'
          : '';
    };

    mapInstance.on('click', handleClick);
    mapInstance.on('mousemove', handleMove);
    return () => {
      mapInstance.off('click', handleClick);
      mapInstance.off('mousemove', handleMove);
    };
  }, [isMapInitialized, mapInstance, setSelectedGlacier, visible]);

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
            'raster-opacity': (layer.opacity ?? 84) / 100,
            'raster-fade-duration': 120,
          },
        });
      }

      setLayerVisibility(mapInstance, layerId, layer.visible);
      setLayerOpacity(mapInstance, layerId, (layer.opacity ?? 84) / 100, 'raster');
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
