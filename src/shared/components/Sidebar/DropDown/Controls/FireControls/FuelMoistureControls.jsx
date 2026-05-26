import { useCallback, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Calendar,
  ChevronUp,
  Database,
  Droplets,
  Eye,
  EyeOff,
  Info,
  Layers,
  MapPin,
  Navigation,
  Pentagon,
  Search,
  Sliders,
  Square,
  Trash2,
  X,
} from 'lucide-react';

import useAoiStore from 'src/app/store/aoiStore';
import useFuelMoistureStore from 'src/app/store/fuelMoistureStore';
import { isAbortError, useAbortableTask } from 'src/shared/hooks/useAbortableTask';
import { getCurrentDate } from 'src/shared/utils/dateDefaults';
import { KAZAKHSTAN_EXTENT_GEO } from 'src/modules/MapPage/utils/mapConstants';
import {
  FUEL_MOISTURE_INDICES,
  buildFuelMoistureTileUrl,
  formatDate,
  getCloudCoverColor,
  getCloudCoverLabel,
  getFuelMoistureDateRange,
  getFuelMoistureIndex,
  searchFuelMoisture,
} from 'src/utils/fuelMoistureService';

import styles from '../../SentinelControls/SentinelExplorer.module.scss';
import './fireControls.scss';

const KZ_BBOX = KAZAKHSTAN_EXTENT_GEO;
const KZ_GEOJSON = {
  type: 'Polygon',
  coordinates: [[
    [50.5, 40.5], [87.5, 40.5], [87.5, 55.5], [50.5, 55.5], [50.5, 40.5],
  ]],
};

const today = getCurrentDate();

const sortResults = (results, sortBy, sortOrder) => {
  const sorted = [...results].sort((a, b) => {
    if (sortBy === 'cloudCover') {
      return (a.cloudCover ?? 999) - (b.cloudCover ?? 999);
    }
    return new Date(a.acquisitionDate || 0) - new Date(b.acquisitionDate || 0);
  });
  return sortOrder === 'asc' ? sorted : sorted.reverse();
};

const makeLayerId = (sceneId, indexId) => {
  const safeSceneId = String(sceneId).replace(/[^a-zA-Z0-9_-]/g, '-');
  return `fuel-moisture-${safeSceneId}-${indexId}-${Date.now()}`;
};

