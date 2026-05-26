import {
  formatDate,
  getCloudCoverColor,
  getCloudCoverLabel,
  searchSentinelPc,
} from './sentinelPcSearchService';

const PC_TILE_BASE = 'https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad';
const SEARCH_WINDOW_DAYS = 10;

export const FUEL_MOISTURE_INDICES = [
  {
    id: 'ndmi',
    label: 'NDMI / Gao NDWI',
    shortLabel: 'NDMI',
    assets: ['B08', 'B11'],
    expression: '(B08-B11)/(B08+B11)',
    rescale: '-0.4,0.6',
    colormap: 'rdylbu',
    description: 'Sentinel-2 NIR-SWIR water-content proxy. Low values indicate dry vegetation and crop fuel.',
  },
  {
    id: 'msi',
    label: 'Moisture Stress Index',
    shortLabel: 'MSI',
    assets: ['B11', 'B08'],
    expression: 'B11/B08',
    rescale: '0.4,2.5',
    colormap: 'ylorrd',
    description: 'SWIR/NIR stress proxy. High values indicate stronger vegetation water stress.',
  },
];

export const getFuelMoistureIndex = (indexId) =>
  FUEL_MOISTURE_INDICES.find((index) => index.id === indexId) || FUEL_MOISTURE_INDICES[0];

const shiftDate = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().split('T')[0];
};

export const getFuelMoistureDateRange = (date) => ({
  startDate: shiftDate(date, -SEARCH_WINDOW_DAYS),
  endDate: date,
});

export const buildFuelMoistureTileUrl = (itemId, indexId = 'ndmi') => {
  const index = getFuelMoistureIndex(indexId);
  const params = new URLSearchParams({
    collection: 'sentinel-2-l2a',
    item: itemId,
    expression: index.expression,
    rescale: index.rescale,
    colormap_name: index.colormap,
    asset_as_band: 'true',
    format: 'png',
  });

  index.assets.forEach((asset) => params.append('assets', asset));
  return `${PC_TILE_BASE}/{z}/{x}/{y}@1x?${params.toString()}`;
};

export const searchFuelMoisture = ({
  date,
  bbox,
  cloudCoverage = 30,
  maxRecords = 20,
  signal,
}) => {
  if (!date) throw new Error('Select a date');
  const { startDate, endDate } = getFuelMoistureDateRange(date);
  return searchSentinelPc({
    mission: 'sentinel-2',
    startDate,
    endDate,
    bbox,
    cloudCoverage,
    maxRecords,
    signal,
  });
};

export {
  formatDate,
  getCloudCoverColor,
  getCloudCoverLabel,
};
