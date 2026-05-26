const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

export const WIND_SOURCE = {
  name: 'Open-Meteo Forecast API',
  url: 'https://open-meteo.com/en/docs',
  cadence: 'Current forecast conditions; model-backed updates',
  variables: 'wind_speed_10m, wind_direction_10m, wind_gusts_10m, temperature_2m',
};

const WIND_POINTS = [
  { id: 'uralsk', name: 'Oral', latitude: 51.23, longitude: 51.37 },
  { id: 'atyrau', name: 'Atyrau', latitude: 47.09, longitude: 51.92 },
  { id: 'aktau', name: 'Aktau', latitude: 43.65, longitude: 51.17 },
  { id: 'aktobe', name: 'Aktobe', latitude: 50.28, longitude: 57.17 },
  { id: 'kostanay', name: 'Kostanay', latitude: 53.21, longitude: 63.63 },
  { id: 'petropavl', name: 'Petropavl', latitude: 54.87, longitude: 69.15 },
  { id: 'astana', name: 'Astana', latitude: 51.16, longitude: 71.43 },
  { id: 'kokshetau', name: 'Kokshetau', latitude: 53.28, longitude: 69.38 },
  { id: 'pavlodar', name: 'Pavlodar', latitude: 52.29, longitude: 76.95 },
  { id: 'semey', name: 'Semey', latitude: 50.41, longitude: 80.23 },
  { id: 'oskemen', name: 'Oskemen', latitude: 49.95, longitude: 82.61 },
  { id: 'karaganda', name: 'Karaganda', latitude: 49.81, longitude: 73.09 },
  { id: 'ulytau', name: 'Ulytau', latitude: 48.65, longitude: 67.00 },
  { id: 'zhezkazgan', name: 'Zhezkazgan', latitude: 47.78, longitude: 67.71 },
  { id: 'balkhash', name: 'Balkhash', latitude: 46.84, longitude: 74.98 },
  { id: 'aral', name: 'Aral', latitude: 46.80, longitude: 61.67 },
  { id: 'kyzylorda', name: 'Kyzylorda', latitude: 44.85, longitude: 65.51 },
  { id: 'turkistan', name: 'Turkistan', latitude: 43.30, longitude: 68.27 },
  { id: 'shymkent', name: 'Shymkent', latitude: 42.34, longitude: 69.59 },
  { id: 'taraz', name: 'Taraz', latitude: 42.90, longitude: 71.37 },
  { id: 'shu', name: 'Shu', latitude: 43.60, longitude: 73.76 },
  { id: 'taldykorgan', name: 'Taldykorgan', latitude: 45.02, longitude: 78.37 },
  { id: 'almaty', name: 'Almaty', latitude: 43.24, longitude: 76.93 },
  { id: 'zharkent', name: 'Zharkent', latitude: 44.17, longitude: 80.00 },
  { id: 'zaysan', name: 'Zaysan', latitude: 47.47, longitude: 84.87 },
  { id: 'borovoe', name: 'Burabay', latitude: 53.08, longitude: 70.31 },
  { id: 'arkalyk', name: 'Arkalyk', latitude: 50.25, longitude: 66.91 },
  { id: 'kulsary', name: 'Kulsary', latitude: 46.95, longitude: 54.02 },
  { id: 'saryagash', name: 'Saryagash', latitude: 41.46, longitude: 69.17 },
  { id: 'ridder', name: 'Ridder', latitude: 50.34, longitude: 83.51 },
];

const DENSITY_STEP = {
  low: 3,
  medium: 2,
  high: 1,
};

const getWindPoints = (density) => {
  const step = DENSITY_STEP[density] || DENSITY_STEP.medium;
  return WIND_POINTS.filter((_, index) => index % step === 0);
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const getSpeedColor = (speed) => {
  if (speed >= 15) return '#ef4444';
  if (speed >= 10) return '#f97316';
  if (speed >= 6) return '#facc15';
  return '#38bdf8';
};

const getCardinalDirection = (degrees) => {
  if (!Number.isFinite(degrees)) return 'N/A';
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round(degrees / 45) % 8];
};

