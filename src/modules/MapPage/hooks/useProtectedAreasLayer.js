import { useEffect, useRef, useState, useCallback } from 'react';
import useProtectedAreasStore from 'src/app/store/protectedAreasStore';
import {
  createPopup,
  removeSourceWithLayers,
  setLayerOpacity,
  setLayerVisibility,
} from '../utils/maplibreHelpers';

export const useProtectedAreasLayer = (mapInstance, isMapInitialized) => {
  const popupRef = useRef(null);
  const popupInstanceRef = useRef(null);
  const [popupContent, setPopupContent] = useState(null);
  const visible = useProtectedAreasStore((s) => s.visible);
  const opacity = useProtectedAreasStore((s) => s.opacity);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    if (!mapInstance.getSource('protected-areas-source')) {
      mapInstance.addSource('protected-areas-source', {
        type: 'geojson',
        data: '/layers/protected_areas-w.geojson',
      });
    }
    if (!mapInstance.getLayer('protected-areas-fill')) {
      mapInstance.addLayer({
        id: 'protected-areas-fill',
        type: 'fill',
        source: 'protected-areas-source',
        layout: { visibility: 'none' },
        paint: {
          'fill-color': 'rgba(52,211,153,0.12)',
          'fill-opacity': 1,
        },
      });
      mapInstance.addLayer({
        id: 'protected-areas-line',
        type: 'line',
        source: 'protected-areas-source',
        layout: { visibility: 'none' },
        paint: {
          'line-color': 'rgba(52,211,153,0.65)',
          'line-width': 1.5,
          'line-dasharray': [2, 2],
          'line-opacity': 1,
        },
      });
    }
    return () => removeSourceWithLayers(mapInstance, 'protected-areas-source');
  }, [isMapInitialized, mapInstance]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    setLayerVisibility(mapInstance, 'protected-areas-fill', visible);
    setLayerVisibility(mapInstance, 'protected-areas-line', visible);
  }, [isMapInitialized, mapInstance, visible]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    setLayerOpacity(mapInstance, 'protected-areas-fill', opacity, 'fill');
    setLayerOpacity(mapInstance, 'protected-areas-line', opacity, 'line');
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
      const feature = mapInstance.queryRenderedFeatures(event.point, { layers: ['protected-areas-fill'] })[0];
      if (!feature) {
        closePopup();
        return;
      }
      const p = feature.properties || {};
      setPopupContent({
        name: p.NAME,
        nameEng: p.NAME_ENG,
        desig: p.DESIG_ENG,
        iucnCat: p.IUCN_CAT,
        statusYr: p.STATUS_YR,
        repArea: p.REP_AREA,
        mangAuth: p.MANG_AUTH,
      });
      popupInstanceRef.current?.setLngLat(event.lngLat).addTo(mapInstance);
    };
    mapInstance.on('click', handleClick);
    return () => mapInstance.off('click', handleClick);
  }, [closePopup, isMapInitialized, mapInstance]);

  return { popupRef, popupContent, closePopup };
};
