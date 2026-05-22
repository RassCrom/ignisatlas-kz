const GLYPHS_URL = 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf';
const BASEMAP_SOURCE_ID = 'basemap-source';
const BASEMAP_LAYER_ID = 'basemap-layer';

export const basemapOptions = {
  osm: {
    key: 'osm',
    name: 'OpenStreetMap',
    type: 'raster',
    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
    tileSize: 256,
    attribution: '(c) OpenStreetMap contributors',
  },
  googleSatellite: {
    key: 'googleSatellite',
    name: 'Google Satellite',
    type: 'raster',
    tiles: ['https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'],
    tileSize: 256,
    attribution: 'Tiles (c) Google',
  },
  googleHybrid: {
    key: 'googleHybrid',
    name: 'Google Hybrid',
    type: 'raster',
    tiles: ['https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'],
    tileSize: 256,
    attribution: 'Tiles (c) Google',
  },
  openFreeMapLiberty: {
    key: 'openFreeMapLiberty',
    name: 'OpenFreeMap Liberty',
    type: 'vector',
    style: 'https://tiles.openfreemap.org/styles/liberty',
  },
  openFreeMapBright: {
    key: 'openFreeMapBright',
    name: 'OpenFreeMap Bright',
    type: 'vector',
    style: 'https://tiles.openfreemap.org/styles/bright',
  },
  openFreeMapPositron: {
    key: 'openFreeMapPositron',
    name: 'OpenFreeMap Positron',
    type: 'vector',
    style: 'https://tiles.openfreemap.org/styles/positron',
  },
};

export const DEFAULT_BASEMAP_KEY = 'osm';

const getBasemap = (basemapKey = DEFAULT_BASEMAP_KEY) => (
  basemapOptions[basemapKey] || basemapOptions[DEFAULT_BASEMAP_KEY]
);

const createRasterStyle = (basemap) => ({
  version: 8,
  sources: {
    [BASEMAP_SOURCE_ID]: {
      type: 'raster',
      tiles: basemap.tiles,
      tileSize: basemap.tileSize || 256,
      attribution: basemap.attribution,
    },
  },
  layers: [
    {
      id: BASEMAP_LAYER_ID,
      type: 'raster',
      source: BASEMAP_SOURCE_ID,
      minzoom: 0,
      maxzoom: 22,
    },
  ],
  glyphs: GLYPHS_URL,
  metadata: {
    basemapKey: basemap.key,
    basemapType: basemap.type,
  },
});

export const createInitialStyle = (basemapKey = DEFAULT_BASEMAP_KEY) => {
  const basemap = getBasemap(basemapKey);
  return basemap.type === 'vector' && basemap.style
    ? basemap.style
    : createRasterStyle(basemap);
};

export const getAllBasemaps = () => Object.values(basemapOptions);

export const applyBasemap = (map, basemapKey) => {
  if (!map) return;

  const basemap = getBasemap(basemapKey);
  const style = basemap.type === 'vector' && basemap.style
    ? basemap.style
    : createRasterStyle(basemap);

  map.setStyle(style);

  if (basemap.type === 'vector') {
    map.once('styledata', () => {
      const nextStyle = map.getStyle();
      nextStyle.metadata = {
        ...(nextStyle.metadata || {}),
        basemapKey: basemap.key,
        basemapType: basemap.type,
      };
    });
  }
};
