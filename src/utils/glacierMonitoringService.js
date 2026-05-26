import {
  formatDate,
  getCloudCoverColor,
  getCloudCoverLabel,
  searchSentinelPc,
} from './sentinelPcSearchService';

const PC_TILE_BASE = 'https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad';
const SEARCH_WINDOW_DAYS = 31;

export const GLACIER_INDEX_CONFIGS = [
  {
    id: 'ndsi',
    label: 'NDSI Snow and Ice Extent',
    shortLabel: 'NDSI',
    family: 'ice',
    collection: 'sentinel-2-l2a',
    assets: ['B03', 'B11'],
    expression: '(B03-B11)/(B03+B11)',
    rescale: '-1,1',
    colormap: 'blues',
    description: 'Green-SWIR normalized snow difference index for glacier snow and ice extent.',
  },
  {
    id: 'ndmi-ice',
    label: 'NDMI Ice Moisture',
    shortLabel: 'NDMI',
    family: 'moisture',
    collection: 'sentinel-2-l2a',
    assets: ['B08', 'B11'],
    expression: '(B08-B11)/(B08+B11)',
    rescale: '-1,1',
    colormap: 'brbg',
    description: 'NIR-SWIR moisture index for wet snow, firn moisture, and melt-condition screening.',
  },
  {
    id: 'nbr-ice-dust',
    label: 'NBR Debris and Ice Contrast',
    shortLabel: 'NBR',
    family: 'contrast',
    collection: 'sentinel-2-l2a',
    assets: ['B08', 'B12'],
    expression: '(B08-B12)/(B08+B12)',
    rescale: '-1,1',
    colormap: 'rdylgn_r',
    description: 'NIR-SWIR2 contrast useful for separating clean ice, debris, and exposed terrain.',
  },
  {
    id: 'swir-snow-ice',
    label: 'SWIR Snow/Ice Composite',
    shortLabel: 'SWIR',
    family: 'context',
    collection: 'sentinel-2-l2a',
    assets: ['B11', 'B08', 'B02'],
    rescale: '0,4000',
    description: 'SWIR-NIR-blue composite for snow, ice, debris cover, and terrain context.',
  },
  {
    id: 'true-color-glacier',
    label: 'True Color Context',
    shortLabel: 'RGB',
    family: 'context',
    collection: 'sentinel-2-l2a',
    assets: ['visual'],
    assetBidx: 'visual|1,2,3',
    nodata: '0',
    description: 'Visual context for interpreting glacier boundaries, cloud, snow, and shadow.',
  },
];

export const getGlacierIndexConfig = (indexId) =>
  GLACIER_INDEX_CONFIGS.find((index) => index.id === indexId) || GLACIER_INDEX_CONFIGS[0];

const shiftDate = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().split('T')[0];
};

export const getGlacierSearchDateRange = (date) => ({
  startDate: shiftDate(date, -SEARCH_WINDOW_DAYS),
  endDate: date,
});

export async function searchGlacierMonitoring({
  indexId,
  date,
  bbox,
  cloudCoverage = 25,
  maxRecords = 20,
  signal,
}) {
  if (!date) throw new Error('Select a date');
  const index = getGlacierIndexConfig(indexId);
  const { startDate, endDate } = getGlacierSearchDateRange(date);

  return searchSentinelPc({
    mission: 'sentinel-2',
    startDate,
    endDate,
    bbox,
    cloudCoverage,
    maxRecords,
    signal,
    collection: index.collection,
  });
}

export function buildGlacierMonitoringTileUrl(itemId, indexId) {
  const index = getGlacierIndexConfig(indexId);
  const params = new URLSearchParams({
    collection: index.collection,
    item: itemId,
    format: 'png',
  });

  index.assets.forEach((asset) => params.append('assets', asset));

  if (index.expression) {
    params.set('expression', index.expression);
    params.set('asset_as_band', 'true');
  } else if (index.assetBidx) {
    params.set('asset_bidx', index.assetBidx);
  }

  if (index.rescale) params.set('rescale', index.rescale);
  if (index.colormap) params.set('colormap_name', index.colormap);
  if (index.nodata) params.set('nodata', index.nodata);

  return `${PC_TILE_BASE}/{z}/{x}/{y}@1x?${params.toString()}`;
}

export {
  formatDate,
  getCloudCoverColor,
  getCloudCoverLabel,
};
