import { useEffect, useRef, useState, useCallback } from 'react';
import useClimateZonesStore from 'src/app/store/climateZonesStore';
import { useMapStyleStore } from 'src/app/store/mapStyleStore';
import {
  createPopup,
  removeSourceWithLayers,
  setLayerOpacity,
  setLayerVisibility,
} from '../utils/maplibreHelpers';

export const useClimateZonesLayer = (mapInstance, isMapInitialized) => {
  const styleVersion = useMapStyleStore((s) => s.styleVersion);
  const popupRef = useRef(null);
  const popupInstanceRef = useRef(null);
  const [popupContent, setPopupContent] = useState(null);
  const visible = useClimateZonesStore((s) => s.visible);
  const opacity = useClimateZonesStore((s) => s.opacity);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    if (!mapInstance.getSource('climate-zones-source')) {
      mapInstance.addSource('climate-zones-source', {
        type: 'geojson',
        data: '/layers/climate_zones_kg1976-2000-w.geojson',
      });
    }
    if (!mapInstance.getLayer('climate-zones-layer')) {
      mapInstance.addLayer({
        id: 'climate-zones-layer',
        type: 'fill',
        source: 'climate-zones-source',
        layout: { visibility: 'none' },
        paint: {
          'fill-color': ['coalesce', ['get', 'color'], '#888888'],
          'fill-opacity': 0.35,
          'fill-outline-color': ['coalesce', ['get', 'color'], '#888888'],
        },
      });
    }
    return () => removeSourceWithLayers(mapInstance, 'climate-zones-source');
  }, [isMapInitialized, mapInstance, styleVersion]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    setLayerVisibility(mapInstance, 'climate-zones-layer', visible);
  }, [isMapInitialized, mapInstance, visible]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    setLayerOpacity(mapInstance, 'climate-zones-layer', opacity, 'fill');
  }, [isMapInitialized, mapInstance, opacity]);

  useEffect(() => {
    if (!mapInstance || !popupRef.current || popupInstanceRef.current) return;
    popupInstanceRef.current = createPopup().setDOMContent(popupRef.current);
    return () => {
      popupInstanceRef.current?.remove();
      popupInstanceRef.current = null;
    };
  }, [mapInstance]);

  const closePopup = useCallback(() => {
    popupInstanceRef.current?.remove();
    setPopupContent(null);
  }, []);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    const handleClick = (event) => {
      const feature = mapInstance.queryRenderedFeatures(event.point, { layers: ['climate-zones-layer'] })[0];
      if (!feature) {
        closePopup();
        return;
      }
      const props = feature.properties || {};
      setPopupContent({
        koppen: props.koppen,
        koppenDesc: props.koppen_desc,
        color: props.color,
      });
      popupInstanceRef.current?.setLngLat(event.lngLat).addTo(mapInstance);
    };
    mapInstance.on('click', handleClick);
    return () => mapInstance.off('click', handleClick);
  }, [closePopup, isMapInitialized, mapInstance]);

  return { popupRef, popupContent, closePopup };
};
