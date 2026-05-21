export const basemapOptions = {
  osm: {
    key: 'osm',
    name: 'OpenStreetMap',
    type: 'raster',
    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
    tileSize: 256,
    attribution: '© OpenStreetMap contributors',
  },
  esri: {
    key: 'esri',
    name: 'Esri Imagery',
    type: 'raster',
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    tileSize: 256,
    attribution: 'Tiles © Esri',
  },
  carto: {
    key: 'carto',
    name: 'Carto Light',
    type: 'raster',
    tiles: ['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'],
    tileSize: 256,
    attribution: 'Tiles © CartoDB',
  },
  googleSatellite: {
    key: 'googleSatellite',
    name: 'Google Satellite',
    type: 'raster',
    tiles: ['https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'],
    tileSize: 256,
    attribution: 'Tiles © Google',
  },
  googleHybrid: {
    key: 'googleHybrid',
    name: 'Google Hybrid',
    type: 'raster',
    tiles: ['https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'],
    tileSize: 256,
    attribution: 'Tiles © Google',
  },
  googleTerrain: {
    key: 'googleTerrain',
    name: 'Google Terrain',
    type: 'raster',
    tiles: ['https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}'],
    tileSize: 256,
    attribution: 'Tiles © Google',
  },
  stamenToner: {
    key: 'stamenToner',
    name: 'Stamen Toner',
    type: 'raster',
    tiles: ['https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png'],
    tileSize: 256,
    attribution: 'Map tiles by Stamen Design, CC BY 3.0, Map data © OpenStreetMap',
  },
  stamenTerrain: {
    key: 'stamenTerrain',
    name: 'Stamen Terrain',
    type: 'raster',
    tiles: ['https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png'],
    tileSize: 256,
    attribution: 'Map tiles by Stamen Design, CC BY 3.0, Map data © OpenStreetMap',
  },
  stamenWatercolor: {
    key: 'stamenWatercolor',
    name: 'Stamen Watercolor',
    type: 'raster',
    tiles: ['https://stamen-tiles.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg'],
    tileSize: 256,
    attribution: 'Map tiles by Stamen Design, CC BY 3.0, Map data © OpenStreetMap',
  },
  cartoDark: {
    key: 'cartoDark',
    name: 'Carto Dark',
    type: 'raster',
    tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'],
    tileSize: 256,
    attribution: 'Tiles © CartoDB',
  },
  cartoVoyager: {
    key: 'cartoVoyager',
    name: 'Carto Voyager',
    type: 'raster',
    tiles: ['https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'],
    tileSize: 256,
    attribution: 'Tiles © CartoDB',
  },
  esriTopo: {
    key: 'esriTopo',
    name: 'Esri Topographic',
    type: 'raster',
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'],
    tileSize: 256,
    attribution: 'Tiles © Esri',
  },
  esriStreet: {
    key: 'esriStreet',
    name: 'Esri Street',
    type: 'raster',
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'],
    tileSize: 256,
    attribution: 'Tiles © Esri',
  },
  openmaptilesVector: {
    key: 'openmaptilesVector',
    name: 'OpenFreeMap Liberty',
    type: 'vector',
    style: 'https://tiles.openfreemap.org/styles/liberty',
  },
  openStreetsVector: {
    key: 'openStreetsVector',
    name: 'OpenFreeMap Bright',
    type: 'vector',
    style: 'https://tiles.openfreemap.org/styles/bright',
  },
};

export const DEFAULT_BASEMAP_KEY = 'osm';

export const createInitialStyle = (basemapKey = DEFAULT_BASEMAP_KEY) => ({
  version: 8,
  sources: {},
  layers: [],
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  metadata: {
    basemapKey,
  },
});

export const getAllBasemaps = () => Object.values(basemapOptions);

export const applyBasemap = (map, basemapKey) => {
  const basemap = basemapOptions[basemapKey] || basemapOptions[DEFAULT_BASEMAP_KEY];
  if (!map) return;

  if (basemap.type === 'vector' && basemap.style) {
    map.setStyle(basemap.style);
    map.once('styledata', () => {
      map.getStyle().metadata = { ...(map.getStyle().metadata || {}), basemapKey: basemap.key };
    });
    return;
  }

  const sourceId = 'basemap-source';
  const layerId = 'basemap-layer';

  if (map.getLayer(layerId)) map.removeLayer(layerId);
  if (map.getSource(sourceId)) map.removeSource(sourceId);

  map.addSource(sourceId, {
    type: 'raster',
    tiles: basemap.tiles,
    tileSize: basemap.tileSize || 256,
    attribution: basemap.attribution,
  });

  map.addLayer({
    id: layerId,
    type: 'raster',
    source: sourceId,
    minzoom: 0,
    maxzoom: 22,
  }, map.getStyle().layers?.[0]?.id);

  map.getStyle().metadata = { ...(map.getStyle().metadata || {}), basemapKey: basemap.key };
};
