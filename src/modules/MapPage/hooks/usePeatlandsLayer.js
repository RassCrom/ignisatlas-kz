import { useEffect, useRef, useState, useCallback } from 'react';
import usePeatlandsStore from 'src/app/store/peatlandsStore';
import {
  createPopup,
  removeSourceWithLayers,
  setLayerOpacity,
  setLayerVisibility,
} from '../utils/maplibreHelpers';

export const usePeatlandsLayer = (mapInstance, isMapInitialized) => {
  const popupRef = useRef(null);
  const popupInstanceRef = useRef(null);
  const [popupContent, setPopupContent] = useState(null);
  const visible = usePeatlandsStore((s) => s.visible);
  const opacity = usePeatlandsStore((s) => s.opacity);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    if (!mapInstance.getSource('peatlands-source')) {
      mapInstance.addSource('peatlands-source', {
        type: 'geojson',
        data: '/layers/peatlands-w.geojson',
      });
    }
    if (!mapInstance.getLayer('peatlands-fill')) {
      mapInstance.addLayer({
        id: 'peatlands-fill',
        type: 'fill',
        source: 'peatlands-source',
        layout: { visibility: visible ? 'visible' : 'none' },
        paint: {
          'fill-color': ['match', ['to-string', ['get', 'DN']], '1', 'rgba(101,56,12,0.55)', '2', 'rgba(160,105,45,0.4)', 'rgba(130,80,28,0.45)'],
          'fill-opacity': opacity,
        },
      });
      mapInstance.addLayer({
        id: 'peatlands-line',
        type: 'line',
        source: 'peatlands-source',
        layout: { visibility: visible ? 'visible' : 'none' },
        paint: {
          'line-color': ['match', ['to-string', ['get', 'DN']], '1', 'rgba(101,56,12,0.9)', '2', 'rgba(160,105,45,0.8)', 'rgba(130,80,28,0.85)'],
          'line-width': 1,
          'line-opacity': opacity,
        },
      });
    }
    return () => removeSourceWithLayers(mapInstance, 'peatlands-source');
  }, [isMapInitialized, mapInstance]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    setLayerVisibility(mapInstance, 'peatlands-fill', visible);
    setLayerVisibility(mapInstance, 'peatlands-line', visible);
  }, [isMapInitialized, mapInstance, visible]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    setLayerOpacity(mapInstance, 'peatlands-fill', opacity, 'fill');
    setLayerOpacity(mapInstance, 'peatlands-line', opacity, 'line');
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
      const feature = mapInstance.queryRenderedFeatures(event.point, { layers: ['peatlands-fill'] })[0];
      if (!feature) {
        closePopup();
        return;
      }
      const p = feature.properties || {};
      setPopupContent({ dn: p.DN, description: p.description });
      popupInstanceRef.current?.setLngLat(event.lngLat).addTo(mapInstance);
    };
    mapInstance.on('click', handleClick);
    return () => mapInstance.off('click', handleClick);
  }, [closePopup, isMapInitialized, mapInstance]);

  return { popupRef, popupContent, closePopup };
};
