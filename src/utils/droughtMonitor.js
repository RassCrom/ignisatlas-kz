export const DROUGHT_INDICES = [
  {
    id: 'vhi',
    label: 'VHI',
    name: 'Vegetation Health Index',
    unit: '0-100',
    description: 'Combined vegetation and thermal stress signal.',
  },
  {
    id: 'vci',
    label: 'VCI',
    name: 'Vegetation Condition Index',
    unit: '0-100',
    description: 'Vegetation greenness stress derived from NDVI condition.',
  },
  {
    id: 'tci',
    label: 'TCI',
    name: 'Temperature Condition Index',
    unit: '0-100',
    description: 'Heat-driven surface stress proxy.',
  },
  {
    id: 'spei',
    label: 'SPEI',
    name: 'Standardized Precipitation Evapotranspiration Index',
    unit: 'score',
    description: 'Meteorological drought balance proxy.',
  },
  {
    id: 'ndvi',
    label: 'NDVI anomaly',
    name: 'NDVI Anomaly',
    unit: '%',
    description: 'Vegetation anomaly relative to expected seasonal state.',
  },
];

export const DROUGHT_SEVERITIES = [
  { id: 'all', label: 'Все', minRank: 0 },
  { id: 'watch', label: 'Наблюдение', minRank: 1 },
  { id: 'moderate', label: 'Умеренная', minRank: 2 },
  { id: 'severe', label: 'Сильная', minRank: 3 },
  { id: 'extreme', label: 'Экстремальная', minRank: 4 },
];

const SEVERITY_STEPS = [
  { id: 'normal', label: 'Норма', rank: 0, min: 0, color: '#1f9d55' },
  { id: 'watch', label: 'Наблюдение', rank: 1, min: 25, color: '#c8c83d' },
  { id: 'moderate', label: 'Умеренная', rank: 2, min: 45, color: '#e7a33a' },
  { id: 'severe', label: 'Сильная', rank: 3, min: 65, color: '#d6612f' },
  { id: 'extreme', label: 'Экстремальная', rank: 4, min: 82, color: '#b92f2f' },
];

const REGION_LABELS = {
  'Abay Region': 'Абайская область',
  'Akmola Region': 'Акмолинская область',
  'Aktobe Region': 'Актюбинская область',
  'Almaty Region': 'Алматинская область',
  'Almaty': 'Алматы',
  'Astana': 'Астана',
  'Atyrau Region': 'Атырауская область',
  'East Kazakhstan Region': 'Восточно-Казахстанская область',
  'Jambyl Region': 'Жамбылская область',
  'Jetisu Region': 'Жетысуская область',
  'Karaganda Region': 'Карагандинская область',
  'Kostanay Region': 'Костанайская область',
  'Kyzylorda Region': 'Кызылординская область',
  'Mangystau Region': 'Мангистауская область',
  'North Kazakhstan Region': 'Северо-Казахстанская область',
  'Pavlodar Region': 'Павлодарская область',
  'Shymkent': 'Шымкент',
  'Turkistan Region': 'Туркестанская область',
  'Ulytau Region': 'Улытауская область',
  'West Kazakhstan Region': 'Западно-Казахстанская область',
};

const REGION_BASELINE = {
  KAZ003: 18,
  KAZ004: 10,
  KAZ005: 34,
  KAZ007: 19,
  KAZ009: 37,
  KAZ011: 32,
  KAZ013: 31,
  KAZ014: 42,
  KAZ015: 45,
  KAZ017: 28,
  KAZ019: 43,
  KAZ021: 33,
  KAZ023: 25,
  KAZ025: 15,
  KAZ027: 16,
  KAZ031: 30,
  KAZ033: 13,
  KAZ035: 18,
  KAZ039: 21,
  KAZ001: 24,
};

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const toMonthString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const getMonthOffset = (selectedMonth, offset) => {
  const [yearText, monthText] = String(selectedMonth).split('-');
  const date = new Date(Number(yearText), Number(monthText) - 1 + offset, 1);
  return toMonthString(date);
};

