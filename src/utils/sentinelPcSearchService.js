const PC_STAC      = 'https://planetarycomputer.microsoft.com/api/stac/v1/search';
const PC_TILE_BASE = 'https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad';
const CDSE_STAC    = 'https://stac.dataspace.copernicus.eu/v1/search';

// ── Band / preset configurations ─────────────────────────────────────────────

export const S2_BAND_CONFIGS = {
  'true-color': {
    assets: ['visual'],
    assetBidx: 'visual|1,2,3',
    nodata: '0',
    label: 'True Color (RGB)',
  },

  'false-color':   { assets: ['B08', 'B04', 'B03'], rescale: '0,3000', label: 'False Color (NIR-R-G)' },
  'swir-fire':     { assets: ['B12', 'B08', 'B04'], rescale: '0,3000', label: 'SWIR Fire / Burn Scar' },
  'swir-moisture': { assets: ['B11', 'B08', 'B02'], rescale: '0,3000', label: 'SWIR Vegetation Moisture' },
  'agriculture':   { assets: ['B11', 'B08', 'B04'], rescale: '0,3000', label: 'Agriculture (SWIR1-NIR-R)' },
  'geology':       { assets: ['B12', 'B11', 'B02'], rescale: '0,3000', label: 'Geology / Bare Soil' },
  'nir-swir':      { assets: ['B8A', 'B11', 'B04'], rescale: '0,3000', label: 'NIR-SWIR Burn Severity' },

  'ndvi': { assets: ['B08', 'B04'], expression: '(B08-B04)/(B08+B04)', rescale: '-1,1', colormap_name: 'rdylgn', label: 'NDVI Vegetation Index' },
  'nbr':  { assets: ['B08', 'B12'], expression: '(B08-B12)/(B08+B12)', rescale: '-1,1', colormap_name: 'rdylgn_r', label: 'NBR Burn Severity Index' },
  'ndwi': { assets: ['B03', 'B08'], expression: '(B03-B08)/(B03+B08)', rescale: '-1,1', colormap_name: 'curl', label: 'NDWI Water Index' },
};

export const S1_BAND_CONFIGS = {
  'vv':    { assets: ['vv'],       rescale: '0,0.4', colormap_name: 'greys_r', label: 'VV Amplitude' },
  'vh':    { assets: ['vh'],       rescale: '0,0.2', colormap_name: 'greys_r', label: 'VH Amplitude' },
  'vv-vh': { assets: ['vv', 'vh'], bidx: [1, 2, 1],  rescale: '0,0.4', formula: 'gamma+RGB+1.3', label: 'VV/VH Color Composite' },
};

// ── Tile URL builders ─────────────────────────────────────────────────────────

export function buildS2TileUrl(itemId, preset) {
  const cfg = S2_BAND_CONFIGS[preset] || S2_BAND_CONFIGS['true-color'];
  const params = new URLSearchParams({
    collection: 'sentinel-2-l2a',
    item: itemId,
    format: 'png',
  });

  for (const asset of cfg.assets) params.append('assets', asset);

  if (cfg.expression) {
    params.set('expression', cfg.expression);
    params.set('rescale', cfg.rescale);
    params.set('colormap_name', cfg.colormap_name);
  } else {
    if (cfg.assetBidx) params.set('asset_bidx', cfg.assetBidx);
    if (cfg.nodata) params.set('nodata', cfg.nodata);
    if (cfg.rescale) params.set('rescale', cfg.rescale);
  }

  return `${PC_TILE_BASE}/{z}/{x}/{y}@1x?${params.toString()}`;
}

export function buildS1TileUrl(itemId, preset) {
  const cfg = S1_BAND_CONFIGS[preset] || S1_BAND_CONFIGS['vv'];
  let url = `${PC_TILE_BASE}/{z}/{x}/{y}@1x?collection=sentinel-1-rtc&item=${itemId}`;
  cfg.assets.forEach((a) => { url += `&assets=${a}`; });
  if (cfg.bidx) cfg.bidx.forEach((b) => { url += `&bidx=${b}`; });
  url += `&rescale=${cfg.rescale}`;
  if (cfg.colormap_name) url += `&colormap_name=${cfg.colormap_name}`;
  if (cfg.formula)       url += `&color_formula=${cfg.formula}`;
  url += `&format=png`;
  return url;
}

