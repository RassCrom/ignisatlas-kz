import { DEFAULT_POSITION } from './mapConstants';
import { toLngLat } from './maplibreHelpers';

export const getMapStateFromHash = () => {
  if (window.location.hash !== '') {
    const hash = window.location.hash.replace('#map=', '');
    const parts = hash.split('/');
    if (parts.length === 4) {
      return {
        zoom: parseFloat(parts[0]),
        center: toLngLat([parseFloat(parts[1]), parseFloat(parts[2])]),
        bearing: parseFloat(parts[3]) || 0,
      };
    }
  }
  return DEFAULT_POSITION;
};

export const updateMapStateInHash = (map) => {
  const center = map.getCenter();
  const zoom = map.getZoom();
  const bearing = map.getBearing();
  const hash = `#map=${zoom.toFixed(2)}/${center.lng.toFixed(5)}/${center.lat.toFixed(5)}/${bearing.toFixed(1)}`;
  const state = {
    zoom,
    center: [center.lng, center.lat],
    bearing,
  };
  window.history.pushState(state, 'map', hash);
};