const FuelMoistureControls = () => {
  const selectedIndex = useFuelMoistureStore((state) => state.selectedIndex);
  const date = useFuelMoistureStore((state) => state.date);
  const cloudCoverage = useFuelMoistureStore((state) => state.cloudCoverage);
  const pageSize = useFuelMoistureStore((state) => state.pageSize);
  const searchResults = useFuelMoistureStore((state) => state.searchResults);
  const totalResults = useFuelMoistureStore((state) => state.totalResults);
  const isLoading = useFuelMoistureStore((state) => state.isLoading);
  const error = useFuelMoistureStore((state) => state.error);
  const sortBy = useFuelMoistureStore((state) => state.sortBy);
  const sortOrder = useFuelMoistureStore((state) => state.sortOrder);
  const activeLayers = useFuelMoistureStore((state) => state.activeLayers);
  const globalOpacity = useFuelMoistureStore((state) => state.globalOpacity);
  const activeTab = useFuelMoistureStore((state) => state.activeTab);
  const setSelectedIndex = useFuelMoistureStore((state) => state.setSelectedIndex);
  const setDate = useFuelMoistureStore((state) => state.setDate);
  const setCloudCoverage = useFuelMoistureStore((state) => state.setCloudCoverage);
  const setPageSize = useFuelMoistureStore((state) => state.setPageSize);
  const setSearchResults = useFuelMoistureStore((state) => state.setSearchResults);
  const setIsLoading = useFuelMoistureStore((state) => state.setIsLoading);
  const setError = useFuelMoistureStore((state) => state.setError);
  const clearSearch = useFuelMoistureStore((state) => state.clearSearch);
  const setGlobalOpacity = useFuelMoistureStore((state) => state.setGlobalOpacity);
  const setActiveTab = useFuelMoistureStore((state) => state.setActiveTab);
  const setSortBy = useFuelMoistureStore((state) => state.setSortBy);
  const addActiveLayer = useFuelMoistureStore((state) => state.addActiveLayer);
  const removeActiveLayer = useFuelMoistureStore((state) => state.removeActiveLayer);
  const toggleLayerVisibility = useFuelMoistureStore((state) => state.toggleLayerVisibility);
  const updateLayerOpacity = useFuelMoistureStore((state) => state.updateLayerOpacity);
  const reorderLayers = useFuelMoistureStore((state) => state.reorderLayers);
  const clearActiveLayers = useFuelMoistureStore((state) => state.clearActiveLayers);
  const setAllLayersVisible = useFuelMoistureStore((state) => state.setAllLayersVisible);

  const aoiBbox = useAoiStore((state) => state.aoiBbox);
  const aoiVisible = useAoiStore((state) => state.aoiVisible);
  const aoiDrawMode = useAoiStore((state) => state.aoiDrawMode);
  const setAoi = useAoiStore((state) => state.setAoi);
  const clearAoi = useAoiStore((state) => state.clearAoi);
  const setAoiDrawMode = useAoiStore((state) => state.setAoiDrawMode);
  const toggleAoiVisibility = useAoiStore((state) => state.toggleAoiVisibility);

  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [thumbErrors, setThumbErrors] = useState({});
  const searchTask = useAbortableTask();
  const searchSeqRef = useRef(0);

  const indexConfig = getFuelMoistureIndex(selectedIndex);
  const dateRange = getFuelMoistureDateRange(date);
  const isStressIndex = selectedIndex === 'msi';
  const legendGradient = isStressIndex
    ? 'linear-gradient(to right, #ffffcc, #fed976, #fd8d3c, #e31a1c, #800026)'
    : 'linear-gradient(to right, #b2182b, #ef8a62, #fddbc7, #d1e5f0, #67a9cf, #2166ac)';
  const legendLeftLabel = isStressIndex ? 'Moist' : 'Extremely dry';
  const legendRightLabel = isStressIndex ? 'Extremely dry' : 'Moist';
  const sortedResults = useMemo(
    () => sortResults(searchResults, sortBy, sortOrder),
    [searchResults, sortBy, sortOrder]
  );

  const handleSearch = useCallback(async () => {
    const searchSeq = searchSeqRef.current + 1;
    searchSeqRef.current = searchSeq;
    setIsLoading(true);
    setError(null);
    clearSearch();
    setActiveTab('results');

    try {
      const { features, totalResults: nextTotal } = await searchTask.run((signal) => searchFuelMoisture({
        date,
        bbox: aoiBbox || KZ_BBOX,
        cloudCoverage,
        maxRecords: pageSize,
        signal,
      }));

      if (searchSeq !== searchSeqRef.current) return;

      setSearchResults(features, nextTotal);
      if (features.length === 0) {
        setError('No Sentinel-2 scenes found. Try a wider AOI, lower cloud filter, or another date.');
      }
    } catch (err) {
      if (isAbortError(err)) return;
      if (searchSeq !== searchSeqRef.current) return;
      setError(err.message);
      setActiveTab('search');
    } finally {
      if (searchSeq === searchSeqRef.current) setIsLoading(false);
    }
  }, [
    aoiBbox,
    clearSearch,
    cloudCoverage,
    date,
    pageSize,
    searchTask,
    setActiveTab,
    setError,
    setIsLoading,
    setSearchResults,
  ]);

  const handleAddToMap = useCallback((result) => {
    const layerId = makeLayerId(result.id, selectedIndex);
    const tileUrl = buildFuelMoistureTileUrl(result.id, selectedIndex);
    const index = getFuelMoistureIndex(selectedIndex);

    addActiveLayer({
      id: layerId,
      layerId,
      sourceId: `${layerId}-source`,
      indexId: selectedIndex,
      indexLabel: index.shortLabel,
      opacity: globalOpacity,
      productId: result.id,
      name: result.name,
      sceneId: result.sceneId,
      cloudCover: result.cloudCover,
      visible: true,
      acquisitionDate: result.acquisitionDate,
      tileUrl,
    });
    setActiveTab('layers');
  }, [addActiveLayer, globalOpacity, selectedIndex, setActiveTab]);

  const handleToggleAll = useCallback(() => {
    if (activeLayers.length === 0) {
      setIsExpanded((value) => !value);
      return;
    }
    const next = !activeLayers.every((layer) => layer.visible);
    setAllLayersVisible(next);
  }, [activeLayers, setAllLayersVisible]);

  const handleClearAoi = useCallback(() => {
    clearAoi();
    setAoiDrawMode(null);
  }, [clearAoi, setAoiDrawMode]);

  const allVisible = activeLayers.length > 0 && activeLayers.every((layer) => layer.visible);

  return (
    <div className="fire-controls">
      <div className="fire-controls__header">
        <div className="fire-controls__toggle" onClick={handleToggleAll}>
          <div className="fire-controls__toggle-icon">
            {allVisible
              ? <Eye size={16} className="fire-controls__icon-active" />
              : <EyeOff size={16} className="fire-controls__icon-inactive" />}
          </div>
          <span className="fire-controls__toggle-label">Fuel Moisture & Dryness</span>
        </div>
        <button
          className={`fire-controls__expand-btn ${isExpanded ? 'fire-controls__expand-btn--expanded' : ''}`}
          onClick={() => setIsExpanded((value) => !value)}
          aria-label="Fuel moisture settings"
        >
          <Sliders size={14} />
        </button>
      </div>

      {isExpanded && (
        <div className={styles.explorer}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'search' ? styles['tab--active'] : ''}`}
              onClick={() => setActiveTab('search')}
            >
              <Search size={14} /> Search
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'results' ? styles['tab--active'] : ''}`}
              onClick={() => setActiveTab('results')}
              disabled={searchResults.length === 0 && !isLoading}
            >
              <Database size={14} /> Results
              {searchResults.length > 0 && <span className={styles.badge}>{searchResults.length}</span>}
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'layers' ? styles['tab--active'] : ''}`}
              onClick={() => setActiveTab('layers')}
              disabled={activeLayers.length === 0}
            >
              <Layers size={14} /> Layers
              {activeLayers.length > 0 && <span className={styles.badge}>{activeLayers.length}</span>}
            </button>
          </div>

          <div className={styles.content}>
            {activeTab === 'search' && (
              <div className={styles.searchSection}>
                <div>
                  <div className={styles.sectionTitle}>
                    <Droplets size={12} /> Moisture index
                  </div>
                  <div className={styles.missionSelector}>
                    <select
                      value={selectedIndex}
                      onChange={(event) => setSelectedIndex(event.target.value)}
                      className={styles.select}
                    >
                      {FUEL_MOISTURE_INDICES.map((index) => (
                        <option key={index.id} value={index.id}>{index.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.aoiInfo} style={{ marginTop: '0.45rem' }}>
                    <Info size={11} />
                    {indexConfig.description}
                  </div>
                </div>

                <div>
                  <div className={styles.sectionTitle}>
                    <Navigation size={12} /> Area of interest
                  </div>
                  <div className={styles.aoiRow}>
                    <button
                      className={`${styles.aoiBtn} ${aoiDrawMode === 'box' ? styles['aoiBtn--active'] : ''}`}
                      onClick={() => setAoiDrawMode(aoiDrawMode === 'box' ? null : 'box')}
                    >
                      <Square size={13} /> Box
                    </button>
                    <button
                      className={`${styles.aoiBtn} ${aoiDrawMode === 'polygon' ? styles['aoiBtn--active'] : ''}`}
                      onClick={() => setAoiDrawMode(aoiDrawMode === 'polygon' ? null : 'polygon')}
                    >
                      <Pentagon size={13} /> Polygon
                    </button>
                    <button
                      className={styles.aoiBtn}
                      onClick={() => setAoi(KZ_GEOJSON, KZ_BBOX)}
                      title="Kazakhstan"
                    >
                      KZ
                    </button>
                    {aoiBbox && (
                      <>
                        <button
                          className={`${styles.aoiBtn} ${!aoiVisible ? styles['aoiBtn--inactive'] : ''}`}
                          onClick={toggleAoiVisibility}
                          title={aoiVisible ? 'Hide AOI' : 'Show AOI'}
                        >
                          {aoiVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                        </button>
                        <button
                          className={`${styles.aoiBtn} ${styles['aoiBtn--clear']}`}
                          onClick={handleClearAoi}
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
                      Bbox: [{aoiBbox.map((value) => value.toFixed(2)).join(', ')}]
                    </div>
                  )}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>
                    <Calendar size={12} /> Target date
                  </label>
                  <input
                    type="date"
                    value={date}
                    max={today}
                    onChange={(event) => setDate(event.target.value)}
                    className={styles.dateInput}
                  />
                  <span className={styles.detailLabel}>
                    Search window: {dateRange.startDate} to {dateRange.endDate}
                  </span>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>
                    Cloud cover: up to {cloudCoverage}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={cloudCoverage}
                    onChange={(event) => setCloudCoverage(Number(event.target.value))}
                    className={styles.slider}
                  />
                </div>

                <div className={styles.dateRow}>
                  <div className={styles.field}>
                    <label className={styles.label}>Max scenes</label>
                    <select
                      value={pageSize}
                      onChange={(event) => setPageSize(Number(event.target.value))}
                      className={styles.select}
                    >
                      {[10, 20, 40, 60].map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>
                      Opacity: {globalOpacity}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={globalOpacity}
                      onChange={(event) => setGlobalOpacity(Number(event.target.value))}
                      className={styles.slider}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Dryness ramp</label>
                  <div style={{
                    height: '12px',
                    borderRadius: '4px',
                    background: legendGradient,
                    margin: '4px 0',
                  }} />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.65rem',
                    color: 'rgba(255,255,255,0.55)',
                  }}>
                    <span>{legendLeftLabel}</span>
                    <span>{legendRightLabel}</span>
                  </div>
                </div>

                {error && (
                  <div className={styles.error}>
                    <AlertCircle size={14} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  className={styles.searchBtn}
                  onClick={handleSearch}
                  disabled={isLoading || !date}
                >
                  <Search size={15} />
                  {isLoading ? 'Searching...' : 'Find Sentinel-2 scenes'}
                </button>
              </div>
            )}

            {activeTab === 'results' && (
              <div className={styles.resultsSection}>
                {isLoading && (
                  <div className={styles.loadingMsg}>
                    <div className={styles.spinner} />
                    <div>Searching Sentinel-2 scenes...</div>
                  </div>
                )}

                {!isLoading && sortedResults.length === 0 && (
                  <div className={styles.emptyMsg}>
                    {error || 'No results yet. Run a search first.'}
                  </div>
                )}

                {sortedResults.length > 0 && (
                  <>
                    <div className={styles.resultsHeader}>
                      <span className={styles.totalCount}>
                        {sortedResults.length} of {totalResults} scenes
                      </span>
                      <div className={styles.sortControls}>
                        <button
                          className={`${styles.sortBtn} ${sortBy === 'date' ? styles['sortBtn--active'] : ''}`}
                          onClick={() => setSortBy('date')}
                        >
                          Date {sortBy === 'date' && (sortOrder === 'desc' ? 'down' : 'up')}
                        </button>
                        <button
                          className={`${styles.sortBtn} ${sortBy === 'cloudCover' ? styles['sortBtn--active'] : ''}`}
                          onClick={() => setSortBy('cloudCover')}
                        >
                          Clouds {sortBy === 'cloudCover' && (sortOrder === 'asc' ? 'up' : 'down')}
                        </button>
                      </div>
                    </div>

                    <div className={styles.resultsList}>
                      {sortedResults.map((result) => {
                        const isDetailExpanded = expandedId === result.id;
                        const thumbFailed = thumbErrors[result.id];
                        const cloudColor = getCloudCoverColor(result.cloudCover);

                        return (
                          <div key={result.id} className={styles.resultCard}>
                            <div className={styles.cardMain}>
                              <div className={styles.cardThumb}>
                                {result.thumbnailUrl && !thumbFailed ? (
                                  <img
                                    src={result.thumbnailUrl}
                                    alt="Sentinel-2 preview"
                                    loading="lazy"
                                    onError={() => setThumbErrors((prev) => ({ ...prev, [result.id]: true }))}
                                  />
                                ) : (
                                  <div className={styles.cardNoThumb}>
                                    <Droplets size={16} />
                                  </div>
                                )}
                              </div>

                              <div className={styles.cardBody}>
                                <div className={styles.cardTopRow}>
                                  <span className={styles.cardDate}>
                                    {formatDate(result.acquisitionDate)}
                                  </span>
                                  <span className={styles.missionBadge} style={{ background: '#0f766e' }}>
                                    S2
                                  </span>
                                </div>

                                <div className={styles.cardMeta}>
                                  {result.mgrsTile && (
                                    <span className={styles.cardType}>Tile {result.mgrsTile}</span>
                                  )}
                                  <span className={styles.cloudBadge} style={{ color: cloudColor }}>
                                    {result.cloudCover == null ? 'Clouds N/A' : `${result.cloudCover.toFixed(1)}% clouds`}
                                    {' '}
                                    ({getCloudCoverLabel(result.cloudCover)})
                                  </span>
                                </div>

                                <div className={styles.cardActions}>
                                  <button
                                    className={styles.expandBtn}
                                    onClick={() => setExpandedId(isDetailExpanded ? null : result.id)}
                                  >
                                    {isDetailExpanded ? <ChevronUp size={12} /> : <Info size={12} />}
                                    {isDetailExpanded ? 'Hide' : 'Details'}
                                  </button>
                                  <button
                                    className={styles.addBtn}
                                    onClick={() => handleAddToMap(result)}
                                  >
                                    <MapPin size={12} /> Add dryness map
                                  </button>
                                </div>
                              </div>
                            </div>

                            {isDetailExpanded && (
                              <div className={styles.cardDetails}>
                                <div className={styles.detailGrid}>
                                  <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Scene ID</span>
                                    <span className={styles.detailValue}>{result.sceneId || result.id}</span>
                                  </div>
                                  <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Index</span>
                                    <span className={styles.detailValue}>{indexConfig.label}</span>
                                  </div>
                                  <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Product</span>
                                    <span className={styles.detailValue}>{result.productType || 'Sentinel-2 L2A'}</span>
                                  </div>
                                  <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Platform</span>
                                    <span className={styles.detailValue}>{result.platform || 'Sentinel-2'}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'layers' && (
              <div className={styles.layersSection}>
                {activeLayers.length === 0 ? (
                  <div className={styles.emptyLayers}>
                    <Layers size={24} />
                    <div>No fuel moisture layers on the map.</div>
                  </div>
                ) : (
                  <>
                    <div className={styles.layersHeader}>
                      <span className={styles.totalCount}>{activeLayers.length} layers on map</span>
                      <button className={styles.clearBtn} onClick={clearActiveLayers}>
                        <Trash2 size={12} /> Clear all
                      </button>
                    </div>

                    <div className={styles.layersList}>
                      {activeLayers.map((layer, idx) => (
                        <div key={layer.id} className={styles.layerCard}>
                          <div className={styles.layerTop}>
                            <div className={styles.layerInfo}>
                              <div className={styles.layerName}>
                                {layer.indexLabel || 'NDMI'} Fuel Dryness
                              </div>
                              <div className={styles.layerDate}>
                                {formatDate(layer.acquisitionDate)}
                              </div>
                            </div>
                            <div className={styles.layerActions}>
                              <button
                                className={`${styles.layerActionBtn} ${layer.visible ? styles['layerActionBtn--active'] : ''}`}
                                onClick={() => toggleLayerVisibility(layer.id)}
                                title={layer.visible ? 'Hide layer' : 'Show layer'}
                              >
                                {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                              </button>
                              <button
                                className={`${styles.layerActionBtn} ${styles['layerActionBtn--up']}`}
                                onClick={() => reorderLayers(idx, Math.max(0, idx - 1))}
                                disabled={idx === 0}
                                title="Move up"
                              >
                                <ArrowUp size={12} />
                              </button>
                              <button
                                className={`${styles.layerActionBtn} ${styles['layerActionBtn--down']}`}
                                onClick={() => reorderLayers(idx, Math.min(activeLayers.length - 1, idx + 1))}
                                disabled={idx === activeLayers.length - 1}
                                title="Move down"
                              >
                                <ArrowDown size={12} />
                              </button>
                              <button
                                className={`${styles.layerActionBtn} ${styles['layerActionBtn--danger']}`}
                                onClick={() => removeActiveLayer(layer.id)}
                                title="Remove layer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                          <div className={styles.layerOpacity}>
                            <label className={styles.opacityLabel}>
                              Opacity: {layer.opacity ?? globalOpacity}%
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={layer.opacity ?? globalOpacity}
                              onChange={(event) => updateLayerOpacity(layer.id, Number(event.target.value))}
                              className={styles.slider}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FuelMoistureControls;
