import axios from 'axios';

const PC_MOSAIC_REGISTER = 'https://planetarycomputer.microsoft.com/api/data/v1/mosaic/register';
const COLLECTION = 'io-lulc-annual-v02';
const COLORMAP = 'io-lulc-9-class';

export async function fetchLulcTileUrl(year) {
  const datetime = `${year}-01-01/${year + 1}-01-01`;

  // Step 1: register the mosaic search to get a searchid
  const { data: reg } = await axios.post(PC_MOSAIC_REGISTER, {
    collections: [COLLECTION],
    datetime,
  });

  const searchid = reg.searchid;
  if (!searchid) throw new Error(`Failed to register LULC mosaic for year ${year}`);

  // Step 2: fetch tilejson using the searchid
  const { data } = await axios.get(
    `https://planetarycomputer.microsoft.com/api/data/v1/mosaic/${searchid}/tilejson.json`,
    { params: { assets: 'data', colormap_name: COLORMAP, format: 'png' } }
  );

  if (!data?.tiles?.length) throw new Error(`No tile URL returned for LULC year ${year}`);
  return data.tiles[0];
}

/**
 * Available years for the io-lulc-annual-v02 collection.
 */
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
