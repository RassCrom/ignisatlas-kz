import { useState, useCallback, useMemo } from 'react';
import {
  Search, Database, Layers, Calendar, Cloud, MapPin,
  AlertCircle, Trash2, Eye, EyeOff, Info, ChevronUp,
  Square, Pentagon, X, Navigation, ArrowUp, ArrowDown,
  Satellite, Sliders,
} from 'lucide-react';

import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';

import useSentinelExplorerStore from 'src/app/store/sentinelExplorerStore';
import useAoiStore from 'src/app/store/aoiStore';
import { createSentinelLayer } from 'src/utils/sentinelUtils';
import {
  searchSentinelPc,
  buildS2TileUrl,
  buildS1TileUrl,
  sortResults,
  formatDate,
  getCloudCoverColor,
  getCloudCoverLabel,
  getMissionColor,
  getMissionLabel,
} from 'src/utils/sentinelPcSearchService';

import styles from './SentinelExplorer.module.scss';
import '../Controls/FireControls/fireControls.scss';

// ── Mission list ─────────────────────────────────────────────────────────────

const MISSIONS = [
  { id: 'all',         label: 'All'  },
  { id: 'sentinel-1',  label: 'S-1'  },
  { id: 'sentinel-2',  label: 'S-2'  },
  { id: 'sentinel-3',  label: 'S-3'  },
  { id: 'sentinel-5p', label: 'S-5P' },
];

// ── Band / preset options per mission ────────────────────────────────────────

const BAND_OPTIONS = {
  'sentinel-2': [
    { value: 'true-color',    label: 'True Color (RGB)'         },
    { value: 'false-color',   label: 'False Color (NIR-R-G)'    },
    { value: 'swir-fire',     label: 'SWIR Fire / Burn Scar'    },
    { value: 'swir-moisture', label: 'SWIR Vegetation Moisture' },
    { value: 'agriculture',   label: 'Agriculture (SWIR1-NIR-R)'},
    { value: 'geology',       label: 'Geology / Bare Soil'      },
    { value: 'nir-swir',      label: 'NIR-SWIR Burn Severity'   },
    { value: 'ndvi',          label: 'NDVI Vegetation Index'    },
    { value: 'nbr',           label: 'NBR Burn Severity Index'  },
    { value: 'ndwi',          label: 'NDWI Water Index'         },
  ],
  'sentinel-1': [
    { value: 'vv',    label: 'VV Amplitude'         },
    { value: 'vh',    label: 'VH Amplitude'         },
    { value: 'vv-vh', label: 'VV/VH Color Composite'},
  ],
  'sentinel-3': [
    { value: 'OLCI-TRUE', label: 'OLCI True Color' },
  ],
  // S-5P items are metadata-only — the labels here serve as display context in results
  'sentinel-5p': [
    { value: 'no2',        label: 'NO2 — Tropospheric Column' },
    { value: 'ch4',        label: 'CH4 — Methane'             },
    { value: 'co',         label: 'CO — Carbon Monoxide'      },
    { value: 'so2',        label: 'SO2 — Sulfur Dioxide'      },
    { value: 'o3',         label: 'O3 — Ozone'                },
    { value: 'hcho',       label: 'HCHO — Formaldehyde'       },
    { value: 'aerosol-ai', label: 'Aerosol Index'             },
  ],
};

// sentinelUtils key for S-3 WMS (PC has no S-3 data)
// NOTE: sentinelUtils uses confusing internal names; 'sentinel1' key → Sentinel-3 OLCI WMS
const S3_UTILS_KEY = 'sentinel1';

// When searching 'all' missions, the result's actual mission may differ from the selected preset.
// Fall back to the first valid preset for that mission to avoid sending an invalid band config.
function resolvePreset(resultMission, currentPreset) {
  const opts = BAND_OPTIONS[resultMission] || BAND_OPTIONS['sentinel-2'];
  return opts.find((o) => o.value === currentPreset) ? currentPreset : opts[0].value;
}

