import { useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Flame,
  Layers,
  Map,
  RotateCcw,
  Satellite,
  Sparkles,
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

const PresetsControls = () => {
  const [lastApplied, setLastApplied] = useState('');
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
    setFireStartDate(getDaysAgo(7));
    setFireEndDate(formatDate(new Date()));
    setConfidenceFilter(30);
    resetFilters();
    ensureFireLayer();
    ensureBoundaries({ regions: true });
    setDateHasChanged();
    fitKazakhstan();
    setLastApplied('Пожарный мониторинг');
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
    setLastApplied('Инфраструктура реагирования');
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
    setLastApplied('Оценка пожарного риска');
  };

  const applySatelliteWorkspace = () => {
    ensureBoundaries({ country: true, regions: true });
    setTabIndex(3);
    fitKazakhstan();
    setLastApplied('Космоснимки и AOI');
  };

  const applyCleanMap = () => {
    if (fireLayerVisible) setFireLayerVisible();
    setRiskVisible(false);
    setInfrastructureVisibility(layers.map((layer) => layer.id), false);
    if (adminVisibility.country_boundaries) changeFirst();
    if (adminVisibility.region_boundaries) changeSecond();
    if (adminVisibility.district_boundaries) changeThird();
    resetFilters();
    flyDefault();
    setLastApplied('Чистая карта');
  };

  const presets = [
    {
      id: 'fire-monitoring',
      title: 'Пожарный мониторинг',
      description: 'Горячие точки за последние 7 дней, фильтр достоверности от 30%, границы областей.',
      meta: 'FIRMS, фильтры, регионы',
      badge: 'Оперативно',
      icon: Flame,
      action: applyFireMonitoring,
    },
    {
      id: 'emergency-infrastructure',
      title: 'Инфраструктура реагирования',
      description: 'Пожарные части, гидранты, больницы, спасательные службы, авиация и пункты сбора.',
      meta: 'КЧС объекты, регионы',
      badge: 'Слои',
      icon: Building2,
      action: applyEmergencyInfrastructure,
    },
    {
      id: 'risk-overview',
      title: 'Оценка пожарного риска',
      description: 'Включает слой риска на текущую дату вместе с горячими точками и областными границами.',
      meta: 'Риск, hotspots, обзор',
      badge: 'Анализ',
      icon: AlertTriangle,
      action: applyRiskOverview,
    },
    {
      id: 'satellite-workspace',
      title: 'Космоснимки и AOI',
      description: 'Переход к снимкам с включенными базовыми границами для быстрого выбора AOI.',
      meta: 'Sentinel, Landsat, MODIS',
      badge: 'Снимки',
      icon: Satellite,
      action: applySatelliteWorkspace,
    },
    {
      id: 'clean-map',
      title: 'Чистая карта',
      description: 'Скрывает пожарные точки, риск, инфраструктуру и административные границы.',
      meta: 'Быстрый сброс вида',
      badge: 'Reset',
      icon: RotateCcw,
      action: applyCleanMap,
      danger: true,
    },
  ];

  return (
    <div className="fire-controls">
      <div className="fire-controls__header">
        <div className="fire-controls__toggle">
          <div className="fire-controls__toggle-icon">
            <Sparkles size={16} className="fire-controls__icon-active" />
          </div>
          <span className="fire-controls__toggle-label">Пресеты</span>
        </div>
      </div>

      <div className="fire-controls__content">
        <div className={styles.presets}>
          <div className={styles.intro}>
            <h3 className={styles.introTitle}>
              <Map size={15} />
              Быстрые сценарии карты
            </h3>
            <p className={styles.introText}>
              Пресеты включают уже существующие слои, фильтры и обзор карты для частых рабочих сценариев.
            </p>
          </div>

          <div className={styles.grid}>
            {presets.map(({ id, title, description, meta, badge, icon: Icon, action, danger }) => (
              <div key={id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.icon}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <div className={styles.titleRow}>
                      <h4 className={styles.title}>{title}</h4>
                      <span className={styles.badge}>{badge}</span>
                    </div>
                    <p className={styles.description}>{description}</p>
                  </div>
                </div>

                <div className={styles.actions}>
                  <span className={styles.meta}>{meta}</span>
                  <button
                    type="button"
                    className={`${styles.button} ${danger ? styles.buttonDanger : ''}`}
                    onClick={action}
                  >
                    <Layers size={13} />
                    Применить
                  </button>
                </div>
              </div>
            ))}
          </div>

          {lastApplied && (
            <div className={styles.status}>
              <CheckCircle2 size={14} />
              Применен пресет: {lastApplied}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PresetsControls;
