import { useState, useCallback } from 'react';
import {
  Calendar, Search, Layers, Database, MapPin,
  Eye, EyeOff, Trash2, AlertCircle, Cloud, Info,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import useHLSStore from 'src/app/store/hlsStore';
import styles from './HLSControls.module.scss';


const CMR_BASE = 'https://cmr.earthdata.nasa.gov/stac/LPCLOUD';

// Candidate collection IDs: CMR concept ID first (most reliable),
// then human-readable variants as fallback.
const CMR_COLLECTION_CANDIDATES = [
  'C2021957295-LPCLOUD', // HLSL30 v2.0 – official CMR concept ID
  'HLSL30.v2.0',
  'HLSL30_2.0',
  'HLSL30.020',
];

// Cached after the first successful discovery so repeat searches are instant.
let resolvedCollectionId = null;

/**
 * Discovers the working HLSL30 collection ID by asking the LPCLOUD catalog
 * for its collection list and matching on id/title containing "hlsl30".
 * Returns null if the catalog cannot be reached.
 */
async function discoverHLSL30Collection() {
  try {
    const res = await fetch(`${CMR_BASE}/collections?limit=200`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const cols = data.collections || data.features || [];
    const match = cols.find((c) => {
      const id = (c.id || '').toLowerCase();
      const title = (c.title || '').toLowerCase();
      return id.includes('hlsl30') || title.includes('hlsl30');
    });
    return match?.id ?? null;
  } catch {
    return null;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getThumbnailUrl(item) {
  const assets = item.assets || {};
  for (const key of ['rendered_preview', 'thumbnail', 'overview', 'BROWSE', 'browse']) {
    if (assets[key]?.href) return assets[key].href;
  }
  return null;
}

function getItemBbox(item) {
  if (Array.isArray(item.bbox) && item.bbox.length === 4) return item.bbox;
  // Fall back to geometry envelope
  const coords = item.geometry?.coordinates?.[0];
  if (coords) {
    const lons = coords.map(([x]) => x);
    const lats = coords.map(([, y]) => y);
    return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
  }
  return null;
}

function getCloudCover(item) {
  return item.properties?.['eo:cloud_cover'] ?? item.properties?.cloud_cover ?? null;
}

function getPlatform(item) {
  return item.properties?.platform || item.properties?.instruments?.[0] || 'Unknown';
}

function getAcquisitionDate(item) {
  const dt = item.properties?.datetime || item.properties?.start_datetime;
  if (!dt) return 'Unknown';
  return new Date(dt).toLocaleDateString('ru-RU', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function getCloudColor(pct) {
  if (pct == null) return '#64748b';
  if (pct <= 10) return '#16a34a';
  if (pct <= 30) return '#ca8a04';
  return '#dc2626';
}

function getMgrsTile(item) {
  return (
    item.properties?.['mgrs:utm_zone'] ||
    item.properties?.['mgrs:latitude_band'] ||
    item.properties?.['landsat:wrs_path'] ||
    null
  );
}

// ─── STAC search ─────────────────────────────────────────────────────────────

/** Tries one collection ID and returns its items, or throws on failure. */
async function fetchItems(collectionId, datetime, limit) {
  const params = new URLSearchParams({ datetime, limit: String(limit) });
  const url = `${CMR_BASE}/collections/${collectionId}/items?${params}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.features || [];
}

/**
 * Searches NASA CMR-STAC LPCLOUD for HLSL30 items.
 * Strategy:
 *  1. If a working collection ID is cached, use it directly.
 *  2. Otherwise try each candidate in CMR_COLLECTION_CANDIDATES.
 *  3. If all candidates fail, ask the provider catalog for the real ID.
 */
async function searchHLS({ startDate, endDate, cloudCover, platform, limit }) {
  const datetime = `${startDate}T00:00:00Z/${endDate}T23:59:59Z`;
  const errors = [];

  const candidates = resolvedCollectionId
    ? [resolvedCollectionId]
    : CMR_COLLECTION_CANDIDATES;

  for (const id of candidates) {
    try {
      const items = await fetchItems(id, datetime, limit);
      resolvedCollectionId = id; // cache for future searches
      return { items: applyFilters(items, cloudCover, platform), source: `NASA CMR-STAC (${id})` };
    } catch (err) {
      errors.push(`${id}: ${err.message}`);
    }
  }

  // Last resort: dynamically discover the collection ID from the catalog
  const discovered = await discoverHLSL30Collection();
  if (discovered && !candidates.includes(discovered)) {
    try {
      const items = await fetchItems(discovered, datetime, limit);
      resolvedCollectionId = discovered;
      return { items: applyFilters(items, cloudCover, platform), source: `NASA CMR-STAC (${discovered})` };
    } catch (err) {
      errors.push(`discovered(${discovered}): ${err.message}`);
    }
  }

  throw new Error(`Search failed – tried: ${[...candidates, discovered].filter(Boolean).join(', ')}\n${errors.join('\n')}`);
}

function applyFilters(items, cloudCover, platform) {
  let filtered = items.filter((item) => (getCloudCover(item) ?? 0) <= cloudCover);
  if (platform !== 'all') {
    const needle = platform.replace('-', '_').toLowerCase();
    filtered = filtered.filter((item) => {
      const p = getPlatform(item).toLowerCase().replace(/[-\s]/g, '_');
      return p.includes(needle);
    });
  }
  return filtered;
}

// ─── Component ────────────────────────────────────────────────────────────────

const HLSControls = () => {
  const {
    startDate, setStartDate,
    endDate, setEndDate,
    cloudCover, setCloudCover,
    platform, setPlatform,
    isLoading, setIsLoading,
    searchResults, setSearchResults,
    error, setError,
    activeLayers,
    addActiveLayer, removeActiveLayer, clearActiveLayers,
    toggleLayerVisibility, updateLayerOpacity,
  } = useHLSStore();

  const [activeTab, setActiveTab] = useState('search');
  const [searchSource, setSearchSource] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [thumbErrors, setThumbErrors] = useState({});

  // ── Search ──────────────────────────────────────────────────────────────────

  const handleSearch = useCallback(async () => {
    if (!startDate || !endDate) {
      setError('Выберите начальную и конечную даты');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('Конечная дата должна быть позже начальной');
      return;
    }

    setError(null);
    setIsLoading(true);
    setSearchResults([]);
    setActiveTab('results');

    try {
      const { items, source } = await searchHLS({
        startDate, endDate, cloudCover, platform, limit: 100,
      });
      setSearchResults(items);
      setSearchSource(source);
      if (items.length === 0) {
        setError('Снимки HLS L30 не найдены. Попробуйте расширить период или лимит облачности.');
      }
    } catch (err) {
      setError(err.message);
      setActiveTab('search');
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, cloudCover, platform, setError, setIsLoading, setSearchResults]);

  // ── Add to map ───────────────────────────────────────────────────────────────

  const handleAddToMap = useCallback((item) => {
    const bbox = getItemBbox(item);
    const thumbnailUrl = getThumbnailUrl(item);

    const config = {
      id: `hls_${item.id}_${Date.now()}`,
      itemId: item.id,
      bbox,
      thumbnailUrl,
      opacity: 0.85,
      visible: true,
      cloudCover: getCloudCover(item),
      date: getAcquisitionDate(item),
      platform: getPlatform(item),
      mgrsTile: getMgrsTile(item),
      assets: item.assets || {},
      hasThumbnail: !!thumbnailUrl,
    };

    addActiveLayer(config);
    setActiveTab('layers');
  }, [addActiveLayer]);

  // ── Tab switch helper ────────────────────────────────────────────────────────

  const switchTab = (tab) => {
    setActiveTab(tab);
    setError(null);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className={styles.hlsControls}>

      {/* ── Tab bar ─────────────────────────────────────────────── */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'search' ? styles['tab--active'] : ''}`}
          onClick={() => switchTab('search')}
        >
          <Search size={14} /> Поиск
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'results' ? styles['tab--active'] : ''}`}
          onClick={() => switchTab('results')}
          disabled={searchResults.length === 0 && !isLoading}
        >
          <Database size={14} /> Результаты ({searchResults.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'layers' ? styles['tab--active'] : ''}`}
          onClick={() => switchTab('layers')}
          disabled={activeLayers.length === 0}
        >
          <Layers size={14} /> Слои ({activeLayers.length})
        </button>
      </div>

      <div className={styles.content}>

        {/* ══════════════ Search tab ══════════════════════════════ */}
        {activeTab === 'search' && (
          <div className={styles.searchSection}>

            {/* Date row */}
            <div className={styles.dateRow}>
              <div className={styles.dateGroup}>
                <label className={styles.label}>
                  <Calendar size={13} /> Начало
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate || new Date().toISOString().split('T')[0]}
                  className={styles.dateInput}
                />
              </div>
              <div className={styles.dateGroup}>
                <label className={styles.label}>
                  <Calendar size={13} /> Конец
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  max={new Date().toISOString().split('T')[0]}
                  className={styles.dateInput}
                />
              </div>
            </div>

            {/* Cloud cover */}
            <div className={styles.field}>
              <label className={styles.label}>
                <Cloud size={13} /> Облачность ≤ {cloudCover}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={cloudCover}
                onChange={(e) => setCloudCover(Number(e.target.value))}
                className={styles.slider}
              />
            </div>

            {/* Platform */}
            <div className={styles.field}>
              <label className={styles.label}>Платформа</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className={styles.select}
              >
                <option value="all">Все (L8 + L9)</option>
                <option value="landsat-8">Landsat 8</option>
                <option value="landsat-9">Landsat 9</option>
              </select>
            </div>

            {/* Error */}
            {error && (
              <div className={styles.error}>
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <button
              className={styles.searchBtn}
              onClick={handleSearch}
              disabled={isLoading || !startDate || !endDate}
            >
              <Search size={15} />
              {isLoading ? 'Поиск…' : 'Найти HLS L30'}
            </button>

            <p className={styles.hint}>
              Запрос NASA CMR-STAC для HLS L30 (30 м) снимков Казахстана.
            </p>
          </div>
        )}

        {/* ══════════════ Results tab ═════════════════════════════ */}
        {activeTab === 'results' && (
          <div className={styles.resultsSection}>
            {isLoading && (
              <div className={styles.statusMsg}>Поиск…</div>
            )}

            {!isLoading && searchResults.length === 0 && (
              <div className={styles.statusMsg}>
                {error || 'Нет результатов. Выполните поиск.'}
              </div>
            )}

            {searchSource && (
              <div className={styles.sourceTag}>{searchSource}</div>
            )}

            {error && !isLoading && searchResults.length > 0 && (
              <div className={styles.error}>
                <AlertCircle size={14} /> <span>{error}</span>
              </div>
            )}

            <div className={styles.resultsList}>
              {searchResults.map((item) => {
                const cloud = getCloudCover(item);
                const date = getAcquisitionDate(item);
                const plat = getPlatform(item);
                const thumb = getThumbnailUrl(item);
                const tile = getMgrsTile(item);
                const isExpanded = expandedId === item.id;
                const thumbFailed = thumbErrors[item.id];

                return (
                  <div key={item.id} className={styles.resultCard}>
                    {/* Card header */}
                    <div className={styles.resultCard__header}>

                      {/* Thumbnail */}
                      <div className={styles.resultCard__thumb}>
                        {thumb && !thumbFailed ? (
                          <img
                            src={thumb}
                            alt="preview"
                            crossOrigin="anonymous"
                            onError={() =>
                              setThumbErrors((prev) => ({ ...prev, [item.id]: true }))
                            }
                          />
                        ) : (
                          <div className={styles.resultCard__noThumb}>
                            {thumbFailed ? '⚠ Auth' : '—'}
                          </div>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className={styles.resultCard__meta}>
                        <span className={styles.resultCard__date}>{date}</span>
                        <span className={styles.resultCard__platform}>{plat}</span>
                        {cloud !== null && (
                          <span
                            className={styles.resultCard__cloud}
                            style={{ color: getCloudColor(cloud) }}
                          >
                            <Cloud size={11} /> {cloud.toFixed(1)}%
                          </span>
                        )}
                        {tile && (
                          <span className={styles.resultCard__tile}>{tile}</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className={styles.resultCard__actions}>
                        <button
                          className={styles.iconBtn}
                          onClick={() =>
                            setExpandedId(isExpanded ? null : item.id)
                          }
                          title="Подробности"
                        >
                          {isExpanded ? <ChevronUp size={13} /> : <Info size={13} />}
                        </button>
                        <button
                          className={`${styles.iconBtn} ${styles['iconBtn--add']}`}
                          onClick={() => handleAddToMap(item)}
                          title={thumb ? 'Добавить на карту' : 'Нет превью – добавить метку bbox'}
                        >
                          <MapPin size={13} /> Добавить
                        </button>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className={styles.resultCard__details}>
                        <div className={styles.detailRow}>
                          <span>ID</span>
                          <code className={styles.detailValue}>{item.id}</code>
                        </div>
                        {item.bbox && (
                          <div className={styles.detailRow}>
                            <span>BBox</span>
                            <code className={styles.detailValue}>
                              {item.bbox.map((v) => v.toFixed(3)).join(', ')}
                            </code>
                          </div>
                        )}
                        <div className={styles.detailRow}>
                          <span>Assets</span>
                          <div className={styles.assetGrid}>
                            {Object.entries(item.assets || {}).map(([key, asset]) => (
                              <div key={key} className={styles.assetItem}>
                                <span className={styles.assetKey}>{key}</span>
                                {asset.href && (
                                  <a
                                    href={asset.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.assetLink}
                                    title={asset.href}
                                  >
                                    {asset.title || asset.type || asset.href.split('/').pop()}
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        {!thumb && (
                          <div className={styles.authNote}>
                            Нет публичного превью. RAW-данные могут требовать авторизацию NASA Earthdata.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════ Layers tab ══════════════════════════════ */}
        {activeTab === 'layers' && (
          <div className={styles.layersSection}>
            <div className={styles.layersHeader}>
              <button
                className={styles.clearBtn}
                onClick={clearActiveLayers}
                disabled={activeLayers.length === 0}
              >
                <Trash2 size={14} /> Очистить все
              </button>
            </div>

            <div className={styles.layersList}>
              {activeLayers.map((layer) => (
                <div key={layer.id} className={styles.layerCard}>
                  <div className={styles.layerCard__top}>
                    <div className={styles.layerCard__info}>
                      <span className={styles.layerCard__date}>{layer.date}</span>
                      <span className={styles.layerCard__platform}>{layer.platform}</span>
                      {layer.cloudCover != null && (
                        <span
                          className={styles.layerCard__cloud}
                          style={{ color: getCloudColor(layer.cloudCover) }}
                        >
                          <Cloud size={11} /> {layer.cloudCover.toFixed(1)}%
                        </span>
                      )}
                      {!layer.hasThumbnail && (
                        <span className={styles.layerCard__noThumb}>Нет превью</span>
                      )}
                    </div>
                    <div className={styles.layerCard__actions}>
                      <button
                        className={`${styles.iconBtn} ${layer.visible ? styles['iconBtn--active'] : ''}`}
                        onClick={() => toggleLayerVisibility(layer.id)}
                        title={layer.visible ? 'Скрыть' : 'Показать'}
                      >
                        {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles['iconBtn--danger']}`}
                        onClick={() => removeActiveLayer(layer.id)}
                        title="Удалить"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Opacity slider */}
                  <div className={styles.layerCard__opacity}>
                    <span className={styles.opacityLabel}>
                      Непрозрачность {Math.round((layer.opacity ?? 0.85) * 100)}%
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round((layer.opacity ?? 0.85) * 100)}
                      onChange={(e) =>
                        updateLayerOpacity(layer.id, Number(e.target.value) / 100)
                      }
                      className={styles.slider}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className={styles.hint}>
              Слои отображаются как геопривязанные превью. RAW-данные могут требовать авторизацию NASA Earthdata.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HLSControls;
