import { ExternalLink } from 'lucide-react';
import baseStyles from './ToolsControls.module.scss';
import styles from './AnalysisTools.module.scss';

const SOURCES = [
  {
    category: 'Пожары',
    items: [
      {
        name: 'NASA FIRMS',
        desc: 'Активные точки возгорания MODIS / VIIRS в реальном времени',
        format: 'CSV / SHP / KML',
        url: 'https://firms.modaps.eosdis.nasa.gov/download/',
      },
    ],
  },
  {
    category: 'Спутниковые снимки',
    items: [
      {
        name: 'Copernicus Open Access Hub',
        desc: 'Sentinel-1 SAR и Sentinel-2 мультиспектральные снимки',
        format: 'GeoTIFF / SAFE',
        url: 'https://browser.dataspace.copernicus.eu/',
      },
      {
        name: 'Microsoft Planetary Computer',
        desc: 'Sentinel-1/2, Landsat, DEM, LULC через STAC API',
        format: 'COG / GeoTIFF',
        url: 'https://planetarycomputer.microsoft.com/catalog',
      },
    ],
  },
  {
    category: 'Рельеф (ЦМР)',
    items: [
      {
        name: 'OpenTopography — Copernicus GLO-30',
        desc: 'Цифровая модель рельефа 30 м на основе TanDEM-X',
        format: 'GeoTIFF',
        url: 'https://portal.opentopography.org/raster?opentopoID=OTSDEM.032021.4326.3',
      },
    ],
  },
  {
    category: 'Охраняемые территории',
    items: [
      {
        name: 'Protected Planet (UNEP-WCMC)',
        desc: 'Глобальная база особо охраняемых природных территорий',
        format: 'SHP / GeoJSON / CSV',
        url: 'https://www.protectedplanet.net/en/thematic-areas/wdpa',
      },
    ],
  },
  {
    category: 'Административные границы',
    items: [
      {
        name: 'HDX — Humanitarian Data Exchange',
        desc: 'Административные границы Казахстана уровней 1–3',
        format: 'SHP / GeoJSON',
        url: 'https://data.humdata.org/dataset/cod-ab-kaz',
      },
    ],
  },
];

const formatBadgeStyle = {
  display: 'inline-block',
  fontSize: '0.6rem',
  padding: '0.1rem 0.35rem',
  borderRadius: '0.25rem',
  background: 'rgba(136,139,224,0.12)',
  color: 'rgba(136,139,224,0.8)',
  border: '1px solid rgba(136,139,224,0.18)',
  marginBottom: '0.2rem',
};

const DownloadDataTool = () => (
  <div className={styles.toolWrap}>
    <p className={baseStyles.toolDesc}>
      Ссылки на внешние источники для загрузки данных, используемых в геопортале.
    </p>

    {SOURCES.map((group) => (
      <div key={group.category} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <span className={styles.sectionLabel}>{group.category}</span>

        {group.items.map((item) => (
          <div key={item.name} style={{
            background: 'rgba(9,10,36,0.35)',
            border: '1px solid rgba(136,139,224,0.1)',
            borderRadius: '0.4rem',
            padding: '0.5rem 0.6rem',
          }}>
            <div style={{ fontWeight: 600, fontSize: '0.72rem', marginBottom: '0.15rem' }}>{item.name}</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(217,218,245,0.45)', marginBottom: '0.3rem', lineHeight: 1.35 }}>
              {item.desc}
            </div>
            <span style={formatBadgeStyle}>{item.format}</span>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                marginTop: '0.35rem',
                fontSize: '0.68rem',
                color: 'rgba(52,211,153,0.85)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              <ExternalLink size={11} /> Открыть
            </a>
          </div>
        ))}
      </div>
    ))}
  </div>
);

export default DownloadDataTool;
