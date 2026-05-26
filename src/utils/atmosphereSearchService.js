/**
 * Atmosphere Search Service
 * Uses Microsoft Planetary Computer STAC API (free, no auth required).
 * Focuses on Sentinel-5P Atmospheric composition and emissions products.
 */

import { cachedRequest, createCacheKey, fetchJson } from './requestCache';

const PC_STAC_SEARCH = 'https://planetarycomputer.microsoft.com/api/stac/v1/search';
const GIBS_WMS_EPSG3857 = 'https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi';
export const KAZAKHSTAN_BOUNDS = [46, 40, 88, 56];

// ── Product mapping ─────────────────────────────────────────────────────

export const ATMOSPHERE_PRODUCTS = [
  // Direct Observation (S5P)
  { id: 'ch4',    label: 'Methane (CH₄)', category: 'Direct Observation', type: 'Gas Emissions', isSupported: true, unit: 'mol/m²' },
  { id: 'co',     label: 'Carbon Monoxide (CO)', category: 'Direct Observation', type: 'Gas Emissions', isSupported: true, unit: 'mol/m²' },
  { id: 'no2',    label: 'Nitrogen Dioxide (NO₂)', category: 'Direct Observation', type: 'Gas Emissions', isSupported: true, unit: 'mol/m²' },
  { id: 'so2',    label: 'Sulfur Dioxide (SO₂)', category: 'Direct Observation', type: 'Gas Emissions', isSupported: true, unit: 'mol/m²' },
  { id: 'hcho',   label: 'Formaldehyde (HCHO)', category: 'Direct Observation', type: 'Gas Emissions', isSupported: true, unit: 'mol/m²' },
  { id: 'o3',     label: 'Ozone (O₃) Total Column', category: 'Direct Observation', type: 'Gas Emissions', isSupported: true, unit: 'mol/m²' },
  
  { id: 'aer-ai', label: 'UV Aerosol Index', category: 'Direct Observation', type: 'Aerosols & Smoke', isSupported: true, unit: 'Index (Unitless)' },
  { id: 'aer-lh', label: 'Aerosol Layer Height', category: 'Direct Observation', type: 'Aerosols & Smoke', isSupported: true, unit: 'km' },

  // Derived / Modeled (Conceptual / Future Integration)
  { id: 'derived-pm25', label: 'PM2.5 Surface Concentration', category: 'Derived / Modeled', type: 'Aerosols & Smoke', isSupported: true, provider: 'CAMS/Forecast', unit: 'µg/m³' },
  { id: 'derived-pm10', label: 'PM10 Surface Concentration', category: 'Derived / Modeled', type: 'Aerosols & Smoke', isSupported: true, provider: 'CAMS/Forecast', unit: 'µg/m³' },

  // Unsupported (UI Conceptual)
  { id: 'co2-direct', label: 'Carbon Dioxide (CO₂)', category: 'Unsupported', type: 'Gas Emissions', isSupported: false, note: 'S5P does not retrieve CO₂', unit: 'ppm' },
  { id: 'nh3-direct', label: 'Ammonia (NH₃)', category: 'Unsupported', type: 'Gas Emissions', isSupported: false, note: 'Not typically exposed via standard PC NetCDF', unit: 'mol/m²' },
];

