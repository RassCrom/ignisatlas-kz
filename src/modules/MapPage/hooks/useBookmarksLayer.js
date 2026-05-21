import { useEffect, useMemo } from 'react';
import useBookmarksStore from 'src/app/store/bookmarksStore';
import {
  addOrUpdateGeoJsonSource,
  removeSourceWithLayers,
} from '../utils/maplibreHelpers';

export const useBookmarksLayer = (mapInstance, isMapInitialized) => {
  const { bookmarks } = useBookmarksStore();

  const data = useMemo(() => ({
    type: 'FeatureCollection',
    features: bookmarks
      .filter((bookmark) => bookmark.visible)
      .map((bookmark) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: bookmark.center },
        properties: {
          id: bookmark.id,
          title: bookmark.title,
          date: bookmark.date,
        },
      })),
  }), [bookmarks]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    addOrUpdateGeoJsonSource(mapInstance, 'bookmarks-source', data);
    if (!mapInstance.getLayer('bookmarks-layer')) {
      mapInstance.addLayer({
        id: 'bookmarks-layer',
        type: 'symbol',
        source: 'bookmarks-source',
        layout: {
          'text-field': '📍',
          'text-size': 22,
          'text-anchor': 'bottom',
          'text-offset': [0, -0.2],
        },
      });
    }
    return () => removeSourceWithLayers(mapInstance, 'bookmarks-source');
  }, [isMapInitialized, mapInstance]);

  useEffect(() => {
    if (!mapInstance || !isMapInitialized) return;
    addOrUpdateGeoJsonSource(mapInstance, 'bookmarks-source', data);
  }, [data, isMapInitialized, mapInstance]);
};
