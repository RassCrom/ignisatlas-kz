/**
 * Unified Sentinel Search Service
 * Uses the Copernicus Data Space Ecosystem STAC API (free, no auth required for search).
 * Migrated from Resto API (decommissioned Feb 2026) to STAC API.
 */

const STAC_SEARCH = 'https://stac.dataspace.copernicus.eu/v1/search';

/**
 * STAC collection IDs for each Sentinel mission.
 * These are the actual collection names used by the CDSE STAC catalog.
 */
const COLLECTION_MAP = {
  'sentinel-1':  ['sentinel-1-grd'],
  'sentinel-2':  ['sentinel-2-l2a'],
  'sentinel-3':  ['sentinel-3-olci-lfr'],
  'sentinel-5p': ['sentinel-5p-l2'],
};

const ALL_MISSIONS = ['sentinel-1', 'sentinel-2', 'sentinel-3', 'sentinel-5p'];

// ── Transform a STAC feature into our unified shape ─────────────────────

function transformFeature(feature, mission) {
  const props = feature.properties || {};

  // Extract thumbnail URL — STAC puts it in assets.thumbnail
  let thumbnailUrl = null;
  if (feature.assets?.thumbnail?.href) {
    thumbnailUrl = feature.assets.thumbnail.href;
    // The thumbnail.alternate.s3 has direct access but main href needs auth
    // Try the s3-alternate which is publicly readable through the CDSE endpoint
    const altS3 = feature.assets.thumbnail?.alternate?.s3;
    if (altS3?.href) {
      // Convert s3:// path to HTTPS endpoint
      thumbnailUrl = altS3.href.replace(
        's3://eodata/',
        'https://catalogue.dataspace.copernicus.eu/odata/v1/Assets/'
      );
    }
    // Fallback: keep the main href (may require auth for viewing)
    if (!thumbnailUrl) thumbnailUrl = feature.assets.thumbnail.href;
  }

  return {
    id:                feature.id,
    name:              feature.id,
    mission:           mission,
    acquisitionDate:   props.datetime || props.start_datetime,
    cloudCover:        props['eo:cloud_cover'] ?? null,
    productType:       props['product:type'] || '',
    processingLevel:   props['processing:level'] || '',
    orbitDirection:    props['sat:orbit_state'] || '',
    geometry:          feature.geometry,
    bbox:              feature.bbox || null,
    thumbnailUrl:      thumbnailUrl,
    sceneId:           feature.id,
    size:              null, // STAC doesn't include total size at top level
    orbitNumber:       props['sat:absolute_orbit'] || null,
    relativeOrbitNumber: props['sat:relative_orbit'] || null,
    platform:          props.platform || '',
    instrument:        (props.instruments || []).join(', '),
    published:         props.published || props.created || null,
    constellation:     props.constellation || '',
    snowCover:         props['eo:snow_cover'] ?? null,
    gridCode:          props['grid:code'] || '',
  };
}

// ── Search a single collection via STAC ──────────────────────────────────

async function searchCollection(mission, {
  startDate,
  endDate,
  bbox,
  cloudCoverage,
  limit = 20,
  page = 1,
}) {
  const collections = COLLECTION_MAP[mission];
  if (!collections) throw new Error(`Unknown mission: ${mission}`);

  // Build STAC search URL with GET parameters
  const url = new URL(STAC_SEARCH);
  url.searchParams.set('collections', collections.join(','));
  url.searchParams.set('limit', String(limit));

  // STAC uses ISO 8601 datetime ranges
  const dtStart = startDate.includes('T') ? startDate : `${startDate}T00:00:00Z`;
  const dtEnd = endDate.includes('T') ? endDate : `${endDate}T23:59:59Z`;
  url.searchParams.set('datetime', `${dtStart}/${dtEnd}`);

  // Spatial filter
  if (bbox && bbox.length === 4) {
    url.searchParams.set('bbox', bbox.join(','));
  }

  // STAC filter for cloud cover (uses CQL2 query parameter)
  // Note: only works for collections that have eo:cloud_cover
  if (cloudCoverage != null && mission !== 'sentinel-1') {
    url.searchParams.set(
      'filter',
      `eo:cloud_cover <= ${cloudCoverage}`
    );
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
    const features = (data.features || []).map((f) => transformFeature(f, mission));
    return {
      features,
      totalResults: data.numberReturned || features.length,
      numberMatched: data.numberMatched || null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// ── Main search function (supports "all" missions) ───────────────────────

export async function searchSentinel({
  mission = 'sentinel-2',
  startDate,
  endDate,
  bbox,
  cloudCoverage = 30,
  maxRecords = 20,
  page = 1,
}) {
  if (!startDate || !endDate) {
    throw new Error('Выберите начальную и конечную даты');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) throw new Error('Конечная дата должна быть позже начальной');

  const diffDays = (end - start) / (1000 * 60 * 60 * 24);
  if (diffDays > 365) throw new Error('Диапазон дат не может превышать 1 год');

  const missions = mission === 'all' ? ALL_MISSIONS : [mission];

  // For "all", split maxRecords across missions
  const perMission = mission === 'all'
    ? Math.max(5, Math.ceil(maxRecords / missions.length))
    : maxRecords;

  const results = await Promise.allSettled(
    missions.map((m) =>
      searchCollection(m, { startDate, endDate, bbox, cloudCoverage, limit: perMission, page })
    )
  );

  let allFeatures = [];
  let totalResults = 0;
  const errors = [];

  results.forEach((result, idx) => {
    if (result.status === 'fulfilled') {
      allFeatures = allFeatures.concat(result.value.features);
      totalResults += result.value.totalResults;
    } else {
      errors.push(`${missions[idx]}: ${result.reason?.message || 'Unknown error'}`);
    }
  });

  if (allFeatures.length === 0 && errors.length > 0) {
    throw new Error(`Ошибка поиска:\n${errors.join('\n')}`);
  }

  return { features: allFeatures, totalResults, errors };
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
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatFileSize(bytes) {
  if (!bytes) return 'N/A';
  const num = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
  if (isNaN(num)) return bytes; // already formatted (e.g., "1.2 GB")
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(num) / Math.log(1024));
  return `${(num / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
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
  if (pct <= 10) return 'Отлично';
  if (pct <= 30) return 'Хорошо';
  if (pct <= 60) return 'Средне';
  return 'Плохо';
}

export function getMissionColor(mission) {
  const colors = {
    'sentinel-1':  '#f97316',
    'sentinel-2':  '#3b82f6',
    'sentinel-3':  '#8b5cf6',
    'sentinel-5p': '#06b6d4',
  };
  return colors[mission] || '#6b7280';
}

export function getMissionLabel(mission) {
  const labels = {
    'sentinel-1':  'S-1 SAR',
    'sentinel-2':  'S-2 Optical',
    'sentinel-3':  'S-3',
    'sentinel-5p': 'S-5P',
  };
  return labels[mission] || mission;
}
