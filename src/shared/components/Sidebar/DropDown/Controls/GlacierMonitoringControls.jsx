import { useCallback, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Calendar,
  ChevronUp,
  Database,
  Eye,
  EyeOff,
  Filter,
  Info,
  Layers,
  MapPin,
  Mountain,
  Navigation,
  Pentagon,
  RotateCcw,
  Search,
  Sliders,
  Snowflake,
  Square,
  Trash2,
  X,
} from 'lucide-react';

import useAoiStore from 'src/app/store/aoiStore';
import useGlacierMonitoringStore from 'src/app/store/glacierMonitoringStore';
import { KAZAKHSTAN_EXTENT_GEO } from 'src/modules/MapPage/utils/mapConstants';
import { isAbortError, useAbortableTask } from 'src/shared/hooks/useAbortableTask';
import { getCurrentDate } from 'src/shared/utils/dateDefaults';
import {
  GLACIER_INDEX_CONFIGS,
  buildGlacierMonitoringTileUrl,
  formatDate,
  getCloudCoverColor,
  getCloudCoverLabel,
  getGlacierIndexConfig,
  getGlacierSearchDateRange,
  searchGlacierMonitoring,
} from 'src/utils/glacierMonitoringService';

import styles from '../SentinelControls/SentinelExplorer.module.scss';
import './FireControls/fireControls.scss';

const KZ_BBOX = KAZAKHSTAN_EXTENT_GEO;
const KZ_GEOJSON = {
  type: 'Polygon',
  coordinates: [[
    [50.5, 40.5], [87.5, 40.5], [87.5, 55.5], [50.5, 55.5], [50.5, 40.5],
  ]],
};

const GLACIER_STATS = {
  total: 1754,
  named: 407,
  unnamed: 1347,
};

const CLASS_OPTIONS = [
  { value: 'all', label: 'Все классы' },
  { value: 'glacier', label: 'Glacier' },
];

const today = getCurrentDate();

const sortResults = (results, sortBy, sortOrder) => {
  const sorted = [...results].sort((a, b) => {
    if (sortBy === 'cloudCover') return (a.cloudCover ?? 999) - (b.cloudCover ?? 999);
    return new Date(a.acquisitionDate || 0) - new Date(b.acquisitionDate || 0);
  });
  return sortOrder === 'asc' ? sorted : sorted.reverse();
};

const makeLayerId = (sceneId, indexId) => {
  const safeSceneId = String(sceneId).replace(/[^a-zA-Z0-9_-]/g, '-');
  return `glacier-monitoring-${safeSceneId}-${indexId}-${Date.now()}`;
};

const getGradient = (family) => {
  if (family === 'context') {
    return 'linear-gradient(to right, #111827, #1d4ed8, #38bdf8, #f8fafc)';
  }
  if (family === 'moisture') {
    return 'linear-gradient(to right, #78350f, #0f766e, #7dd3fc, #f8fafc)';
  }
  if (family === 'contrast') {
    return 'linear-gradient(to right, #451a03, #64748b, #bfdbfe, #f8fafc)';
  }
  return 'linear-gradient(to right, #0f172a, #2563eb, #7dd3fc, #f8fafc)';
};

const StatCard = ({ label, value }) => (
  <div className={styles.detailItem} style={{
    padding: '0.55rem',
    borderRadius: '0.5rem',
    border: '1px solid rgba(136,139,224,0.1)',
    background: 'rgba(9,10,36,0.28)',
  }}>
    <span className={styles.detailLabel}>{label}</span>
    <span className={styles.detailValue}>{value}</span>
  </div>
);

