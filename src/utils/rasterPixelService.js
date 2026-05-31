import { fetchJson } from './requestCache';

const PC_ITEM_TILE_PATH = '/api/data/v1/item/tiles/';
const PC_ITEM_POINT_PATH = '/api/data/v1/item/point/';
const RENDER_ONLY_PARAMS = ['color_formula', 'colormap_name', 'format', 'rescale'];

const hasCelsiusExpression = (url) =>
  url.searchParams.get('expression')?.includes('-273.15') ?? false;

export function buildRasterPointUrl(tileUrl, { lng, lat }) {
  if (!tileUrl || !Number.isFinite(lng) || !Number.isFinite(lat)) return null;

  const url = new URL(tileUrl);
  if (
    url.hostname !== 'planetarycomputer.microsoft.com'
    || !url.pathname.includes(PC_ITEM_TILE_PATH)
  ) {
    return null;
  }

  url.pathname = `${PC_ITEM_POINT_PATH}${lng},${lat}`;
  RENDER_ONLY_PARAMS.forEach((param) => url.searchParams.delete(param));
  return url;
}

export async function inspectRasterPixel(tileUrl, coordinate) {
  const url = buildRasterPointUrl(tileUrl, coordinate);
  if (!url) {
    return {
      status: 'unsupported',
      message: 'Pixel value is unavailable for this raster source.',
    };
  }

  const data = await fetchJson(url.toString());
  const values = data.values || [];
  const bandNames = data.band_names || [];
  const unit = hasCelsiusExpression(url) ? '°C' : '';

  return {
    status: 'ready',
    values: values.map((value, index) => ({
      band: bandNames[index] || `band_${index + 1}`,
      value,
      unit,
    })),
  };
}
