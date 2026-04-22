import { useState, useCallback, useMemo } from 'react';
import {
  Search, Database, Layers, Calendar, Cloud, MapPin,
  AlertCircle, Trash2, Eye, EyeOff, Info, ChevronUp,
  ChevronDown, Square, Pentagon, X, Navigation, ArrowUp, ArrowDown,
  Satellite, Sliders, Flame
} from 'lucide-react';

import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';

import useModisExplorerStore from 'src/app/store/modisExplorerStore';
import useAoiStore from 'src/app/store/aoiStore';
import {
  MODIS_PRODUCTS,
  BAND_CONFIGS,
  searchModis,
  buildModisTileUrl,
  sortModisResults,
  formatModisDate,
  getModisProductColor,
  getModisProductLabel,
} from 'src/utils/modisSearchService';
import { getCloudCoverColor, getCloudCoverLabel } from 'src/utils/landsatSearchService';

import styles from './SentinelExplorer.module.scss';
import '../Controls/FireControls/fireControls.scss';

const BAND_OPTIONS = [
  { value: 'default',     label: 'Default for Product',     icon: '✨' },
  { value: 'true-color',  label: 'True Color (09A1)',       icon: '🌍' },
  { value: 'false-color', label: 'False Color/Burn (09A1)', icon: '🌿' },
  { value: 'fire-mask',   label: 'Fire Mask (14A1/14A2)',   icon: '🔥' },
  { value: 'burn-date',   label: 'Burn Date (64A1)',        icon: '⏳' },
  { value: 'land-surface-temperature',   label: 'Land Surface Temperature (11A2)',        icon: '🌡️' },
];