export const ATMOSPHERE_VISUAL_LAYERS = [
  {
    id: 'AIRS_L3_Methane_400hPa_Volume_Mixing_Ratio_Daily_Day',
    label: 'Methane 400 hPa',
    gas: 'CH4',
    category: 'Methane',
    provider: 'NASA GIBS / Aqua AIRS',
    cadence: 'Daily daytime layer',
    unit: 'ppbv',
    color: '#f59e0b',
    description: 'Global AIRS Level-3 methane volume mixing ratio rendered as a WMS raster layer.',
  },
  {
    id: 'AIRS_L3_Carbon_Monoxide_500hPa_Volume_Mixing_Ratio_Daily_Day',
    label: 'Carbon monoxide 500 hPa',
    gas: 'CO',
    category: 'Combustion',
    provider: 'NASA GIBS / Aqua AIRS',
    cadence: 'Daily daytime layer',
    unit: 'ppbv',
    color: '#ef4444',
    description: 'AIRS Level-3 carbon monoxide volume mixing ratio, useful for smoke and combustion transport context.',
  },
  {
    id: 'TROPOMI_L2_Nitrogen_Dioxide_Tropospheric_Column',
    label: 'Nitrogen dioxide column',
    gas: 'NO2',
    category: 'Emissions',
    provider: 'NASA GIBS / Sentinel-5P TROPOMI',
    cadence: 'Daily swath layer',
    unit: 'mol/m2',
    color: '#ec4899',
    description: 'TROPOMI tropospheric NO2 column visualization for combustion and industrial emission plumes.',
  },
  {
    id: 'TROPOMI_L2_Sulfur_Dioxide_Total_Vertical_Column',
    label: 'Sulfur dioxide column',
    gas: 'SO2',
    category: 'Emissions',
    provider: 'NASA GIBS / Sentinel-5P TROPOMI',
    cadence: 'Daily swath layer',
    unit: 'DU',
    color: '#eab308',
    description: 'TROPOMI total vertical SO2 column layer for volcanic, industrial, and smoke chemistry context.',
  },
  {
    id: 'AIRS_Prata_SO2_Index_Day',
    label: 'SO2 Prata index',
    gas: 'SO2',
    category: 'Emissions',
    provider: 'NASA GIBS / Aqua AIRS',
    cadence: 'Daily daytime layer',
    unit: 'index',
    color: '#f97316',
    description: 'AIRS Prata sulfur dioxide index layer, available through the same WMS visualization API.',
  },
  {
    id: 'VIIRS_SNPP_AOD_Dark_Target_Land_Ocean',
    label: 'Aerosol optical depth',
    gas: 'AOD',
    category: 'Aerosols',
    provider: 'NASA GIBS / Suomi NPP VIIRS',
    cadence: 'Daily layer',
    unit: 'AOD',
    color: '#38bdf8',
    description: 'VIIRS aerosol optical depth layer for smoke, dust, and haze context over Kazakhstan.',
  },
];

export const GIBS_SOURCE = {
  name: 'NASA GIBS WMS',
  url: 'https://gibs.earthdata.nasa.gov/',
  metadataUrl: 'https://gibs.earthdata.nasa.gov/layer-metadata/v1.0/',
};

export const getAtmosphereVisualLayer = (layerId) =>
  ATMOSPHERE_VISUAL_LAYERS.find((layer) => layer.id === layerId) || ATMOSPHERE_VISUAL_LAYERS[0];

export const getAtmosphereLayerColor = (layerId) =>
  getAtmosphereVisualLayer(layerId)?.color || '#888be0';

export const buildGibsWmsTileUrl = ({ layerId, date }) => {
  const params = new URLSearchParams({
    SERVICE: 'WMS',
    VERSION: '1.3.0',
    REQUEST: 'GetMap',
    LAYERS: layerId,
    STYLES: '',
    FORMAT: 'image/png',
    TRANSPARENT: 'TRUE',
    WIDTH: '256',
    HEIGHT: '256',
    CRS: 'EPSG:3857',
    BBOX: '{bbox-epsg-3857}',
  });

  if (date) params.set('TIME', date);
  return `${GIBS_WMS_EPSG3857}?${params.toString()}`
    .replace('%7Bbbox-epsg-3857%7D', '{bbox-epsg-3857}');
};

export const createAtmosphereMapLayer = ({ layerId, date, opacity = 80 }) => {
  const definition = getAtmosphereVisualLayer(layerId);
  const layerKey = `${layerId}-${date || 'latest'}`;
  const id = `atmosphere-${layerKey}`;

  return {
    id,
    layerId: id,
    sourceId: `${id}-source`,
    gibsLayerId: layerId,
    name: definition.label,
    productName: definition.gas,
    category: definition.category,
    provider: definition.provider,
    cadence: definition.cadence,
    acquisitionDate: date,
    date,
    visible: true,
    opacity,
    bounds: KAZAKHSTAN_BOUNDS,
    tileUrl: buildGibsWmsTileUrl({ layerId, date }),
  };
};

// ── Transform a PC STAC feature into our unified shape ───────────────────

