import { useEffect, useState } from 'react';
import { createSentinelLayer } from "src/utils/sentinelUtils.js";

export const useSentinelLayers = (sentinelType, activeLayersStore) => {
  // Handle different naming patterns for different sentinel types
  const getStoreKeys = (type) => {
    switch (type) {
      case 'sentinel2':
        return {
          visible: 'sentinelVisible',
          opacity: 'sentinelOpacity',
          activeLayers: 'activeLayers'
        };
      case 'sentinel3':
        return {
          visible: 'sentinel3Visible',
          opacity: 'sentinel3Opacity',
          activeLayers: 'activeLayers3'
        };
      case 'sentinel5':
        return {
          visible: 'sentinel5Visible',
          opacity: 'sentinel5Opacity',
          activeLayers: 'activeLayers5'
        };
      case 'sentinel1':
        return {
          visible: 'sentinel1Visible',
          opacity: 'sentinel1Opacity',
          activeLayers: 'activeLayers1'
        };
      default:
        return {
          visible: 'sentinelVisible',
          opacity: 'sentinelOpacity',
          activeLayers: 'activeLayers'
        };
    }
  };

  const keys = getStoreKeys(sentinelType);
  const visible = activeLayersStore[keys.visible];
  const opacity = activeLayersStore[keys.opacity];
  const activeLayers = activeLayersStore[keys.activeLayers] || [];

  const [layers, setLayers] = useState([]);

  // Add new layers
  useEffect(() => {
    const currentLayerIds = layers.map(layer => layer.get('id'));
    const newLayers = activeLayers.filter(layerConfig => 
      !currentLayerIds.includes(layerConfig.id)
    );

    newLayers.forEach(layerConfig => {
      const layer = createSentinelLayer(
        sentinelType,
        layerConfig.id,
        layerConfig.bands,
        layerConfig.startDate,
        layerConfig.endDate,
        layerConfig.opacity
      );

      if (layer && window.mapInstance) {
        window.mapInstance.addLayer(layer);
        setLayers(prev => [...prev, layer]);
      }
    });
  }, [activeLayers, sentinelType]);

  // Clear layers when activeLayers is empty
  useEffect(() => {
    if (activeLayers.length === 0 && layers.length > 0) {
      layers.forEach(layer => {
        if (window.mapInstance) {
          window.mapInstance.removeLayer(layer);
        }
      });
      setLayers([]);
    }
  }, [activeLayers.length, layers]);

  // Control visibility
  useEffect(() => {
    layers.forEach(layer => {
      layer.setVisible(visible);
    });
  }, [visible, layers]);

  // Control opacity
  useEffect(() => {
    layers.forEach(layer => {
      layer.setOpacity(opacity / 100);
    });
  }, [opacity, layers]);

  return layers;
};