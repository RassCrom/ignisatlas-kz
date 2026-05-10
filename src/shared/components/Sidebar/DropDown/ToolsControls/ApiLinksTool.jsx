import { ExternalLink } from 'lucide-react';
import baseStyles from './ToolsControls.module.scss';
import styles from './AnalysisTools.module.scss';

const SERVICES = [
  {
    name: 'NASA FIRMS',
    desc: 'Активные точки пожаров MODIS/VIIRS (Fire Information for Resource Management System)',
    url: 'https://firms.modaps.eosdis.nasa.gov/',
    tag: 'Fire data',
  },
  {
    name: 'Microsoft Planetary Computer',
    desc: 'Каталог STAC: Sentinel-1/2, Landsat, Copernicus DEM GLO-30, ESRI LULC',
    url: 'https://planetarycomputer.microsoft.com/',
    tag: 'Satellite / DEM / LULC',
  },
  {
    name: 'OpenTopoData',
    desc: 'REST API для запроса высот на основе Copernicus DEM GLO-30 (профиль рельефа)',
    url: 'https://www.opentopodata.org/',
    tag: 'Elevation API',
  },
  {
    name: 'Copernicus Data Space',
    desc: 'Снимки Sentinel-1/2, атмосферные данные Copernicus Atmosphere Monitoring Service (CAMS)',
    url: 'https://dataspace.copernicus.eu/',
    tag: 'Satellite / Atmosphere',
  },
  {
    name: 'Protected Planet (UNEP-WCMC)',
    desc: 'Всемирная база данных охраняемых территорий (WDPA)',
    url: 'https://www.protectedplanet.net/',
    tag: 'Protected areas',
  },
  {
    name: 'Copernicus CDS — Köppen-Geiger',
    desc: 'Климатические зоны Кёппен-Гейгера — прогнозы 1991–2100',
    url: 'https://cds.climate.copernicus.eu/datasets/sis-biodiversity-cmip5-global',
    tag: 'Climate zones',
  },
  {
    name: 'Open-Meteo',
    desc: 'Бесплатный метеорологический API с прогнозами погоды и историческими данными',
    url: 'https://open-meteo.com/',
    tag: 'Weather API',
  },
];

const tagStyle = {
  display: 'inline-block',
  fontSize: '0.58rem',
  padding: '0.1rem 0.35rem',
  borderRadius: '0.25rem',
  background: 'rgba(136,139,224,0.1)',
  color: 'rgba(136,139,224,0.75)',
  border: '1px solid rgba(136,139,224,0.18)',
  marginBottom: '0.25rem',
  fontWeight: 500,
};

const ApiLinksTool = () => (
  <div className={styles.toolWrap}>
    <p className={baseStyles.toolDesc}>
      Сервисы и API, используемые в геопортале.
    </p>

    {SERVICES.map((s) => (
      <div key={s.name} style={{
        background: 'rgba(9,10,36,0.35)',
        border: '1px solid rgba(136,139,224,0.1)',
        borderRadius: '0.4rem',
        padding: '0.5rem 0.6rem',
      }}>
        <div style={{ fontWeight: 600, fontSize: '0.72rem', marginBottom: '0.1rem' }}>{s.name}</div>
        <span style={tagStyle}>{s.tag}</span>
        <div style={{ fontSize: '0.64rem', color: 'rgba(217,218,245,0.42)', lineHeight: 1.4, marginBottom: '0.3rem' }}>
          {s.desc}
        </div>
        <a
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.67rem',
            color: 'rgba(52,211,153,0.8)',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          <ExternalLink size={11} /> Открыть сайт
        </a>
      </div>
    ))}
  </div>
);

export default ApiLinksTool;
