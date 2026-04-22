import { useState, useCallback, useMemo } from 'react';
import {
  Search, Database, Layers, Calendar, Cloud, MapPin,
  AlertCircle, Trash2, Eye, EyeOff, Info, ChevronUp,
  ChevronDown, Square, Pentagon, X, Navigation, ArrowUp, ArrowDown,
  Satellite, Sliders,
} from 'lucide-react';

import useSentinelExplorerStore from 'src/app/store/sentinelExplorerStore';
import useAoiStore from 'src/app/store/aoiStore';
import { createSentinelLayer } from 'src/utils/sentinelUtils';
import {
  searchSentinel,
  sortResults,
  formatDate,
  formatFileSize,
  getCloudCoverColor,
  getCloudCoverLabel,
  getMissionColor,
  getMissionLabel,
} from 'src/utils/sentinelSearchService';

import styles from './SentinelExplorer.module.scss';
import '../Controls/FireControls/fireControls.scss';

// ── Mission configs ──────────────────────────────────────────────────────

const MISSIONS = [
  { id: 'all',          label: 'Все' },
  { id: 'sentinel-1',   label: 'S-1' },
  { id: 'sentinel-2',   label: 'S-2' },
  { id: 'sentinel-3',   label: 'S-3' },
  { id: 'sentinel-5p',  label: 'S-5P' },
];

const BAND_OPTIONS = {
  'sentinel-2': [
    { value: 'true-color',  label: 'Натуральные цвета (RGB)', icon: '🌍' },
    { value: 'false-color', label: 'Ложный цвет (БИК-К-З)',   icon: '🌿' },
    { value: 'ndvi',        label: 'NDVI (Растительность)',     icon: '🌱' },
    { value: 'ndwi',        label: 'NDWI (Водные объекты)',     icon: '💧' },
    { value: 'ndbr',        label: 'NDBR (Индекс выжженности)', icon: '🔥' },
  ],
  'sentinel-3': [
    { value: 'OLCI-TRUE', label: 'OLCI True Color', icon: '🌍' },
  ],
  'sentinel-5p': [
    { value: 'NO2', label: 'NO₂', icon: '🏭' },
    { value: 'O3',  label: 'O₃',  icon: '☁️' },
    { value: 'CH4', label: 'CH₄', icon: '🔥' },
  ],
  'sentinel-1': [
    { value: 'IW_VV', label: 'IW VV', icon: '📡' },
  ],
};

// Map from our mission IDs to sentinelUtils satellite keys
// NOTE: sentinelUtils has confusing naming:
//   sentinel3 key → actually Sentinel-1 SAR (WMS instance for S-1)
//   sentinel1 key → actually Sentinel-3 (WMS instance for S-3)
const SENTINEL_UTILS_KEY = {
  'sentinel-1':  'sentinel3',
  'sentinel-2':  'sentinel2',
  'sentinel-3':  'sentinel1',
  'sentinel-5p': 'sentinel5',
};

// ── Component ────────────────────────────────────────────────────────────