const makeVectorLine = ({ longitude, latitude, direction, speed }) => {
  const flowDirection = ((direction ?? 0) + 180) % 360;
  const radians = flowDirection * Math.PI / 180;
  const length = 0.18 + Math.min(speed ?? 0, 20) * 0.025;
  const latFactor = Math.max(0.4, Math.cos(latitude * Math.PI / 180));
  const endLongitude = longitude + (Math.sin(radians) * length) / latFactor;
  const endLatitude = latitude + Math.cos(radians) * length;

  return {
    type: 'LineString',
    coordinates: [
      [longitude, latitude],
      [endLongitude, endLatitude],
    ],
  };
};

const normalizeResponse = (response) => (Array.isArray(response) ? response : [response]);

export const searchKazakhstanWind = async ({ density = 'medium', signal } = {}) => {
  const locations = getWindPoints(density);
  const params = new URLSearchParams({
    latitude: locations.map((point) => point.latitude.toFixed(3)).join(','),
    longitude: locations.map((point) => point.longitude.toFixed(3)).join(','),
    current: 'wind_speed_10m,wind_direction_10m,wind_gusts_10m,temperature_2m',
    wind_speed_unit: 'ms',
    timezone: 'auto',
  });

  const response = await fetch(`${OPEN_METEO_URL}?${params.toString()}`, { signal });
  if (!response.ok) {
    throw new Error(`Open-Meteo request failed: ${response.status}`);
  }

  const payload = await response.json();
  const results = normalizeResponse(payload).map((item, index) => {
    const location = locations[index];
    const current = item.current || {};
    const speed = toNumber(current.wind_speed_10m);
    const direction = toNumber(current.wind_direction_10m);
    const gust = toNumber(current.wind_gusts_10m);
    const temperature = toNumber(current.temperature_2m);
    const color = getSpeedColor(speed ?? 0);

    return {
      id: location.id,
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      speed,
      direction,
      gust,
      temperature,
      time: current.time || null,
      color,
      directionLabel: getCardinalDirection(direction),
      speedLabel: speed == null ? 'N/A' : `${speed.toFixed(1)} m/s`,
      gustLabel: gust == null ? 'N/A' : `${gust.toFixed(1)} m/s`,
    };
  });

  const validSpeeds = results.map((item) => item.speed).filter(Number.isFinite);
  const validGusts = results.map((item) => item.gust).filter(Number.isFinite);
  const averageSpeed = validSpeeds.length
    ? validSpeeds.reduce((sum, value) => sum + value, 0) / validSpeeds.length
    : null;
  const maxGust = validGusts.length ? Math.max(...validGusts) : null;

  return {
    points: results,
    fetchedAt: new Date().toISOString(),
    density,
    summary: {
      stations: results.length,
      averageSpeed,
      maxGust,
      strongest: results.reduce((strongest, item) => {
        if (!strongest || (item.speed ?? -1) > (strongest.speed ?? -1)) return item;
        return strongest;
      }, null),
    },
  };
};

export const buildWindFeatureCollection = (points, { minSpeed = 0 } = {}) => {
  const filtered = points.filter((point) => (point.speed ?? 0) >= minSpeed);

  return {
    type: 'FeatureCollection',
    features: [
      ...filtered.map((point) => ({
        type: 'Feature',
        id: `${point.id}-point`,
        properties: {
          ...point,
          kind: 'station',
          radius: Math.max(4, Math.min(11, 4 + (point.speed ?? 0) * 0.35)),
        },
        geometry: {
          type: 'Point',
          coordinates: [point.longitude, point.latitude],
        },
      })),
      ...filtered.map((point) => ({
        type: 'Feature',
        id: `${point.id}-vector`,
        properties: {
          ...point,
          kind: 'vector',
          width: Math.max(1.2, Math.min(4.4, 1.2 + (point.speed ?? 0) * 0.15)),
        },
        geometry: makeVectorLine(point),
      })),
    ],
  };
};