function transformFeature(feature) {
  const props = feature.properties || {};

  const acquisitionDate = props.datetime || props.start_datetime || props.end_datetime;
  
  // S5P specific properties mapping
  const productName = props['s5p:product_name'] || 'unknown';
  const processingMode = props['s5p:processing_mode'] || '';
  
  return {
    id:                feature.id,
    name:              feature.id,
    mission:           props.platform || 'Sentinel-5P',
    collection:        feature.collection,
    productName:       productName,
    processingMode:    processingMode,
    acquisitionDate:   acquisitionDate,
    cloudCover:        null, // Cloud cover metrics for S5P are complex and usually embedded in the NetCDF or not uniformly provided
    geometry:          feature.geometry,
    bbox:              feature.bbox || null,
    thumbnailUrl:      null, // PC doesn't usually generate standard png thumbnails for netcdf 
    sceneId:           feature.id,
    
    // Allow rendering logic in the UI layer panel.
    isRenderSupported: true, 
  };
}

// ── Search Atmosphere via Planetary Computer STAC ────────────────────────────

export async function searchAtmosphere({
  product = 'ch4',
  startDate,
  endDate,
  bbox,
  maxRecords = 20,
  signal,
}) {
  if (!startDate || !endDate) {
    throw new Error('Please select start and end dates');
  }

  const prodDef = ATMOSPHERE_PRODUCTS.find(p => p.id === product);
  if (prodDef && !prodDef.isSupported) {
    throw new Error(`${prodDef.label} is currently unsupported by the selected data provider.`);
  }
  if (prodDef && prodDef.category === 'Derived / Modeled') {
    throw new Error('Derived/Modeled products (e.g. CAMS) are included in the UI concept but not natively indexed under this PC STAC collection currently.');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) throw new Error('End date must be after start date');

  // Allow up to 6 months
  const diffDays = (end - start) / (1000 * 60 * 60 * 24);
  if (diffDays > 180) throw new Error('Date range cannot exceed 6 months');

  const url = new URL(PC_STAC_SEARCH);
  
  // PC puts all S5P under one generic collection
  url.searchParams.append('collections', 'sentinel-5p-l2-netcdf');
  url.searchParams.set('limit', String(maxRecords));

  const dtStart = startDate.includes('T') ? startDate : `${startDate}T00:00:00Z`;
  const dtEnd = endDate.includes('T') ? endDate : `${endDate}T23:59:59Z`;
  url.searchParams.set('datetime', `${dtStart}/${dtEnd}`);

  if (bbox && bbox.length === 4) {
    url.searchParams.set('bbox', bbox.join(','));
  }

  // Filter exactly by Sentinel 5P product
  // CQL2 JSON or Text filtering
  const filters = [];
  if (product && product !== 'all') {
    filters.push(`s5p:product_name = '${product}'`);
  }

  if (filters.length > 0) {
    url.searchParams.set('filter', filters.join(' AND '));
    url.searchParams.set('filter-lang', 'cql2-text');
  }

  const data = await cachedRequest(
    createCacheKey('atmosphere-search', url.toString()),
    () => fetchJson(url.toString(), { signal }),
    { signal }
  );
  const features = (data.features || []).map(transformFeature);
  return {
    features,
    totalResults: data.numberReturned || features.length,
    numberMatched: data.numberMatched || null,
  };
}

// ── Sort helpers ─────────────────────────────────────────────────────────

export function sortAtmosphereResults(results, sortBy = 'date', sortOrder = 'desc') {
  const sorted = [...results];
  sorted.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'date') {
      cmp = new Date(a.acquisitionDate || 0) - new Date(b.acquisitionDate || 0);
    }
    return sortOrder === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

// ── Format helpers ───────────────────────────────────────────────────────

export function formatAtmosphereDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function getAtmosphereProductLabel(productId) {
  const match = ATMOSPHERE_PRODUCTS.find(p => p.id === productId);
  return match ? match.label : productId;
}

export function getAtmosphereProductUnit(productId) {
  const match = ATMOSPHERE_PRODUCTS.find(p => p.id === productId);
  return match?.unit || 'N/A';
}

export function getAtmosphereProductColor(productId) {
  return {
    'ch4':    '#f59e0b', // Amber/Orange
    'co':     '#ef4444', // Red
    'no2':    '#ec4899', // Pink
    'so2':    '#eab308', // Yellow
    'hcho':   '#8b5cf6', // Purple
    'o3':     '#3b82f6', // Blue
    'aer-ai': '#64748b', // Slate/Gray
    'aer-lh': '#94a3b8', // Light Slate
  }[productId] || '#10b981';
}
