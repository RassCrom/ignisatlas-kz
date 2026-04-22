import { useEffect, useState } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Style, Icon } from 'ol/style';
import useBookmarksStore from 'src/app/store/bookmarksStore';

export const useBookmarksLayer = (mapInstance, isMapInitialized) => {
  const { bookmarks } = useBookmarksStore();
  const [vectorLayer, setVectorLayer] = useState(null);

  useEffect(() => {
    if (!isMapInitialized || !mapInstance) return;

    const source = new VectorSource();
    const layer = new VectorLayer({
      source,
      zIndex: 1000 // Ensuring it sits visually above most things
    });

    mapInstance.addLayer(layer);
    setVectorLayer(layer);

    return () => {
      mapInstance.removeLayer(layer);
    };
  }, [mapInstance, isMapInitialized]);

  useEffect(() => {
    if (!vectorLayer) return;

    const source = vectorLayer.getSource();
    source.clear();

    const features = bookmarks
      .filter((b) => b.visible)
      .map((b) => {
        const feature = new Feature({
          geometry: new Point(b.center),
          bookmark: b,
        });

        // Basic default pin style, reused from standard openlayers approaches.
        // It provides a fallback generic marker natively without external images.
        feature.setStyle(
          new Style({
            image: new Icon({
              src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%233b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>',
              anchor: [0.5, 1],
              scale: 1.2
            }),
          })
        );

        return feature;
      });

    source.addFeatures(features);
  }, [bookmarks, vectorLayer]);

  return vectorLayer;
};
