import { useEffect } from 'react';
import useFuelMoistureStore from 'src/app/store/fuelMoistureStore';
import {
  removeMapLayer,
  removeMapSource,
  setLayerOpacity,
  setLayerVisibility,
} from '../utils/maplibreHelpers';

const LAYER_PREFIX = 'fuel-moisture-';

export const useFuelMoistureLayers = (mapInstance, isMapInitialized) => {
  const activeLayers = useFuelMoistureStore((state) => state.activeLayers);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;

    const renderableLayers = activeLayers.filter((layer) => layer.tileUrl);
    const activeLayerIds = new Set(renderableLayers.map((layer) => layer.layerId || layer.id));
    const styleLayers = mapInstance.getStyle()?.layers || [];

    styleLayers
      .filter((layer) => layer.id.startsWith(LAYER_PREFIX) && !activeLayerIds.has(layer.id))
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
          attribution: 'ESA Sentinel-2 / Microsoft Planetary Computer',
        });
      }

      if (!mapInstance.getLayer(layerId)) {
        mapInstance.addLayer({
          id: layerId,
          type: 'raster',
          source: sourceId,
          layout: {
            visibility: layer.visible ? 'visible' : 'none',
          },
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
        .filter((layer) => layer.id.startsWith(LAYER_PREFIX))
        .forEach((layer) => {
          removeMapLayer(mapInstance, layer.id);
          removeMapSource(mapInstance, `${layer.id}-source`);
        });
    };
  }, [mapInstance]);
};