const hash = (input) => {
  let value = 0;
  const text = String(input);
  for (let i = 0; i < text.length; i += 1) {
    value = (value * 31 + text.charCodeAt(i)) % 9973;
  }
  return value;
};

const seasonalStress = (month) => {
  const radians = ((month - 7) / 12) * Math.PI * 2;
  return 20 + Math.cos(radians) * 18;
};

export const getSeverity = (score) => {
  const step = [...SEVERITY_STEPS].reverse().find((item) => score >= item.min);
  return step || SEVERITY_STEPS[0];
};

export const getRegionName = (feature) => {
  const name = feature?.properties?.ADM1_EN || feature?.properties?.name || 'Region';
  return REGION_LABELS[name] || name;
};

const computeMetrics = (feature, selectedMonth) => {
  const props = feature.properties || {};
  const code = props.ADM1_PCODE || props.fid || props.ADM1_EN;
  const [, monthText = '07'] = String(selectedMonth).split('-');
  const month = Number(monthText);
  const noise = (hash(`${code}-${selectedMonth}`) % 21) - 10;
  const baseline = REGION_BASELINE[code] ?? 24;
  const stress = clamp(baseline + seasonalStress(month) + noise);
  const thermal = clamp(stress + ((hash(`${code}-heat-${selectedMonth}`) % 17) - 8));
  const vegetation = clamp(stress + ((hash(`${code}-veg-${selectedMonth}`) % 19) - 9));
  const precipitation = clamp(stress + ((hash(`${code}-rain-${selectedMonth}`) % 23) - 11));

  return {
    vhi: clamp((vegetation * 0.55) + (thermal * 0.45)),
    vci: vegetation,
    tci: thermal,
    spei: precipitation,
    ndvi: clamp(vegetation * 0.9),
    ndviAnomaly: -clamp(vegetation * 0.42, 0, 42),
    lstAnomaly: clamp((thermal - 30) * 0.18, -3, 9),
    soilMoisture: clamp(100 - precipitation),
  };
};

export const buildDroughtFeatureCollection = ({
  regions,
  selectedIndex,
  selectedMonth,
  severityFilter,
  regionFilter,
}) => {
  const minRank = DROUGHT_SEVERITIES.find((item) => item.id === severityFilter)?.minRank ?? 0;

  const features = (regions?.features || []).map((feature) => {
    const metrics = computeMetrics(feature, selectedMonth);
    const score = Math.round(metrics[selectedIndex] ?? metrics.vhi);
    const severity = getSeverity(score);
    const regionCode = feature.properties?.ADM1_PCODE || String(feature.properties?.fid);
    const regionName = getRegionName(feature);
    const included = severity.rank >= minRank && (regionFilter === 'all' || regionFilter === regionCode);

    return {
      ...feature,
      properties: {
        ...feature.properties,
        drought_region_code: regionCode,
        drought_region_name: regionName,
        drought_score: score,
        drought_index: selectedIndex,
        drought_severity: severity.id,
        drought_severity_label: severity.label,
        drought_severity_rank: severity.rank,
        drought_color: severity.color,
        drought_included: included,
        drought_ndvi_anomaly: Number(metrics.ndviAnomaly.toFixed(1)),
        drought_lst_anomaly: Number(metrics.lstAnomaly.toFixed(1)),
        drought_soil_moisture: Math.round(metrics.soilMoisture),
      },
    };
  });

  return {
    type: 'FeatureCollection',
    features,
  };
};

