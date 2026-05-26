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
  Flame,
  Info,
  Layers,
  MapPin,
  Navigation,
  Search,
  Sliders,
  Square,
  Pentagon,
  Trash2,
  X,
} from 'lucide-react';

import useAoiStore from 'src/app/store/aoiStore';
import useBurnedAreaStore from 'src/app/store/burnedAreaStore';
import { isAbortError, useAbortableTask } from 'src/shared/hooks/useAbortableTask';
import { getCurrentMonth } from 'src/shared/utils/dateDefaults';
import { KAZAKHSTAN_EXTENT_GEO } from 'src/modules/MapPage/utils/mapConstants';
import { getMapInstance } from 'src/modules/MapPage/services/mapService';
import {
  BURNED_AREA_DATASETS,
  buildBurnedAreaTileUrl,
  formatBurnedAreaDate,
  getBurnedAreaDataset,
  getBurnedAreaMonthRange,
  searchBurnedAreas,
} from 'src/utils/burnedAreaService';

import styles from '../../SentinelControls/SentinelExplorer.module.scss';
import './fireControls.scss';

const KZ_BBOX = KAZAKHSTAN_EXTENT_GEO;
const KZ_GEOJSON = {
  type: 'Polygon',
  coordinates: [[
    [50.5, 40.5], [87.5, 40.5], [87.5, 55.5], [50.5, 55.5], [50.5, 40.5],
  ]],
};

const maxMonth = getCurrentMonth();

const sortResults = (results, sortBy, sortOrder) => {
  const sorted = [...results].sort((a, b) => {
    if (sortBy === 'tile') {
      return String(a.sceneId || a.id).localeCompare(String(b.sceneId || b.id));
    }
    return new Date(a.acquisitionDate || 0) - new Date(b.acquisitionDate || 0);
  });
  return sortOrder === 'asc' ? sorted : sorted.reverse();
};

const addRasterLayer = (layerId, tileUrl, opacity01) => {
  const map = getMapInstance();
  if (!map) return;
  const sourceId = `${layerId}-source`;
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: 'raster',
      tiles: [tileUrl],
      tileSize: 256,
      maxzoom: 18,
      attribution: 'NASA LP DAAC / MODIS MCD64A1 via Microsoft Planetary Computer',
    });
  }
  if (!map.getLayer(layerId)) {
    map.addLayer({
      id: layerId,
      type: 'raster',
      source: sourceId,
      paint: { 'raster-opacity': opacity01 },
    });
  }
};

const removeRasterLayer = (layerId) => {
  const map = getMapInstance();
  if (!map) return;
  const sourceId = `${layerId}-source`;
  if (map.getLayer(layerId)) map.removeLayer(layerId);
  if (map.getSource(sourceId)) map.removeSource(sourceId);
};

const setRasterVisibility = (layerId, visible) => {
  const map = getMapInstance();
  if (map?.getLayer(layerId)) {
    map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
  }
};

const setRasterOpacity = (layerId, opacity01) => {
  const map = getMapInstance();
  if (map?.getLayer(layerId)) {
    map.setPaintProperty(layerId, 'raster-opacity', opacity01);
  }
};

