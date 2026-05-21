import { useEffect, useRef, useState, useCallback } from 'react';
import { createPopup } from '../utils/maplibreHelpers';
import { useLayersStore } from 'src/app/store/layersStore';

export const useEmergencyPopup = (mapInstance, isMapInitialized) => {
  const popupRef = useRef(null);
  const popupInstanceRef = useRef(null);
  const [popupContent, setPopupContent] = useState(null);
  const emergencyLayers = useLayersStore((s) => s.layers);

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
    if (!mapInstance || !isMapInitialized || !emergencyLayers.length) return;
    const layerIds = emergencyLayers.map((layer) => layer.id).filter((id) => mapInstance.getLayer(id));
    if (!layerIds.length) return;

    const handleClick = (event) => {
      const features = mapInstance.queryRenderedFeatures(event.point, { layers: layerIds });
      const feature = features[0];
      if (!feature) {
        closePopup();
        return;
      }

      const layerId = feature.layer.id;
      const cfg = useLayersStore.getState().layers.find((item) => item.id === layerId);
      setPopupContent({
        layerId,
        layerName: cfg?.layerName || layerId,
        properties: feature.properties || {},
      });
      popupInstanceRef.current?.setLngLat(event.lngLat).addTo(mapInstance);
    };

    const handlePointerMove = (event) => {
      const features = mapInstance.queryRenderedFeatures(event.point, { layers: layerIds });
      mapInstance.getCanvas().style.cursor = features.length ? 'pointer' : '';
    };

    mapInstance.on('click', handleClick);
    mapInstance.on('mousemove', handlePointerMove);
    return () => {
      mapInstance.off('click', handleClick);
      mapInstance.off('mousemove', handlePointerMove);
    };
  }, [closePopup, emergencyLayers, isMapInitialized, mapInstance]);

  return { popupRef, popupContent, closePopup };
};
