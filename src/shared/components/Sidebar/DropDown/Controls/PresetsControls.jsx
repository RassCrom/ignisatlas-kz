import { useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Flame,
  Layers,
  Leaf,
  PanelTop,
  RotateCcw,
  Satellite,
  Sparkles,
  Thermometer,
  Waves,
} from 'lucide-react';

import useAdminBoundaryStore from 'src/app/store/adminBoundaryStore';
import useFireStore from 'src/app/store/fireStore';
import useMenuStore from 'src/app/store/store';
import { useLayersStore } from 'src/app/store/layersStore';
import useRiskMapStore from 'src/app/store/riskMapStore';
import { getMapInstance } from 'src/modules/MapPage/services/mapService';
import { DEFAULT_POSITION, KAZAKHSTAN_EXTENT_GEO } from 'src/modules/MapPage/utils/mapConstants';

import styles from './PresetsControls.module.scss';

const formatDate = (date) => date.toISOString().split('T')[0];

const getDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDate(date);
};

const fitKazakhstan = () => {
  const map = getMapInstance();
  if (!map) return;
  map.fitBounds(
    [
      [KAZAKHSTAN_EXTENT_GEO[0], KAZAKHSTAN_EXTENT_GEO[1]],
      [KAZAKHSTAN_EXTENT_GEO[2], KAZAKHSTAN_EXTENT_GEO[3]],
    ],
    { padding: 56, duration: 550, maxZoom: 6 }
  );
};

const flyDefault = () => {
  const map = getMapInstance();
  if (!map) return;
  map.flyTo({ ...DEFAULT_POSITION, duration: 550 });
};

const applyWindowConfidenceFilter = (value) => {
  if (typeof window === 'undefined') return;
  window.fireLayerInstance?.filterByConfidence(value);
};

const PRESET_TABS = [
  { id: 'operations',  label: 'Пожары',      icon: Flame },
  { id: 'environment', label: 'Природа',      icon: Leaf },
  { id: 'response',    label: 'Реагирование', icon: Building2 },
  { id: 'workspace',   label: 'Рабочая',      icon: PanelTop },
];

const PRESETS = [
  {
    id: 'fire-monitoring',
    tabId: 'operations',
    title: 'Пожарный мониторинг',
    description: 'Горячие точки за последние 7 дней, фильтр достоверности от 30%, границы областей.',
    meta: 'FIRMS, фильтры, регионы',
    badge: 'Оперативно',
    icon: Flame,
    actionId: 'fireMonitoring',
  },
  {
    id: 'risk-overview',
    tabId: 'operations',
    title: 'Оценка пожарного риска',
    description: 'Включает слой риска на текущую дату вместе с горячими точками и областными границами.',
    meta: 'Риск, hotspots, обзор',
    badge: 'Анализ',
    icon: AlertTriangle,
    actionId: 'riskOverview',
  },
  {
    id: 'emergency-infrastructure',
    tabId: 'response',
    title: 'Инфраструктура реагирования',
    description: 'Пожарные части, гидранты, больницы, спасательные службы, авиация и пункты сбора.',
    meta: 'КЧС объекты, регионы',
    badge: 'Слои',
    icon: Building2,
    actionId: 'emergencyInfrastructure',
  },
  {
    id: 'satellite-workspace',
    tabId: 'workspace',
    title: 'Космоснимки и AOI',
    description: 'Переход к снимкам с включенными базовыми границами для быстрого выбора AOI.',
    meta: 'Sentinel, Landsat, MODIS',
    badge: 'Снимки',
    icon: Satellite,
    actionId: 'satelliteWorkspace',
  },
  {
    id: 'clean-map',
    tabId: 'workspace',
    title: 'Чистая карта',
    description: 'Скрывает пожарные точки, риск, инфраструктуру и административные границы.',
    meta: 'Быстрый сброс вида',
    badge: 'Reset',
    icon: RotateCcw,
    actionId: 'cleanMap',
    danger: true,
  },
  {
    id: 'water-monitoring',
    tabId: 'environment',
    title: 'Водный мониторинг',
    description: 'Включает слой водных объектов Казахстана и спутниковый мониторинг поверхностных вод.',
    meta: 'MNDWI, NDWI, водоёмы',
    badge: 'Вода',
    icon: Waves,
    actionId: 'waterMonitoring',
  },
  {
    id: 'drought-overview',
    tabId: 'environment',
    title: 'Мониторинг засухи',
    description: 'Слои засушливости (NDVI, SPI, PDSI) и прогноз засухи для территории Казахстана.',
    meta: 'Засуха, индексы, NDVI',
    badge: 'Засуха',
    icon: Thermometer,
    actionId: 'droughtOverview',
  },
  {
    id: 'peatlands-overview',
    tabId: 'environment',
    title: 'Торфяники и заповедники',
    description: 'Показывает слои торфяных болот и особо охраняемых природных территорий Казахстана.',
    meta: 'ООПТ, торфяники',
    badge: 'Экология',
    icon: Leaf,
    actionId: 'peatlandsOverview',
  },
];

