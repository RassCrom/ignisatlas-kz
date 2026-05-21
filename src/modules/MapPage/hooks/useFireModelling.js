import { useCallback, useEffect, useRef, useState } from 'react';
import { createPopup, removeSourceWithLayers } from '../utils/maplibreHelpers.js';
import {
  fireModelFillColorExpression,
  fireModelStrokeColorExpression,
} from '../utils/colorFireModel.js';

const SOURCE_PREFIX = 'fire-model-source';
const FILL_PREFIX = 'fire-model-fill';
const LINE_PREFIX = 'fire-model-line';

export const useFireModelling = (
  fireModelLayer,
  mapInstance,
  isMapInitialized,
  addFireModellingLayer,
  setMapInstance
) => {
  const popupRef = useRef(null);
  const popupInstanceRef = useRef(null);
  const activeSourceIdsRef = useRef([]);
  const [popupContent, setPopupContent] = useState(null);

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
    if (!mapInstance || !fireModelLayer || !isMapInitialized) return undefined;

    const id = Date.now();
    const sourceId = `${SOURCE_PREFIX}-${id}`;
    const fillLayerId = `${FILL_PREFIX}-${id}`;
    const lineLayerId = `${LINE_PREFIX}-${id}`;

    try {
      mapInstance.addSource(sourceId, {
        type: 'geojson',
        data: fireModelLayer,
      });

      mapInstance.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': fireModelFillColorExpression,
          'fill-opacity': 1,
        },
      });
      mapInstance.addLayer({
        id: lineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': fireModelStrokeColorExpression,
          'line-width': 1,
        },
      });

      activeSourceIdsRef.current = [...activeSourceIdsRef.current, sourceId];
      setMapInstance(mapInstance);
      addFireModellingLayer({
        id,
        sourceId,
        layerIds: [fillLayerId, lineLayerId],
        data: fireModelLayer,
        opacity: 1,
        visible: true,
        name: fireModelLayer.name || 'Модель распространения',
        type: fireModelLayer.type || 'Прогнозная модель',
        color: '#ff6b6b',
        metadata: {
          source: fireModelLayer.source || 'Автоматически',
          accuracy: fireModelLayer.accuracy || '—',
          timestamp: new Date().toISOString(),
        },
      });

      const clickHandler = (event) => {
        const feature = mapInstance.queryRenderedFeatures(event.point, {
          layers: [fillLayerId],
        })[0];

        if (!feature) {
          closePopup();
          return;
        }

        setPopupContent({
          coordinate: [event.lngLat.lng, event.lngLat.lat],
          properties: feature.properties,
          accuracy: fireModelLayer.accuracy || null,
        });
        popupInstanceRef.current?.setLngLat(event.lngLat).addTo(mapInstance);
      };

      const moveHandler = (event) => {
        const hasFeature = mapInstance.queryRenderedFeatures(event.point, {
          layers: [fillLayerId],
        }).length > 0;
        mapInstance.getCanvas().style.cursor = hasFeature ? 'pointer' : '';
      };

      mapInstance.on('click', clickHandler);
      mapInstance.on('mousemove', moveHandler);

      return () => {
        mapInstance.off('click', clickHandler);
        mapInstance.off('mousemove', moveHandler);
      };
    } catch (error) {
      console.error('Error processing fire model GeoJSON:', error);
      return undefined;
    }
  }, [fireModelLayer, isMapInitialized, mapInstance, addFireModellingLayer, setMapInstance, closePopup]);

  useEffect(() => () => {
    activeSourceIdsRef.current.forEach((sourceId) => removeSourceWithLayers(mapInstance, sourceId));
    activeSourceIdsRef.current = [];
  }, [mapInstance]);

  return { popupRef, popupContent, closePopup };
};