const GlacierMonitoringControls = ({ option }) => {
  const visible = useGlacierMonitoringStore((state) => state.visible);
  const opacity = useGlacierMonitoringStore((state) => state.opacity);
  const selectedGlacier = useGlacierMonitoringStore((state) => state.selectedGlacier);
  const glacierFilters = useGlacierMonitoringStore((state) => state.glacierFilters);
  const selectedIndex = useGlacierMonitoringStore((state) => state.selectedIndex);
  const date = useGlacierMonitoringStore((state) => state.date);
  const cloudCoverage = useGlacierMonitoringStore((state) => state.cloudCoverage);
  const pageSize = useGlacierMonitoringStore((state) => state.pageSize);
  const searchResults = useGlacierMonitoringStore((state) => state.searchResults);
  const isLoading = useGlacierMonitoringStore((state) => state.isLoading);
  const error = useGlacierMonitoringStore((state) => state.error);
  const totalResults = useGlacierMonitoringStore((state) => state.totalResults);
  const sortBy = useGlacierMonitoringStore((state) => state.sortBy);
  const sortOrder = useGlacierMonitoringStore((state) => state.sortOrder);
  const activeTab = useGlacierMonitoringStore((state) => state.activeTab);
  const activeLayers = useGlacierMonitoringStore((state) => state.activeLayers);
  const globalOpacity = useGlacierMonitoringStore((state) => state.globalOpacity);

  const toggleVisible = useGlacierMonitoringStore((state) => state.toggleVisible);
  const setOpacity = useGlacierMonitoringStore((state) => state.setOpacity);
  const setGlacierFilter = useGlacierMonitoringStore((state) => state.setGlacierFilter);
  const resetGlacierFilters = useGlacierMonitoringStore((state) => state.resetGlacierFilters);
  const setSelectedIndex = useGlacierMonitoringStore((state) => state.setSelectedIndex);
  const setDate = useGlacierMonitoringStore((state) => state.setDate);
  const setCloudCoverage = useGlacierMonitoringStore((state) => state.setCloudCoverage);
  const setPageSize = useGlacierMonitoringStore((state) => state.setPageSize);
  const setSearchResults = useGlacierMonitoringStore((state) => state.setSearchResults);
  const setIsLoading = useGlacierMonitoringStore((state) => state.setIsLoading);
  const setError = useGlacierMonitoringStore((state) => state.setError);
  const clearSearch = useGlacierMonitoringStore((state) => state.clearSearch);
  const setSortBy = useGlacierMonitoringStore((state) => state.setSortBy);
  const setActiveTab = useGlacierMonitoringStore((state) => state.setActiveTab);
  const addActiveLayer = useGlacierMonitoringStore((state) => state.addActiveLayer);
  const removeActiveLayer = useGlacierMonitoringStore((state) => state.removeActiveLayer);
  const toggleLayerVisibility = useGlacierMonitoringStore((state) => state.toggleLayerVisibility);
  const updateLayerOpacity = useGlacierMonitoringStore((state) => state.updateLayerOpacity);
  const reorderLayers = useGlacierMonitoringStore((state) => state.reorderLayers);
  const clearActiveLayers = useGlacierMonitoringStore((state) => state.clearActiveLayers);
  const setAllLayersVisible = useGlacierMonitoringStore((state) => state.setAllLayersVisible);
  const setGlobalOpacity = useGlacierMonitoringStore((state) => state.setGlobalOpacity);

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

  const indexConfig = getGlacierIndexConfig(selectedIndex);
  const dateRange = getGlacierSearchDateRange(date);
  const sortedResults = useMemo(
    () => sortResults(searchResults, sortBy, sortOrder),
    [searchResults, sortBy, sortOrder]
  );
  const allRasterVisible = activeLayers.length > 0 && activeLayers.every((layer) => layer.visible);
  const mode = option?.id === 'satellite_glacier_monitoring' ? 'satellite' : 'inventory';
  const isInventoryMode = mode === 'inventory';
  const headerVisible = isInventoryMode ? visible : allRasterVisible;
  const headerLabel = isInventoryMode ? 'Glacier Inventory' : 'Satellite Glacier Monitoring';
  const HeaderIcon = isInventoryMode ? Mountain : Snowflake;

  const handleSearch = useCallback(async () => {
    const searchSeq = searchSeqRef.current + 1;
    searchSeqRef.current = searchSeq;
    setIsLoading(true);
    setError(null);
    clearSearch();
    setActiveTab('results');

    try {
      const { features, totalResults: nextTotal } = await searchTask.run((signal) => searchGlacierMonitoring({
        indexId: selectedIndex,
        date,
        bbox: aoiBbox || KZ_BBOX,
        cloudCoverage,
        maxRecords: pageSize,
        signal,
      }));

      if (searchSeq !== searchSeqRef.current) return;
      setSearchResults(features, nextTotal);
      if (features.length === 0) {
        setError('No scenes found. Try a different date, AOI, or cloud threshold.');
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
    selectedIndex,
    setActiveTab,
    setError,
    setIsLoading,
    setSearchResults,
  ]);

  const handleAddToMap = useCallback((result) => {
    const layerId = makeLayerId(result.id, selectedIndex);
    const index = getGlacierIndexConfig(selectedIndex);
    const tileUrl = buildGlacierMonitoringTileUrl(result.id, selectedIndex);
    addActiveLayer({
      id: layerId,
      layerId,
      sourceId: `${layerId}-source`,
      indexId: selectedIndex,
      indexLabel: index.shortLabel,
      indexName: index.label,
      family: index.family,
      collection: result.collection || index.collection,
      opacity: globalOpacity,
      visible: true,
      productId: result.id,
      sceneId: result.sceneId,
      name: result.name,
      cloudCover: result.cloudCover,
      acquisitionDate: result.acquisitionDate,
      tileUrl,
    });
    setActiveTab('layers');
  }, [addActiveLayer, globalOpacity, selectedIndex, setActiveTab]);

  const handleToggleRasterLayers = useCallback(() => {
    if (activeLayers.length === 0) return;
    setAllLayersVisible(!activeLayers.every((layer) => layer.visible));
  }, [activeLayers, setAllLayersVisible]);

  const handleClearAoi = useCallback(() => {
    clearAoi();
    setAoiDrawMode(null);
  }, [clearAoi, setAoiDrawMode]);

  return (
    <div className="fire-controls">
      <div className="fire-controls__header">
        <div className="fire-controls__toggle" onClick={isInventoryMode ? toggleVisible : handleToggleRasterLayers}>
          <div className="fire-controls__toggle-icon">
            {headerVisible
              ? <Eye size={16} className="fire-controls__icon-active" />
              : <EyeOff size={16} className="fire-controls__icon-inactive" />}
          </div>
          <span className="fire-controls__toggle-label">{headerLabel}</span>
          <HeaderIcon
            size={16}
            className={`fire-controls__flame-icon ${headerVisible ? 'fire-controls__flame-icon--active' : ''}`}
          />
        </div>
        <button
          className={`fire-controls__expand-btn ${isExpanded ? 'fire-controls__expand-btn--expanded' : ''}`}
          onClick={() => setIsExpanded((value) => !value)}
          aria-label="Glacier monitoring settings"
        >
          <Sliders size={14} />
        </button>
      </div>

      {isExpanded && (
        <div className={styles.explorer}>
          <div className={styles.content}>
            {isInventoryMode && (
              <div className={styles.searchSection}>
                <div className={styles.dateRow}>
                  <StatCard label="Features" value={GLACIER_STATS.total.toLocaleString('en-US')} />
                  <StatCard label="Named" value={GLACIER_STATS.named.toLocaleString('en-US')} />
                </div>

                <div className={styles.dateRow}>
                  <StatCard label="Unnamed" value={GLACIER_STATS.unnamed.toLocaleString('en-US')} />
                  <StatCard label="Class" value="glacier" />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>GeoJSON opacity: {Math.round(opacity * 100)}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(opacity * 100)}
                    onChange={(event) => setOpacity(Number(event.target.value) / 100)}
                    className={styles.slider}
                  />
                  <div className={styles.aoiInfo}>
                    <Info size={11} />
                    Click a glacier on the map to open OSM inventory attributes.
                  </div>
                </div>

                <div>
                  <div className={styles.sectionTitle}>
                    <Filter size={12} /> Filters
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Class</label>
                    <select
                      value={glacierFilters.className}
                      onChange={(event) => setGlacierFilter('className', event.target.value)}
                      className={styles.select}
                    >
                      {CLASS_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Name contains</label>
                    <input
                      type="search"
                      value={glacierFilters.name}
                      onChange={(event) => setGlacierFilter('name', event.target.value)}
                      className={styles.dateInput}
                      placeholder="Search glacier name"
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>OSM ID contains</label>
                    <input
                      type="search"
                      value={glacierFilters.osmId}
                      onChange={(event) => setGlacierFilter('osmId', event.target.value)}
                      className={styles.dateInput}
                      placeholder="27094703"
                    />
                  </div>
                  <button className={styles.searchBtn} onClick={resetGlacierFilters}>
                    <RotateCcw size={14} /> Reset filters
                  </button>
                </div>

                {selectedGlacier && (
                  <div className={styles.aoiInfo}>
                    <MapPin size={11} />
                    Selected: {selectedGlacier.properties?.name || selectedGlacier.properties?.osm_id || 'glacier'}
                  </div>
                )}
              </div>
            )}

            {!isInventoryMode && (
              <>
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

                {activeTab === 'search' && (
                  <div className={styles.searchSection}>
                    <div>
                      <div className={styles.sectionTitle}>
                        <Snowflake size={12} /> Monitoring product
                      </div>
                      <select
                        value={selectedIndex}
                        onChange={(event) => setSelectedIndex(event.target.value)}
                        className={styles.select}
                      >
                        {GLACIER_INDEX_CONFIGS.map((index) => (
                          <option key={index.id} value={index.id}>{index.label}</option>
                        ))}
                      </select>
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
                        <button className={styles.aoiBtn} onClick={() => setAoi(KZ_GEOJSON, KZ_BBOX)}>
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

                    <div className={styles.dateRow}>
                      <div className={styles.field}>
                        <label className={styles.label}>
                          <Calendar size={12} /> Month date
                        </label>
                        <input
                          type="date"
                          value={date}
                          max={today}
                          onChange={(event) => setDate(event.target.value)}
                          className={styles.dateInput}
                        />
                        <span className={styles.detailLabel}>
                          {dateRange.startDate} to {dateRange.endDate}
                        </span>
                      </div>
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
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Cloud cover: up to {cloudCoverage}%</label>
                      <input
                        type="range"
                        min="0"
                        max="80"
                        value={cloudCoverage}
                        onChange={(event) => setCloudCoverage(Number(event.target.value))}
                        className={styles.slider}
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Raster opacity: {globalOpacity}%</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={globalOpacity}
                        onChange={(event) => setGlobalOpacity(Number(event.target.value))}
                        className={styles.slider}
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>{indexConfig.family === 'context' ? 'Context composite ramp' : 'Glacier indicator ramp'}</label>
                      <div style={{
                        height: '12px',
                        borderRadius: '4px',
                        background: getGradient(indexConfig.family),
                        margin: '4px 0',
                      }} />
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.65rem',
                        color: 'rgba(255,255,255,0.55)',
                      }}>
                        <span>Low</span>
                        <span>High</span>
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
                      {isLoading ? 'Searching...' : 'Find Planetary Computer scenes'}
                    </button>
                  </div>
                )}

                {activeTab === 'results' && (
                  <div className={styles.resultsSection}>
                    {isLoading && (
                      <div className={styles.loadingMsg}>
                        <div className={styles.spinner} />
                        <div>Searching scenes...</div>
                      </div>
                    )}

                    {!isLoading && sortedResults.length === 0 && (
                      <div className={styles.emptyMsg}>{error || 'No results yet. Run a search first.'}</div>
                    )}

                    {sortedResults.length > 0 && (
                      <>
                        <div className={styles.resultsHeader}>
                          <span className={styles.totalCount}>{sortedResults.length} of {totalResults} scenes</span>
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
                                        alt="glacier monitoring preview"
                                        loading="lazy"
                                        onError={() => setThumbErrors((prev) => ({ ...prev, [result.id]: true }))}
                                      />
                                    ) : (
                                      <div className={styles.cardNoThumb}><Snowflake size={16} /></div>
                                    )}
                                  </div>

                                  <div className={styles.cardBody}>
                                    <div className={styles.cardTopRow}>
                                      <span className={styles.cardDate}>{formatDate(result.acquisitionDate)}</span>
                                      <span className={styles.missionBadge} style={{ background: '#0284c7' }}>
                                        S2
                                      </span>
                                    </div>

                                    <div className={styles.cardMeta}>
                                      <span className={styles.cardType}>{result.collection || indexConfig.collection}</span>
                                      {result.cloudCover != null && (
                                        <span className={styles.cloudBadge} style={{ color: cloudColor }}>
                                          {result.cloudCover.toFixed(1)}% clouds ({getCloudCoverLabel(result.cloudCover)})
                                        </span>
                                      )}
                                    </div>

                                    <div className={styles.cardActions}>
                                      <button
                                        className={styles.expandBtn}
                                        onClick={() => setExpandedId(isDetailExpanded ? null : result.id)}
                                      >
                                        {isDetailExpanded ? <ChevronUp size={12} /> : <Info size={12} />}
                                        {isDetailExpanded ? 'Hide' : 'Details'}
                                      </button>
                                      <button className={styles.addBtn} onClick={() => handleAddToMap(result)}>
                                        <MapPin size={12} /> Add layer
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
                                        <span className={styles.detailLabel}>Product</span>
                                        <span className={styles.detailValue}>{indexConfig.label}</span>
                                      </div>
                                      <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Collection</span>
                                        <span className={styles.detailValue}>{result.collection || indexConfig.collection}</span>
                                      </div>
                                      <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Type</span>
                                        <span className={styles.detailValue}>{result.productType || '-'}</span>
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
                        <div>No glacier-monitoring rasters on the map.</div>
                      </div>
                    ) : (
                      <>
                        <div className={styles.layersHeader}>
                          <button className={styles.clearBtn} onClick={handleToggleRasterLayers}>
                            {allRasterVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                            {allRasterVisible ? 'Скрыть все' : 'Показать все'}
                          </button>
                          <button className={styles.clearBtn} onClick={clearActiveLayers}>
                            <Trash2 size={12} /> Очистить
                          </button>
                        </div>

                        <div className={styles.layersList}>
                          {activeLayers.map((layer, idx) => (
                            <div key={layer.id} className={styles.layerCard}>
                              <div className={styles.layerTop}>
                                <div className={styles.layerInfo}>
                                  <div className={styles.layerName}>{layer.indexName || 'Мониторинг ледников'}</div>
                                  <div className={styles.layerDate}>{formatDate(layer.acquisitionDate)}</div>
                                </div>
                                <div className={styles.layerActions}>
                                  <button
                                    className={`${styles.layerActionBtn} ${layer.visible ? styles['layerActionBtn--active'] : ''}`}
                                    onClick={() => toggleLayerVisibility(layer.id)}
                                    title={layer.visible ? 'Скрыть слой' : 'Показать слой'}
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
                                <label className={styles.opacityLabel}>Opacity: {layer.opacity ?? globalOpacity}%</label>
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlacierMonitoringControls;