/* ── Tab pill ─────────────────────────────────────────────── */
const PresetTabs = ({ activeTabId, onChange }) => (
  <div className={styles.tabs} role="tablist" aria-label="Категории пресетов">
    {PRESET_TABS.map(({ id, label, icon: Icon }) => (
      <button
        key={id}
        type="button"
        id={`preset-tab-${id}`}
        className={`${styles.tab} ${activeTabId === id ? styles.tabActive : ''}`}
        onClick={() => onChange(id)}
        role="tab"
        aria-selected={activeTabId === id}
        aria-controls={`preset-panel-${id}`}
      >
        <Icon size={13} />
        <span>{label}</span>
      </button>
    ))}
  </div>
);

/* ── Mission card ─────────────────────────────────────────── */
const PresetCard = ({ preset, isActive, onApply }) => {
  const { title, description, badge, icon: Icon, danger } = preset;

  return (
    <article
      className={`${styles.card} ${isActive ? styles.cardActive : ''} ${danger ? styles.cardDanger : ''}`}
    >
      <div className={styles.cardPattern} aria-hidden="true" />

      <span className={`${styles.badge} ${danger ? styles.badgeDanger : ''}`}>{badge}</span>

      <div className={`${styles.cardIcon} ${danger ? styles.cardIconDanger : ''}`}>
        <div className={`${styles.iconGlow} ${danger ? styles.iconGlowDanger : ''}`} aria-hidden="true" />
        <Icon size={16} />
      </div>

      <h4 className={styles.title}>{title}</h4>
      <p className={styles.description}>{description}</p>

      <button
        type="button"
        className={`${styles.applyBtn} ${danger ? styles.applyBtnDanger : ''}`}
        onClick={() => onApply(preset)}
      >
        <Layers size={12} />
        Применить
      </button>
    </article>
  );
};

