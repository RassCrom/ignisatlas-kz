import { formatModisDate } from './modisSearchService';
import { cachedRequest, createCacheKey, fetchJson } from './requestCache';

const PC_STAC_SEARCH = 'https://planetarycomputer.microsoft.com/api/stac/v1/search';
const PC_TILE_BASE = 'https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad';
const COLORMAP = 'rdylbu_r'; // blue → red

export const LST_PRODUCTS = [
  { id: 'modis-11A2-061', label: 'MODIS 11A2 — 8-Day LST (1 km)',    isMODIS: true  },
  { id: 'modis-11A1-061', label: 'MODIS 11A1 — Daily LST (1 km)',     isMODIS: true  },
  { id: 'landsat-c2-l2',  label: 'Landsat 8/9 — Surface Temp (30 m)', isMODIS: false },
];

export const LST_RANGE_C = { min: -3, max: 57 };

export function isModisProduct(productId) {
  return productId !== 'landsat-c2-l2';
}

// Convert source DN values to Celsius before rendering so tile colors and point
// inspection use the same temperature scale as the legend.
export function buildLstTileUrl(collection, itemId, obsTime = 'day') {
  const params = new URLSearchParams({
    collection,
    item: itemId,
    colormap_name: COLORMAP,
    rescale: `${LST_RANGE_C.min},${LST_RANGE_C.max}`,
    asset_as_band: 'true',
  });

  if (collection === 'landsat-c2-l2') {
    params.set('assets', 'lwir11');
    params.set('expression', 'lwir11*0.00341802+149-273.15');
    return `${PC_TILE_BASE}/{z}/{x}/{y}@1x.png?${params.toString()}`;
  }

  const asset = obsTime === 'night' ? 'LST_Night_1km' : 'LST_Day_1km';
  params.set('assets', asset);
  params.set('expression', `${asset}*0.02-273.15`);
  return `${PC_TILE_BASE}/{z}/{x}/{y}@1x.png?${params.toString()}`;
}

// How many days back from the selected date to open the search window
const SEARCH_WINDOW = {
  'modis-11A2-061': 20,
  'modis-11A1-061': 10,
  'landsat-c2-l2':  28,
};

async function searchModisLst({ product, startDate, endDate, bbox, maxRecords, signal }) {
  const url = new URL(PC_STAC_SEARCH);
  url.searchParams.set('collections', product);
  url.searchParams.set('limit', String(maxRecords));
  url.searchParams.set('datetime', `${startDate}T00:00:00Z/${endDate}T23:59:59Z`);
  if (bbox?.length === 4) url.searchParams.set('bbox', bbox.join(','));

  const data = await cachedRequest(
    createCacheKey('lst-modis-search', url.toString()),
    () => fetchJson(url.toString(), { signal }),
    { signal }
  );
  const features = (data.features || []).map((f) => {
    const props = f.properties || {};
    return {
      id:              f.id,
      name:            f.id,
      mission:         props.platform || 'MODIS',
      collection:      f.collection,
      acquisitionDate: props.datetime || props.start_datetime,
      cloudCover:      props['eo:cloud_cover'] ?? null,
      geometry:        f.geometry,
      bbox:            f.bbox || null,
      thumbnailUrl:    f.assets?.rendered_preview?.href || null,
      sceneId:         props['modis:tile-id'] || f.id,
    };
  });
  return { features, totalResults: data.numberReturned || features.length };
}

export async function searchLst({ product, date, bbox, maxRecords = 20, signal }) {
  const windowDays = SEARCH_WINDOW[product] ?? 10;
  const end   = new Date(date);
  const start = new Date(date);
  start.setDate(start.getDate() - (windowDays - 1));

  const startDate = start.toISOString().split('T')[0];
  const endDate   = end.toISOString().split('T')[0];

  if (product !== 'landsat-c2-l2') {
    return searchModisLst({ product, startDate, endDate, bbox, maxRecords, signal });
  }

  return searchLandsatLst({ startDate, endDate, bbox, maxRecords, signal });
}

async function searchLandsatLst({ startDate, endDate, bbox, maxRecords, signal }) {
  const url = new URL(PC_STAC_SEARCH);
  url.searchParams.append('collections', 'landsat-c2-l2');
  url.searchParams.set('limit', String(maxRecords));
  url.searchParams.set('datetime', `${startDate}T00:00:00Z/${endDate}T23:59:59Z`);
  if (bbox?.length === 4) url.searchParams.set('bbox', bbox.join(','));

  url.searchParams.set('filter', "platform IN ('landsat-8','landsat-9')");
  url.searchParams.set('filter-lang', 'cql2-text');

  const data = await cachedRequest(
    createCacheKey('lst-landsat-search', url.toString()),
    () => fetchJson(url.toString(), { signal }),
    { signal }
  );
  const features = (data.features || []).map((f) => {
    const props = f.properties || {};
    return {
      id:              f.id,
      name:            f.id,
      mission:         props.platform || 'Landsat',
      collection:      f.collection,
      acquisitionDate: props.datetime || props.start_datetime,
      cloudCover:      props['eo:cloud_cover'] ?? null,
      geometry:        f.geometry,
      bbox:            f.bbox || null,
      thumbnailUrl:    f.assets?.rendered_preview?.href || null,
      sceneId:         props['landsat:scene_id'] || f.id,
    };
  });
  return { features, totalResults: data.numberReturned || features.length };
}

export { formatModisDate as formatLstDate };
