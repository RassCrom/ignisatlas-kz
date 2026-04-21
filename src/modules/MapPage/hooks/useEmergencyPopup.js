import { useEffect, useRef, useState, useCallback } from 'react';
import Overlay from 'ol/Overlay';
import { useLayersStore } from 'src/app/store/layersStore';

export const useEmergencyPopup = (mapInstance, emergencyLayers) => {
  const popupRef   = useRef(null);
  const overlayRef = useRef(null);
  const [popupContent, setPopupContent] = useState(null);

  /* ── Overlay setup (once per mapInstance) ───────────────────── */

  useEffect(() => {
    if (!mapInstance || !popupRef.current || overlayRef.current) return;

    const overlay = new Overlay({
      element: popupRef.current,
      autoPan: { animation: { duration: 250 }, margin: 80 },
    });

    overlayRef.current = overlay;
    mapInstance.addOverlay(overlay);

    return () => {
      if (mapInstance && overlay) mapInstance.removeOverlay(overlay);
      overlayRef.current = null;
    };
  }, [mapInstance]);

  /* ── Close ──────────────────────────────────────────────────── */

  const closePopup = useCallback(() => {
    overlayRef.current?.setPosition(undefined);
    setPopupContent(null);
  }, []);

  /* ── Click handler ──────────────────────────────────────────── */

  useEffect(() => {
    if (!mapInstance || !emergencyLayers?.length) return;

    const isEmergencyLayer = (layer) => emergencyLayers.includes(layer);

    const handleClick = (evt) => {
      let handled = false;

      mapInstance.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        if (handled || !isEmergencyLayer(layer)) return;

        const layerId = layer.get('id');
        // Read current store state at click time (no subscription needed)
        const { layers: configs } = useLayersStore.getState();
        const cfg = configs.find(c => c.id === layerId);

        setPopupContent({
          layerId,
          layerName:  cfg?.layerName || layerId,
          properties: feature.getProperties(),
        });
        overlayRef.current?.setPosition(evt.coordinate);
        handled = true;
        return true;
      });

      // Close popup when clicking outside any emergency feature
      if (!handled) closePopup();
    };

    /* Pointer cursor on hover */
    const handlePointerMove = (evt) => {
      if (evt.dragging) return;
      const pixel = mapInstance.getEventPixel(evt.originalEvent);
      const hit   = mapInstance.hasFeatureAtPixel(pixel, { layerFilter: isEmergencyLayer });
      if (hit) mapInstance.getTargetElement().style.cursor = 'pointer';
    };

    mapInstance.on('click', handleClick);
    mapInstance.on('pointermove', handlePointerMove);

    return () => {
      mapInstance.un('click', handleClick);
      mapInstance.un('pointermove', handlePointerMove);
    };
  }, [mapInstance, emergencyLayers, closePopup]);

  return { popupRef, popupContent, closePopup };
};
