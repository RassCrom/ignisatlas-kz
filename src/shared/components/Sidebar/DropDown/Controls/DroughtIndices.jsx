import { useCallback, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Cloud,
  Database,
  Eye,
  EyeOff,
  Image,
  Layers,
  MapPlus,
  MapPin,
  Navigation,
  Pentagon,
  Search,
  Satellite,
  Sliders,
  Square,
  X,
} from 'lucide-react';
import styles from '../SentinelControls/SentinelExplorer.module.scss';
import useAoiStore from 'src/app/store/aoiStore';
import { getMapInstance } from 'src/modules/MapPage/services/mapService';
import { getDefaultDateRange } from 'src/shared/utils/dateDefaults';
import {
  searchSentinelPc,
  buildS2TileUrl,
  sortResults as sortSentinelResults,
  formatDate as formatSentinelDate,
  getMissionLabel as getSentinelMissionLabel,
} from 'src/utils/sentinelPcSearchService';
import {
  searchLandsat,
  buildTileUrl as buildLandsatTileUrl,
  sortResults as sortLandsatResults,
  formatDate as formatLandsatDate,
  getMissionLabel as getLandsatMissionLabel,
} from 'src/utils/landsatSearchService';
import {
  searchModis,
  buildModisTileUrl,
  sortModisResults,
  formatModisDate,
  getModisProductLabel,
} from 'src/utils/modisSearchService';
import './FireControls/fireControls.scss';

const KAZAKHSTAN_BBOX = [46, 40, 88, 56];

const IMAGERY_SOURCE = {
  name: 'Microsoft Planetary Computer STAC API',
  url: 'https://planetarycomputer.microsoft.com/api/stac/v1',
  cadence: 'Sentinel-2 L2A, Landsat Collection 2 Level-2, MODIS 061 COG collections',
  variables: 'NDVI, EVI/AEVI, NDMI, SAVI, NBR, NDWI, LAI, and FPAR render presets',
};

const IMAGERY_SOURCES = [
  { id: 'sentinel', label: 'Sentinel-2', caption: '10-20 m optical', icon: Satellite },
  { id: 'landsat', label: 'Landsat', caption: '30 m archive', icon: Layers },
  { id: 'modis', label: 'MODIS', caption: '250-500 m composites', icon: Cloud },
];

const DROUGHT_IMAGE_PRESETS = [
  {
    id: 'ndvi',
    label: 'NDVI',
    description: 'Vegetation greenness and drought stress screening.',
    sources: {
      sentinel: { mission: 'sentinel-2', preset: 'ndvi' },
      landsat: { mission: 'all', preset: 'ndvi' },
      modis: { product: 'modis-13Q1-061', preset: 'ndvi-250m' },
    },
  },
  {
    id: 'evi',
    label: 'EVI / AEVI',
    description: 'Enhanced vegetation response for dense canopy areas.',
    sources: {
      sentinel: { mission: 'sentinel-2', preset: 'evi' },
      landsat: { mission: 'all', preset: 'evi' },
      modis: { product: 'modis-13Q1-061', preset: 'evi-250m' },
    },
  },
  {
    id: 'ndmi',
    label: 'NDMI',
    description: 'Vegetation water content and moisture anomaly proxy.',
    sources: {
      sentinel: { mission: 'sentinel-2', preset: 'ndmi' },
      landsat: { mission: 'all', preset: 'ndmi' },
    },
  },
  {
    id: 'savi',
    label: 'SAVI',
    description: 'Soil-adjusted vegetation signal for sparse cover.',
    sources: {
      sentinel: { mission: 'sentinel-2', preset: 'savi' },
      landsat: { mission: 'all', preset: 'savi' },
    },
  },
  {
    id: 'nbr',
    label: 'NBR',
    description: 'Dry vegetation, burn severity, and disturbance context.',
    sources: {
      sentinel: { mission: 'sentinel-2', preset: 'nbr' },
      landsat: { mission: 'all', preset: 'nbr' },
    },
  },
  {
    id: 'ndwi',
    label: 'NDWI',
    description: 'Open water and surface wetness context.',
    sources: {
      sentinel: { mission: 'sentinel-2', preset: 'ndwi' },
      landsat: { mission: 'all', preset: 'ndwi' },
    },
  },
  {
    id: 'lai',
    label: 'LAI',
    description: 'MODIS Leaf Area Index for canopy density.',
    sources: {
      modis: { product: 'modis-15A3H-061', preset: 'lai-4day' },
    },
  },
  {
    id: 'fpar',
    label: 'FPAR',
    description: 'MODIS absorbed photosynthetically active radiation.',
    sources: {
      modis: { product: 'modis-15A2H-061', preset: 'fpar-8day' },
    },
  },
  {
    id: 'modis-ndvi-500',
    label: 'NDVI 500m',
    description: 'MODIS vegetation indices 16-day 500 m product.',
    sources: {
      modis: { product: 'modis-13A1-061', preset: 'ndvi-500m' },
    },
  },
];

