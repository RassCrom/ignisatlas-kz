import { useState, useCallback, useMemo } from 'react';
import {
  Search, Database, Layers, Calendar, Cloud, MapPin,
  AlertCircle, Trash2, Eye, EyeOff, Info, ChevronUp,
  Square, Pentagon, X, Navigation, ArrowUp, ArrowDown,
  Wind, Sliders, Ban
} from 'lucide-react';

import useAtmosphereStore from 'src/app/store/atmosphereStore';
import useAoiStore from 'src/app/store/aoiStore';
import {
  ATMOSPHERE_PRODUCTS,
  searchAtmosphere,
  sortAtmosphereResults,
  formatAtmosphereDate,
  getAtmosphereProductColor,
  getAtmosphereProductLabel,
  getAtmosphereProductUnit,
} from 'src/utils/atmosphereSearchService';

import styles from './SentinelExplorer.module.scss';
import '../Controls/FireControls/fireControls.scss';

const AtmosphereExplorer = () => {
  const store = useAtmosphereStore();
  const aoi = useAoiStore();

  const [expandedId, setExpandedId] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const sortedResults = useMemo(
    () => sortAtmosphereResults(store.searchResults, store.sortBy, store.sortOrder),
    [store.searchResults, store.sortBy, store.sortOrder]
  );

  const handleSearch = useCallback(async () => {
    store.setIsLoading(true);
    store.setError(null);
    store.clearSearch();
    store.setActiveTab('results');

    try {
      const { features, totalResults, errors } = await searchAtmosphere({
        product: store.selectedProduct,
        startDate: store.startDate,
        endDate: store.endDate,
        bbox: aoi.aoiBbox,
        maxRecords: store.pageSize,
      });

      store.setSearchResults(features, totalResults);

      if (features.length === 0) {
        store.setError('No scenes found. Try expanding the date range (e.g. within 1-2 months).');
      }
    } catch (err) {
      store.setError(err.message);
      store.setActiveTab('search');
    } finally {
      store.setIsLoading(false);
    }
  }, [store, aoi]);

  const handleAddToMap = useCallback((result) => {
    if (!result.isRenderSupported) return;
    
    store.addActiveLayer({
      id: result.id,
      name: `${getAtmosphereProductLabel(result.productName) || result.productName}`,
      mission: result.mission,
      productName: result.productName,
      date: result.acquisitionDate,
      visible: true,
      opacity: store.globalOpacity ? store.globalOpacity / 100 : 0.8,
      bbox: result.bbox,
      sceneId: result.sceneId,
      // For future TiTiler Xarray rendering use or equivalent
      collection: result.collection
    });
    
    store.setActiveTab('layers');
  }, [store]);

  const handleRemoveLayer = useCallback((layerId) => {
    store.removeActiveLayer(layerId);
  }, [store]);

  const handleToggleVisibility = useCallback((layerId) => {
    store.toggleLayerVisibility(layerId);
  }, [store]);

  const handleOpacityChange = useCallback((layerId, opacity) => {
    store.updateLayerOpacity(layerId, opacity);
  }, [store]);

  const handleClearAll = useCallback(() => {
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
            <Wind size={16} className="fire-controls__icon-active" />
          </div>
          <span className="fire-controls__toggle-label">Atmosphere Explorer</span>
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

                {/* Info Box */}
                <div className={styles.infoBox} style={{
                  padding: '0.6rem', 
                  background: 'rgba(59, 130, 246, 0.1)', 
                  border: '1px solid rgba(59, 130, 246, 0.2)', 
                  borderRadius: '6px', 
                  fontSize: '0.65rem', 
                  color: 'rgba(217, 218, 245, 0.7)'
                }}>
                  <Info size={12} style={{ float: 'left', marginRight: '0.4rem', color: '#3b82f6' }} />
                  Queries the Microsoft Planetary Computer standard STAC catalog for Sentinel-5P Level-2 atmospheric data (NetCDF format).
                </div>

                {/* Product selector */}
                <div>
                  <div className={styles.sectionTitle}>
                    <Wind size={12} /> Variable
                  </div>
                  <div className={styles.missionSelector}>
                    <select 
                        value={store.selectedProduct} 
                        onChange={(e) => store.setSelectedProduct(e.target.value)}
                        className={styles.select}
                    >
                      {Array.from(new Set(ATMOSPHERE_PRODUCTS.map(m => m.category))).map(category => (
                        <optgroup key={category} label={category}>
                          {ATMOSPHERE_PRODUCTS.filter(m => m.category === category).map(m => (
                            <option 
                              key={m.id} 
                              value={m.id} 
                              disabled={!m.isSupported}
                            >
                              {m.label} {!m.isSupported ? '(Not Available)' : ''}
                            </option>
                          ))}
                        </optgroup>
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
                  {store.isLoading ? 'Searching…' : 'Search Data Archive'}
                </button>
              </div>
            )}

            {/* ═══ RESULTS TAB ══════════════════════════════════ */}
            {store.activeTab === 'results' && (
              <div className={styles.resultsSection}>
                {store.isLoading && (
                  <div className={styles.loadingMsg}>
                    <div className={styles.spinner} />
                    <div>Querying STAC Database…</div>
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
                        {sortedResults.length} of {store.totalResults} features
                      </span>
                      <div className={styles.sortControls}>
                        <button
                          className={`${styles.sortBtn} ${store.sortBy === 'date' ? styles['sortBtn--active'] : ''}`}
                          onClick={() => store.setSortBy('date')}
                        >
                          Date {store.sortBy === 'date' && (store.sortOrder === 'desc' ? '↓' : '↑')}
                        </button>
                      </div>
                    </div>

                    <div className={styles.resultsList}>
                      {sortedResults.map((result) => {
                        const isDetailExpanded = expandedId === result.id;
                        
                        return (
                          <div
                            key={result.id}
                            className={styles.resultCard}
                            onMouseEnter={() => result.geometry && store.setHoveredFootprint(result.geometry)}
                            onMouseLeave={() => store.clearHoveredFootprint()}
                          >
                            <div className={styles.cardMain}>
                              {/* Thumbnail (Often unavailable for NetCDF) */}
                              <div className={styles.cardThumb}>
                                <div className={styles.cardNoThumb}>
                                  <Wind size={16} />
                                </div>
                              </div>

                              {/* Body */}
                              <div className={styles.cardBody}>
                                <div className={styles.cardTopRow}>
                                  <span className={styles.cardDate}>
                                    {formatAtmosphereDate(result.acquisitionDate)}
                                  </span>
                                  <span
                                    className={styles.missionBadge}
                                    style={{ background: getAtmosphereProductColor(result.productName) }}
                                  >
                                    {getAtmosphereProductLabel(result.productName)}
                                  </span>
                                </div>

                                <div className={styles.cardMeta}>
                                  <span className={styles.cardType}>Provider: {result.mission}</span>
                                  {result.processingMode && (
                                    <span className={styles.cardType}>Mode: {result.processingMode}</span>
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
                                  
                                  {result.isRenderSupported ? (
                                     <button
                                       className={styles.addBtn}
                                       onClick={() => handleAddToMap(result)}
                                     >
                                       <MapPin size={12} /> Add to Map
                                     </button>
                                  ) : (
                                    <div 
                                      className={styles.unsupportedBadge}
                                      title="Microsoft Planetary Computer's TiTiler natively limits direct map-rendering for raw NetCDF granules."
                                    >
                                      <Ban size={12} /> Map Visualization Unsupported
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Expanded details */}
                            {isDetailExpanded && (
                              <div className={styles.cardDetails}>
                                <div className={styles.detailGrid}>
                                  <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Scene ID</span>
                                    <span className={styles.detailValue} style={{ fontSize: '0.55rem' }}>{result.sceneId}</span>
                                  </div>
                                  <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Provider Node</span>
                                    <span className={styles.detailValue}>Planetary Computer</span>
                                  </div>
                                  <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Format</span>
                                    <span className={styles.detailValue}>NetCDF / GeoParquet</span>
                                  </div>
                                  <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Data Variable</span>
                                    <span className={styles.detailValue}>{result.productName}</span>
                                  </div>
                                  <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Units</span>
                                    <span className={styles.detailValue}>{getAtmosphereProductUnit(result.productName)}</span>
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
                    <div>No active visualization layers</div>
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
                                {layer.name}
                              </div>
                              <div className={styles.layerDate}>
                                {layer.mission}
                              </div>
                            </div>

                            <div className={styles.layerActions}>
                              {idx > 0 && (
                                <button
                                  className={`${styles.layerActionBtn} ${styles['layerActionBtn--up']}`}
                                  onClick={() => handleReorder(idx, idx - 1)}
                                >
                                  <ArrowUp size={12} />
                                </button>
                              )}
                              {idx < store.activeLayers.length - 1 && (
                                <button
                                  className={`${styles.layerActionBtn} ${styles['layerActionBtn--down']}`}
                                  onClick={() => handleReorder(idx, idx + 1)}
                                >
                                  <ArrowDown size={12} />
                                </button>
                              )}
                              <button
                                className={`${styles.layerActionBtn} ${layer.visible ? styles['layerActionBtn--active'] : ''}`}
                                onClick={() => handleToggleVisibility(layer.id)}
                              >
                                {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                              </button>
                              <button
                                className={`${styles.layerActionBtn} ${styles['layerActionBtn--danger']}`}
                                onClick={() => handleRemoveLayer(layer.id)}
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

export default AtmosphereExplorer;