// ── Feature transformers ──────────────────────────────────────────────────────

function transformS2Feature(feature) {
  const props = feature.properties || {};
  return {
    id:              feature.id,
    name:            feature.id,
    mission:         'sentinel-2',
    acquisitionDate: props.datetime || props.start_datetime,
    cloudCover:      props['eo:cloud_cover'] ?? null,
    productType:     props['s2:product_type'] || '',
    platform:        props.platform || '',
    mgrsTile:        props['s2:mgrs_tile'] || '',
    geometry:        feature.geometry,
    bbox:            feature.bbox || null,
    thumbnailUrl:    feature.assets?.rendered_preview?.href || null,
    sceneId:         feature.id,
  };
}

function transformS1Feature(feature) {
  const props = feature.properties || {};
  return {
    id:              feature.id,
    name:            feature.id,
    mission:         'sentinel-1',
    acquisitionDate: props.datetime || props.start_datetime,
    cloudCover:      null, // SAR — no cloud cover
    productType:     props['sar:product_type'] || '',
    platform:        props.platform || '',
    orbitDirection:  props['sat:orbit_state'] || '',
    polarizations:   (props['sar:polarizations'] || []).join('/'),
    geometry:        feature.geometry,
    bbox:            feature.bbox || null,
    thumbnailUrl:    feature.assets?.rendered_preview?.href || null,
    sceneId:         feature.id,
  };
}

function transformS5PFeature(feature) {
  const props = feature.properties || {};
  return {
    id:              feature.id,
    name:            feature.id,
    mission:         'sentinel-5p',
    acquisitionDate: props.datetime || props.start_datetime,
    cloudCover:      null,
    productType:     props['s5p:product_type'] || props['product:type'] || '',
    platform:        props.platform || 'sentinel-5p',
    geometry:        feature.geometry,
    bbox:            feature.bbox || null,
    thumbnailUrl:    feature.assets?.rendered_preview?.href || null,
    sceneId:         feature.id,
  };
}

// S-3 is fetched from CDSE STAC (not available on PC)
function transformCdseS3Feature(feature) {
  const props = feature.properties || {};
  return {
    id:              feature.id,
    name:            feature.id,
    mission:         'sentinel-3',
    acquisitionDate: props.datetime || props.start_datetime,
    cloudCover:      props['eo:cloud_cover'] ?? null,
    productType:     props['product:type'] || '',
    platform:        props.platform || '',
    instrument:      (props.instruments || []).join(', '),
    geometry:        feature.geometry,
    bbox:            feature.bbox || null,
    thumbnailUrl:    feature.assets?.thumbnail?.href || null,
    sceneId:         feature.id,
    collection:      feature.collection || '',
  };
}

// ── Low-level collection search helpers ──────────────────────────────────────

async function searchPcCollection(collection, { startDate, endDate, bbox, cloudCoverage, limit }) {
  const url = new URL(PC_STAC);
  url.searchParams.set('collections', collection);
  url.searchParams.set('limit', String(limit));

  const dtStart = startDate.includes('T') ? startDate : `${startDate}T00:00:00Z`;
  const dtEnd   = endDate.includes('T')   ? endDate   : `${endDate}T23:59:59Z`;
  url.searchParams.set('datetime', `${dtStart}/${dtEnd}`);

  if (bbox && bbox.length === 4) {
    url.searchParams.set('bbox', bbox.join(','));
  }

  // Cloud cover CQL2 filter for optical collections only
  if (cloudCoverage != null && collection === 'sentinel-2-l2a') {
    url.searchParams.set('filter', `eo:cloud_cover <= ${cloudCoverage}`);
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
    return data.features || [];
  } finally {
    clearTimeout(timeout);
  }
}