const safeLayerId = (value) => value.replace(/[^a-zA-Z0-9_-]/g, '_');

const addRasterLayerToMap = ({ layerId, tileUrl, bbox, sourceLabel }) => {
  const map = getMapInstance();
  if (!map || !tileUrl) return false;

  const sourceId = `${layerId}-source`;
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: 'raster',
      tiles: [tileUrl],
      tileSize: 256,
      maxzoom: 18,
      attribution: `${sourceLabel} via Microsoft Planetary Computer`,
    });
  }

  if (!map.getLayer(layerId)) {
    map.addLayer({
      id: layerId,
      type: 'raster',
      source: sourceId,
      paint: { 'raster-opacity': 0.82 },
    });
  }

  if (bbox?.length === 4) {
    map.fitBounds(
      [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
      { padding: 72, maxZoom: 10, duration: 700 }
    );
  }

  return true;
};

const PanelSection = ({ icon: Icon, title, children }) => (
  <section className="drought-panel__section">
    <div className="drought-panel__section-header">
      <div className="drought-panel__section-title">
        <Icon size={13} />
        <span>{title}</span>
      </div>
    </div>
    {children}
  </section>
);

const SourceCard = ({ source }) => (
  <div className="drought-panel__source-card">
    <a href={source.url} target="_blank" rel="noreferrer">
      {source.name}
    </a>
    <span>{source.cadence}</span>
    <p>{source.variables}</p>
  </div>
);

const ImageryResultCard = ({ item, isOnMap, onAddToMap }) => (
  <article className="drought-panel__image-card">
    <div className="drought-panel__image-thumb">
      {item.thumbnailUrl ? (
        <img src={item.thumbnailUrl} alt={`${item.sourceLabel} ${item.indexLabel} preview`} loading="lazy" />
      ) : (
        <div className="drought-panel__image-placeholder">
          <Image size={18} />
          <span>No preview</span>
        </div>
      )}
    </div>
    <div className="drought-panel__image-body">
      <div className="drought-panel__image-title-row">
        <strong title={item.name}>{item.name}</strong>
        <span>{item.indexLabel}</span>
      </div>
      <div className="drought-panel__image-meta">
        <span>{item.sourceLabel}</span>
        <span>{item.dateLabel}</span>
        <span>{item.cloudLabel}</span>
      </div>
      <p>{item.productLabel}</p>
      <button
        type="button"
        className={`drought-panel__map-action ${isOnMap ? 'drought-panel__map-action--active' : ''}`}
        onClick={() => onAddToMap(item)}
      >
        <MapPlus size={13} />
        <span>{isOnMap ? 'Layer on map' : 'Add to map'}</span>
      </button>
    </div>
  </article>
);

