import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { applyBasemap, createInitialStyle, DEFAULT_BASEMAP_KEY } from '../utils/basemaps.js';
import { getMapStateFromHash, updateMapStateInHash } from '../utils/mapState.js';
import { createContextMenu } from '../utils/contextMenu.js';
import { handleFullScreenChange } from '../utils/fullScreen.js';

export const useMapInitialization = (mapRef, basemapKey = DEFAULT_BASEMAP_KEY) => {
  const mapInstance = useRef(null);
  const activeBasemapRef = useRef(basemapKey);
  const initialBasemapRef = useRef(basemapKey);
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const { zoom, center, bearing } = getMapStateFromHash();
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: createInitialStyle(initialBasemapRef.current),
      center,
      zoom,
      bearing,
      pitch: 0,
      attributionControl: false,
      preserveDrawingBuffer: true,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    map.addControl(new maplibregl.FullscreenControl({ container: mapRef.current }), 'top-right');
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    const fullscreenCleanUp = handleFullScreenChange(mapRef);
    const contextMenuCleanUp = createContextMenu(map);

    const handleMoveEnd = () => updateMapStateInHash(map);
    const handlePopState = (event) => {
      if (event.state?.center) {
        map.jumpTo({
          center: event.state.center,
          zoom: event.state.zoom,
          bearing: event.state.bearing || 0,
        });
      }
    };

    map.on('load', () => {
      activeBasemapRef.current = initialBasemapRef.current;
      mapInstance.current = map;
      setIsMapInitialized(true);
      map.on('moveend', handleMoveEnd);
      window.addEventListener('popstate', handlePopState);
    });

    return () => {
      contextMenuCleanUp?.();
      fullscreenCleanUp();
      window.removeEventListener('popstate', handlePopState);
      map.off('moveend', handleMoveEnd);
      map.remove();
      mapInstance.current = null;
      setIsMapInitialized(false);
    };
  }, [mapRef]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isMapInitialized) return;

    if (activeBasemapRef.current === basemapKey) return;

    setIsMapInitialized(false);

    const handleStyleLoad = () => {
      activeBasemapRef.current = basemapKey;
      setIsMapInitialized(true);
    };

    map.once('style.load', handleStyleLoad);
    applyBasemap(map, basemapKey);
  }, [basemapKey, isMapInitialized]);

  return { mapInstance: mapInstance.current, isMapInitialized };
};
