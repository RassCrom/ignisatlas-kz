import axios from 'axios';
import { KAZAKHSTAN_EXTENT_GEO } from '../modules/MapPage/utils/mapConstants';

const PC_MOSAIC_REGISTER = 'https://planetarycomputer.microsoft.com/api/data/v1/mosaic/register';
const COLLECTION = 'io-lulc-annual-v02';

const KZ_BBOX = KAZAKHSTAN_EXTENT_GEO;

export async function fetchLulcTileUrl(yearInput) {
  const year = Number(yearInput);
  const datetime = `${year}-01-01T00:00:00Z/${year + 1}-01-01T00:00:00Z`;

  const { data: reg } = await axios.post(PC_MOSAIC_REGISTER, {
    collections: [COLLECTION],
    datetime,
    bbox: KZ_BBOX,
  });

  const searchid = reg.searchid;
  if (!searchid) throw new Error(`Failed to register LULC mosaic for year ${year}`);

  return `https://planetarycomputer.microsoft.com/api/data/v1/mosaic/${searchid}/tiles/WebMercatorQuad/{z}/{x}/{y}@1x.png?collection=${COLLECTION}&assets=data&exitwhenfull=False&skipcovered=False&colormap_name=io-lulc-9-class`;
}

export const LULC_YEARS = [2023, 2022, 2021, 2020, 2019, 2018, 2017];

/**
 * LULC class definitions matching io-lulc-9-class colormap values.
 */
export const LULC_CLASSES = [
  { value: 1,  label: 'Вода',                     color: '#419BDF' },
  { value: 2,  label: 'Деревья',                  color: '#397D49' },
  { value: 4,  label: 'Затопленная растит.',       color: '#7A87C6' },
  { value: 5,  label: 'Сельхозугодья',            color: '#E49635' },
  { value: 7,  label: 'Застройка',                color: '#C4281B' },
  { value: 8,  label: 'Голый грунт',              color: '#A59B8F' },
  { value: 9,  label: 'Снег / лёд',               color: '#B39FE1' },
  { value: 10, label: 'Облака',                   color: '#616161' },
  { value: 11, label: 'Степь / пастбища',         color: '#E3E2C3' },
];
