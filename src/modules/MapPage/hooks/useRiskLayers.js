import { useEffect, useRef } from 'react';
import TileLayer from 'ol/layer/Tile.js';
import XYZ from 'ol/source/XYZ.js';
import useRiskMapStore from 'src/app/store/riskMapStore';

export const useRiskLayers = (riskDates, mapInstance, isMapInitialized) => {
  // Map of id -> TileLayer for efficient per-layer updates
  const layerMapRef = useRef(new Map());
  const isVisible = useRiskMapStore((state) => state.isVisible);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;

    const currentIds = new Set(riskDates.map((item) => item.id));

    // Remove layers for deleted dates
    layerMapRef.current.forEach((layer, id) => {
      if (!currentIds.has(id)) {
        mapInstance.removeLayer(layer);
        layerMapRef.current.delete(id);
      }
    });

    // Add new layers or update existing ones
    riskDates.forEach((item) => {
      if (!layerMapRef.current.has(item.id)) {
        const layer = new TileLayer({
          source: new XYZ({
            url: `http://old.fires.kz/data/fire_haz/${item.date.replace(/-/g, ".")}/{z}/{x}/{-y}.png`
          }),
          visible: isVisible && item.isVisible,
          opacity: item.opacity
        });
        layer.set('layerType', 'fireRisk');
        mapInstance.addLayer(layer);
        layerMapRef.current.set(item.id, layer);
      } else {
        const layer = layerMapRef.current.get(item.id);
        layer.setVisible(isVisible && item.isVisible);
        layer.setOpacity(item.opacity);
      }
    });
  }, [riskDates, mapInstance, isMapInitialized, isVisible]);
};
