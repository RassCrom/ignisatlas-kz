import { useState, useCallback, useMemo } from 'react';
import {
  Search, Database, Layers, Calendar, MapPin,
  AlertCircle, Trash2, Eye, EyeOff, Info, ChevronUp,
  ArrowUp, ArrowDown, Satellite, Sliders,
  Square, Pentagon, X, Navigation,
} from 'lucide-react';

import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';

import { KAZAKHSTAN_EXTENT_GEO } from '../../../../../modules/MapPage/utils/mapConstants';
import useLstStore from 'src/app/store/lstStore';
import useAoiStore from 'src/app/store/aoiStore';
import {
  LST_PRODUCTS,
  LST_RANGE_C,
  buildLstTileUrl,
  searchLst,
  formatLstDate,
  isModisProduct,
} from 'src/utils/lstService';

import styles from './SentinelExplorer.module.scss';
import '../Controls/FireControls/fireControls.scss';

const KZ_BBOX = KAZAKHSTAN_EXTENT_GEO;
const KZ_GEOJSON = {
  type: 'Polygon',
  coordinates: [[
    [50.5, 40.5], [87.5, 40.5], [87.5, 55.5], [50.5, 55.5], [50.5, 40.5],
  ]],
};

const today = new Date().toISOString().split('T')[0];

function sortResults(results, sortBy, sortOrder) {
  return [...results].sort((a, b) => {
    let aVal, bVal;
    if (sortBy === 'date') {
      aVal = new Date(a.acquisitionDate).getTime();
      bVal = new Date(b.acquisitionDate).getTime();
    } else {
      aVal = a.cloudCover ?? 0;
      bVal = b.cloudCover ?? 0;
    }
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });
}

