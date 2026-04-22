/**
 * Atmosphere Search Service
 * Uses Microsoft Planetary Computer STAC API (free, no auth required).
 * Focuses on Sentinel-5P Atmospheric composition and emissions products.
 */

const PC_STAC_SEARCH = 'https://planetarycomputer.microsoft.com/api/stac/v1/search';

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
