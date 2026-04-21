import { DEFAULT_POSITION } from "../utils/mapConstants";

export const getMapStateFromHash = () => {
  if (window.location.hash !== "") {
    const hash = window.location.hash.replace("#map=", "");
    const parts = hash.split("/");
    if (parts.length === 4) {
      return {
        zoom: parseFloat(parts[0]),
        center: [parseFloat(parts[1]), parseFloat(parts[2])],
        rotation: parseFloat(parts[3]),
      };
    }
  }
  return DEFAULT_POSITION;
};

export const updateMapStateInHash = (view) => {
  const center = view.getCenter();
  const hash = `#map=${view.getZoom().toFixed(2)}/${center[0].toFixed(
    2
  )}/${center[1].toFixed(2)}/${view.getRotation()}`;
  const state = { zoom: view.getZoom(), center, rotation: view.getRotation() };
  window.history.pushState(state, "map", hash);
};
