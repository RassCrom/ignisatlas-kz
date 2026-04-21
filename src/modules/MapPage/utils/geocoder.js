import Geocoder from 'ol-geocoder';

export const createGeocoder = () => {
  // Create the geocoder control
  const geocoder = new Geocoder('nominatim', {
    provider: 'osm',
    lang: 'kz',
    placeholder: 'Поиск...',
    targetType: 'glass-button',
    limit: 3,
    countrycodes: 'KZ',
    keepOpen: true,
    // preventDefault: true, // preventing zoom to the location
  });
  
  return geocoder;
};