const BurnedAreaControls = () => {
  const store = useBurnedAreaStore();
  const aoi = useAoiStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [thumbErrors, setThumbErrors] = useState({});
  const searchTask = useAbortableTask();
  const searchSeqRef = useRef(0);

  const selectedDataset = getBurnedAreaDataset(store.selectedDataset);
  const sortedResults = useMemo(
    () => sortResults(store.searchResults, store.sortBy, store.sortOrder),
    [store.searchResults, store.sortBy, store.sortOrder]
  );

  const handleSearch = useCallback(async () => {
    const searchSeq = searchSeqRef.current + 1;
    searchSeqRef.current = searchSeq;
    store.setIsLoading(true);
    store.setError(null);
    store.clearSearch();
    store.setActiveTab('results');

    try {
      const { features, totalResults } = await searchTask.run((signal) => searchBurnedAreas({
        month: store.month,
        bbox: aoi.aoiBbox || KZ_BBOX,
        maxRecords: store.pageSize,
        signal,
      }));

      if (searchSeq !== searchSeqRef.current) return;

      store.setSearchResults(features, totalResults);
      if (features.length === 0) {
        store.setError('Снимки не найдены. Выберите другой месяц или область.');
      }
    } catch (err) {
      if (isAbortError(err)) return;
      if (searchSeq !== searchSeqRef.current) return;
      store.setError(err.message);
      store.setActiveTab('search');
    } finally {
      if (searchSeq === searchSeqRef.current) store.setIsLoading(false);
    }
  }, [aoi.aoiBbox, store, searchTask]);

  const handleAddToMap = useCallback((result) => {
    const layerId = `burned_area_${result.id}_${store.selectedDataset}_${Date.now()}`;
    const tileUrl = buildBurnedAreaTileUrl(result.collection, result.id, store.selectedDataset);
    const dataset = getBurnedAreaDataset(store.selectedDataset);

    const layerConfig = {
      id: layerId,
      collection: result.collection,
      dataset: store.selectedDataset,
      datasetLabel: dataset.label,
      opacity: store.globalOpacity / 100,
      productId: result.id,
      name: result.name,
      visible: true,
      acquisitionDate: result.acquisitionDate,
    };

    addRasterLayer(layerId, tileUrl, store.globalOpacity / 100);
    store.addActiveLayer({ ...layerConfig, tileUrl });
    store.setActiveTab('layers');
  }, [store]);

  const handleRemoveLayer = useCallback((layerId) => {
    removeRasterLayer(layerId);
    store.removeActiveLayer(layerId);
  }, [store]);

  const handleToggleVisibility = useCallback((layerId) => {
    const layer = store.activeLayers.find((item) => item.id === layerId);
    setRasterVisibility(layerId, !(layer?.visible ?? true));
    store.toggleLayerVisibility(layerId);
  }, [store]);

  const handleOpacityChange = useCallback((layerId, opacity) => {
    setRasterOpacity(layerId, opacity / 100);
    store.updateLayerOpacity(layerId, opacity);
  }, [store]);

  const handleClearAll = useCallback(() => {
    store.activeLayers.forEach((layer) => removeRasterLayer(layer.id));
    store.clearActiveLayers();
  }, [store]);

  const handleReorder = useCallback((fromIdx, toIdx) => {
    store.reorderLayers(fromIdx, toIdx);
  }, [store]);

  const handleToggleAll = useCallback(() => {
    if (store.activeLayers.length === 0) {
      setIsExpanded((value) => !value);
      return;
    }
    const next = !store.activeLayers.every((layer) => layer.visible);
    store.activeLayers.forEach((layer) => setRasterVisibility(layer.id, next));
    store.setAllLayersVisible(next);
  }, [store]);

  const allVisible = store.activeLayers.length > 0 && store.activeLayers.every((layer) => layer.visible);
  const monthRange = getBurnedAreaMonthRange(store.month);

  return (
    <div className="fire-controls">
      <div className="fire-controls__header">
        <div className="fire-controls__toggle" onClick={handleToggleAll}>
          <div className="fire-controls__toggle-icon">
            {allVisible
              ? <Eye size={16} className="fire-controls__icon-active" />
              : <EyeOff size={16} className="fire-controls__icon-inactive" />}
          </div>
          <span className="fire-controls__toggle-label">Сгоревшие территории MODIS</span>
        </div>
        <button
          className={`fire-controls__expand-btn ${isExpanded ? 'fire-controls__expand-btn--expanded' : ''}`}
          onClick={() => setIsExpanded((value) => !value)}
          aria-label="Настройки сгоревших территорий"
        >
          <Sliders size={14} />
        </button>
      </div>

      {isExpanded && (
        <div className={styles.explorer}>
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
            {store.activeTab === 'search' && (
              <div className={styles.searchSection}>
                <div>
                  <div className={styles.sectionTitle}>
                    <Flame size={12} /> Данные
                  </div>
                  <div className={styles.missionSelector}>
                    <select
                      value={store.selectedDataset}
                      onChange={(event) => store.setSelectedDataset(event.target.value)}
                      className={styles.select}
                    >
                      {BURNED_AREA_DATASETS.map((dataset) => (
                        <option key={dataset.id} value={dataset.id}>
                          {dataset.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.aoiInfo} style={{ marginTop: '0.45rem' }}>
                    <Info size={11} />
                    {selectedDataset.description}
                  </div>
                </div>

                <div>
                  <div className={styles.sectionTitle}>
                    <Navigation size={12} /> Область интереса
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
                    <button
                      className={styles.aoiBtn}
                      onClick={() => aoi.setAoi(KZ_GEOJSON, KZ_BBOX)}
                      title="Казахстан"
                    >
                      KZ
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
                  <div className={styles.aoiInfo} style={{ marginTop: '0.45rem' }}>
                    <MapPin size={11} />
                    {aoi.aoiBbox
                      ? `Bbox: [${aoi.aoiBbox.map((value) => value.toFixed(2)).join(', ')}]`
                      : 'По умолчанию используется охват Казахстана'}
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>
                    <Calendar size={12} /> Месяц MCD64A1
                  </label>
                  <input
                    type="month"
                    value={store.month}
                    max={maxMonth}
                    onChange={(event) => store.setMonth(event.target.value)}
                    className={styles.dateInput}
                  />
                  <div className={styles.aoiInfo}>
                    <Info size={11} />
                    Период: {monthRange.startDate} - {monthRange.endDate}
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>
                    Прозрачность: {store.globalOpacity}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={store.globalOpacity}
                    onChange={(event) => store.setGlobalOpacity(Number(event.target.value))}
                    className={styles.slider}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Легенда Burn Date</label>
                  <div style={{
                    height: '12px',
                    borderRadius: '4px',
                    background: 'linear-gradient(to right, #140000, #6f0000, #c42f00, #ff8c00, #fff4a3)',
                    margin: '4px 0',
                  }} />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.65rem',
                    color: 'rgba(255,255,255,0.55)',
                  }}>
                    <span>Day 1</span>
                    <span>Day 183</span>
                    <span>Day 366</span>
                  </div>
                </div>

                <div className={styles.aoiInfo}>
                  <Info size={11} />
                  Source: Microsoft Planetary Computer / MODIS MCD64A1 v6.1
                </div>

                {store.error && (
                  <div className={styles.error}>
                    <AlertCircle size={14} />
                    <span>{store.error}</span>
                  </div>
                )}

                <button
                  className={styles.searchBtn}
                  onClick={handleSearch}
                  disabled={store.isLoading || !store.month}
                >
                  <Search size={15} />
                  {store.isLoading ? 'Поиск...' : 'Найти данные'}
                </button>
              </div>
            )}

            {store.activeTab === 'results' && (
              <div className={styles.resultsSection}>
                {store.isLoading && (
                  <div className={styles.loadingMsg}>
                    <div className={styles.spinner} />
                    <div>Поиск данных...</div>
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
                        {sortedResults.length} из {store.totalResults} тайлов
                      </span>
                      <div className={styles.sortControls}>
                        <button
                          className={`${styles.sortBtn} ${store.sortBy === 'date' ? styles['sortBtn--active'] : ''}`}
                          onClick={() => store.setSortBy('date')}
                        >
                          Дата {store.sortBy === 'date' && (store.sortOrder === 'desc' ? '↓' : '↑')}
                        </button>
                        <button
                          className={`${styles.sortBtn} ${store.sortBy === 'tile' ? styles['sortBtn--active'] : ''}`}
                          onClick={() => store.setSortBy('tile')}
                        >
                          Tile {store.sortBy === 'tile' && (store.sortOrder === 'desc' ? '↓' : '↑')}
                        </button>
                      </div>
                    </div>

                    <div className={styles.resultsList}>
                      {sortedResults.map((result) => {
                        const isDetailExpanded = expandedId === result.id;
                        const thumbFailed = thumbErrors[result.id];

                        return (
                          <div key={result.id} className={styles.resultCard}>
                            <div className={styles.cardMain}>
                              <div className={styles.cardThumb}>
                                {result.thumbnailUrl && !thumbFailed ? (
                                  <img
                                    src={result.thumbnailUrl}
                                    alt="MODIS burned area preview"
                                    loading="lazy"
                                    onError={() => setThumbErrors((prev) => ({ ...prev, [result.id]: true }))}
                                  />
                                ) : (
                                  <div className={styles.cardNoThumb}>
                                    {thumbFailed ? '-' : <Flame size={16} />}
                                  </div>
                                )}
                              </div>

                              <div className={styles.cardBody}>
                                <div className={styles.cardTopRow}>
                                  <span className={styles.cardDate}>
                                    {formatBurnedAreaDate(result.acquisitionDate)}
                                  </span>
                                  <span className={styles.missionBadge} style={{ background: '#b45309' }}>
                                    MCD64A1
                                  </span>
                                </div>

                                <div className={styles.cardMeta}>
                                  <span className={styles.cardType}>{result.sceneId}</span>
                                  <span className={styles.cloudBadge}>{selectedDataset.label}</span>
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

                            {isDetailExpanded && (
                              <div className={styles.cardDetails}>
                                <div className={styles.detailGrid}>
                                  <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Scene ID</span>
                                    <span className={styles.detailValue}>{result.id}</span>
                                  </div>
                                  <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Collection</span>
                                    <span className={styles.detailValue}>{result.collection}</span>
                                  </div>
                                  <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Asset</span>
                                    <span className={styles.detailValue}>{store.selectedDataset}</span>
                                  </div>
                                  <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Platform</span>
                                    <span className={styles.detailValue}>{result.mission}</span>
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

            {store.activeTab === 'layers' && (
              <div className={styles.layersSection}>
                {store.activeLayers.length === 0 ? (
                  <div className={styles.emptyLayers}>
                    <Layers size={28} />
                    <div>Нет добавленных слоев</div>
                  </div>
                ) : (
                  <>
                    <div className={styles.layersHeader}>
                      <span className={styles.totalCount}>
                        {store.activeLayers.length} слоев на карте
                      </span>
                      <button className={styles.clearBtn} onClick={handleClearAll}>
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
                                    background: '#b45309',
                                    marginRight: '0.35rem',
                                    fontSize: '0.55rem',
                                    padding: '0.05rem 0.3rem',
                                  }}
                                >
                                  MODIS
                                </span>
                                {layer.datasetLabel}
                              </div>
                              <div className={styles.layerDate}>
                                {formatBurnedAreaDate(layer.acquisitionDate)}
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
                              onChange={(event) => handleOpacityChange(layer.id, Number(event.target.value))}
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

export default BurnedAreaControls;