const DroughtIndices = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState('sentinel');
  const [selectedPresetId, setSelectedPresetId] = useState('ndvi');
  const [{ startDate, endDate }, setDateRange] = useState(getDefaultDateRange);
  const [cloudCoverage, setCloudCoverage] = useState(30);
  const [maxRecords, setMaxRecords] = useState(6);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [activeLayerIds, setActiveLayerIds] = useState({});
  const aoiBbox = useAoiStore((state) => state.aoiBbox);
  const aoiDrawMode = useAoiStore((state) => state.aoiDrawMode);
  const aoiVisible = useAoiStore((state) => state.aoiVisible);
  const setAoiDrawMode = useAoiStore((state) => state.setAoiDrawMode);
  const clearAoi = useAoiStore((state) => state.clearAoi);
  const toggleAoiVisibility = useAoiStore((state) => state.toggleAoiVisibility);

  const availablePresets = useMemo(
    () => DROUGHT_IMAGE_PRESETS.filter((preset) => preset.sources[selectedSourceId]),
    [selectedSourceId]
  );

  const activePreset = useMemo(
    () => availablePresets.find((preset) => preset.id === selectedPresetId) || availablePresets[0],
    [availablePresets, selectedPresetId]
  );

  const activeSource = useMemo(
    () => IMAGERY_SOURCES.find((source) => source.id === selectedSourceId) || IMAGERY_SOURCES[0],
    [selectedSourceId]
  );

  const searchBbox = aoiBbox || KAZAKHSTAN_BBOX;

  const handleSourceChange = useCallback((sourceId) => {
    setSelectedSourceId(sourceId);
    const firstPreset = DROUGHT_IMAGE_PRESETS.find((preset) => preset.sources[sourceId]);
    if (firstPreset) setSelectedPresetId(firstPreset.id);
    setSearchResults([]);
    setTotalResults(0);
    setSearchError(null);
  }, []);

  const handleImagerySearch = useCallback(async () => {
    if (!activePreset) {
      setSearchError('No drought index preset is available for this source.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setTotalResults(0);
    setActiveLayerIds({});

    try {
      const sourcePreset = activePreset.sources[selectedSourceId];
      let nextResults = [];
      let nextTotal = 0;

      if (selectedSourceId === 'sentinel') {
        const { features, totalResults: found } = await searchSentinelPc({
          mission: sourcePreset.mission,
          startDate,
          endDate,
          bbox: searchBbox,
          cloudCoverage,
          maxRecords,
        });
        nextTotal = found;
        nextResults = sortSentinelResults(features).map((item) => ({
          id: item.id,
          name: item.name,
          sourceLabel: getSentinelMissionLabel(item.mission),
          dateLabel: formatSentinelDate(item.acquisitionDate),
          cloudLabel: item.cloudCover == null ? 'Cloud N/A' : `${Math.round(item.cloudCover)}% cloud`,
          productLabel: `Planetary Computer sentinel-2-l2a tile preset: ${sourcePreset.preset}`,
          indexLabel: activePreset.label,
          thumbnailUrl: item.thumbnailUrl,
          tileUrl: buildS2TileUrl(item.id, sourcePreset.preset),
          bbox: item.bbox,
          mapLayerId: safeLayerId(`drought_index_sentinel_${activePreset.id}_${item.id}`),
        }));
      } else if (selectedSourceId === 'landsat') {
        const { features, totalResults: found } = await searchLandsat({
          mission: sourcePreset.mission,
          startDate,
          endDate,
          bbox: searchBbox,
          cloudCoverage,
          maxRecords,
        });
        nextTotal = found;
        nextResults = sortLandsatResults(features).map((item) => ({
          id: item.id,
          name: item.name,
          sourceLabel: getLandsatMissionLabel(item.mission),
          dateLabel: formatLandsatDate(item.acquisitionDate),
          cloudLabel: item.cloudCover == null ? 'Cloud N/A' : `${Math.round(item.cloudCover)}% cloud`,
          productLabel: `Planetary Computer landsat-c2-l2 tile preset: ${sourcePreset.preset}`,
          indexLabel: activePreset.label,
          thumbnailUrl: item.thumbnailUrl,
          tileUrl: buildLandsatTileUrl(item.id, sourcePreset.preset),
          bbox: item.bbox,
          mapLayerId: safeLayerId(`drought_index_landsat_${activePreset.id}_${item.id}`),
        }));
      } else {
        const { features, totalResults: found } = await searchModis({
          product: sourcePreset.product,
          startDate,
          endDate,
          bbox: searchBbox,
          cloudCoverage: 100,
          maxRecords,
        });
        nextTotal = found;
        nextResults = sortModisResults(features).map((item) => ({
          id: item.id,
          name: item.name,
          sourceLabel: 'MODIS',
          dateLabel: formatModisDate(item.acquisitionDate),
          cloudLabel: 'Composite',
          productLabel: `${getModisProductLabel(item.collection)} tile preset: ${sourcePreset.preset}`,
          indexLabel: activePreset.label,
          thumbnailUrl: item.thumbnailUrl,
          tileUrl: buildModisTileUrl(item.collection, item.id, sourcePreset.preset),
          bbox: item.bbox,
          mapLayerId: safeLayerId(`drought_index_modis_${activePreset.id}_${item.id}`),
        }));
      }

      setSearchResults(nextResults);
      setTotalResults(nextTotal || nextResults.length);
      if (nextResults.length === 0) {
        setSearchError('No images found. Try a wider date range or another index.');
      }
    } catch (error) {
      setSearchError(error.message);
    } finally {
      setIsSearching(false);
    }
  }, [
    activePreset,
    cloudCoverage,
    endDate,
    maxRecords,
    searchBbox,
    selectedSourceId,
    startDate,
  ]);

  const handleAddToMap = useCallback((item) => {
    const added = addRasterLayerToMap({
      layerId: item.mapLayerId,
      tileUrl: item.tileUrl,
      bbox: item.bbox,
      sourceLabel: item.sourceLabel,
    });

    if (!added) {
      setSearchError('Map is not ready yet. Try again after the map finishes loading.');
      return;
    }

    setActiveLayerIds((current) => ({
      ...current,
      [item.mapLayerId]: true,
    }));
    setSearchError(null);
  }, []);

  return (
    <div className="fire-controls drought-panel drought-panel--indices-feature">
      <div className="fire-controls__header">
        <div className="fire-controls__toggle drought-panel__main-toggle">
          <span className="fire-controls__toggle-icon">
            <Image size={16} className="fire-controls__icon-active" />
          </span>
          <span className="fire-controls__toggle-label">Индексы засухи</span>
          <span className="drought-panel__status drought-panel__status--forecast">PC</span>
        </div>

        <button
          type="button"
          className={`fire-controls__expand-btn ${isExpanded ? 'fire-controls__expand-btn--expanded' : ''}`}
          onClick={() => setIsExpanded((value) => !value)}
          title="Drought indices"
          aria-expanded={isExpanded}
        >
          <Sliders size={14} />
        </button>
      </div>

      {isExpanded && (
        <div className="fire-controls__content drought-panel__content">
          {/* ── AOI Controls (same pattern as Landsat/Sentinel explorers) ── */}
          <div className={styles.searchSection} style={{ paddingBottom: 0 }}>
            <div>
              <div className={styles.sectionTitle}>
                <Navigation size={12} /> Area of Interest (AOI)
              </div>
              <div className={styles.aoiRow}>
                <button
                  className={`${styles.aoiBtn} ${aoiDrawMode === 'box' ? styles['aoiBtn--active'] : ''}`}
                  onClick={() => setAoiDrawMode(aoiDrawMode === 'box' ? null : 'box')}
                >
                  <Square size={13} /> Rectangle
                </button>
                <button
                  className={`${styles.aoiBtn} ${aoiDrawMode === 'polygon' ? styles['aoiBtn--active'] : ''}`}
                  onClick={() => setAoiDrawMode(aoiDrawMode === 'polygon' ? null : 'polygon')}
                >
                  <Pentagon size={13} /> Polygon
                </button>
                {aoiBbox && (
                  <>
                    <button
                      className={`${styles.aoiBtn} ${!aoiVisible ? styles['aoiBtn--inactive'] : ''}`}
                      onClick={() => toggleAoiVisibility()}
                      title={aoiVisible ? 'Hide AOI Polygon' : 'Show AOI Polygon'}
                    >
                      {aoiVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                    <button
                      className={`${styles.aoiBtn} ${styles['aoiBtn--clear']}`}
                      onClick={() => { clearAoi(); setAoiDrawMode(null); }}
                      title="Clear AOI"
                    >
                      <X size={13} />
                    </button>
                  </>
                )}
              </div>
              {aoiBbox && (
                <div className={styles.aoiInfo}>
                  <MapPin size={11} />
                  Bbox: [{aoiBbox.map((v) => v.toFixed(2)).join(', ')}]
                </div>
              )}
            </div>
          </div>

          <PanelSection icon={Satellite} title="Sensor">
            <div className="drought-panel__source-grid">
              {IMAGERY_SOURCES.map(({ id, label, caption, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`drought-panel__source-btn ${selectedSourceId === id ? 'drought-panel__source-btn--active' : ''}`}
                  onClick={() => handleSourceChange(id)}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                  <small>{caption}</small>
                </button>
              ))}
            </div>
          </PanelSection>

          <PanelSection icon={Layers} title={`${activeSource.label} index presets`}>
            <div className="drought-panel__preset-grid">
              {availablePresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`drought-panel__preset-btn ${activePreset?.id === preset.id ? 'drought-panel__preset-btn--active' : ''}`}
                  onClick={() => setSelectedPresetId(preset.id)}
                >
                  <strong>{preset.label}</strong>
                  <span>{preset.description}</span>
                </button>
              ))}
            </div>
          </PanelSection>

          <PanelSection icon={Calendar} title="Search filters">
            <div className="drought-panel__field-grid drought-panel__field-grid--two">
              <label className="drought-panel__field">
                <span>Start date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setDateRange((value) => ({ ...value, startDate: event.target.value }))}
                />
              </label>
              <label className="drought-panel__field">
                <span>End date</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setDateRange((value) => ({ ...value, endDate: event.target.value }))}
                />
              </label>
            </div>
            <div className="drought-panel__field-grid drought-panel__field-grid--two">
              <label className="drought-panel__field">
                <span>Cloud cover</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={cloudCoverage}
                  disabled={selectedSourceId === 'modis'}
                  onChange={(event) => setCloudCoverage(Number(event.target.value))}
                />
                <small>{selectedSourceId === 'modis' ? 'MODIS composites' : `${cloudCoverage}% max`}</small>
              </label>
              <label className="drought-panel__field">
                <span>Records</span>
                <select value={maxRecords} onChange={(event) => setMaxRecords(Number(event.target.value))}>
                  <option value={4}>4 images</option>
                  <option value={6}>6 images</option>
                  <option value={10}>10 images</option>
                </select>
              </label>
            </div>
            <button
              type="button"
              className="drought-panel__imagery-search"
              onClick={handleImagerySearch}
              disabled={isSearching}
            >
              <Search size={14} />
              <span>{isSearching ? 'Searching...' : `Search ${activePreset?.label || 'index'}`}</span>
            </button>
          </PanelSection>

          {searchError && (
            <div className="drought-panel__imagery-error" role="alert">
              <AlertCircle size={14} />
              <span>{searchError}</span>
            </div>
          )}

          <PanelSection icon={Image} title={`Images${totalResults ? ` (${searchResults.length}/${totalResults})` : ''}`}>
            <div className="drought-panel__image-results">
              {searchResults.length > 0 ? (
                searchResults.map((item) => (
                  <ImageryResultCard
                    key={`${item.id}-${item.tileUrl}`}
                    item={item}
                    isOnMap={Boolean(activeLayerIds[item.mapLayerId])}
                    onAddToMap={handleAddToMap}
                  />
                ))
              ) : (
                <div className="drought-panel__empty-state">
                  <Image size={18} />
                  <span>Run a search to preview matching Planetary Computer images.</span>
                </div>
              )}
            </div>
          </PanelSection>

          <PanelSection icon={Database} title="Real imagery data source">
            <SourceCard source={IMAGERY_SOURCE} />
          </PanelSection>
        </div>
      )}
    </div>
  );
};

export default DroughtIndices;
