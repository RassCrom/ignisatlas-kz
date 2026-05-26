import { useEffect, useRef, useState, useCallback } from 'react';
import useSettlementsStore from 'src/app/store/settlementsStore';
import { useMapStyleStore } from 'src/app/store/mapStyleStore';
import {
  createPopup,
  removeSourceWithLayers,
  setLayerOpacity,
  setLayerVisibility,
} from '../utils/maplibreHelpers';

export const useSettlementsLayer = (mapInstance, isMapInitialized) => {
  const styleVersion = useMapStyleStore((s) => s.styleVersion);
  const popupRef = useRef(null);
  const popupInstanceRef = useRef(null);
  const [popupContent, setPopupContent] = useState(null);
  const visible = useSettlementsStore((state) => state.visible);
  const opacity = useSettlementsStore((state) => state.opacity);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    if (!mapInstance.getSource('settlements-source')) {
      mapInstance.addSource('settlements-source', {
        type: 'geojson',
        data: '/layers/nas_punkti_5000.geojson',
      });
    }
    if (!mapInstance.getLayer('settlements-layer')) {
      mapInstance.addLayer({
        id: 'settlements-layer',
        type: 'circle',
        source: 'settlements-source',
        layout: { visibility: 'none' },
        paint: {
          'circle-color': ['case', ['==', ['get', 'fclass'], 'national_capital'], '#facc15', '#111827'],
          'circle-radius': ['match', ['get', 'fclass'], 'national_capital', 8, 'city', 5.5, 'town', 4.5, 'village', 3.5, 2.5],
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 1.2,
          'circle-opacity': 1,
        },
      });
    }
    return () => removeSourceWithLayers(mapInstance, 'settlements-source');
  }, [isMapInitialized, mapInstance, styleVersion]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    setLayerVisibility(mapInstance, 'settlements-layer', visible);
  }, [isMapInitialized, mapInstance, visible]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    setLayerOpacity(mapInstance, 'settlements-layer', opacity, 'circle');
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
      const feature = mapInstance.queryRenderedFeatures(event.point, { layers: ['settlements-layer'] })[0];
      if (!feature) {
        closePopup();
        return;
      }
      setPopupContent({
        name: feature.properties?.name,
        population: feature.properties?.population,
        fclass: feature.properties?.fclass,
      });
      popupInstanceRef.current?.setLngLat(event.lngLat).addTo(mapInstance);
    };
    const handleMove = (event) => {
      mapInstance.getCanvas().style.cursor =
        mapInstance.queryRenderedFeatures(event.point, { layers: ['settlements-layer'] }).length ? 'pointer' : '';
    };
    mapInstance.on('click', handleClick);
    mapInstance.on('mousemove', handleMove);
    return () => {
      mapInstance.off('click', handleClick);
      mapInstance.off('mousemove', handleMove);
    };
  }, [closePopup, isMapInitialized, mapInstance]);

  return { popupRef, popupContent, closePopup };
};
