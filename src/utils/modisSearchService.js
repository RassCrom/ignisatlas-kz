/**
 * MODIS Search Service
 * Uses Microsoft Planetary Computer STAC API (free, no auth required).
 * Rendering via PC TiTiler tile server (XYZ tiles from COGs).
 */

const PC_STAC_SEARCH = 'https://planetarycomputer.microsoft.com/api/stac/v1/search';
const PC_TILE_BASE   = 'https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad';

// ── Product mapping ─────────────────────────────────────────────────────

export const MODIS_PRODUCTS = [
  { id: 'all',            label: 'All Products' },
  { id: 'modis-14A1-061', label: '14A1 (Daily Active Fire)' },
  { id: 'modis-11A2-061', label: '11A2 Land Surface Temperature/Emissivity 8-Day' },
  { id: 'modis-14A2-061', label: '14A2 (8-Day Active Fire)' },
  { id: 'modis-09A1-061', label: '09A1 (8-Day Surface Reflectance)' },
  { id: 'modis-64A1-061', label: '64A1 (Monthly Burned Area)' },
];

const MODIS_COLLECTIONS = MODIS_PRODUCTS.map(p => p.id).filter(id => id !== 'all');

// ── Band combinations → asset lists for tile rendering ───────────────────

export const BAND_CONFIGS = {
  // Surface Reflectance (09A1)
  'true-color':   {
    assets: ['sur_refl_b01', 'sur_refl_b04', 'sur_refl_b03'],
    params: 'color_formula=gamma+RGB+3.0%2C+saturation+1.9%2C+sigmoidal+RGB+0+0.55',
    product: 'modis-09A1-061'
  },
  'false-color':  {
    assets: ['sur_refl_b07', 'sur_refl_b02', 'sur_refl_b01'], // SWIR-NIR-Red useful for burn scars
    params: 'color_formula=gamma+RGB+3.0%2C+saturation+1.9%2C+sigmoidal+RGB+0+0.55',
    product: 'modis-09A1-061'
  },
  // Active Fires (14A1, 14A2)
  'fire-mask': {
    assets: ['FireMask'],
    params: 'colormap_name=modis-14A1%7CA2', // URL encoded | to prevent TiTiler 500 error
    product: 'modis-14A1-061' // APPLIES TO 14A2 AS WELL
  },
  // Burned Area (64A1)
  'burn-date': {
    assets: ['Burn_Date'],
    params: 'colormap_name=modis-64A1',
    product: 'modis-64A1-061'
  },
  // 11A2 Land Surface Temperature/Emissivity 8-Day
  'land-surface-temperature': {
    assets: ['LST_Day_1km', 'LST_Night_1km', 'QC_Day'],
    params: 'color_formula=gamma+RGB+3.0%2C+saturation+1.9%2C+sigmoidal+RGB+0+0.55',
    product: 'modis-11A2-061'
  }
};

// ── Build tile URL for a given STAC item ─────────────────────────────────

export function buildModisTileUrl(collection, itemId, bands = 'default') {
  // Determine which config matches the collection
  let configKey = bands;
  
  // Auto-map specialized collections if "default" is passed
  if (bands === 'default' || !BAND_CONFIGS[bands]) {
    if (collection.includes('14A')) configKey = 'fire-mask';
    else if (collection.includes('64A')) configKey = 'burn-date';
    else configKey = 'true-color';
  }

  const config = BAND_CONFIGS[configKey] || BAND_CONFIGS['true-color'];
  const assetParams = config.assets.map((a) => `assets=${a}`).join('&');
  
  return `${PC_TILE_BASE}/{z}/{x}/{y}@1x.png?collection=${collection}&item=${itemId}&${assetParams}&${config.params}&format=png`;
}

// ── Transform a PC STAC feature into our unified shape ───────────────────

