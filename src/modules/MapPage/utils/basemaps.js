import TileLayer from "ol/layer/Tile";
import VectorTileLayer from "ol/layer/VectorTile";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import VectorTileSource from "ol/source/VectorTile";
import MVT from "ol/format/MVT";

// Base map layers (existing)
export const osmLayer = new TileLayer({
  source: new OSM({attributions: [], crossOrigin: 'anonymous'}),
  preload: Infinity,
  useInterimTilesOnError: false, 
  tileSize: 512
});

export const esriLayer = new TileLayer({
  source: new XYZ({
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attributions: "Tiles © Esri",
    crossOrigin: "anonymous",
  }),
});

export const cartoLayer = new TileLayer({
  source: new XYZ({
    url: "https://{a-d}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attributions: "Tiles © CartoDB",
    crossOrigin: "anonymous",
  }),
});

// Additional Raster Basemaps
export const googleSatelliteLayer = new TileLayer({
  source: new XYZ({
    url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    attributions: "Tiles © Google",
    crossOrigin: "anonymous",
  }),
});

export const googleHybridLayer = new TileLayer({
  source: new XYZ({
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    attributions: "Tiles © Google",
    crossOrigin: "anonymous",
  }),
});

export const googleTerrainLayer = new TileLayer({
  source: new XYZ({
    url: "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
    attributions: "Tiles © Google",
    crossOrigin: "anonymous",
  }),
});

export const stamenTonerLayer = new TileLayer({
  source: new XYZ({
    url: "https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png",
    attributions: "Map tiles by Stamen Design, CC BY 3.0 — Map data © OpenStreetMap",
    crossOrigin: "anonymous",
  }),
});

export const stamenTerrainLayer = new TileLayer({
  source: new XYZ({
    url: "https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png",
    attributions: "Map tiles by Stamen Design, CC BY 3.0 — Map data © OpenStreetMap",
    crossOrigin: "anonymous",
  }),
});

export const stamenWatercolorLayer = new TileLayer({
  source: new XYZ({
    url: "https://stamen-tiles.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.png",
    attributions: "Map tiles by Stamen Design, CC BY 3.0 — Map data © OpenStreetMap",
    crossOrigin: "anonymous",
  }),
});

export const cartoDarkLayer = new TileLayer({
  source: new XYZ({
    url: "https://{a-d}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attributions: "Tiles © CartoDB",
    crossOrigin: "anonymous",
  }),
});

export const cartoVoyagerLayer = new TileLayer({
  source: new XYZ({
    url: "https://{a-d}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attributions: "Tiles © CartoDB",
    crossOrigin: "anonymous",
  }),
});

export const esriTopoLayer = new TileLayer({
  source: new XYZ({
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attributions: "Tiles © Esri",
    crossOrigin: "anonymous",
  }),
});

export const esriStreetLayer = new TileLayer({
  source: new XYZ({
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    attributions: "Tiles © Esri",
    crossOrigin: "anonymous",
  }),
});

// Vector Basemaps (Free alternatives)
export const openmaptilesVectorLayer = new VectorTileLayer({
  source: new VectorTileSource({
    format: new MVT(),
    url: "https://free-0.tilehosting.com/data/v3/{z}/{x}/{y}.pbf.pict?key=undefined", // Free tier without key
    attributions: "© OpenMapTiles © OpenStreetMap contributors",
  }),
});

// Alternative free vector tile sources
export const openStreetsVectorLayer = new VectorTileLayer({
  source: new VectorTileSource({
    format: new MVT(),
    url: "https://tiles.openfreemap.org/styles/liberty/{z}/{x}/{y}.pbf",
    attributions: "© OpenFreeMap © OpenStreetMap contributors",
  }),
});

// Utility function to create a custom XYZ layer
export const createCustomXYZLayer = (url, attributions = "", crossOrigin = "anonymous") => {
  return new TileLayer({
    source: new XYZ({
      url,
      attributions,
      crossOrigin,
    }),
  });
};

// Utility function to create a custom vector tile layer
export const createCustomVectorLayer = (url, attributions = "", format = new MVT()) => {
  return new VectorTileLayer({
    source: new VectorTileSource({
      format,
      url,
      attributions,
    }),
  });
};

export const basemapOptions = {
  // Original
  osm: osmLayer,
  esri: esriLayer,
  carto: cartoLayer,
  
  // Raster Basemaps
  googleSatellite: googleSatelliteLayer,
  googleHybrid: googleHybridLayer,
  googleTerrain: googleTerrainLayer,
  stamenToner: stamenTonerLayer,
  stamenTerrain: stamenTerrainLayer,
  stamenWatercolor: stamenWatercolorLayer,
  cartoDark: cartoDarkLayer,
  cartoVoyager: cartoVoyagerLayer,
  esriTopo: esriTopoLayer,
  esriStreet: esriStreetLayer,
  
  // Vector Basemaps (free)
  openmaptilesVector: openmaptilesVectorLayer,
  openStreetsVector: openStreetsVectorLayer,
};

// Basemap categories for easier organization
export const basemapCategories = {
  raster: {
    standard: ['osm', 'carto', 'esriStreet', 'cartoVoyager'],
    satellite: ['esri', 'googleSatellite', 'googleHybrid'],
    terrain: ['googleTerrain', 'stamenTerrain', 'esriTopo'],
    stylized: ['stamenToner', 'stamenWatercolor', 'cartoDark'],
  },
  vector: {
    standard: ['openmaptilesVector', 'openStreetsVector'],
  }
};

// Function to get basemaps by category
export const getBasemapsByCategory = (category, subcategory) => {
  if (!basemapCategories[category] || !basemapCategories[category][subcategory]) {
    return [];
  }
  
  return basemapCategories[category][subcategory].map(key => ({
    key,
    name: key,
    layer: basemapOptions[key]
  }));
};

// Function to get all available basemaps with display names
export const getAllBasemaps = () => {
  return Object.keys(basemapOptions).map(key => ({
    key,
    name: formatBasemapName(key),
    layer: basemapOptions[key],
    type: isVectorBasemap(key) ? 'vector' : 'raster'
  }));
};

// Helper functions
function formatBasemapName(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

function isVectorBasemap(key) {
  const vectorKeys = ['openmaptilesVector', 'openStreetsVector'];
  return vectorKeys.includes(key);
}