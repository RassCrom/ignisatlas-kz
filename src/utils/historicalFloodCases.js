export const HISTORICAL_FLOOD_CASES = [
  {
    id: 'west-kz-2024',
    type: 'flood',
    title: 'Наводнения на западе Казахстана 2024',
    location: 'Уральск, Западно-Казахстанская область',
    period: 'апр. 2024',
    startDate: '2024-04-03',
    endDate: '2024-04-25',
    affectedAreaHa: 180000,
    territory: 'Речная пойма и городские кварталы',
    severity: 'Катастрофическое',
    impact: 'Более 100 тыс. человек эвакуировано; введён режим ЧС по всей стране',
    sourceLabel: 'МЧС РК, Reuters, Kazinform',
    sourceNote: 'Контур затопления — схематичная АОИ до загрузки официальных данных.',
    color: '#3b82f6',
    bbox: [50.5, 51.0, 52.0, 51.8],
    center: [51.4, 51.35],
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [50.6, 51.1],
        [51.2, 51.0],
        [51.9, 51.15],
        [52.0, 51.55],
        [51.5, 51.8],
        [50.8, 51.7],
        [50.5, 51.4],
        [50.6, 51.1],
      ]],
    },
    timeline: [
      { label: '3 апр', areaHa: 20000 },
      { label: '8 апр', areaHa: 90000 },
      { label: '15 апр', areaHa: 180000 },
      { label: '25 апр', areaHa: 140000 },
    ],
    landCover: [
      { label: 'Сельхозугодья', value: 52, color: '#86efac' },
      { label: 'Жилые кварталы', value: 28, color: '#fb923c' },
      { label: 'Речная пойма', value: 20, color: '#38bdf8' },
    ],
    stats: [
      { label: 'Площадь затопления', value: '180 000 га' },
      { label: 'Эвакуировано', value: '~100 тыс.' },
      { label: 'Регион', value: 'ЗКО' },
      { label: 'Статус', value: 'Ликвидировано' },
    ],
  },
  {
    id: 'aktobe-2024',
    type: 'flood',
    title: 'Паводки в Актюбинской области 2024',
    location: 'Актобе и прилегающие районы',
    period: 'апр. 2024',
    startDate: '2024-04-05',
    endDate: '2024-04-22',
    affectedAreaHa: 95000,
    territory: 'Степь, сельские населённые пункты',
    severity: 'Серьёзное',
    impact: 'Тысячи домов затоплены; дороги регионального значения перекрыты',
    sourceLabel: 'МЧС РК, QazMonitor, Tengrinews',
    sourceNote: 'Контур затопления — схематичная АОИ до загрузки официальных данных.',
    color: '#60a5fa',
    bbox: [56.5, 49.8, 58.5, 51.0],
    center: [57.2, 50.28],
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [56.7, 49.9],
        [57.5, 49.8],
        [58.5, 50.1],
        [58.4, 50.7],
        [57.8, 51.0],
        [56.8, 50.8],
        [56.5, 50.3],
        [56.7, 49.9],
      ]],
    },
    timeline: [
      { label: '5 апр', areaHa: 15000 },
      { label: '10 апр', areaHa: 65000 },
      { label: '15 апр', areaHa: 95000 },
      { label: '22 апр', areaHa: 60000 },
    ],
    landCover: [
      { label: 'Пастбища / степь', value: 65, color: '#a3e635' },
      { label: 'Сёла', value: 22, color: '#fb923c' },
      { label: 'Поймы рек', value: 13, color: '#38bdf8' },
    ],
    stats: [
      { label: 'Площадь затопления', value: '95 000 га' },
      { label: 'Длительность', value: '18 дней' },
      { label: 'Регион', value: 'Актюбинская' },
      { label: 'Статус', value: 'Ликвидировано' },
    ],
  },
  {
    id: 'kyzylorda-2020',
    type: 'flood',
    title: 'Паводки на Сырдарье 2020',
    location: 'Кызылорда и Арал, Кызылординская область',
    period: 'апр.–май 2020',
    startDate: '2020-04-12',
    endDate: '2020-05-18',
    affectedAreaHa: 120000,
    territory: 'Дельта Сырдарьи, рисовые поля',
    severity: 'Серьёзное',
    impact: 'Около 2 тыс. домов затоплено; угроза экологическим зонам Аральского моря',
    sourceLabel: 'Казинформ, ООН-УКГВ, Tengrinews',
    sourceNote: 'Контур затопления — схематичная АОИ до загрузки официальных данных.',
    color: '#2563eb',
    bbox: [63.5, 44.5, 65.5, 45.8],
    center: [64.6, 44.85],
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [63.6, 44.6],
        [64.4, 44.5],
        [65.2, 44.7],
        [65.5, 45.2],
        [65.1, 45.8],
        [64.2, 45.7],
        [63.5, 45.3],
        [63.6, 44.6],
      ]],
    },
    timeline: [
      { label: '12 апр', areaHa: 30000 },
      { label: '25 апр', areaHa: 90000 },
      { label: '5 мая', areaHa: 120000 },
      { label: '18 мая', areaHa: 80000 },
    ],
    landCover: [
      { label: 'Рисовые поля', value: 45, color: '#86efac' },
      { label: 'Тростниковые угодья', value: 33, color: '#4ade80' },
      { label: 'Населённые пункты', value: 22, color: '#fb923c' },
    ],
    stats: [
      { label: 'Площадь затопления', value: '120 000 га' },
      { label: 'Длительность', value: '36 дней' },
      { label: 'Регион', value: 'Кызылординская' },
      { label: 'Статус', value: 'Ликвидировано' },
    ],
  },
];

export const getHistoricalFloodCase = (id) =>
  HISTORICAL_FLOOD_CASES.find((item) => item.id === id) || null;

export const buildHistoricalFloodFeatureCollection = (floodCase) => {
  if (!floodCase) {
    return { type: 'FeatureCollection', features: [] };
  }
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          id: floodCase.id,
          title: floodCase.title,
          location: floodCase.location,
          affectedAreaHa: floodCase.affectedAreaHa,
          color: floodCase.color,
          eventType: 'flood',
        },
        geometry: floodCase.geometry,
      },
      {
        type: 'Feature',
        properties: {
          id: `${floodCase.id}-center`,
          title: floodCase.title,
          color: floodCase.color,
          eventType: 'flood',
        },
        geometry: {
          type: 'Point',
          coordinates: floodCase.center,
        },
      },
    ],
  };
};
