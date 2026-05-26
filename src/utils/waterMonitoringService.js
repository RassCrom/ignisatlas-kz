import {
  formatDate,
  getCloudCoverColor,
  getCloudCoverLabel,
  searchSentinelPc,
} from './sentinelPcSearchService';
import { cachedRequest, createCacheKey, fetchJson } from './requestCache';

const PC_STAC_SEARCH = 'https://planetarycomputer.microsoft.com/api/stac/v1/search';
const PC_TILE_BASE = 'https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad';
const SEARCH_WINDOW_DAYS = 31;

export const WATER_INDEX_CONFIGS = [
  {
    id: 'mndwi',
    label: 'MNDWI Surface Water',
    shortLabel: 'MNDWI',
    family: 'extent',
    collection: 'sentinel-2-l2a',
    assets: ['B03', 'B11'],
    expression: '(B03-B11)/(B03+B11)',
    rescale: '-1,1',
    colormap: 'blues',
    description: 'Green-SWIR water index for monthly surface-water extent and shrinkage checks.',
  },
  {
    id: 'ndwi',
    label: 'NDWI Open Water',
    shortLabel: 'NDWI',
    family: 'extent',
    collection: 'sentinel-2-l2a',
    assets: ['B03', 'B08'],
    expression: '(B03-B08)/(B03+B08)',
    rescale: '-1,1',
    colormap: 'blues',
    description: 'Green-NIR water index for open-water delineation and shoreline comparison.',
  },
  {
    id: 'awei',
    label: 'AWEI Shadow Resistant Water',
    shortLabel: 'AWEI',
    family: 'extent',
    collection: 'sentinel-2-l2a',
    assets: ['B02', 'B03', 'B08', 'B11', 'B12'],
    expression: 'B02+2.5*B03-1.5*(B08+B11)-0.25*B12',
    rescale: '-6000,6000',
    colormap: 'blues',
    description: 'Automated Water Extraction Index for turbid or shadow-affected water boundaries.',
  },
  {
    id: 'ndti',
    label: 'NDTI Turbidity Proxy',
    shortLabel: 'NDTI',
    family: 'quality',
    collection: 'sentinel-2-l2a',
    assets: ['B04', 'B03'],
    expression: '(B04-B03)/(B04+B03)',
    rescale: '-0.5,0.7',
    colormap: 'ylorrd',
    description: 'Red-Green turbidity proxy for sediment load and shallow-water disturbance.',
  },
  {
    id: 'ndci',
    label: 'NDCI Chlorophyll-a Proxy',
    shortLabel: 'NDCI',
    family: 'quality',
    collection: 'sentinel-2-l2a',
    assets: ['B05', 'B04'],
    expression: '(B05-B04)/(B05+B04)',
    rescale: '-0.4,0.8',
    colormap: 'viridis',
    description: 'Sentinel-2 red-edge chlorophyll-a proxy for algal bloom screening in reservoirs.',
  },
  {
    id: 'true-color-water',
    label: 'True Color Context',
    shortLabel: 'RGB',
    family: 'context',
    collection: 'sentinel-2-l2a',
    assets: ['visual'],
    assetBidx: 'visual|1,2,3',
    nodata: '0',
    description: 'Visual context for shoreline and bloom interpretation.',
  },
  {
    id: 'olci-chl-nn',
    label: 'Sentinel-3 OLCI Chlorophyll-a NN',
    shortLabel: 'OLCI CHL',
    family: 'quality',
    collection: 'sentinel-3-olci-wfr-l2-netcdf',
    assets: ['chl_nn'],
    rescale: '0,30',
    colormap: 'viridis',
    description: 'Sentinel-3 OLCI neural-network chlorophyll-a product for eutrophication monitoring.',
  },
  {
    id: 'olci-chl-oc4me',
    label: 'Sentinel-3 OLCI Chlorophyll-a OC4ME',
    shortLabel: 'OC4ME',
    family: 'quality',
    collection: 'sentinel-3-olci-wfr-l2-netcdf',
    assets: ['chl_oc4me'],
    rescale: '0,30',
    colormap: 'viridis',
    description: 'Sentinel-3 OLCI ocean-color chlorophyll-a product for bloom trend screening.',
  },
];

export const getWaterIndexConfig = (indexId) =>
  WATER_INDEX_CONFIGS.find((index) => index.id === indexId) || WATER_INDEX_CONFIGS[0];

const shiftDate = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().split('T')[0];
};

export const getWaterSearchDateRange = (date) => ({
  startDate: shiftDate(date, -SEARCH_WINDOW_DAYS),
  endDate: date,
});

const isSentinel2Index = (index) => index.collection === 'sentinel-2-l2a';

const transformPcFeature = (feature) => {
  const props = feature.properties || {};
  return {
    id: feature.id,
    name: feature.id,
    collection: feature.collection,
    mission: props.platform || feature.collection,
    acquisitionDate: props.datetime || props.start_datetime,
    cloudCover: props['eo:cloud_cover'] ?? null,
    productType: props['s2:product_type'] || props['product:type'] || '',
    geometry: feature.geometry,
    bbox: feature.bbox || null,
    thumbnailUrl: feature.assets?.rendered_preview?.href || feature.assets?.thumbnail?.href || null,
    sceneId: feature.id,
  };
};

async function searchPcCollection(collection, { startDate, endDate, bbox, maxRecords, signal }) {
  const url = new URL(PC_STAC_SEARCH);
  url.searchParams.set('collections', collection);
  url.searchParams.set('limit', String(maxRecords));
  url.searchParams.set('datetime', `${startDate}T00:00:00Z/${endDate}T23:59:59Z`);
  if (bbox?.length === 4) url.searchParams.set('bbox', bbox.join(','));

  const data = await cachedRequest(
    createCacheKey('water-monitoring-search', collection, url.toString()),
    () => fetchJson(url.toString(), { signal }),
    { signal }
  );
  const features = (data.features || []).map(transformPcFeature);
  return { features, totalResults: data.numberReturned || features.length };
}

export async function searchWaterMonitoring({
  indexId,
  date,
  bbox,
  cloudCoverage = 35,
  maxRecords = 20,
  signal,
}) {
  if (!date) throw new Error('Select a date');
  const index = getWaterIndexConfig(indexId);
  const { startDate, endDate } = getWaterSearchDateRange(date);

  if (isSentinel2Index(index)) {
    return searchSentinelPc({
      mission: 'sentinel-2',
      startDate,
      endDate,
      bbox,
      cloudCoverage,
      maxRecords,
      signal,
    });
  }

  return searchPcCollection(index.collection, {
    startDate,
    endDate,
    bbox,
    maxRecords,
    signal,
  });
}

export function buildWaterMonitoringTileUrl(itemId, indexId) {
  const index = getWaterIndexConfig(indexId);
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
