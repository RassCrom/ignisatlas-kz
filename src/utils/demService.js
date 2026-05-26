import axios from 'axios';
import { KAZAKHSTAN_EXTENT_GEO } from '../modules/MapPage/utils/mapConstants';
import { cachedRequest, createCacheKey } from './requestCache';

const PC_MOSAIC_REGISTER = 'https://planetarycomputer.microsoft.com/api/data/v1/mosaic/register';
const COLLECTION = 'cop-dem-glo-30';

const RESCALE = '0,5000';

export const DEM_RENDERERS = [
  { id: 'terrain',    label: 'Terrain tint' },
  { id: 'gist_earth', label: 'Earth tones'  },
  { id: 'gray',       label: 'Grayscale'    },
];

// legend display only
export const DEM_RENDERER_GRADIENTS = {
  terrain:    'linear-gradient(to right, #006994, #5db870, #e4c040, #a85428, #ececec)',
  gist_earth: 'linear-gradient(to right, #1a1444, #1a5050, #508050, #a09060, #e0d8c8)',
  gray:       'linear-gradient(to right, #111111, #888888, #ffffff)',
};

export function buildDemTileUrl(searchid, renderer = 'terrain') {
  const params = new URLSearchParams({
    collection:    COLLECTION,
    assets:        'data',
    colormap_name: renderer,
    rescale:       RESCALE,
    exitwhenfull:  'False',
    skipcovered:   'False',
  });
  return `https://planetarycomputer.microsoft.com/api/data/v1/mosaic/${searchid}/tiles/WebMercatorQuad/{z}/{x}/{y}@1x.png?${params}`;
}

/**
 * Registers a global-coverage DEM mosaic for Kazakhstan and returns
 * the searchid together with the initial tile URL.
 */
export async function fetchDemTileUrl(renderer = 'terrain', { signal } = {}) {
  const reg = await cachedRequest(
    createCacheKey('pc-mosaic', COLLECTION, KAZAKHSTAN_EXTENT_GEO),
    async () => {
      const { data } = await axios.post(PC_MOSAIC_REGISTER, {
        collections: [COLLECTION],
        bbox: KAZAKHSTAN_EXTENT_GEO,
      }, { signal });
      return data;
    },
    { ttlMs: 60 * 60 * 1000, signal }
  );

  const { searchid } = reg;
  if (!searchid) throw new Error('Mosaic registration did not return a searchid');

  return { searchid, tileUrl: buildDemTileUrl(searchid, renderer) };
}
