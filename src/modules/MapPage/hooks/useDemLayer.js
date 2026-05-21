import { useEffect, useRef } from 'react';
import useDemStore from 'src/app/store/demStore';
import {
  removeSourceWithLayers,
  setLayerOpacity,
  setLayerVisibility,
} from '../utils/maplibreHelpers.js';

const SOURCE_ID = 'dem-pc-source';
const LAYER_ID = 'dem-pc-layer';

export const useDemLayer = (mapInstance, isMapInitialized) => {
  const urlRef = useRef(null);

  const isAdded = useDemStore((s) => s.isAdded);
  const tileUrl = useDemStore((s) => s.tileUrl);
  const visible = useDemStore((s) => s.visible);
  const opacity = useDemStore((s) => s.opacity);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;

    if (!isAdded || !tileUrl) {
      removeSourceWithLayers(mapInstance, SOURCE_ID);
      urlRef.current = null;
      return;
    }

    if (urlRef.current === tileUrl && mapInstance.getLayer(LAYER_ID)) {
      return;
    }

    removeSourceWithLayers(mapInstance, SOURCE_ID);
    mapInstance.addSource(SOURCE_ID, {
      type: 'raster',
      tiles: [tileUrl],
      tileSize: 256,
      maxzoom: 14,
    });
    mapInstance.addLayer({
      id: LAYER_ID,
      type: 'raster',
      source: SOURCE_ID,
      layout: { visibility: visible ? 'visible' : 'none' },
      paint: { 'raster-opacity': opacity },
    });
    urlRef.current = tileUrl;
  }, [mapInstance, isMapInitialized, isAdded, tileUrl, visible, opacity]);

  useEffect(() => {
    setLayerVisibility(mapInstance, LAYER_ID, visible);
  }, [mapInstance, visible]);

  useEffect(() => {
    setLayerOpacity(mapInstance, LAYER_ID, opacity, 'raster');
  }, [mapInstance, opacity]);
};
