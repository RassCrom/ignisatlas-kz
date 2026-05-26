import { useEffect, useMemo } from 'react';
import useWindStore from 'src/app/store/windStore';
import { buildWindFeatureCollection } from 'src/utils/windService';
import {
  addOrUpdateGeoJsonSource,
  removeSourceWithLayers,
  setLayerOpacity,
  setLayerVisibility,
} from '../utils/maplibreHelpers';

const SOURCE_ID = 'wind-current-source';
const VECTOR_LAYER_ID = 'wind-current-vectors';
const POINT_LAYER_ID = 'wind-current-points';
const LABEL_LAYER_ID = 'wind-current-labels';

export const useWindLayer = (mapInstance, isMapInitialized) => {
  const visible = useWindStore((state) => state.visible);
  const opacity = useWindStore((state) => state.opacity);
  const points = useWindStore((state) => state.points);
  const minSpeed = useWindStore((state) => state.minSpeed);
  const setSelectedPointId = useWindStore((state) => state.setSelectedPointId);

  const featureCollection = useMemo(
    () => buildWindFeatureCollection(points, { minSpeed }),
    [minSpeed, points]
  );

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;

    addOrUpdateGeoJsonSource(mapInstance, SOURCE_ID, {
      type: 'FeatureCollection',
      features: [],
    });

    if (!mapInstance.getLayer(VECTOR_LAYER_ID)) {
      mapInstance.addLayer({
        id: VECTOR_LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        filter: ['==', ['geometry-type'], 'LineString'],
        layout: {
          visibility: 'none',
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-opacity': 0.86,
          'line-width': ['get', 'width'],
        },
      });
    }

    if (!mapInstance.getLayer(POINT_LAYER_ID)) {
      mapInstance.addLayer({
        id: POINT_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['==', ['geometry-type'], 'Point'],
        layout: { visibility: 'none' },
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': ['get', 'radius'],
          'circle-opacity': 0.86,
          'circle-stroke-color': '#f8fafc',
          'circle-stroke-width': 1.2,
          'circle-stroke-opacity': 0.88,
        },
      });
    }

    if (!mapInstance.getLayer(LABEL_LAYER_ID)) {
      mapInstance.addLayer({
        id: LABEL_LAYER_ID,
        type: 'symbol',
        source: SOURCE_ID,
        filter: ['==', ['geometry-type'], 'Point'],
        layout: {
          visibility: 'none',
          'text-field': ['get', 'speedLabel'],
          'text-size': 11,
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': 'rgba(217, 218, 245, 0.88)',
          'text-halo-color': 'rgba(9, 10, 36, 0.92)',
          'text-halo-width': 1.2,
          'text-opacity': 0.86,
        },
      });
    }

    return () => removeSourceWithLayers(mapInstance, SOURCE_ID);
  }, [isMapInitialized, mapInstance]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized || !mapInstance.getSource(SOURCE_ID)) return;
    mapInstance.getSource(SOURCE_ID)?.setData(featureCollection);
  }, [featureCollection, isMapInitialized, mapInstance]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    const shouldShow = visible && points.length > 0;
    setLayerVisibility(mapInstance, VECTOR_LAYER_ID, shouldShow);
    setLayerVisibility(mapInstance, POINT_LAYER_ID, shouldShow);
    setLayerVisibility(mapInstance, LABEL_LAYER_ID, shouldShow);
  }, [isMapInitialized, mapInstance, points.length, visible]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    setLayerOpacity(mapInstance, VECTOR_LAYER_ID, opacity, 'line');
    setLayerOpacity(mapInstance, POINT_LAYER_ID, opacity, 'circle');
    if (mapInstance.getLayer(LABEL_LAYER_ID)) {
      mapInstance.setPaintProperty(LABEL_LAYER_ID, 'text-opacity', opacity);
    }
  }, [isMapInitialized, mapInstance, opacity]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;

    const handleClick = (event) => {
      const feature = mapInstance.queryRenderedFeatures(event.point, { layers: [POINT_LAYER_ID] })[0];
      if (feature?.properties?.id) {
        setSelectedPointId(feature.properties.id);
      }
    };

    const handleMove = (event) => {
      mapInstance.getCanvas().style.cursor =
        mapInstance.queryRenderedFeatures(event.point, { layers: [POINT_LAYER_ID] }).length ? 'pointer' : '';
    };

    mapInstance.on('click', handleClick);
    mapInstance.on('mousemove', handleMove);
    return () => {
      mapInstance.off('click', handleClick);
      mapInstance.off('mousemove', handleMove);
    };
  }, [isMapInitialized, mapInstance, setSelectedPointId]);
};
