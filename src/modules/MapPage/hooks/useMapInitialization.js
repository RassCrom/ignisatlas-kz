import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import {
  applyBasemap,
  createInitialStyle,
  DEFAULT_BASEMAP_KEY,
  shouldReloadBasemapStyle,
} from '../utils/basemaps.js';
import { getMapStateFromHash, updateMapStateInHash } from '../utils/mapState.js';
import { createContextMenu } from '../utils/contextMenu.js';
import { handleFullScreenChange } from '../utils/fullScreen.js';
import { useMapStyleStore } from 'src/app/store/mapStyleStore.js';

const PRESERVE_DRAWING_BUFFER = import.meta.env.VITE_MAP_PRESERVE_DRAWING_BUFFER === 'true';
let pmtilesRegistered = false;

export const useMapInitialization = (mapRef, basemapKey = DEFAULT_BASEMAP_KEY) => {
  const mapInstance = useRef(null);
  const activeBasemapRef = useRef(basemapKey);
  const initialBasemapRef = useRef(basemapKey);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const bumpStyleVersion = useMapStyleStore((s) => s.bumpStyleVersion);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Register PMTiles protocol once (idempotent — safe to call multiple times)
    if (!pmtilesRegistered) {
      const protocol = new Protocol();
      maplibregl.addProtocol('pmtiles', protocol.tile);
      pmtilesRegistered = true;
    }

    const { zoom, center, bearing } = getMapStateFromHash();
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: createInitialStyle(initialBasemapRef.current),
      center,
      zoom,
      bearing,
      pitch: 0,
      attributionControl: false,
      preserveDrawingBuffer: PRESERVE_DRAWING_BUFFER,
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

    const requiresStyleReload = shouldReloadBasemapStyle(basemapKey, activeBasemapRef.current);

    const handleStyleLoad = () => {
      activeBasemapRef.current = basemapKey;
      setIsMapInitialized(true);
      bumpStyleVersion();
    };

    if (requiresStyleReload) {
      setIsMapInitialized(false);
      map.once('style.load', handleStyleLoad);
    }

    applyBasemap(map, basemapKey, activeBasemapRef.current);

    if (requiresStyleReload) return;

    activeBasemapRef.current = basemapKey;
  }, [basemapKey, isMapInitialized]);

  return { mapInstance: mapInstance.current, isMapInitialized };
};
