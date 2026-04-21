import { useEffect, useRef, useState, useCallback } from 'react';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import Overlay from 'ol/Overlay';

import { styleFireModelFunction } from "../utils/colorFireModel.js";

export const useFireModelling = (fireModelLayer, mapInstance, isMapInitialized, addFireModellingLayer, setMapInstance) => {
  const popupRef   = useRef(null);
  const overlayRef = useRef(null);
  const [popupContent, setPopupContent] = useState(null);

  /* ── Overlay (one per map instance) ────────────────────────────── */

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

  /* ── Close popup ────────────────────────────────────────────────── */

  const closePopup = useCallback(() => {
    overlayRef.current?.setPosition(undefined);
    setPopupContent(null);
  }, []);

  /* ── Fire model layer ───────────────────────────────────────────── */

  useEffect(() => {
    if (!mapInstance || !fireModelLayer || !isMapInitialized) return;

    let vectorLayer;

    try {
      vectorLayer = new VectorLayer({
        source: new VectorSource({
          features: new GeoJSON().readFeatures(fireModelLayer, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857',
          }),
        }),
        style: styleFireModelFunction,
      });

      const clickHandler = (evt) => {
        const feature = mapInstance.forEachFeatureAtPixel(evt.pixel, (feat, layer) => {
          if (layer === vectorLayer) return feat;
        });

        if (feature) {
          setPopupContent({
            coordinate: evt.coordinate,
            properties: feature.getProperties(),
            accuracy:   fireModelLayer.accuracy || null,
          });
          overlayRef.current?.setPosition(evt.coordinate);
        } else {
          closePopup();
        }
      };

      mapInstance.on('singleclick', clickHandler);
      mapInstance.addLayer(vectorLayer);
      setMapInstance(mapInstance);

      addFireModellingLayer({
        id:      Date.now(),
        layer:   vectorLayer,
        opacity: 1,
        visible: true,
        name:    fireModelLayer.name || 'Модель распространения',
        type:    fireModelLayer.type || 'Прогнозная модель',
        color:   '#ff6b6b',
        metadata: {
          source:    fireModelLayer.source || 'Автоматически',
          accuracy:  fireModelLayer.accuracy || '—',
          timestamp: new Date().toISOString(),
        },
      });

      return () => {
        mapInstance.un('singleclick', clickHandler);
      };
    } catch (error) {
      console.error('Error processing fire model GeoJSON:', error);
    }
  }, [fireModelLayer, isMapInitialized, mapInstance, addFireModellingLayer, setMapInstance, closePopup]);

  return { popupRef, popupContent, closePopup };
};
