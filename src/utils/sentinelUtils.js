import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';

// Configuration constants
const SENTINEL_CONFIG = {
  sentinel3: {
    baseUrl: "https://sh.dataspace.copernicus.eu/ogc/wms/2777646e-6efc-437a-960f-25534461007d",
    searchApiBase: "https://catalogue.dataspace.copernicus.eu/resto/api/collections/Sentinel1/search.json",
    collectionPath: "Sentinel1",
    bands: {
      'IW_VV': { layerName: 'IW_VV' }
    }
  },
  sentinel2: {
    baseUrl: "https://sh.dataspace.copernicus.eu/ogc/wms/4c423dbd-36df-4327-a20b-19a08f888c59",
    searchApiBase: "https://catalogue.dataspace.copernicus.eu/resto/api/collections/Sentinel2/search.json",
    collectionPath: "Sentinel2",
    bands: {
      'true-color': { layerName: 'TRUE_COLOR' },
      'false-color': { layerName: 'TEST' },
      'ndvi': { layerName: 'NDVI_FIRESKZ' },
      'ndwi': { layerName: 'NDWI' },
      'ndbr': { layerName: 'NDBR' },
      'methane': { layerName: 'METHANE' }
    }
  },
  sentinel1: {
    baseUrl: "https://sh.dataspace.copernicus.eu/ogc/wms/51330d81-9d6b-48ee-8a98-6e6bd0f36715",
    searchApiBase: "https://catalogue.dataspace.copernicus.eu/resto/api/collections/Sentinel3/search.json",
    collectionPath: "Sentinel3",
    bands: {
      'OLCI-TRUE': {
        layerName: 'OLCI-TRUE',
      },
    }
  },
  sentinel5: {
    baseUrl: "https://sh.dataspace.copernicus.eu/ogc/wms/d7e26b68-ae7e-416a-86a4-a875713b4ab5",
    searchApiBase: "https://catalogue.dataspace.copernicus.eu/resto/api/collections/Sentinel5P/search.json",
    collectionPath: "Sentinel5P",
    bands: {
      'NO2': {
        layerName: 'NO2',
      },
      'O3': {
        layerName: 'O3',
      },
      'CH4': {
        layerName: 'CH4',
      },
    }
  }
};

const DEFAULT_BBOX = [14.0, 46.0, 16.0, 47.0];

const createFootprint = (bounds = null) => {
  const [minLon, minLat, maxLon, maxLat] = bounds || DEFAULT_BBOX;
  return `POLYGON((${minLon} ${minLat},${maxLon} ${minLat},${maxLon} ${maxLat},${minLon} ${maxLat},${minLon} ${minLat}))`;
};

const transformFeature = (feature) => ({
  Id: feature.id,
  Name: feature.properties.title,
  ContentDate: { 
    beginPosition: feature.properties.startDate 
  },
  CloudCoverPercentage: feature.properties.cloudCover,
  Platform: feature.properties.platform,
  Instrument: feature.properties.instrument,
  ProductType: feature.properties.productType,
  ProcessingLevel: feature.properties.processingLevel,
  Footprint: feature.geometry,
  ThumbnailUrl: feature.properties.thumbnail,
  OrbitNumber: feature.properties.orbitNumber,
  RelativeOrbitNumber: feature.properties.relativeOrbitNumber,
  TileId: feature.properties.tileId,
  IngestionDate: feature.properties.published,
  ModificationDate: feature.properties.updated,
  Size: feature.properties.size
});