/* ── Main component ───────────────────────────────────────── */
const PresetsControls = () => {
  const [activeTabId, setActiveTabId] = useState(PRESET_TABS[0].id);
  const [lastApplied, setLastApplied] = useState(null);
  const setTabIndex = useMenuStore((state) => state.setTabIndex);

  const fireLayerVisible = useFireStore((state) => state.fireLayerVisible);
  const setFireLayerVisible = useFireStore((state) => state.setFireLayerVisible);
  const setFireStartDate = useFireStore((state) => state.setFireStartDate);
  const setFireEndDate = useFireStore((state) => state.setFireEndDate);
  const setDateHasChanged = useFireStore((state) => state.setDateHasChanged);
  const setConfidenceFilter = useFireStore((state) => state.setConfidenceFilter);
  const resetFilters = useFireStore((state) => state.resetFilters);

  const adminVisibility = useAdminBoundaryStore((state) => state.layerVisibility);
  const changeFirst = useAdminBoundaryStore((state) => state.changeFirst);
  const changeSecond = useAdminBoundaryStore((state) => state.changeSecond);
  const changeThird = useAdminBoundaryStore((state) => state.changeThird);

  const layers = useLayersStore((state) => state.layers);
  const updateLayer = useLayersStore((state) => state.updateLayer);

  const riskDates = useRiskMapStore((state) => state.riskDates);
  const setRiskVisible = useRiskMapStore((state) => state.setIsVisible);
  const addRiskDate = useRiskMapStore((state) => state.addDate);

  const ensureFireLayer = () => {
    if (!fireLayerVisible) setFireLayerVisible();
  };

  const ensureBoundaries = ({ country = false, regions = false, districts = false } = {}) => {
    if (country && !adminVisibility.country_boundaries) changeFirst();
    if (regions && !adminVisibility.region_boundaries) changeSecond();
    if (districts && !adminVisibility.district_boundaries) changeThird();
  };

  const setInfrastructureVisibility = (ids, visible) => {
    ids.forEach((id) => updateLayer(id, { visible }));
  };

  const applyFireMonitoring = () => {
    resetFilters();
    setFireStartDate(getDaysAgo(7));
    setFireEndDate(formatDate(new Date()));
    setConfidenceFilter(30);
    applyWindowConfidenceFilter(30);
    ensureFireLayer();
    ensureBoundaries({ regions: true });
    setDateHasChanged();
    fitKazakhstan();
  };

  const applyEmergencyInfrastructure = () => {
    setInfrastructureVisibility([
      'fire_departments',
      'fire_hydrants',
      'hospitals',
      'ava_ss',
      'kaz_avia',
      'ps',
    ], true);
    ensureBoundaries({ regions: true });
    fitKazakhstan();
  };

  const applyRiskOverview = () => {
    const today = formatDate(new Date());
    if (!riskDates.some((item) => item.date === today)) {
      addRiskDate(today);
    }
    setRiskVisible(true);
    ensureFireLayer();
    ensureBoundaries({ regions: true });
    fitKazakhstan();
  };

  const applySatelliteWorkspace = () => {
    ensureBoundaries({ country: true, regions: true });
    setTabIndex(3);
    fitKazakhstan();
  };

  const applyCleanMap = () => {
    if (fireLayerVisible) setFireLayerVisible();
    setConfidenceFilter(0);
    applyWindowConfidenceFilter(0);
    setRiskVisible(false);
    setInfrastructureVisibility(layers.map((layer) => layer.id), false);
    if (adminVisibility.country_boundaries) changeFirst();
    if (adminVisibility.region_boundaries) changeSecond();
    if (adminVisibility.district_boundaries) changeThird();
    resetFilters();
    flyDefault();
  };

  const applyWaterMonitoring = () => {
    setInfrastructureVisibility(['water_bodies', 'glacier_inventory'], true);
    ensureBoundaries({ regions: true });
    fitKazakhstan();
    setTabIndex(2);
  };

  const applyDroughtOverview = () => {
    setInfrastructureVisibility(['drought_indices', 'drought_forecast'], true);
    ensureBoundaries({ regions: true });
    fitKazakhstan();
    setTabIndex(2);
  };

  const applyPeatlandsOverview = () => {
    setInfrastructureVisibility(['peatlands', 'protected_area_boundaries'], true);
    ensureBoundaries({ country: true });
    fitKazakhstan();
    setTabIndex(1);
  };

  const actions = {
    fireMonitoring: applyFireMonitoring,
    emergencyInfrastructure: applyEmergencyInfrastructure,
    riskOverview: applyRiskOverview,
    satelliteWorkspace: applySatelliteWorkspace,
    cleanMap: applyCleanMap,
    waterMonitoring: applyWaterMonitoring,
    droughtOverview: applyDroughtOverview,
    peatlandsOverview: applyPeatlandsOverview,
  };

  const activeTab = PRESET_TABS.find((tab) => tab.id === activeTabId) || PRESET_TABS[0];
  const activePresets = PRESETS.filter((preset) => preset.tabId === activeTab.id);

  const handleApplyPreset = (preset) => {
    actions[preset.actionId]?.();
    setLastApplied({ id: preset.id, title: preset.title });
  };

  return (
    <div className="fire-controls">
      <div className="fire-controls__header">
        <div className="fire-controls__toggle">
          <div className="fire-controls__toggle-icon">
            <Sparkles size={16} className="fire-controls__icon-active" />
          </div>
          <span className="fire-controls__toggle-label">Пресеты</span>
          <span className={styles.headerCount}>{PRESETS.length}</span>
        </div>
      </div>

      <div className="fire-controls__content">
        <div className={styles.presets}>
          <PresetTabs activeTabId={activeTab.id} onChange={setActiveTabId} />

          <div
            id={`preset-panel-${activeTab.id}`}
            className={styles.grid}
            role="tabpanel"
            aria-labelledby={`preset-tab-${activeTab.id}`}
          >
            {activePresets.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                isActive={lastApplied?.id === preset.id}
                onApply={handleApplyPreset}
              />
            ))}
          </div>

          {lastApplied && (
            <div className={styles.status} role="status" aria-live="polite">
              <CheckCircle2 size={13} />
              {lastApplied.title}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PresetsControls;
