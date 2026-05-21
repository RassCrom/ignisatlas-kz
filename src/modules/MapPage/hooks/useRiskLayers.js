import { useEffect, useRef } from 'react';
import useRiskMapStore from 'src/app/store/riskMapStore';
import {
  removeSourceWithLayers,
  setLayerOpacity,
  setLayerVisibility,
} from '../utils/maplibreHelpers.js';

const sourceId = (id) => `fire-risk-source-${id}`;
const layerId = (id) => `fire-risk-layer-${id}`;

const FIRE_HAZARD_TILE_BASE = import.meta.env.VITE_FIRE_HAZARD_TILE_BASE
  || (import.meta.env.DEV ? '/fire-haz-tiles' : 'http://old.fires.kz/data/fire_haz');

const normalizeRiskDate = (value) => {
  const match = String(value ?? '').match(/^(\d{4})[-.](\d{1,2})[-.](\d{1,2})/);
  if (!match) return null;

  const [, year, month, day] = match;
  const normalized = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));

  if (
    parsed.getFullYear() !== Number(year)
    || parsed.getMonth() !== Number(month) - 1
    || parsed.getDate() !== Number(day)
  ) {
    return null;
  }

  return normalized;
};

export const useRiskLayers = (riskDates, mapInstance, isMapInitialized) => {
  const layerIdsRef = useRef(new Set());
  const isVisible = useRiskMapStore((state) => state.isVisible);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;

    const currentIds = new Set(riskDates.map((item) => String(item.id)));

    layerIdsRef.current.forEach((id) => {
      if (!currentIds.has(id)) {
        removeSourceWithLayers(mapInstance, sourceId(id));
        layerIdsRef.current.delete(id);
      }
    });

    riskDates.forEach((item) => {
      const id = String(item.id);
      const source = sourceId(id);
      const layer = layerId(id);
      const date = normalizeRiskDate(item.date);

      if (!date) {
        removeSourceWithLayers(mapInstance, source);
        layerIdsRef.current.delete(id);
        return;
      }

      const url = `${FIRE_HAZARD_TILE_BASE}/${date.replace(/-/g, '.')}/{z}/{x}/{y}.png`;

      if (!mapInstance.getSource(source)) {
        mapInstance.addSource(source, {
          type: 'raster',
          tiles: [url],
          tileSize: 256,
          scheme: 'tms',
        });
      }

      if (!mapInstance.getLayer(layer)) {
        mapInstance.addLayer({
          id: layer,
          type: 'raster',
          source,
          layout: { visibility: isVisible && item.isVisible ? 'visible' : 'none' },
          paint: { 'raster-opacity': item.opacity ?? 1 },
        });
        layerIdsRef.current.add(id);
      }

      setLayerVisibility(mapInstance, layer, isVisible && item.isVisible);
      setLayerOpacity(mapInstance, layer, item.opacity ?? 1, 'raster');
    });
  }, [riskDates, mapInstance, isMapInitialized, isVisible]);
};