// Creates an XYZ TileLayer from a PC TiTiler URL.
// Tiles outside the scene footprint return 404 — setState(4) discards them silently.
function createXyzLayer(layerId, tileUrl, opacity01) {
  const olLayer = new TileLayer({
    source: new XYZ({
      url: tileUrl,
      crossOrigin: 'anonymous',
      maxZoom: 18,
      tileLoadFunction: (tile, src) => {
        const img = tile.getImage();
        img.onerror = () => tile.setState(4);
        img.src = src;
      },
      attributions: '© ESA Sentinel / Microsoft Planetary Computer',
    }),
    opacity: opacity01,
    zIndex: 100,
  });
  olLayer.set('id', layerId);
  return olLayer;
}

// ── Component ────────────────────────────────────────────────────────────────

const SentinelExplorer = () => {
  const store = useSentinelExplorerStore();
  const aoi   = useAoiStore();

  const [expandedId,  setExpandedId]  = useState(null);
  const [thumbErrors, setThumbErrors] = useState({});
  const [isExpanded,  setIsExpanded]  = useState(false);

  // ── Derived state ────────────────────────────────────────────────────────

  const sortedResults = useMemo(
    () => sortResults(store.searchResults, store.sortBy, store.sortOrder),
    [store.searchResults, store.sortBy, store.sortOrder]
  );

  const currentBandOptions = useMemo(() => {
    if (store.selectedMission === 'all') return BAND_OPTIONS['sentinel-2'];
    return BAND_OPTIONS[store.selectedMission] || BAND_OPTIONS['sentinel-2'];
  }, [store.selectedMission]);

  // Cloud cover is irrelevant for SAR (S-1) and atmospheric (S-5P) data
  const showCloudFilter = !['sentinel-1', 'sentinel-5p'].includes(store.selectedMission);

  // Band selector is shown for all missions except S-5P (no rendering)
  const showBandSelector = store.selectedMission !== 'sentinel-5p';

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSearch = useCallback(async () => {
    store.setIsLoading(true);
    store.setError(null);
    store.clearSearch();
    store.setActiveTab('results');

    try {
      const { features, totalResults, errors } = await searchSentinelPc({
        mission:      store.selectedMission,
        startDate:    store.startDate,
        endDate:      store.endDate,
        bbox:         aoi.aoiBbox,
        cloudCoverage: store.cloudCoverage,
        maxRecords:   store.pageSize,
      });

      store.setSearchResults(features, totalResults);
      if (features.length === 0) {
        store.setError('No scenes found. Try adjusting your filters or date range.');
      }
      if (errors?.length > 0) console.warn('Partial search errors:', errors);
    } catch (err) {
      store.setError(err.message);
      store.setActiveTab('search');
    } finally {
      store.setIsLoading(false);
    }
  }, [store, aoi]);

  const handleAddToMap = useCallback((result) => {
    const mission     = result.mission || store.selectedMission;
    const preset      = resolvePreset(mission, store.selectedBands);
    const layerId     = `sentinel_pc_${result.id}_${preset}_${Date.now()}`;
    const opts        = BAND_OPTIONS[mission] || [];
    const presetLabel = opts.find((o) => o.value === preset)?.label || preset;

    const baseConfig = {
      id: layerId,
      mission,
      preset,
      presetLabel,
      visible:         true,
      opacity:         store.globalOpacity, // 0–100 int
      productId:       result.id,
      name:            result.name,
      cloudCover:      result.cloudCover,
      acquisitionDate: result.acquisitionDate,
      polarizations:   result.polarizations || null,
      mgrsTile:        result.mgrsTile       || null,
    };

    if (mission === 'sentinel-2') {
      const tileUrl = buildS2TileUrl(result.id, preset);
      const olLayer = createXyzLayer(layerId, tileUrl, store.globalOpacity / 100);
      if (window.mapInstance) window.mapInstance.addLayer(olLayer);
      store.addActiveLayer({ ...baseConfig, tileUrl, canRender: true });

    } else if (mission === 'sentinel-1') {
      const tileUrl = buildS1TileUrl(result.id, preset);
      const olLayer = createXyzLayer(layerId, tileUrl, store.globalOpacity / 100);
      if (window.mapInstance) window.mapInstance.addLayer(olLayer);
      store.addActiveLayer({ ...baseConfig, tileUrl, canRender: true });

    } else if (mission === 'sentinel-3') {
      // S-3 is not on PC; fall back to Sentinel Hub WMS via sentinelUtils
      const olLayer = createSentinelLayer(
        S3_UTILS_KEY, layerId, preset,
        store.startDate, store.endDate,
        store.globalOpacity / 100, result.id
      );
      if (olLayer && window.mapInstance) window.mapInstance.addLayer(olLayer);
      store.addActiveLayer({ ...baseConfig, tileUrl: null, canRender: true });

    } else {
      // S-5P: atmospheric data — no OL tile layer, store metadata only
      store.addActiveLayer({ ...baseConfig, tileUrl: null, canRender: false });
    }

    store.setActiveTab('layers');
  }, [store]);

  const handleRemoveLayer = useCallback((layer) => {
    if (layer.canRender !== false && window.mapInstance) {
      const olLayer = window.mapInstance.getLayers().getArray().find((l) => l.get('id') === layer.id);
      if (olLayer) window.mapInstance.removeLayer(olLayer);
    }
    store.removeActiveLayer(layer.id);
  }, [store]);

  const handleToggleVisibility = useCallback((layer) => {
    const next = !layer.visible;
    store.toggleLayerVisibility(layer.id);
    if (layer.canRender !== false && window.mapInstance) {
      const olLayer = window.mapInstance.getLayers().getArray().find((l) => l.get('id') === layer.id);
      if (olLayer) olLayer.setVisible(next);
    }
  }, [store]);

  const handleOpacityChange = useCallback((layer, opacity) => {
    store.updateLayerOpacity(layer.id, opacity); // stores 0–100
    if (layer.canRender !== false && window.mapInstance) {
      const olLayer = window.mapInstance.getLayers().getArray().find((l) => l.get('id') === layer.id);
      if (olLayer) olLayer.setOpacity(opacity / 100);
    }
  }, [store]);

  const handleClearAll = useCallback(() => {
    if (window.mapInstance) {
      store.activeLayers.forEach((layer) => {
        if (layer.canRender !== false) {
          const olLayer = window.mapInstance.getLayers().getArray().find((l) => l.get('id') === layer.id);
          if (olLayer) window.mapInstance.removeLayer(olLayer);
        }
      });
    }
    store.clearActiveLayers();
  }, [store]);

  const handleReorder = useCallback((fromIdx, toIdx) => {
    store.reorderLayers(fromIdx, toIdx);
  }, [store]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="fire-controls">
      <div className="fire-controls__header">
        <div className="fire-controls__toggle" onClick={() => setIsExpanded((v) => !v)}>
          <div className="fire-controls__toggle-icon">
            <Satellite size={16} className="fire-controls__icon-active" />
          </div>
          <span className="fire-controls__toggle-label">Sentinel Explorer</span>
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

          {/* ── Tabs ───────────────────────────────────────────── */}
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

                {/* Mission selector */}
                <div>
                  <div className={styles.sectionTitle}>
                    <Satellite size={12} /> Mission
                  </div>
                  <div className={styles.missionSelector}>
                    {MISSIONS.map((m) => (
                      <button
                        key={m.id}
                        className={`${styles.missionBtn} ${store.selectedMission === m.id ? styles['missionBtn--active'] : ''}`}
                        onClick={() => store.setSelectedMission(m.id)}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AOI */}
                <div>
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
                          title={aoi.aoiVisible ? 'Hide AOI' : 'Show AOI'}
                        >
                          {aoi.aoiVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                        </button>
                        <button
                          className={`${styles.aoiBtn} ${styles['aoiBtn--clear']}`}
                          onClick={() => { aoi.clearAoi(); aoi.setAoiDrawMode(null); }}
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
                    <label className={styles.label}><Calendar size={12} /> Start</label>
                    <input
                      type="date"
                      value={store.startDate}
                      onChange={(e) => store.setStartDate(e.target.value)}
                      max={store.endDate || new Date().toISOString().split('T')[0]}
                      className={styles.dateInput}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}><Calendar size={12} /> End</label>
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

                {/* Cloud cover — hidden for SAR (S-1) and atmospheric (S-5P) */}
                {showCloudFilter && (
                  <div className={styles.field}>
                    <label className={styles.label}>
                      <Cloud size={12} /> Cloud Cover ≤ {store.cloudCoverage}%
                    </label>
                    <input
                      type="range" min="0" max="100"
                      value={store.cloudCoverage}
                      onChange={(e) => store.setCloudCoverage(Number(e.target.value))}
                      className={styles.slider}
                    />
                  </div>
                )}

                {/* Band / preset selector */}
                {showBandSelector && (
                  <div className={styles.field}>
                    <label className={styles.label}>Band Combination</label>
                    <select
                      value={store.selectedBands}
                      onChange={(e) => store.setSelectedBands(e.target.value)}
                      className={styles.select}
                    >
                      {currentBandOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Opacity */}
                <div className={styles.field}>
                  <label className={styles.label}>Opacity: {store.globalOpacity}%</label>
                  <input
                    type="range" min="0" max="100"
                    value={store.globalOpacity}
                    onChange={(e) => store.setGlobalOpacity(Number(e.target.value))}
                    className={styles.slider}
                  />
                </div>

                {/* S-5P info note */}
                {store.selectedMission === 'sentinel-5p' && (
                  <div className={styles.error} style={{
                    background: 'rgba(6,182,212,0.08)',
                    borderColor: 'rgba(6,182,212,0.2)',
                    color: 'rgba(6,182,212,0.9)',
                  }}>
                    <Info size={14} />
                    <span>S-5P data is search-only — map tile rendering is not available via Planetary Computer. Use Atmosphere Explorer for visual analysis.</span>
                  </div>
                )}

                {/* S-3 info note */}
                {store.selectedMission === 'sentinel-3' && (
                  <div className={styles.error} style={{
                    background: 'rgba(139,92,246,0.08)',
                    borderColor: 'rgba(139,92,246,0.2)',
                    color: 'rgba(167,139,250,0.9)',
                  }}>
                    <Info size={14} />
                    <span>S-3 uses CDSE STAC search + Sentinel Hub WMS rendering (PC has no S-3 data).</span>
                  </div>
                )}

                {store.error && (
                  <div className={styles.error}>
                    <AlertCircle size={14} /><span>{store.error}</span>
                  </div>
                )}

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
                    <div className={styles.spinner} /><div>Searching scenes…</div>
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
                              <div className={styles.cardThumb}>
                                {result.thumbnailUrl && !thumbFailed ? (
                                  <img
                                    src={result.thumbnailUrl}
                                    alt="preview"
                                    loading="lazy"
                                    onError={() => setThumbErrors((p) => ({ ...p, [result.id]: true }))}
                                  />
                                ) : (
                                  <div className={styles.cardNoThumb}>
                                    {thumbFailed ? '—' : <Satellite size={16} />}
                                  </div>
                                )}
                              </div>

                              <div className={styles.cardBody}>
                                <div className={styles.cardTopRow}>
                                  <span className={styles.cardDate}>
                                    {formatDate(result.acquisitionDate)}
                                  </span>
                                  <span
                                    className={styles.missionBadge}
                                    style={{ background: getMissionColor(result.mission) }}
                                  >
                                    {getMissionLabel(result.mission)}
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
                                  {result.productType  && <span className={styles.cardType}>{result.productType}</span>}
                                  {result.polarizations && <span className={styles.cardType}>{result.polarizations}</span>}
                                  {result.mgrsTile      && <span className={styles.cardType}>{result.mgrsTile}</span>}
                                </div>

                                <div className={styles.cardActions}>
                                  <button
                                    className={styles.expandBtn}
                                    onClick={() => setExpandedId(isDetailExpanded ? null : result.id)}
                                  >
                                    {isDetailExpanded ? <ChevronUp size={12} /> : <Info size={12} />}
                                    {isDetailExpanded ? 'Collapse' : 'Details'}
                                  </button>
                                  <button className={styles.addBtn} onClick={() => handleAddToMap(result)}>
                                    <MapPin size={12} /> Add to Map
                                  </button>
                                </div>
                              </div>
                            </div>

                            {isDetailExpanded && (
                              <div className={styles.cardDetails}>
                                <div className={styles.detailGrid}>
                                  {[
                                    ['Scene ID',     result.sceneId],
                                    ['Platform',     result.platform],
                                    ['Product',      result.productType],
                                    result.polarizations ? ['Polarizations', result.polarizations] : null,
                                    result.mgrsTile      ? ['MGRS Tile',     result.mgrsTile]      : null,
                                    result.instrument    ? ['Instrument',    result.instrument]    : null,
                                    result.collection    ? ['Collection',    result.collection]    : null,
                                  ].filter(Boolean).map(([label, val]) => (
                                    <div key={label} className={styles.detailItem}>
                                      <span className={styles.detailLabel}>{label}</span>
                                      <span className={styles.detailValue}>{val || 'N/A'}</span>
                                    </div>
                                  ))}
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
                    <Layers size={28} /><div>No layers added</div>
                  </div>
                ) : (
                  <>
                    <div className={styles.layersHeader}>
                      <span className={styles.totalCount}>
                        {store.activeLayers.length} layers on map
                      </span>
                      <button className={styles.clearBtn} onClick={handleClearAll}>
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
                                    background: getMissionColor(layer.mission),
                                    marginRight: '0.35rem',
                                    fontSize: '0.55rem',
                                    padding: '0.05rem 0.3rem',
                                  }}
                                >
                                  {getMissionLabel(layer.mission)}
                                </span>
                                {layer.presetLabel || layer.preset}
                              </div>
                              <div className={styles.layerDate}>
                                {formatDate(layer.acquisitionDate)}
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
                              {layer.canRender !== false && (
                                <button
                                  className={`${styles.layerActionBtn} ${layer.visible ? styles['layerActionBtn--active'] : ''}`}
                                  onClick={() => handleToggleVisibility(layer)}
                                  title={layer.visible ? 'Hide' : 'Show'}
                                >
                                  {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                                </button>
                              )}
                              <button
                                className={`${styles.layerActionBtn} ${styles['layerActionBtn--danger']}`}
                                onClick={() => handleRemoveLayer(layer)}
                                title="Remove"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          {layer.canRender !== false ? (
                            <div className={styles.layerOpacity}>
                              <span className={styles.opacityLabel}>
                                Opacity {layer.opacity ?? store.globalOpacity}%
                              </span>
                              <input
                                type="range" min="0" max="100"
                                value={layer.opacity ?? store.globalOpacity}
                                onChange={(e) => handleOpacityChange(layer, Number(e.target.value))}
                                className={styles.slider}
                              />
                            </div>
                          ) : (
                            // S-5P layers: no OL tile, show info instead of controls
                            <div style={{
                              fontSize: '10px',
                              color: 'rgba(6,182,212,0.65)',
                              padding: '4px 0 2px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                            }}>
                              <Info size={10} />
                              Atmospheric data — no map tile visualization
                            </div>
                          )}
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

export default SentinelExplorer;
