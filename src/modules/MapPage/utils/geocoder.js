import Geocoder from 'ol-geocoder';

export const createGeocoder = () => {
  // Create the geocoder control
  const geocoder = new Geocoder('nominatim', {
    provider: 'osm',
    lang: 'en-US',
    placeholder: 'Search location...',
    targetType: 'glass-button',
    limit: 5,
    countrycodes: 'KZ',
    keepOpen: false,
  });
  
  return geocoder;
};