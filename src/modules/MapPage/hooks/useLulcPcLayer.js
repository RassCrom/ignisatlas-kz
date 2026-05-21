import { useEffect, useRef } from 'react';
import useLulcPcStore from 'src/app/store/lulcPcStore';
import {
  removeSourceWithLayers,
  setLayerOpacity,
  setLayerVisibility,
} from '../utils/maplibreHelpers.js';

const SOURCE_ID = 'lulc-pc-source';
const LAYER_ID = 'lulc-pc-layer';

export const useLulcPcLayer = (mapInstance, isMapInitialized) => {
  const urlRef = useRef(null);

  const isAdded = useLulcPcStore((state) => state.isAdded);
  const tileUrl = useLulcPcStore((state) => state.tileUrl);
  const visible = useLulcPcStore((state) => state.visible);
  const opacity = useLulcPcStore((state) => state.opacity);

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