async function searchCdseCollections(collections, { startDate, endDate, bbox, limit }) {
  const url = new URL(CDSE_STAC);
  url.searchParams.set('collections', collections.join(','));
  url.searchParams.set('limit', String(limit));

  const dtStart = startDate.includes('T') ? startDate : `${startDate}T00:00:00Z`;
  const dtEnd   = endDate.includes('T')   ? endDate   : `${endDate}T23:59:59Z`;
  url.searchParams.set('datetime', `${dtStart}/${dtEnd}`);

  if (bbox && bbox.length === 4) {
    url.searchParams.set('bbox', bbox.join(','));
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
    return data.features || [];
  } finally {
    clearTimeout(timeout);
  }
}

// ── Main search function ──────────────────────────────────────────────────────

export async function searchSentinelPc({
  mission = 'sentinel-2',
  startDate,
  endDate,
  bbox,
  cloudCoverage = 30,
  maxRecords = 20,
}) {
  if (!startDate || !endDate) throw new Error('Select start and end dates');

  const start = new Date(startDate);
  const end   = new Date(endDate);
  if (end < start) throw new Error('End date must be after start date');
  if ((end - start) / 86400000 > 365) throw new Error('Date range cannot exceed 1 year');

  const missions = mission === 'all'
    ? ['sentinel-1', 'sentinel-2', 'sentinel-3', 'sentinel-5p']
    : [mission];

  const perMission = mission === 'all'
    ? Math.max(5, Math.ceil(maxRecords / missions.length))
    : maxRecords;

  const args = { startDate, endDate, bbox, cloudCoverage, limit: perMission };

  const tasks = missions.map(async (m) => {
    switch (m) {
      case 'sentinel-2': {
        const raw = await searchPcCollection('sentinel-2-l2a', args);
        return raw.map(transformS2Feature);
      }
      case 'sentinel-1': {
        const raw = await searchPcCollection('sentinel-1-rtc', args);
        return raw.map(transformS1Feature);
      }
      case 'sentinel-5p': {
        const raw = await searchPcCollection('sentinel-5p-l2-netcdf', args);
        return raw.map(transformS5PFeature);
      }
      case 'sentinel-3': {
        const raw = await searchCdseCollections(
          ['sentinel-3-olci-efr', 'sentinel-3-slstr-frp'],
          args
        );
        return raw.map(transformCdseS3Feature);
      }
      default:
        return [];
    }
  });

  const settled = await Promise.allSettled(tasks);
  let allFeatures = [];
  let totalResults = 0;
  const errors = [];

  settled.forEach((result, idx) => {
    if (result.status === 'fulfilled') {
      allFeatures = allFeatures.concat(result.value);
      totalResults += result.value.length;
    } else {
      errors.push(`${missions[idx]}: ${result.reason?.message || 'Unknown error'}`);
    }
  });

  if (allFeatures.length === 0 && errors.length > 0) {
    throw new Error(`Search failed:\n${errors.join('\n')}`);
  }

  return { features: allFeatures, totalResults, errors };
}

// ── Sort / format helpers ─────────────────────────────────────────────────────

export function sortResults(results, sortBy = 'date', sortOrder = 'desc') {
  const sorted = [...results];
  sorted.sort((a, b) => {
    const cmp = sortBy === 'cloudCover'
      ? (a.cloudCover ?? 999) - (b.cloudCover ?? 999)
      : new Date(a.acquisitionDate || 0) - new Date(b.acquisitionDate || 0);
    return sortOrder === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

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
    'sentinel-1':  '#f97316',
    'sentinel-2':  '#3b82f6',
    'sentinel-3':  '#8b5cf6',
    'sentinel-5p': '#06b6d4',
  }[mission] || '#6b7280';
}

export function getMissionLabel(mission) {
  return {
    'sentinel-1':  'S-1 SAR',
    'sentinel-2':  'S-2 Optical',
    'sentinel-3':  'S-3',
    'sentinel-5p': 'S-5P',
  }[mission] || mission;
}