export const summarizeDrought = (featureCollection) => {
  const included = (featureCollection?.features || []).filter((feature) => feature.properties?.drought_included);
  const totalArea = included.reduce((sum, feature) => sum + Number(feature.properties?.area || 0), 0);
  const weightedScore = included.reduce(
    (sum, feature) => sum + (Number(feature.properties?.drought_score || 0) * Number(feature.properties?.area || 0)),
    0
  );
  const severe = included.filter((feature) => Number(feature.properties?.drought_severity_rank || 0) >= 3);
  const extreme = included.filter((feature) => feature.properties?.drought_severity === 'extreme');
  const severityArea = SEVERITY_STEPS.map((step) => {
    const matching = included.filter((feature) => feature.properties?.drought_severity === step.id);
    const area = matching.reduce((sum, feature) => sum + Number(feature.properties?.area || 0), 0);
    return {
      ...step,
      count: matching.length,
      area,
      pct: totalArea > 0 ? Math.round((area / totalArea) * 100) : 0,
    };
  });

  return {
    regions: included.length,
    totalArea,
    averageScore: totalArea > 0 ? Math.round(weightedScore / totalArea) : 0,
    severeRegions: severe.length,
    extremeRegions: extreme.length,
    severityArea,
    ranked: [...included].sort((a, b) => b.properties.drought_score - a.properties.drought_score),
  };
};

export const buildDroughtTrend = ({ regions, selectedIndex, selectedMonth, regionFilter }) => {
  const [yearText, monthText] = String(selectedMonth).split('-');
  const base = new Date(Number(yearText), Number(monthText) - 1, 1);

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(base.getFullYear(), base.getMonth() - (5 - index), 1);
    const month = toMonthString(date);
    const collection = buildDroughtFeatureCollection({
      regions,
      selectedIndex,
      selectedMonth: month,
      severityFilter: 'all',
      regionFilter,
    });
    const summary = summarizeDrought(collection);
    return {
      month,
      label: date.toLocaleDateString('ru-RU', { month: 'short' }),
      value: summary.averageScore,
    };
  });
};

export const buildRegionDeltas = ({
  regions,
  selectedIndex,
  selectedMonth,
  severityFilter = 'all',
  regionFilter = 'all',
}) => {
  const current = buildDroughtFeatureCollection({
    regions,
    selectedIndex,
    selectedMonth,
    severityFilter,
    regionFilter,
  });
  const previous = buildDroughtFeatureCollection({
    regions,
    selectedIndex,
    selectedMonth: getMonthOffset(selectedMonth, -1),
    severityFilter: 'all',
    regionFilter: 'all',
  });
  const previousByCode = new Map(
    previous.features.map((feature) => [feature.properties.drought_region_code, feature])
  );

  return current.features
    .filter((feature) => feature.properties?.drought_included)
    .map((feature) => {
      const previousFeature = previousByCode.get(feature.properties.drought_region_code);
      const previousScore = previousFeature?.properties?.drought_score ?? feature.properties.drought_score;
      return {
        feature,
        currentScore: feature.properties.drought_score,
        previousScore,
        delta: feature.properties.drought_score - previousScore,
      };
    });
};

export const getPinnedRegionSnapshot = ({
  regions,
  selectedIndex,
  selectedMonth,
  pinnedRegionCode,
}) => {
  if (!pinnedRegionCode) return null;

  const deltas = buildRegionDeltas({
    regions,
    selectedIndex,
    selectedMonth,
    severityFilter: 'all',
    regionFilter: pinnedRegionCode,
  });

  return deltas[0] || null;
};

export const exportDroughtCsv = (features) => {
  const rows = [
    ['region', 'code', 'score', 'severity', 'ndvi_anomaly_pct', 'lst_anomaly_c', 'soil_moisture_proxy'],
    ...features.map((feature) => {
      const props = feature.properties || {};
      return [
        props.drought_region_name,
        props.drought_region_code,
        props.drought_score,
        props.drought_severity_label,
        props.drought_ndvi_anomaly,
        props.drought_lst_anomaly,
        props.drought_soil_moisture,
      ];
    }),
  ];

  return rows
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
};