const SentinelExplorer = () => {
  const store = useSentinelExplorerStore();
  const aoi = useAoiStore();
  const [expandedId, setExpandedId] = useState(null);
  const [thumbErrors, setThumbErrors] = useState({});
  const [isExpanded, setIsExpanded] = useState(false);

  // ── Derived state ──────────────────────────────────────────────────────

  const sortedResults = useMemo(
    () => sortResults(store.searchResults, store.sortBy, store.sortOrder),
    [store.searchResults, store.sortBy, store.sortOrder]
  );

  const currentBandOptions = useMemo(() => {
    if (store.selectedMission === 'all') return BAND_OPTIONS['sentinel-2'];
    return BAND_OPTIONS[store.selectedMission] || BAND_OPTIONS['sentinel-2'];
  }, [store.selectedMission]);

  const showCloudFilter = store.selectedMission !== 'sentinel-1';
  const showOrbitFilter = store.selectedMission === 'sentinel-1' || store.selectedMission === 'all';

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleSearch = useCallback(async () => {
    store.setIsLoading(true);
    store.setError(null);
    store.clearSearch();
    store.setActiveTab('results');

    try {
      const { features, totalResults, errors } = await searchSentinel({
        mission: store.selectedMission,
        startDate: store.startDate,
        endDate: store.endDate,
        bbox: aoi.aoiBbox,
        cloudCoverage: store.cloudCoverage,
        maxRecords: store.pageSize,
        page: store.page,
      });

      store.setSearchResults(features, totalResults);

      if (features.length === 0) {
        store.setError('Снимки не найдены для указанных критериев. Попробуйте изменить фильтры.');
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
  }, [store]);

  const handleAddToMap = useCallback((result) => {
    const mission = result.mission || store.selectedMission;
    const utilsKey = SENTINEL_UTILS_KEY[mission] || 'sentinel2';
    const bands = store.selectedBands;
    const layerId = `explorer_${result.id}_${bands}_${Date.now()}`;

    const layerConfig = {
      id: layerId,
      mission,
      bands,
      startDate: store.startDate,
      endDate: store.endDate,
      opacity: store.globalOpacity / 100,
      productId: result.id,
      name: result.name,
      cloudCover: result.cloudCover,
      visible: true,
      acquisitionDate: result.acquisitionDate,
      utilsKey,
    };

    // Create OpenLayers layer and add to map
    const olLayer = createSentinelLayer(
      utilsKey,
      layerId,
      bands,
      store.startDate,
      store.endDate,
      store.globalOpacity / 100,
      result.id
    );

    if (olLayer && window.mapInstance) {
      window.mapInstance.addLayer(olLayer);
    }

    store.addActiveLayer(layerConfig);
    store.setActiveTab('layers');
  }, [store]);

  const handleRemoveLayer = useCallback((layerId) => {
    // Remove from OL map
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

  // ── Render ────────────────────────────────────────────────────────────

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
          {/* ── Tabs ─────────────────────────────────────────── */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${store.activeTab === 'search' ? styles['tab--active'] : ''}`}
              onClick={() => store.setActiveTab('search')}
            >
              <Search size={14} /> Поиск
            </button>
            <button
              className={`${styles.tab} ${store.activeTab === 'results' ? styles['tab--active'] : ''}`}
              onClick={() => store.setActiveTab('results')}
              disabled={store.searchResults.length === 0 && !store.isLoading}
            >
              <Database size={14} /> Результаты
              {store.searchResults.length > 0 && (
                <span className={styles.badge}>{store.searchResults.length}</span>
              )}
            </button>
            <button
              className={`${styles.tab} ${store.activeTab === 'layers' ? styles['tab--active'] : ''}`}
              onClick={() => store.setActiveTab('layers')}
              disabled={store.activeLayers.length === 0}
            >
              <Layers size={14} /> Слои
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
                    <Satellite size={12} /> Миссия
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

                {/* AOI Controls */}
                <div>
                  <div className={styles.sectionTitle}>
                    <Navigation size={12} /> Область интереса (AOI)
                  </div>
                  <div className={styles.aoiRow}>
                    <button
                      className={`${styles.aoiBtn} ${aoi.aoiDrawMode === 'box' ? styles['aoiBtn--active'] : ''}`}
                      onClick={() => aoi.setAoiDrawMode(aoi.aoiDrawMode === 'box' ? null : 'box')}
                    >
                      <Square size={13} /> Прямоугольник
                    </button>
                    <button
                      className={`${styles.aoiBtn} ${aoi.aoiDrawMode === 'polygon' ? styles['aoiBtn--active'] : ''}`}
                      onClick={() => aoi.setAoiDrawMode(aoi.aoiDrawMode === 'polygon' ? null : 'polygon')}
                    >
                      <Pentagon size={13} /> Полигон
                    </button>
                    {aoi.aoiBbox && (
                      <>
                        <button
                          className={`${styles.aoiBtn} ${!aoi.aoiVisible ? styles['aoiBtn--inactive'] : ''}`}
                          onClick={() => aoi.toggleAoiVisibility()}
                          title={aoi.aoiVisible ? 'Скрыть полигон AOI' : 'Показать полигон AOI'}
                        >
                          {aoi.aoiVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                        </button>
                        <button
                          className={`${styles.aoiBtn} ${styles['aoiBtn--clear']}`}
                          onClick={() => {
                            aoi.clearAoi();
                            aoi.setAoiDrawMode(null);
                          }}
                          title="Очистить AOI"
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
                      <Calendar size={12} /> Начало
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
                      <Calendar size={12} /> Конец
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
                {showCloudFilter && (
                  <div className={styles.field}>
                    <label className={styles.label}>
                      <Cloud size={12} /> Облачность ≤ {store.cloudCoverage}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={store.cloudCoverage}
                      onChange={(e) => store.setCloudCoverage(Number(e.target.value))}
                      className={styles.slider}
                    />
                  </div>
                )}

                {/* Band combination */}
                <div className={styles.field}>
                  <label className={styles.label}>Комбинация каналов</label>
                  <select
                    value={store.selectedBands}
                    onChange={(e) => store.setSelectedBands(e.target.value)}
                    className={styles.select}
                  >
                    {currentBandOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.icon} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Opacity */}
                <div className={styles.field}>
                  <label className={styles.label}>
                    Непрозрачность: {store.globalOpacity}%
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
                  {store.isLoading ? 'Поиск…' : 'Найти снимки'}
                </button>
              </div>
            )}

            {/* ═══ RESULTS TAB ══════════════════════════════════ */}
            {store.activeTab === 'results' && (
              <div className={styles.resultsSection}>
                {store.isLoading && (
                  <div className={styles.loadingMsg}>
                    <div className={styles.spinner} />
                    <div>Поиск снимков…</div>
                  </div>
                )}

                {!store.isLoading && sortedResults.length === 0 && (
                  <div className={styles.emptyMsg}>
                    {store.error || 'Нет результатов. Выполните поиск.'}
                  </div>
                )}

                {sortedResults.length > 0 && (
                  <>
                    <div className={styles.resultsHeader}>
                      <span className={styles.totalCount}>
                        {sortedResults.length} из {store.totalResults} снимков
                      </span>
                      <div className={styles.sortControls}>
                        <button
                          className={`${styles.sortBtn} ${store.sortBy === 'date' ? styles['sortBtn--active'] : ''}`}
                          onClick={() => store.setSortBy('date')}
                        >
                          Дата {store.sortBy === 'date' && (store.sortOrder === 'desc' ? '↓' : '↑')}
                        </button>
                        <button
                          className={`${styles.sortBtn} ${store.sortBy === 'cloudCover' ? styles['sortBtn--active'] : ''}`}
                          onClick={() => store.setSortBy('cloudCover')}
                        >
                          Облачн. {store.sortBy === 'cloudCover' && (store.sortOrder === 'asc' ? '↑' : '↓')}
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
                                  {result.productType && (
                                    <span className={styles.cardType}>{result.productType}</span>
                                  )}
                                </div>

                                <div className={styles.cardActions}>
                                  <button
                                    className={styles.expandBtn}
                                    onClick={() => setExpandedId(isDetailExpanded ? null : result.id)}
                                  >
                                    {isDetailExpanded ? <ChevronUp size={12} /> : <Info size={12} />}
                                    {isDetailExpanded ? 'Свернуть' : 'Детали'}
                                  </button>
                                  <button
                                    className={styles.addBtn}
                                    onClick={() => handleAddToMap(result)}
                                  >
                                    <MapPin size={12} /> На карту
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Expanded details */}
                            {isDetailExpanded && (
                              <div className={styles.cardDetails}>
                                <div className={styles.detailGrid}>
                                  <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>ID сцены</span>
                                    <span className={styles.detailValue}>{result.sceneId}</span>
                                  </div>
                                  <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Платформа</span>
                                    <span className={styles.detailValue}>{result.platform || 'N/A'}</span>
                                  </div>
                                  <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Инструмент</span>
                                    <span className={styles.detailValue}>{result.instrument || 'N/A'}</span>
                                  </div>
                                  <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Уровень обработки</span>
                                    <span className={styles.detailValue}>{result.processingLevel || 'N/A'}</span>
                                  </div>
                                  {result.orbitDirection && (
                                    <div className={styles.detailItem}>
                                      <span className={styles.detailLabel}>Направление орбиты</span>
                                      <span className={styles.detailValue}>{result.orbitDirection}</span>
                                    </div>
                                  )}
                                  {result.orbitNumber && (
                                    <div className={styles.detailItem}>
                                      <span className={styles.detailLabel}>Номер орбиты</span>
                                      <span className={styles.detailValue}>{result.orbitNumber}</span>
                                    </div>
                                  )}
                                  {result.size && (
                                    <div className={styles.detailItem}>
                                      <span className={styles.detailLabel}>Размер</span>
                                      <span className={styles.detailValue}>{formatFileSize(result.size)}</span>
                                    </div>
                                  )}
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
                    <div>Нет добавленных слоёв</div>
                  </div>
                ) : (
                  <>
                    <div className={styles.layersHeader}>
                      <span className={styles.totalCount}>
                        {store.activeLayers.length} слоёв на карте
                      </span>
                      <button
                        className={styles.clearBtn}
                        onClick={handleClearAll}
                      >
                        <Trash2 size={13} /> Очистить
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
                                {layer.bands}
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
                                  title="Вверх"
                                >
                                  <ArrowUp size={12} />
                                </button>
                              )}
                              {idx < store.activeLayers.length - 1 && (
                                <button
                                  className={`${styles.layerActionBtn} ${styles['layerActionBtn--down']}`}
                                  onClick={() => handleReorder(idx, idx + 1)}
                                  title="Вниз"
                                >
                                  <ArrowDown size={12} />
                                </button>
                              )}
                              <button
                                className={`${styles.layerActionBtn} ${layer.visible ? styles['layerActionBtn--active'] : ''}`}
                                onClick={() => handleToggleVisibility(layer.id)}
                                title={layer.visible ? 'Скрыть' : 'Показать'}
                              >
                                {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                              </button>
                              <button
                                className={`${styles.layerActionBtn} ${styles['layerActionBtn--danger']}`}
                                onClick={() => handleRemoveLayer(layer.id)}
                                title="Удалить"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          <div className={styles.layerOpacity}>
                            <span className={styles.opacityLabel}>
                              Непрозрачность {Math.round(layer.opacity * 100)}%
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

export default SentinelExplorer;
