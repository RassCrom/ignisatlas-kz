export const HISTORICAL_WILDFIRE_CASES = [
  {
    id: 'abai-2023',
    title: 'Abai Region forest fires',
    location: 'Semey Ormany reserve, Abai Region',
    period: '8-16 Jun 2023',
    startDate: '2023-06-08',
    endDate: '2023-06-16',
    burnedAreaHa: 60000,
    territory: 'Pine forest reserve',
    severity: 'Extreme',
    impact: '14 fatalities reported; national emergency response',
    sourceLabel: 'Astana Times, TuraNews, Kazakhstan Today',
    sourceNote: 'Burned perimeter is a schematic AOI until official GeoJSON/COG data is loaded.',
    color: '#f97316',
    bbox: [79.42, 49.72, 80.78, 50.58],
    center: [80.1, 50.15],
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [79.52, 49.85],
        [79.82, 49.72],
        [80.36, 49.8],
        [80.78, 50.08],
        [80.6, 50.46],
        [80.08, 50.58],
        [79.56, 50.34],
        [79.42, 50.02],
        [79.52, 49.85],
      ]],
    },
    timeline: [
      { label: 'Jun 8', areaHa: 2000 },
      { label: 'Jun 10', areaHa: 30000 },
      { label: 'Jun 13', areaHa: 60000 },
      { label: 'Jun 16', areaHa: 60000 },
    ],
    landCover: [
      { label: 'Forest', value: 82, color: '#22c55e' },
      { label: 'Grass/shrub', value: 12, color: '#a3e635' },
      { label: 'Other', value: 6, color: '#94a3b8' },
    ],
    stats: [
      { label: 'Burned area', value: '60,000 ha' },
      { label: 'Duration', value: '9 days' },
      { label: 'Region', value: 'Abai' },
      { label: 'Status', value: 'Controlled' },
    ],
  },
  {
    id: 'kostanay-2022',
    title: 'Kostanay forest-steppe fire',
    location: 'Auliekol district, Kostanay Region',
    period: '2-7 Sep 2022',
    startDate: '2022-09-02',
    endDate: '2022-09-07',
    burnedAreaHa: 43000,
    territory: 'Forest-steppe and settlements',
    severity: 'Major',
    impact: 'Thousands evacuated; homes and forest assets affected',
    sourceLabel: 'Kazinform, TuraNews, QazMonitor',
    sourceNote: 'Burned perimeter is a schematic AOI until official GeoJSON/COG data is loaded.',
    color: '#ef4444',
    bbox: [63.82, 51.55, 64.86, 52.34],
    center: [64.32, 51.98],
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [63.9, 51.72],
        [64.24, 51.55],
        [64.72, 51.62],
        [64.86, 51.96],
        [64.62, 52.26],
        [64.08, 52.34],
        [63.82, 52.06],
        [63.9, 51.72],
      ]],
    },
    timeline: [
      { label: 'Sep 2', areaHa: 9400 },
      { label: 'Sep 4', areaHa: 43000 },
      { label: 'Sep 7', areaHa: 43000 },
    ],
    landCover: [
      { label: 'Forest', value: 58, color: '#22c55e' },
      { label: 'Steppe', value: 31, color: '#eab308' },
      { label: 'Settlement edge', value: 11, color: '#f97316' },
    ],
    stats: [
      { label: 'Burned area', value: '43,000 ha' },
      { label: 'Duration', value: '6 days' },
      { label: 'Region', value: 'Kostanay' },
      { label: 'Status', value: 'Localized' },
    ],
  },
  {
    id: 'pavlodar-2010',
    title: 'Pavlodar border forest fire',
    location: 'Yertis Ormany area, Pavlodar Region',
    period: '8-10 Sep 2010',
    startDate: '2010-09-08',
    endDate: '2010-09-10',
    burnedAreaHa: 3300,
    territory: 'Border pine forest',
    severity: 'Severe',
    impact: '6-7 fatalities reported in archival sources',
    sourceLabel: 'Inform.kz, TerraDaily, UN-SPIDER',
    sourceNote: 'Burned perimeter is a schematic AOI until official GeoJSON/COG data is loaded.',
    color: '#fb923c',
    bbox: [77.58, 51.03, 78.12, 51.45],
    center: [77.86, 51.24],
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [77.64, 51.08],
        [77.9, 51.03],
        [78.12, 51.18],
        [78.02, 51.4],
        [77.72, 51.45],
        [77.58, 51.28],
        [77.64, 51.08],
      ]],
    },
    timeline: [
      { label: 'Sep 8', areaHa: 1200 },
      { label: 'Sep 9', areaHa: 3300 },
      { label: 'Sep 10', areaHa: 3300 },
    ],
    landCover: [
      { label: 'Forest', value: 88, color: '#22c55e' },
      { label: 'Grass/shrub', value: 8, color: '#a3e635' },
      { label: 'Other', value: 4, color: '#94a3b8' },
    ],
    stats: [
      { label: 'Burned area', value: '3,300 ha' },
      { label: 'Duration', value: '3 days' },
      { label: 'Region', value: 'Pavlodar' },
      { label: 'Status', value: 'Extinguished' },
    ],
  },
  {
    id: 'ridder-2021',
    title: 'Ridder wildfire',
    location: 'Ridder, East Kazakhstan Region',
    period: '10 May 2021',
    startDate: '2021-05-10',
    endDate: '2021-05-10',
    burnedAreaHa: 310,
    territory: 'Wildland-urban interface',
    severity: 'Local emergency',
    impact: '1 fatality reported; homes and outbuildings damaged',
    sourceLabel: 'Orda.kz, Reuters archive reports',
    sourceNote: 'Burned perimeter is a schematic AOI until official GeoJSON/COG data is loaded.',
    color: '#f59e0b',
    bbox: [83.28, 50.28, 83.64, 50.48],
    center: [83.5, 50.36],
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [83.32, 50.31],
        [83.5, 50.28],
        [83.64, 50.36],
        [83.56, 50.46],
        [83.36, 50.48],
        [83.28, 50.38],
        [83.32, 50.31],
      ]],
    },
    timeline: [
      { label: 'May 10', areaHa: 310 },
    ],
    landCover: [
      { label: 'Forest edge', value: 55, color: '#22c55e' },
      { label: 'Settlement edge', value: 32, color: '#f97316' },
      { label: 'Other', value: 13, color: '#94a3b8' },
    ],
    stats: [
      { label: 'Burned area', value: '310 ha' },
      { label: 'Duration', value: '1 day' },
      { label: 'Region', value: 'East KZ' },
      { label: 'Status', value: 'Extinguished' },
    ],
  },
];

export const getHistoricalWildfireCase = (id) =>
  HISTORICAL_WILDFIRE_CASES.find((item) => item.id === id) || null;

export const buildHistoricalWildfireFeatureCollection = (wildfireCase) => {
  if (!wildfireCase) {
    return {
      type: 'FeatureCollection',
      features: [],
    };
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          id: wildfireCase.id,
          title: wildfireCase.title,
          location: wildfireCase.location,
          burnedAreaHa: wildfireCase.burnedAreaHa,
          color: wildfireCase.color,
        },
        geometry: wildfireCase.geometry,
      },
      {
        type: 'Feature',
        properties: {
          id: `${wildfireCase.id}-center`,
          title: wildfireCase.title,
          color: wildfireCase.color,
        },
        geometry: {
          type: 'Point',
          coordinates: wildfireCase.center,
        },
      },
    ],
  };
};
