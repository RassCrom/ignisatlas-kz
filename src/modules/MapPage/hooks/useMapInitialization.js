import { useEffect, useRef, useState } from 'react';
import Map from "ol/Map";
import View from "ol/View";
import FullScreen from "ol/control/FullScreen";
import { defaults as defaultControls } from "ol/control/defaults";
import { getMapStateFromHash, updateMapStateInHash } from "../utils/mapState.js";
import { createContextMenu } from "../utils/contextMenu.js";
import { handleFullScreenChange } from "../utils/fullScreen.js";
import { createGeocoder } from "../utils/geocoder.js";
import { DEFAULT_POSITION } from "../utils/mapConstants.js";

export const useMapInitialization = (mapRef, basemap, initialLayers = [], styles) => {
  const mapInstance = useRef(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    const { zoom, center, rotation } = getMapStateFromHash();
    const view = new View({
      center,
      zoom,
      rotation,
      showFullExtent: true,
    });

    const geocoder = createGeocoder();
    const map = new Map({
      pixelRatio: window.devicePixelRatio || 1,
      loadTilesWhileInteracting: true,
      loadTilesWhileAnimating: true,
      moveTolerance: 5,
      target: mapRef.current,
      layers: [basemap, ...initialLayers],
      view,
      controls: defaultControls().extend([new FullScreen(), geocoder]),
    });

    mapInstance.current = map;
    setIsMapInitialized(true);

    const contextMenu = createContextMenu(map, view, DEFAULT_POSITION, styles);
    map.addControl(contextMenu);

    const fullscreenCleanUp = handleFullScreenChange(mapRef);

    let shouldUpdate = true;
    const updatePermalink = () => {
      if (!shouldUpdate) {
        shouldUpdate = true;
        return;
      }
      updateMapStateInHash(view);
    };

    map.on("moveend", updatePermalink);

    const handlePopState = (event) => {
      if (event.state === null) return;
      view.setCenter(event.state.center);
      view.setZoom(event.state.zoom);
      view.setRotation(event.state.rotation);
      shouldUpdate = false;
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      map.setTarget(null);
      fullscreenCleanUp();
      window.removeEventListener("popstate", handlePopState);
      map.un('moveend', updatePermalink);
      setIsMapInitialized(false);
    };
  }, [mapRef, styles]);

  // Swap only the basemap layer without recreating the map
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !basemap) return;

    const layers = map.getLayers();
    layers.setAt(0, basemap);
  }, [basemap]);

  return { mapInstance: mapInstance.current, isMapInitialized };
};