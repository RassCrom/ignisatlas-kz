import { useEffect } from 'react';
import useLulcStore from 'src/app/store/lulcStore';
import {
  removeSourceWithLayers,
  setLayerOpacity,
  setLayerVisibility,
} from '../utils/maplibreHelpers.js';

const SOURCE_ID = 'lulc-source';
const LAYER_ID = 'lulc-layer';
const LULC_TILE_URL =
  'https://ic.imagery1.arcgis.com/arcgis/rest/services/Sentinel2_10m_LandCover/ImageServer/tile/{z}/{y}/{x}';

export const useLulcLayer = (mapInstance, isMapInitialized) => {
  const isAdded = useLulcStore((state) => state.isAdded);
  const visible = useLulcStore((state) => state.visible);
  const opacity = useLulcStore((state) => state.opacity);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;

    if (!isAdded) {
      removeSourceWithLayers(mapInstance, SOURCE_ID);
      return;
    }

    if (!mapInstance.getSource(SOURCE_ID)) {
      mapInstance.addSource(SOURCE_ID, {
        type: 'raster',
        tiles: [LULC_TILE_URL],
        tileSize: 256,
      });
    }

    if (!mapInstance.getLayer(LAYER_ID)) {
      mapInstance.addLayer({
        id: LAYER_ID,
        type: 'raster',
        source: SOURCE_ID,
        layout: { visibility: visible ? 'visible' : 'none' },
        paint: { 'raster-opacity': opacity },
      });
    }
  }, [mapInstance, isMapInitialized, isAdded, visible, opacity]);

  useEffect(() => {
    setLayerVisibility(mapInstance, LAYER_ID, visible);
  }, [mapInstance, visible]);

  useEffect(() => {
    setLayerOpacity(mapInstance, LAYER_ID, opacity, 'raster');
  }, [mapInstance, opacity]);
};
