import { formatModisDate } from './modisSearchService';

const PC_STAC_SEARCH = 'https://planetarycomputer.microsoft.com/api/stac/v1/search';
const PC_TILE_BASE = 'https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad';

export const BURNED_AREA_COLLECTION = 'modis-64A1-061';

export const BURNED_AREA_DATASETS = [
  {
    id: 'Burn_Date',
    label: 'Burn date',
    description: 'Day of year when a pixel was detected as burned. Unburned pixels are hidden.',
    rescale: '1,366',
    colormap: 'hot',
    nodata: '0',
  },
  {
    id: 'Burn_Date_Uncertainty',
    label: 'Burn date uncertainty',
    description: 'Estimated uncertainty in the burn date, in days.',
    rescale: '0,100',
    colormap: 'magma',
  },
  {
    id: 'First_Day',
    label: 'First reliable day',
    description: 'First day of the year with reliable change detection.',
    rescale: '1,366',
    colormap: 'viridis',
  },
  {
    id: 'Last_Day',
    label: 'Last reliable day',
    description: 'Last day of the year with reliable change detection.',
    rescale: '1,366',
    colormap: 'viridis',
  },
  {
    id: 'QA',
    label: 'Quality assurance',
    description: 'Quality flags for land/water, valid data, shortened mapping period, and relabeling.',
    rescale: '0,15',
    colormap: 'plasma',
  },
];

export const getBurnedAreaDataset = (assetId) =>
  BURNED_AREA_DATASETS.find((dataset) => dataset.id === assetId) || BURNED_AREA_DATASETS[0];

export const getBurnedAreaMonthRange = (month) => {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return { startDate: '', endDate: '' };
  }

  const [year, monthIndex] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, monthIndex - 1, 1));
  const end = new Date(Date.UTC(year, monthIndex, 0, 23, 59, 59));
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
};

export function buildBurnedAreaTileUrl(collection, itemId, assetId = 'Burn_Date') {
  const dataset = getBurnedAreaDataset(assetId);
  const params = new URLSearchParams({
    collection,
    item: itemId,
    assets: dataset.id,
    rescale: dataset.rescale,
    colormap_name: dataset.colormap,
    format: 'png',
  });

  if (dataset.nodata) params.set('nodata', dataset.nodata);

  return `${PC_TILE_BASE}/{z}/{x}/{y}@1x.png?${params.toString()}`;
}

function transformBurnedAreaFeature(feature) {
  const props = feature.properties || {};
  const acquisitionDate = props.datetime || props.start_datetime || props.end_datetime;

  return {
    id: feature.id,
    name: feature.id,
    mission: props.platform || 'Terra+Aqua MODIS',
    collection: feature.collection,
    acquisitionDate,
    geometry: feature.geometry,
    bbox: feature.bbox || null,
    thumbnailUrl: feature.assets?.rendered_preview?.href || null,
    sceneId: props['modis:tile-id'] || feature.id,
    horizontalTile: props['modis:horizontal-tile'] || '',
    verticalTile: props['modis:vertical-tile'] || '',
  };
}

export async function searchBurnedAreas({
  month,
  bbox,
  maxRecords = 40,
}) {
  if (!month) throw new Error('Select a month');

  const { startDate, endDate } = getBurnedAreaMonthRange(month);
  const url = new URL(PC_STAC_SEARCH);
  url.searchParams.set('collections', BURNED_AREA_COLLECTION);
  url.searchParams.set('limit', String(maxRecords));
  url.searchParams.set('datetime', `${startDate}T00:00:00Z/${endDate}T23:59:59Z`);
  if (bbox?.length === 4) url.searchParams.set('bbox', bbox.join(','));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url.toString(), { signal: controller.signal });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
    }

    const data = await response.json();
    const features = (data.features || []).map(transformBurnedAreaFeature);
    return {
      features,
      totalResults: data.numberReturned || features.length,
      numberMatched: data.numberMatched || null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export { formatModisDate as formatBurnedAreaDate };