export const searchSentinelData = async (satellite, startDate, endDate, bbox = null, maxRecords = 5) => {
  const config = SENTINEL_CONFIG[satellite];
  if (!config) {
    throw new Error(`Unsupported satellite: ${satellite}. Use 'sentinel1' or 'sentinel2'`);
  }

  try {
    const footprint = createFootprint(bbox);
    const searchUrl = new URL(config.searchApiBase);
    
    // Set search parameters
    searchUrl.searchParams.set('startDate', startDate);
    searchUrl.searchParams.set('completionDate', endDate);
    searchUrl.searchParams.set('geometry', footprint);
    searchUrl.searchParams.set('maxRecords', maxRecords.toString());
    
    console.log(`Searching ${satellite} data:`, searchUrl.toString());
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    const transformedResults = data.features?.map(transformFeature) || [];
    
    console.log(`Found ${transformedResults.length} ${satellite} products`);
    
    return { 
      value: transformedResults,
      totalResults: data.properties?.totalResults || 0,
      startIndex: data.properties?.startIndex || 0,
      satellite
    };
    
  } catch (error) {
    console.error(`Error searching ${satellite} data:`, error);
    throw new Error(`Failed to search ${satellite} data: ${error.message}`);
  }
};

export const createSentinelLayer = (satellite, layerId, bands, startDate, endDate, opacity = 0.8, productId = null) => {
  const config = SENTINEL_CONFIG[satellite];
  if (!config) {
    console.error(`Unsupported satellite: ${satellite}`);
    return null;
  }

  const bandConfig = config.bands[bands];
  if (!bandConfig) {
    console.error(`Band configuration not found for ${satellite}: ${bands}`);
    return null;
  }
  
  const timeRange = `${startDate}/${endDate}`;
  
  console.log(`Creating ${satellite} WMS layer:`, {
    url: config.baseUrl,
    layers: bandConfig.layerName,
    time: timeRange,
    layerId,
    productId
  });
  
  const wmsParams = {
    'LAYERS': bandConfig.layerName,
    'TIME': timeRange,
    'MAXCC': 20,
    'FORMAT': 'image/png',
    'TRANSPARENT': true,
    'TILED': true,
    'VERSION': '1.3.0',
    'CRS': 'EPSG:3857'
  };
  
  if (productId) {
    wmsParams['PRODUCT_ID'] = productId;
  }
  
  const layer = new TileLayer({
    source: new TileWMS({
      url: config.baseUrl,
      params: wmsParams,
      serverType: 'geoserver',
      crossOrigin: 'anonymous'
    }),
    opacity: opacity,
    visible: true,
    title: `${satellite.toUpperCase()} ${bands} (${startDate} to ${endDate})`
  });
  
  // Set custom properties for layer management
  layer.set('id', layerId);
  layer.set('type', satellite);
  layer.set('bands', bands);
  layer.set('timeRange', timeRange);
  layer.set('productId', productId);
  
  return layer;
};

export const getProductDetails = async (satellite, productId) => {
  const config = SENTINEL_CONFIG[satellite];
  if (!config) {
    throw new Error(`Unsupported satellite: ${satellite}`);
  }

  try {
    const detailUrl = `https://catalogue.dataspace.copernicus.eu/resto/api/collections/${config.collectionPath}/${productId}.json`;
    
    const response = await fetch(detailUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error(`Error fetching ${satellite} product details:`, error);
    throw new Error(`Failed to get product details: ${error.message}`);
  }
};

export const getAvailableBands = (satellite) => {
  const config = SENTINEL_CONFIG[satellite];
  return config ? Object.keys(config.bands) : [];
};

export const getSatelliteConfig = (satellite) => {
  return SENTINEL_CONFIG[satellite] || null;
};

// Utility functions
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatFileSize = (bytes) => {
  if (!bytes) return "N/A";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

export const getCloudCoverLabel = (cloudCover) => {
  if (cloudCover == null) return "N/A";
  if (cloudCover <= 10) return "Excellent";
  if (cloudCover <= 30) return "Good";
  if (cloudCover <= 60) return "Fair";
  return "Poor";
};

export const getCloudCoverColor = (cloudCover) => {
  if (cloudCover == null) return "#6b7280"; // Gray
  if (cloudCover <= 10) return "#10b981"; // Emerald
  if (cloudCover <= 30) return "#f59e0b"; // Amber
  if (cloudCover <= 60) return "#ef4444"; // Red
  return "#7c2d12"; // Dark red
};

export const showProductDetails = (setSelectedProduct, selectedProduct, product) => {
  setSelectedProduct(selectedProduct?.Id === product.Id ? null : product);
};

export { SENTINEL_CONFIG };