function transformFeature(feature) {
  const props = feature.properties || {};

  // MODIS items often use start_datetime/end_datetime instead of exact datetime
  const acquisitionDate = props.datetime || props.start_datetime || props.end_datetime;
  
  // Get rendered preview from assets
  const previewUrl = feature.assets?.rendered_preview?.href || null;

  return {
    id:                feature.id,
    name:              feature.id,
    mission:           props.platform || 'MODIS',
    collection:        feature.collection,
    acquisitionDate:   acquisitionDate,
    cloudCover:        props['eo:cloud_cover'] ?? null, // Often omitted or 0 for MODIS composite items
    geometry:          feature.geometry,
    bbox:              feature.bbox || null,
    thumbnailUrl:      previewUrl,
    sceneId:           props['modis:tile-id'] || feature.id,
    horizontalTile:    props['modis:horizontal-tile'] || '',
    verticalTile:      props['modis:vertical-tile'] || '',
  };
}

// ── Search MODIS via Planetary Computer STAC ────────────────────────────

export async function searchModis({
  product = 'all',
  startDate,
  endDate,
  bbox,
  cloudCoverage = 100, // Important, MODIS composites don't strictly filter well by cloud cover
  maxRecords = 20,
}) {
  if (!startDate || !endDate) {
    throw new Error('Please select start and end dates');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) throw new Error('End date must be after start date');

  // MODIS spans can be large, allow wider search up to 1 year
  const diffDays = (end - start) / (1000 * 60 * 60 * 24);
  if (diffDays > 365) throw new Error('Date range cannot exceed 1 year');

  const url = new URL(PC_STAC_SEARCH);
  
  // Apply specific product or all supported MODIS products
  if (product === 'all') {
    MODIS_COLLECTIONS.forEach(c => url.searchParams.append('collections', c));
  } else {
    url.searchParams.append('collections', product);
  }
  
  url.searchParams.set('limit', String(maxRecords));

  const dtStart = startDate.includes('T') ? startDate : `${startDate}T00:00:00Z`;
  const dtEnd = endDate.includes('T') ? endDate : `${endDate}T23:59:59Z`;
  url.searchParams.set('datetime', `${dtStart}/${dtEnd}`);

  if (bbox && bbox.length === 4) {
    url.searchParams.set('bbox', bbox.join(','));
  }

  // Cloud cover filter (use cautiously with MODIS)
  const filters = [];
  if (cloudCoverage < 100) {
    filters.push(`eo:cloud_cover <= ${cloudCoverage}`);
  }

  if (filters.length > 0) {
    url.searchParams.set('filter', filters.join(' AND '));
    url.searchParams.set('filter-lang', 'cql2-text');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url.toString(), { signal: controller.signal });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}: ${response.statusText} ${text.slice(0, 200)}`);
    }
    const data = await response.json();
    const features = (data.features || []).map(transformFeature);
    return {
      features,
      totalResults: data.numberReturned || features.length,
      numberMatched: data.numberMatched || null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ── Sort helpers ─────────────────────────────────────────────────────────

export function sortModisResults(results, sortBy = 'date', sortOrder = 'desc') {
  const sorted = [...results];
  sorted.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'date') {
      cmp = new Date(a.acquisitionDate || 0) - new Date(b.acquisitionDate || 0);
    } else if (sortBy === 'cloudCover') {
      cmp = (a.cloudCover ?? 999) - (b.cloudCover ?? 999);
    }
    return sortOrder === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

// ── Format helpers ───────────────────────────────────────────────────────

export function formatModisDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function getModisProductColor(product) {
  return {
    'modis-14A1-061':  '#ef4444', // Red for fire
    'modis-14A2-061':  '#f97316', // Orange for fire 8-day
    'modis-09A1-061':  '#10b981', // Green for optical
    'modis-64A1-061':  '#8b5cf6', // Purple for burned area
  }[product] || '#6b7280';
}

export function getModisProductLabel(product) {
  const match = MODIS_PRODUCTS.find(p => p.id === product);
  return match ? match.label.substring(0, 4) : product; // returns "14A1", "09A1", etc.
}
