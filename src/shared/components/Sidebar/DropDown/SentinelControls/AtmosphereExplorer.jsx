import { useMemo, useState } from 'react';
import {
  Calendar,
  Database,
  Eye,
  EyeOff,
  Info,
  Layers,
  Plus,
  Sliders,
  Trash2,
  Wind,
} from 'lucide-react';

import useAtmosphereStore from 'src/app/store/atmosphereStore';
import { getCurrentDate } from 'src/shared/utils/dateDefaults';
import {
  ATMOSPHERE_VISUAL_LAYERS,
  GIBS_SOURCE,
  createAtmosphereMapLayer,
  getAtmosphereLayerColor,
} from 'src/utils/atmosphereSearchService';

import styles from './SentinelExplorer.module.scss';
import '../Controls/FireControls/fireControls.scss';

const categories = Array.from(new Set(ATMOSPHERE_VISUAL_LAYERS.map((layer) => layer.category)));

const AtmosphereExplorer = () => {
  const store = useAtmosphereStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const selectedLayer = useMemo(
    () => ATMOSPHERE_VISUAL_LAYERS.find((layer) => layer.id === store.selectedProduct) || ATMOSPHERE_VISUAL_LAYERS[0],
    [store.selectedProduct]
  );

  const groupedLayers = useMemo(
    () => categories.map((category) => ({
      category,
      layers: ATMOSPHERE_VISUAL_LAYERS.filter((layer) => layer.category === category),
    })),
    []
  );

  const handleAddLayer = () => {
    const layer = createAtmosphereMapLayer({
      layerId: selectedLayer.id,
      date: store.selectedDate,
      opacity: store.globalOpacity,
    });

    store.addActiveLayer(layer);
    store.setActiveTab('layers');
  };

  const handleOpacityChange = (layerId, value) => {
    store.updateLayerOpacity(layerId, Number(value));
  };

  return (
    <div className="fire-controls">
      <div className="fire-controls__header">
        <div className="fire-controls__toggle" onClick={() => setIsExpanded((value) => !value)}>
          <div className="fire-controls__toggle-icon">
            <Wind size={16} className="fire-controls__icon-active" />
          </div>
          <span className="fire-controls__toggle-label">Atmosphere & Emissions</span>
          {store.activeLayers.length > 0 && (
            <span className="drought-panel__status drought-panel__status--active">
              {store.activeLayers.length}
            </span>
          )}
        </div>
        <button
          type="button"
          className={`fire-controls__expand-btn ${isExpanded ? 'fire-controls__expand-btn--expanded' : ''}`}
          onClick={() => setIsExpanded((value) => !value)}
          aria-expanded={isExpanded}
          title="Atmosphere controls"
        >
          <Sliders size={14} />
        </button>
      </div>

      {isExpanded && (
        <div className={styles.explorer}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${store.activeTab === 'search' ? styles['tab--active'] : ''}`}
              onClick={() => store.setActiveTab('search')}
            >
              <Database size={14} /> Catalog
            </button>
            <button
              type="button"
              className={`${styles.tab} ${store.activeTab === 'layers' ? styles['tab--active'] : ''}`}
              onClick={() => store.setActiveTab('layers')}
            >
              <Layers size={14} /> Layers
              {store.activeLayers.length > 0 && (
                <span className={styles.badge}>{store.activeLayers.length}</span>
              )}
            </button>
          </div>

          <div className={styles.content}>
            {store.activeTab === 'search' && (
              <div className={styles.searchSection}>
                <div className={styles.infoBox} style={{
                  padding: '0.6rem',
                  background: 'rgba(136, 139, 224, 0.08)',
                  border: '1px solid rgba(136, 139, 224, 0.16)',
                  borderRadius: '6px',
                  fontSize: '0.68rem',
                  color: 'rgba(217, 218, 245, 0.66)',
                  lineHeight: 1.45,
                }}>
                  <Info size={12} style={{ float: 'left', marginRight: '0.4rem', color: '#888be0' }} />
                  Adds live NASA GIBS WMS visualization layers to the map. Sources are bounded to Kazakhstan in MapLibre and include methane, CO, NO2, SO2, and aerosol layers.
                </div>

                <div>
                  <div className={styles.sectionTitle}>
                    <Wind size={12} /> API visualization layer
                  </div>
                  <div className={styles.resultsList}>
                    {groupedLayers.map((group) => (
                      <div key={group.category}>
                        <div className={styles.totalCount} style={{ margin: '0.35rem 0' }}>
                          {group.category}
                        </div>
                        {group.layers.map((layer) => {
                          const isSelected = layer.id === store.selectedProduct;
                          return (
                            <button
                              key={layer.id}
                              type="button"
                              className={styles.resultCard}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                cursor: 'pointer',
                                borderColor: isSelected ? 'rgba(136, 139, 224, 0.38)' : undefined,
                                background: isSelected ? 'rgba(136, 139, 224, 0.08)' : undefined,
                              }}
                              onClick={() => store.setSelectedProduct(layer.id)}
                            >
                              <div className={styles.cardMain}>
                                <div className={styles.cardThumb}>
                                  <div className={styles.cardNoThumb}>
                                    <span
                                      style={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: 4,
                                        background: layer.color,
                                        display: 'block',
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className={styles.cardBody}>
                                  <div className={styles.cardTopRow}>
                                    <span className={styles.cardDate}>{layer.label}</span>
                                    <span className={styles.missionBadge} style={{ background: layer.color }}>
                                      {layer.gas}
                                    </span>
                                  </div>
                                  <div className={styles.cardMeta}>
                                    <span className={styles.cardType}>{layer.provider}</span>
                                    <span className={styles.cardType}>{layer.cadence}</span>
                                  </div>
                                  <div className={styles.cardType}>{layer.description}</div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.dateRow}>
                  <div className={styles.field}>
                    <label className={styles.label}>
                      <Calendar size={12} /> Date
                    </label>
                    <input
                      type="date"
                      value={store.selectedDate}
                      onChange={(event) => store.setSelectedDate(event.target.value)}
                      max={getCurrentDate()}
                      className={styles.dateInput}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>
                      <Sliders size={12} /> Opacity
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={store.globalOpacity}
                      onChange={(event) => store.setGlobalOpacity(Number(event.target.value))}
                      className={styles.slider}
                    />
                    <span className={styles.opacityLabel}>{store.globalOpacity}%</span>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.searchBtn}
                  onClick={handleAddLayer}
                  disabled={!selectedLayer || !store.selectedDate}
                >
                  <Plus size={15} />
                  Add {selectedLayer?.gas || 'layer'} to Map
                </button>

                <div className={styles.aoiInfo}>
                  <Database size={11} />
                  <span>
                    Source: <a href={GIBS_SOURCE.url} target="_blank" rel="noreferrer">NASA GIBS WMS</a>
                  </span>
                </div>
              </div>
            )}

            {store.activeTab === 'layers' && (
              <div className={styles.layersSection}>
                {store.activeLayers.length === 0 ? (
                  <div className={styles.emptyLayers}>
                    <Layers size={28} />
                    <div>No active atmosphere layers</div>
                  </div>
                ) : (
                  <>
                    <div className={styles.layersHeader}>
                      <span className={styles.totalCount}>
                        {store.activeLayers.length} API layers on map
                      </span>
                      <button
                        type="button"
                        className={styles.clearBtn}
                        onClick={() => store.clearActiveLayers()}
                      >
                        <Trash2 size={13} /> Clear
                      </button>
                    </div>

                    <div className={styles.layersList}>
                      {store.activeLayers.map((layer) => (
                        <div key={layer.id} className={styles.layerCard}>
                          <div className={styles.layerTop}>
                            <div className={styles.layerInfo}>
                              <div className={styles.layerName}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    width: 8,
                                    height: 8,
                                    borderRadius: 2,
                                    marginRight: 6,
                                    background: getAtmosphereLayerColor(layer.gibsLayerId),
                                  }}
                                />
                                {layer.name}
                              </div>
                              <div className={styles.layerDate}>
                                {layer.date} / {layer.provider}
                              </div>
                            </div>

                            <div className={styles.layerActions}>
                              <button
                                type="button"
                                className={`${styles.layerActionBtn} ${layer.visible ? styles['layerActionBtn--active'] : ''}`}
                                onClick={() => store.toggleLayerVisibility(layer.id)}
                                title={layer.visible ? 'Hide layer' : 'Show layer'}
                              >
                                {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                              </button>
                              <button
                                type="button"
                                className={`${styles.layerActionBtn} ${styles['layerActionBtn--danger']}`}
                                onClick={() => store.removeActiveLayer(layer.id)}
                                title="Remove layer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          <div className={styles.layerOpacity}>
                            <span className={styles.opacityLabel}>
                              Opacity {layer.opacity}%
                            </span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={layer.opacity}
                              onChange={(event) => handleOpacityChange(layer.id, event.target.value)}
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