const LSTExplorer = () => {
  const store = useLstStore();
  const aoi = useAoiStore();

  const [expandedId, setExpandedId] = useState(null);
  const [thumbErrors, setThumbErrors] = useState({});
  const [isExpanded, setIsExpanded] = useState(false);

  const sortedResults = useMemo(
    () => sortResults(store.searchResults, store.sortBy, store.sortOrder),
    [store.searchResults, store.sortBy, store.sortOrder]
  );

  const handleSearch = useCallback(async () => {
    store.setIsLoading(true);
    store.setError(null);
    store.clearSearch();
    store.setActiveTab('results');

    try {
      const { features, totalResults } = await searchLst({
        product: store.selectedProduct,
        date: store.date,
        bbox: aoi.aoiBbox,
        maxRecords: store.pageSize,
      });

      store.setSearchResults(features, totalResults);

      if (features.length === 0) {
        store.setError('Снимки не найдены. Попробуйте изменить фильтры.');
      }
    } catch (err) {
      store.setError(err.message);
      store.setActiveTab('search');
    } finally {
      store.setIsLoading(false);
    }
  }, [store, aoi]);

  const handleAddToMap = useCallback((result) => {
    const layerId = `lst_${result.id}_${Date.now()}`;
    const tileUrl = buildLstTileUrl(result.collection, result.id, store.obsTime);

    const layerConfig = {
      id: layerId,
      mission: result.mission,
      collection: result.collection,
      obsTime: store.obsTime,
      opacity: store.globalOpacity / 100,
      productId: result.id,
      name: result.name,
      cloudCover: result.cloudCover,
      visible: true,
      acquisitionDate: result.acquisitionDate,
    };

    const olLayer = new TileLayer({
      source: new XYZ({
        url: tileUrl,
        crossOrigin: 'anonymous',
        maxZoom: 18,
        attributions: '© NASA / USGS via Microsoft Planetary Computer',
        tileLoadFunction: (tile, src) => {
          const img = tile.getImage();
          img.onerror = () => tile.setState(4); // EMPTY — tile outside scene bounds
          img.src = src;
        },
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

  const handleToggleAll = useCallback(() => {
    const next = !(store.activeLayers.length > 0 && store.activeLayers.every((l) => l.visible));
    if (window.mapInstance) {
      store.activeLayers.forEach((layer) => {
        const ol = window.mapInstance.getLayers().getArray().find((l) => l.get('id') === layer.id);
        if (ol) ol.setVisible(next);
      });
    }
    store.setAllLayersVisible(next);
  }, [store]);

  const isModis = isModisProduct(store.selectedProduct);
  const allVisible = store.activeLayers.length > 0 && store.activeLayers.every((l) => l.visible);

  return (
    <div className="fire-controls">
      <div className="fire-controls__header">
        <div className="fire-controls__toggle" onClick={handleToggleAll}>
          <div className="fire-controls__toggle-icon">
            {allVisible
              ? <Eye size={16} className="fire-controls__icon-active" />
              : <EyeOff size={16} className="fire-controls__icon-inactive" />
            }
          </div>
          <span className="fire-controls__toggle-label">LST Explorer</span>
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

                {/* Product selector */}
                <div>
                  <div className={styles.sectionTitle}>
                    <Satellite size={12} /> Продукт
                  </div>
                  <div className={styles.missionSelector}>
                    <select
                      value={store.selectedProduct}
                      onChange={(e) => store.setSelectedProduct(e.target.value)}
                      className={styles.select}
                    >
                      {LST_PRODUCTS.map((p) => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Day / Night toggle — MODIS only */}
                {isModis && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div className={styles.sectionTitle}>
                      Время съёмки
                    </div>
                    <div className={styles.missionSelector} style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        className={`${styles.missionBtn} ${store.obsTime === 'day' ? styles['missionBtn--active'] : ''}`}
                        onClick={() => store.setObsTime('day')}
                      >
                        День
                      </button>
                      <button
                        className={`${styles.missionBtn} ${store.obsTime === 'night' ? styles['missionBtn--active'] : ''}`}
                        onClick={() => store.setObsTime('night')}
                      >
                        Ночь
                      </button>
                    </div>
                  </div>
                )}

                {/* AOI Controls */}
                <div style={{ marginTop: '0.75rem' }}>
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
                    <button
                      className={styles.aoiBtn}
                      onClick={() => aoi.setAoi(KZ_GEOJSON, KZ_BBOX)}
                      title="Казахстан"
                    >
                      КЗ
                    </button>
                    {aoi.aoiBbox && (
                      <>
                        <button
                          className={`${styles.aoiBtn} ${!aoi.aoiVisible ? styles['aoiBtn--inactive'] : ''}`}
                          onClick={() => aoi.toggleAoiVisibility()}
                          title={aoi.aoiVisible ? 'Скрыть AOI' : 'Показать AOI'}
                        >
                          {aoi.aoiVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                        </button>
                        <button
                          className={`${styles.aoiBtn} ${styles['aoiBtn--clear']}`}
                          onClick={() => { aoi.clearAoi(); aoi.setAoiDrawMode(null); }}
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

                {/* Date */}
                <div className={styles.field} style={{ marginTop: '0.75rem' }}>
                  <label className={styles.label}>
                    <Calendar size={12} /> Дата
                  </label>
                  <input
                    type="date"
                    value={store.date}
                    onChange={(e) => store.setDate(e.target.value)}
                    max={today}
                    className={styles.dateInput}
                  />
                </div>

                {/* Opacity */}
                <div className={styles.field}>
                  <label className={styles.label}>
                    Прозрачность: {store.globalOpacity}%
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

                {/* Temperature legend */}
                <div className={styles.field}>
                  <label className={styles.label}>
                    Температура поверхности
                  </label>
                  <div style={{
                    height: '12px',
                    borderRadius: '4px',
                    background: 'linear-gradient(to right, #4575b4, #91bfdb, #e0f3f8, #ffffbf, #fee090, #fc8d59, #d73027)',
                    margin: '4px 0',
                  }} />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.65rem',
                    color: 'rgba(255,255,255,0.55)',
                  }}>
                    <span>{LST_RANGE_C.min}°C</span>
                    <span>{Math.round((LST_RANGE_C.min + LST_RANGE_C.max) / 2)}°C</span>
                    <span>{LST_RANGE_C.max}°C</span>
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
                  disabled={store.isLoading || !store.date}
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
                          Облака {store.sortBy === 'cloudCover' && (store.sortOrder === 'asc' ? '↑' : '↓')}
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
                                    {formatLstDate(result.acquisitionDate)}
                                  </span>
                                  <span
                                    className={styles.missionBadge}
                                    style={{ background: result.collection === 'landsat-c2-l2' ? '#1a6b3c' : '#7b3fa0' }}
                                  >
                                    {result.collection === 'landsat-c2-l2' ? 'Landsat' : 'MODIS'}
                                  </span>
                                </div>

                                <div className={styles.cardMeta}>
                                  {result.mission && (
                                    <span className={styles.cardType}>
                                      {result.mission}
                                    </span>
                                  )}
                                  {result.cloudCover != null && (
                                    <span className={styles.cloudBadge}>
                                      {result.cloudCover.toFixed(1)}%
                                    </span>
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
                                    <span className={styles.detailLabel}>Scene ID</span>
                                    <span className={styles.detailValue}>{result.sceneId || result.id}</span>
                                  </div>
                                  <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Платформа</span>
                                    <span className={styles.detailValue}>{result.mission || 'N/A'}</span>
                                  </div>
                                  <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Продукт</span>
                                    <span className={styles.detailValue}>{result.collection || 'N/A'}</span>
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
                                    background: layer.collection === 'landsat-c2-l2' ? '#1a6b3c' : '#7b3fa0',
                                    marginRight: '0.35rem',
                                    fontSize: '0.55rem',
                                    padding: '0.05rem 0.3rem',
                                  }}
                                >
                                  {layer.collection === 'landsat-c2-l2' ? 'Landsat' : 'MODIS'}
                                </span>
                                {layer.collection}
                                {layer.obsTime && ` (${layer.obsTime === 'day' ? 'день' : 'ночь'})`}
                              </div>
                              <div className={styles.layerDate}>
                                {formatLstDate(layer.acquisitionDate)}
                              </div>
                            </div>

                            <div className={styles.layerActions}>
                              {idx > 0 && (
                                <button
                                  className={`${styles.layerActionBtn} ${styles['layerActionBtn--up']}`}
                                  onClick={() => handleReorder(idx, idx - 1)}
                                  title="Выше"
                                >
                                  <ArrowUp size={12} />
                                </button>
                              )}
                              {idx < store.activeLayers.length - 1 && (
                                <button
                                  className={`${styles.layerActionBtn} ${styles['layerActionBtn--down']}`}
                                  onClick={() => handleReorder(idx, idx + 1)}
                                  title="Ниже"
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
                              Прозрачность {Math.round(layer.opacity * 100)}%
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

export default LSTExplorer;