const ModisExplorer = () => {
  const store = useModisExplorerStore();
  const aoi = useAoiStore();

  const [expandedId, setExpandedId] = useState(null);
  const [thumbErrors, setThumbErrors] = useState({});
  const [isExpanded, setIsExpanded] = useState(false);

  const sortedResults = useMemo(
    () => sortModisResults(store.searchResults, store.sortBy, store.sortOrder),
    [store.searchResults, store.sortBy, store.sortOrder]
  );

  const handleSearch = useCallback(async () => {
    store.setIsLoading(true);
    store.setError(null);
    store.clearSearch();
    store.setActiveTab('results');

    try {
      const { features, totalResults, errors } = await searchModis({
        product: store.selectedProduct,
        startDate: store.startDate,
        endDate: store.endDate,
        bbox: aoi.aoiBbox,
        cloudCoverage: store.cloudCoverage,
        maxRecords: store.pageSize,
      });

      store.setSearchResults(features, totalResults);

      if (features.length === 0) {
        store.setError('No scenes found for the specified criteria. Try adjusting your filters.');
      }

      if (errors && errors.length > 0) {
        console.warn('Partial search errors:', errors);
      }
    } catch (err) {
      store.setError(err.message);
      store.setActiveTab('search');
    } finally {
      store.setIsLoading(false);
    }
  }, [store, aoi]);

  const handleAddToMap = useCallback((result) => {
    const bands = store.selectedBands;
    const layerId = `modis_${result.id}_${bands}_${Date.now()}`;

    // Build XYZ tile URL from Planetary Computer
    const tileUrl = buildModisTileUrl(result.collection, result.id, bands);

    const layerConfig = {
      id: layerId,
      mission: result.mission,
      collection: result.collection,
      bands,
      opacity: store.globalOpacity / 100,
      productId: result.id,
      name: result.name,
      cloudCover: result.cloudCover,
      visible: true,
      acquisitionDate: result.acquisitionDate,
    };

    // Create OpenLayers XYZ tile layer
    const olLayer = new TileLayer({
      source: new XYZ({
        url: tileUrl,
        crossOrigin: 'anonymous',
        maxZoom: 18,
        attributions: '© NASA MODIS via Microsoft Planetary Computer',
      }),
      opacity: store.globalOpacity / 100,
      zIndex: 100,
    });
    olLayer.set('id', layerId);

    if (window.mapInstance) {
      window.mapInstance.addLayer(olLayer);
    }

    store.addActiveLayer(layerConfig);
    store.setActiveTab('layers');
  }, [store]);

  const handleRemoveLayer = useCallback((layerId) => {
    if (window.mapInstance) {
      const layers = window.mapInstance.getLayers().getArray();
      const olLayer = layers.find((l) => l.get('id') === layerId);
      if (olLayer) window.mapInstance.removeLayer(olLayer);
    }
    store.removeActiveLayer(layerId);
  }, [store]);

  const handleToggleVisibility = useCallback((layerId) => {
    if (window.mapInstance) {
      const layers = window.mapInstance.getLayers().getArray();
      const olLayer = layers.find((l) => l.get('id') === layerId);
      if (olLayer) olLayer.setVisible(!olLayer.getVisible());
    }
    store.toggleLayerVisibility(layerId);
  }, [store]);

  const handleOpacityChange = useCallback((layerId, opacity) => {
    if (window.mapInstance) {
      const layers = window.mapInstance.getLayers().getArray();
      const olLayer = layers.find((l) => l.get('id') === layerId);
      if (olLayer) olLayer.setOpacity(opacity / 100);
    }
    store.updateLayerOpacity(layerId, opacity);
  }, [store]);

  const handleClearAll = useCallback(() => {
    if (window.mapInstance) {
      store.activeLayers.forEach((layer) => {
        const layers = window.mapInstance.getLayers().getArray();
        const olLayer = layers.find((l) => l.get('id') === layer.id);
        if (olLayer) window.mapInstance.removeLayer(olLayer);
      });
    }
    store.clearActiveLayers();
  }, [store]);

  const handleReorder = useCallback((fromIdx, toIdx) => {
    store.reorderLayers(fromIdx, toIdx);
  }, [store]);

  return (
    <div className="fire-controls">
      <div className="fire-controls__header">
        <div className="fire-controls__toggle" onClick={() => setIsExpanded((v) => !v)}>
          <div className="fire-controls__toggle-icon">
            <Flame size={16} className="fire-controls__icon-active" />
          </div>
          <span className="fire-controls__toggle-label">MODIS Explorer</span>
        </div>
        <button
          className={`fire-controls__expand-btn ${isExpanded ? 'fire-controls__expand-btn--expanded' : ''}`}
          onClick={() => setIsExpanded((v) => !v)}
        >
          <Sliders size={14} />
        </button>
      </div>

      {isExpanded && (
        <div className={styles.explorer}>
          {/* ── Tabs ─────────────────────────────────────────── */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${store.activeTab === 'search' ? styles['tab--active'] : ''}`}
              onClick={() => store.setActiveTab('search')}
            >
              <Search size={14} /> Search
            </button>
            <button
              className={`${styles.tab} ${store.activeTab === 'results' ? styles['tab--active'] : ''}`}
              onClick={() => store.setActiveTab('results')}
              disabled={store.searchResults.length === 0 && !store.isLoading}
            >
              <Database size={14} /> Results
              {store.searchResults.length > 0 && (
                <span className={styles.badge}>{store.searchResults.length}</span>
              )}
            </button>
            <button
              className={`${styles.tab} ${store.activeTab === 'layers' ? styles['tab--active'] : ''}`}
              onClick={() => store.setActiveTab('layers')}
              disabled={store.activeLayers.length === 0}
            >
              <Layers size={14} /> Layers
              {store.activeLayers.length > 0 && (
                <span className={styles.badge}>{store.activeLayers.length}</span>
              )}
            </button>
          </div>

          <div className={styles.content}>

            {/* ═══ SEARCH TAB ═══════════════════════════════════ */}
            {store.activeTab === 'search' && (
              <div className={styles.searchSection}>

                {/* Product selector */}
                <div>
                  <div className={styles.sectionTitle}>
                    <Satellite size={12} /> Product
                  </div>
                  <div className={styles.missionSelector}>
                    <select 
                        value={store.selectedProduct} 
                        onChange={(e) => store.setSelectedProduct(e.target.value)}
                        className={styles.select}
                    >
                      {MODIS_PRODUCTS.map((m) => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* AOI Controls */}
                <div style={{ marginTop: '0.75rem' }}>
                  <div className={styles.sectionTitle}>
                    <Navigation size={12} /> Area of Interest (AOI)
                  </div>
                  <div className={styles.aoiRow}>
                    <button
                      className={`${styles.aoiBtn} ${aoi.aoiDrawMode === 'box' ? styles['aoiBtn--active'] : ''}`}
                      onClick={() => aoi.setAoiDrawMode(aoi.aoiDrawMode === 'box' ? null : 'box')}
                    >
                      <Square size={13} /> Rectangle
                    </button>
                    <button
                      className={`${styles.aoiBtn} ${aoi.aoiDrawMode === 'polygon' ? styles['aoiBtn--active'] : ''}`}
                      onClick={() => aoi.setAoiDrawMode(aoi.aoiDrawMode === 'polygon' ? null : 'polygon')}
                    >
                      <Pentagon size={13} /> Polygon
                    </button>
                    {aoi.aoiBbox && (
                      <>
                        <button
                          className={`${styles.aoiBtn} ${!aoi.aoiVisible ? styles['aoiBtn--inactive'] : ''}`}
                          onClick={() => aoi.toggleAoiVisibility()}
                          title={aoi.aoiVisible ? 'Hide AOI Polygon' : 'Show AOI Polygon'}
                        >
                          {aoi.aoiVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                        </button>
                        <button
                          className={`${styles.aoiBtn} ${styles['aoiBtn--clear']}`}
                          onClick={() => {
                            aoi.clearAoi();
                            aoi.setAoiDrawMode(null);
                          }}
                          title="Clear AOI"
                        >
                          <X size={13} />
                        </button>
                      </>
                    )}
                  </div>
                  {aoi.aoiBbox && (
                    <div className={styles.aoiInfo}>
                      <MapPin size={11} />
                      Bbox: [{aoi.aoiBbox.map((v) => v.toFixed(2)).join(', ')}]
                    </div>
                  )}
                </div>

                {/* Date range */}
                <div className={styles.dateRow}>
                  <div className={styles.field}>
                    <label className={styles.label}>
                      <Calendar size={12} /> Start
                    </label>
                    <input
                      type="date"
                      value={store.startDate}
                      onChange={(e) => store.setStartDate(e.target.value)}
                      max={store.endDate || new Date().toISOString().split('T')[0]}
                      className={styles.dateInput}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>
                      <Calendar size={12} /> End
                    </label>
                    <input
                      type="date"
                      value={store.endDate}
                      onChange={(e) => store.setEndDate(e.target.value)}
                      min={store.startDate}
                      max={new Date().toISOString().split('T')[0]}
                      className={styles.dateInput}
                    />
                  </div>
                </div>

                {/* Cloud cover */}
                <div className={styles.field}>
                  <label className={styles.label}>
                    <Cloud size={12} /> Cloud Cover ≤ {store.cloudCoverage}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={store.cloudCoverage}
                    onChange={(e) => store.setCloudCoverage(Number(e.target.value))}
                    className={styles.slider}
                  />
                  <div style={{fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px'}}>
                    * Useful for 09A1 optical products mostly
                  </div>
                </div>

                {/* Band combination */}
                <div className={styles.field}>
                  <label className={styles.label}>Rendering & Analysis</label>
                  <select
                    value={store.selectedBands}
                    onChange={(e) => store.setSelectedBands(e.target.value)}
                    className={styles.select}
                  >
                    {BAND_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.icon} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Opacity */}
                <div className={styles.field}>
                  <label className={styles.label}>
                    Opacity: {store.globalOpacity}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={store.globalOpacity}
                    onChange={(e) => store.setGlobalOpacity(Number(e.target.value))}
                    className={styles.slider}
                  />
                </div>

                {/* Error */}
                {store.error && (
                  <div className={styles.error}>
                    <AlertCircle size={14} />
                    <span>{store.error}</span>
                  </div>
                )}

                {/* Search button */}
                <button
                  className={styles.searchBtn}
                  onClick={handleSearch}
                  disabled={store.isLoading || !store.startDate || !store.endDate}
                >
                  <Search size={15} />
                  {store.isLoading ? 'Searching…' : 'Search Scenes'}
                </button>
              </div>
            )}

            {/* ═══ RESULTS TAB ══════════════════════════════════ */}
            {store.activeTab === 'results' && (
              <div className={styles.resultsSection}>
                {store.isLoading && (
                  <div className={styles.loadingMsg}>
                    <div className={styles.spinner} />
                    <div>Searching scenes…</div>
                  </div>
                )}

                {!store.isLoading && sortedResults.length === 0 && (
                  <div className={styles.emptyMsg}>
                    {store.error || 'No results. Run a search first.'}
                  </div>
                )}

                {sortedResults.length > 0 && (
                  <>
                    <div className={styles.resultsHeader}>
                      <span className={styles.totalCount}>
                        {sortedResults.length} of {store.totalResults} scenes
                      </span>
                      <div className={styles.sortControls}>
                        <button
                          className={`${styles.sortBtn} ${store.sortBy === 'date' ? styles['sortBtn--active'] : ''}`}
                          onClick={() => store.setSortBy('date')}
                        >
                          Date {store.sortBy === 'date' && (store.sortOrder === 'desc' ? '↓' : '↑')}
                        </button>
                        <button
                          className={`${styles.sortBtn} ${store.sortBy === 'cloudCover' ? styles['sortBtn--active'] : ''}`}
                          onClick={() => store.setSortBy('cloudCover')}
                        >
                          Cloud {store.sortBy === 'cloudCover' && (store.sortOrder === 'asc' ? '↑' : '↓')}
                        </button>
                      </div>
                    </div>

                    <div className={styles.resultsList}>
                      {sortedResults.map((result) => {
                        const isDetailExpanded = expandedId === result.id;
                        const thumbFailed = thumbErrors[result.id];

                        return (
                          <div
                            key={result.id}
                            className={styles.resultCard}
                            onMouseEnter={() => result.geometry && store.setHoveredFootprint(result.geometry)}
                            onMouseLeave={() => store.clearHoveredFootprint()}
                          >
                            <div className={styles.cardMain}>
                              {/* Thumbnail */}
                              <div className={styles.cardThumb}>
                                {result.thumbnailUrl && !thumbFailed ? (
                                  <img
                                    src={result.thumbnailUrl}
                                    alt="preview"
                                    loading="lazy"
                                    onError={() => setThumbErrors((prev) => ({ ...prev, [result.id]: true }))}
                                  />
                                ) : (
                                  <div className={styles.cardNoThumb}>
                                    {thumbFailed ? '—' : <Satellite size={16} />}
                                  </div>
                                )}
                              </div>

                              {/* Body */}
                              <div className={styles.cardBody}>
                                <div className={styles.cardTopRow}>
                                  <span className={styles.cardDate}>
                                    {formatModisDate(result.acquisitionDate)}
                                  </span>
                                  <span
                                    className={styles.missionBadge}
                                    style={{ background: getModisProductColor(result.collection) }}
                                  >
                                    {getModisProductLabel(result.collection)}
                                  </span>
                                </div>

                                <div className={styles.cardMeta}>
                                  {result.cloudCover != null && (
                                    <span
                                      className={styles.cloudBadge}
                                      style={{ color: getCloudCoverColor(result.cloudCover) }}
                                    >
                                      <Cloud size={11} />
                                      {result.cloudCover.toFixed(1)}%
                                      <span className={styles.cardType}>
                                        {getCloudCoverLabel(result.cloudCover)}
                                      </span>
                                    </span>
                                  )}
                                  {result.mission && (
                                    <span className={styles.cardType}>Platform {result.mission}</span>
                                  )}
                                </div>

                                <div className={styles.cardActions}>
                                  <button
                                    className={styles.expandBtn}
                                    onClick={() => setExpandedId(isDetailExpanded ? null : result.id)}
                                  >
                                    {isDetailExpanded ? <ChevronUp size={12} /> : <Info size={12} />}
                                    {isDetailExpanded ? 'Collapse' : 'Details'}
                                  </button>
                                  <button
                                    className={styles.addBtn}
                                    onClick={() => handleAddToMap(result)}
                                  >
                                    <MapPin size={12} /> Add to Map
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Expanded details */}
                            {isDetailExpanded && (
                              <div className={styles.cardDetails}>
                                <div className={styles.detailGrid}>
                                  <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Scene ID</span>
                                    <span className={styles.detailValue}>{result.sceneId}</span>
                                  </div>
                                  <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Platform</span>
                                    <span className={styles.detailValue}>{result.mission || 'N/A'}</span>
                                  </div>
                                  <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Product</span>
                                    <span className={styles.detailValue}>{result.collection || 'N/A'}</span>
                                  </div>
                                  <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Tile Info (H/V)</span>
                                    <span className={styles.detailValue}>{result.horizontalTile} / {result.verticalTile}</span>
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

            {/* ═══ LAYERS TAB ═══════════════════════════════════ */}
            {store.activeTab === 'layers' && (
              <div className={styles.layersSection}>
                {store.activeLayers.length === 0 ? (
                  <div className={styles.emptyLayers}>
                    <Layers size={28} />
                    <div>No layers added</div>
                  </div>
                ) : (
                  <>
                    <div className={styles.layersHeader}>
                      <span className={styles.totalCount}>
                        {store.activeLayers.length} layers on map
                      </span>
                      <button
                        className={styles.clearBtn}
                        onClick={handleClearAll}
                      >
                        <Trash2 size={13} /> Clear
                      </button>
                    </div>

                    <div className={styles.layersList}>
                      {store.activeLayers.map((layer, idx) => (
                        <div key={layer.id} className={styles.layerCard}>
                          <div className={styles.layerTop}>
                            <div className={styles.layerInfo}>
                              <div className={styles.layerName}>
                                <span
                                  className={styles.missionBadge}
                                  style={{
                                    background: getModisProductColor(layer.collection),
                                    marginRight: '0.35rem',
                                    fontSize: '0.55rem',
                                    padding: '0.05rem 0.3rem',
                                  }}
                                >
                                  {getModisProductLabel(layer.collection)}
                                </span>
                                {layer.collection} ({layer.bands})
                              </div>
                              <div className={styles.layerDate}>
                                {formatModisDate(layer.acquisitionDate)}
                                {layer.cloudCover != null && (
                                  <> · <Cloud size={10} style={{ verticalAlign: 'text-bottom' }} /> {layer.cloudCover.toFixed(1)}%</>
                                )}
                              </div>
                            </div>

                            <div className={styles.layerActions}>
                              {idx > 0 && (
                                <button
                                  className={`${styles.layerActionBtn} ${styles['layerActionBtn--up']}`}
                                  onClick={() => handleReorder(idx, idx - 1)}
                                  title="Move Up"
                                >
                                  <ArrowUp size={12} />
                                </button>
                              )}
                              {idx < store.activeLayers.length - 1 && (
                                <button
                                  className={`${styles.layerActionBtn} ${styles['layerActionBtn--down']}`}
                                  onClick={() => handleReorder(idx, idx + 1)}
                                  title="Move Down"
                                >
                                  <ArrowDown size={12} />
                                </button>
                              )}
                              <button
                                className={`${styles.layerActionBtn} ${layer.visible ? styles['layerActionBtn--active'] : ''}`}
                                onClick={() => handleToggleVisibility(layer.id)}
                                title={layer.visible ? 'Hide' : 'Show'}
                              >
                                {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                              </button>
                              <button
                                className={`${styles.layerActionBtn} ${styles['layerActionBtn--danger']}`}
                                onClick={() => handleRemoveLayer(layer.id)}
                                title="Remove"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          <div className={styles.layerOpacity}>
                            <span className={styles.opacityLabel}>
                              Opacity {Math.round(layer.opacity * 100)}%
                            </span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={Math.round(layer.opacity * 100)}
                              onChange={(e) => handleOpacityChange(layer.id, Number(e.target.value))}
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

export default ModisExplorer;
