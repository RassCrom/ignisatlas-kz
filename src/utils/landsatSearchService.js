/**
 * Landsat Search Service
 * Uses Microsoft Planetary Computer STAC API (free, no auth required).
 * Rendering via PC TiTiler tile server (XYZ tiles from COGs).
 */

const PC_STAC_SEARCH = 'https://planetarycomputer.microsoft.com/api/stac/v1/search';
const PC_TILE_BASE   = 'https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad';

// ── Platform mapping ─────────────────────────────────────────────────────

const PLATFORM_MAP = {
  'landsat-4': 'landsat-4',
  'landsat-5': 'landsat-5',
  'landsat-7': 'landsat-7',
  'landsat-8': 'landsat-8',
  'landsat-9': 'landsat-9',
};

const ALL_PLATFORMS = Object.values(PLATFORM_MAP);

// ── Band combinations → asset lists for tile rendering ───────────────────

const BAND_CONFIGS = {
  'true-color':   { assets: ['red', 'green', 'blue'],   formula: 'gamma+RGB+2.7%2C+saturation+1.5%2C+sigmoidal+RGB+15+0.55' },
  'false-color':  { assets: ['nir08', 'red', 'green'],   formula: 'gamma+RGB+2.7%2C+saturation+1.5%2C+sigmoidal+RGB+15+0.55' },
  'swir':         { assets: ['swir22', 'nir08', 'red'],   formula: 'gamma+RGB+2.7%2C+saturation+1.5%2C+sigmoidal+RGB+15+0.55' },
  'agriculture':  { assets: ['swir16', 'nir08', 'blue'],  formula: 'gamma+RGB+2.7%2C+saturation+1.5%2C+sigmoidal+RGB+15+0.55' },
};

// ── Build tile URL for a given STAC item ─────────────────────────────────

export function buildTileUrl(itemId, bands = 'true-color') {
  const config = BAND_CONFIGS[bands] || BAND_CONFIGS['true-color'];
  const assetParams = config.assets.map((a) => `assets=${a}`).join('&');
  return `${PC_TILE_BASE}/{z}/{x}/{y}@1x?collection=landsat-c2-l2&item=${itemId}&${assetParams}&color_formula=${config.formula}&format=png`;
}

// ── Transform a PC STAC feature into our unified shape ───────────────────

function transformFeature(feature) {
  const props = feature.properties || {};

  // Get rendered preview from assets
  const previewUrl = feature.assets?.rendered_preview?.href || null;
  const tileJsonUrl = feature.assets?.tilejson?.href || null;

  return {
    id:                feature.id,
    name:              feature.id,
    mission:           props.platform || '',
    acquisitionDate:   props.datetime,
    cloudCover:        props['eo:cloud_cover'] ?? null,
    productType:       props['landsat:correction'] || '',
    processingLevel:   'Level-2',
    geometry:          feature.geometry,
    bbox:              feature.bbox || null,
    thumbnailUrl:      previewUrl,
    tileJsonUrl:       tileJsonUrl,
    sceneId:           props['landsat:scene_id'] || feature.id,
    wrsPath:           props['landsat:wrs_path'] || '',
    wrsRow:            props['landsat:wrs_row'] || '',
    sunAzimuth:        props['view:sun_azimuth'] || null,
    sunElevation:      props['view:sun_elevation'] || null,
    instruments:       (props.instruments || []).join(', '),
    collectionCategory: props['landsat:collection_category'] || '',
    cloudCoverLand:    props['landsat:cloud_cover_land'] ?? null,
  };
}

// ── Search Landsat via Planetary Computer STAC ────────────────────────────

export async function searchLandsat({
  mission = 'all',
  startDate,
  endDate,
  bbox,
  cloudCoverage = 30,
  maxRecords = 20,
}) {
  if (!startDate || !endDate) {
    throw new Error('Please select start and end dates');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) throw new Error('End date must be after start date');

  const diffDays = (end - start) / (1000 * 60 * 60 * 24);
  if (diffDays > 365) throw new Error('Date range cannot exceed 1 year');

  // Build STAC search URL
  const url = new URL(PC_STAC_SEARCH);
  url.searchParams.set('collections', 'landsat-c2-l2');
  url.searchParams.set('limit', String(maxRecords));

  const dtStart = startDate.includes('T') ? startDate : `${startDate}T00:00:00Z`;
  const dtEnd = endDate.includes('T') ? endDate : `${endDate}T23:59:59Z`;
  url.searchParams.set('datetime', `${dtStart}/${dtEnd}`);

  if (bbox && bbox.length === 4) {
    url.searchParams.set('bbox', bbox.join(','));
  }

  // Build CQL2 filter for cloud cover and platform
  const filters = [];
  filters.push(`eo:cloud_cover <= ${cloudCoverage}`);

  if (mission !== 'all') {
    const platform = PLATFORM_MAP[mission];
    if (platform) {
      filters.push(`platform = '${platform}'`);
    }
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

export function sortResults(results, sortBy = 'date', sortOrder = 'desc') {
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

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function getCloudCoverColor(pct) {
  if (pct == null) return '#64748b';
  if (pct <= 10) return '#10b981';
  if (pct <= 30) return '#f59e0b';
  if (pct <= 60) return '#ef4444';
  return '#7c2d12';
}

export function getCloudCoverLabel(pct) {
  if (pct == null) return 'N/A';
  if (pct <= 10) return 'Excellent';
  if (pct <= 30) return 'Good';
  if (pct <= 60) return 'Fair';
  return 'Poor';
}

export function getMissionColor(mission) {
  return {
    'landsat-4':  '#a78bfa',
    'landsat-5':  '#8b5cf6',
    'landsat-7':  '#f97316',
    'landsat-8':  '#3b82f6',
    'landsat-9':  '#06b6d4',
  }[mission] || '#6b7280';
}

export function getMissionLabel(mission) {
  return {
    'landsat-4':  'L4 TM',
    'landsat-5':  'L5 TM',
    'landsat-7':  'L7 ETM+',
    'landsat-8':  'L8 OLI',
    'landsat-9':  'L9 OLI-2',
  }[mission] || mission;
}
