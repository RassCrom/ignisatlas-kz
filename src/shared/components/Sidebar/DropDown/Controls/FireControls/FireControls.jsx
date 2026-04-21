import { useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import useFireStore from "src/app/store/fireStore";
import {
  Flame,
  Calendar,
  Sliders,
  Eye,
  EyeOff,
  MapPin,
  Filter,
  RefreshCw,
  BarChart3,
  X,
  Activity,
  Target,
  AlertTriangle,
  Download,
  Map,
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import './fireControls.scss';
import MapFireControls from './MapFireControls/MapFireControls';
import LinearDateChooser from './LinearDateChooser';

const MAX_DAYS = 31;

const QUICK_PRESETS = [
  { label: 'Сегодня', days: 0 },
  { label: '3 дня',   days: 3 },
  { label: 'Неделя',  days: 7 },
  { label: 'Месяц',   days: 30 },
];

const FireControls = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasDateChanges, setHasDateChanges] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [areaTypeFilter, setAreaTypeFilter] = useState('all');

  const {
    setFireLayerVisible,
    fireLayerVisible,
    fireStartDate,
    fireEndDate,
    setFireStartDate,
    setFireEndDate,
    fireLength,
    setDateHasChanged,
    avgIntensity,
    totalTechnogenicFires,
    totalNaturalFires,
    firesBySatellite,
    avgConfidence,
    firesByConfidence,
    firesByRegion,
    newFiresSinceLastDay,
    setShowTechnogenicOnly,
    selectedRegions,
    setSelectedRegions,
    setShowNaturalOnly,
    selectedModel,
    setSelectedModel,
    firesByModel,
    confidenceFilter,
    setConfidenceFilter,
    confidenceFilterTimeout,
    setConfidenceFilterTimeout,
  } = useFireStore();

  const today = new Date().toISOString().split('T')[0];
  const lastWeek = new Date(Date.now() - 7 * 864e5).toISOString().split('T')[0];

  /* ── Helpers ─────────────────────────────────────────── */

  const getMaxEndDate = useCallback(() => {
    if (!fireStartDate) return today;
    const max = new Date(fireStartDate);
    max.setDate(max.getDate() + MAX_DAYS);
    return (max < new Date(today) ? max : new Date(today)).toISOString().split('T')[0];
  }, [fireStartDate, today]);

  const getRiskColor = (level) => {
    const num = parseFloat(level);
    if (!isNaN(num)) {
      if (num >= 70) return '#ef4444';
      if (num >= 30) return '#f59e0b';
      return '#10b981';
    }
    switch (level) {
      case 'Low':     return '#10b981';
      case 'Medium':  return '#f59e0b';
      case 'High':    return '#ef4444';
      case 'Extreme': return '#dc2626';
      default:        return '#6b7280';
    }
  };

  /* ── Handlers ────────────────────────────────────────── */

  const handleToggleLayer = useCallback(() => {
    setFireLayerVisible();
  }, [setFireLayerVisible]);

  const handleStartDateChange = useCallback((e) => {
    const newStart = e.target.value;
    setFireStartDate(newStart);
    if (fireEndDate) {
      const diff = (new Date(fireEndDate) - new Date(newStart)) / 864e5;
      if (diff > MAX_DAYS) {
        const clamped = new Date(newStart);
        clamped.setDate(clamped.getDate() + MAX_DAYS);
        setFireEndDate(clamped.toISOString().split('T')[0]);
      }
    }
    setHasDateChanges(true);
  }, [fireEndDate, setFireStartDate, setFireEndDate]);

  const handleEndDateChange = useCallback((e) => {
    const newEnd = e.target.value;
    setFireEndDate(newEnd);
    if (fireStartDate) {
      const diff = (new Date(newEnd) - new Date(fireStartDate)) / 864e5;
      if (diff > MAX_DAYS) {
        const clamped = new Date(newEnd);
        clamped.setDate(clamped.getDate() - MAX_DAYS);
        setFireStartDate(clamped.toISOString().split('T')[0]);
      }
    }
    setHasDateChanges(true);
  }, [fireStartDate, setFireStartDate, setFireEndDate]);

  const handleUpdateData = useCallback(() => {
    setDateHasChanged();
    if (!fireLayerVisible) setFireLayerVisible();
    setHasDateChanges(false);
  }, [setDateHasChanged, setFireLayerVisible, fireLayerVisible]);

  const handleQuickPreset = useCallback((days) => {
    const endStr = new Date().toISOString().split('T')[0];
    const startStr = days === 0
      ? endStr
      : new Date(Date.now() - days * 864e5).toISOString().split('T')[0];
    setFireStartDate(startStr);
    setFireEndDate(endStr);
    setHasDateChanges(true);
  }, [setFireStartDate, setFireEndDate]);

  const handleAreaTypeChange = useCallback((value) => {
    setAreaTypeFilter(value);
    if (value === 'nature') {
      setShowNaturalOnly(true);
      setShowTechnogenicOnly(false);
    } else if (value === 'urban') {
      setShowNaturalOnly(false);
      setShowTechnogenicOnly(true);
    } else {
      setShowNaturalOnly(false);
      setShowTechnogenicOnly(false);
    }
  }, [setShowNaturalOnly, setShowTechnogenicOnly]);

  const handleConfidenceChange = useCallback((value) => {
    setConfidenceFilter(value);
    if (confidenceFilterTimeout) clearTimeout(confidenceFilterTimeout);
    const t = setTimeout(() => {
      if (window.fireLayerInstance) window.fireLayerInstance.filterByConfidence(value);
    }, 300);
    setConfidenceFilterTimeout(t);
  }, [confidenceFilterTimeout, setConfidenceFilter, setConfidenceFilterTimeout]);

  const handleResetFilters = useCallback(() => {
    setAreaTypeFilter('all');
    setShowNaturalOnly(false);
    setShowTechnogenicOnly(false);
    setSelectedModel(null);
    setSelectedRegions([]);
    setConfidenceFilter(0);
    if (window.fireLayerInstance) window.fireLayerInstance.filterByConfidence(0);
  }, [setShowNaturalOnly, setShowTechnogenicOnly, setSelectedModel, setSelectedRegions, setConfidenceFilter]);

  const handleShowStats = useCallback(() => {
    setIsLoadingStats(true);
    setTimeout(() => { setIsLoadingStats(false); setShowStats(true); }, 400);
  }, []);

  const handleExportData = useCallback(() => {
    const data = {
      fireData: { totalFires: fireLength, avgIntensity, avgConfidence },
      exportDate: new Date().toISOString(),
      dateRange: { start: fireStartDate, end: fireEndDate },
    };
    const dataStr = JSON.stringify(data, null, 2);
    const uri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.setAttribute('href', uri);
    link.setAttribute('download', `fire_data_${today}.json`);
    link.click();
  }, [fireLength, avgIntensity, avgConfidence, fireStartDate, fireEndDate, today]);

  /* ── Derived stats ───────────────────────────────────── */

  const fireStats = useMemo(() => ({
    totalFires: fireLength,
    riskLevel: avgConfidence,
    satelliteDistribution: {
      'Terra':     firesBySatellite['Terra'],
      'Aqua':      firesBySatellite['Aqua'],
      'NOAA-20':   firesBySatellite['NOAA-20'],
      'Suomi NPP': firesBySatellite['Suomi NPP'],
    },
    fireTypes: {
      natural:     totalNaturalFires,
      technogenic: totalTechnogenicFires,
    },
    confidenceDistribution: {
      high:   firesByConfidence['High'],
      medium: firesByConfidence['Medium'],
      low:    firesByConfidence['Low'],
    },
    timeAnalysis: { newFires24h: newFiresSinceLastDay },
  }), [
    fireLength, avgConfidence,
    firesBySatellite, totalNaturalFires, totalTechnogenicFires,
    firesByConfidence, newFiresSinceLastDay,
  ]);

  const activeFilterCount = [
    confidenceFilter > 0,
    areaTypeFilter !== 'all',
    selectedModel !== null,
    selectedRegions.length > 0,
  ].filter(Boolean).length;

  /* ── Activity summary side panel (portal) ────────────── */

  const activityPanel = isExpanded && createPortal(
    <div className="fire-activity-panel">
      <div className="fire-activity-panel__header">
        <span className="fire-activity-panel__title">
          <Activity size={13} />
          Сводка активности
        </span>
      </div>

      <div className="fire-activity-panel__stats">
        <div className="fire-activity-panel__stat">
          <span className="fire-activity-panel__stat-value">{fireLength}</span>
          <span className="fire-activity-panel__stat-label">Точек</span>
        </div>
        <div className="fire-activity-panel__divider" />
        <div className="fire-activity-panel__stat">
          <span className="fire-activity-panel__stat-value fire-activity-panel__stat-value--nature">
            {fireStats.fireTypes.natural}
          </span>
          <span className="fire-activity-panel__stat-label">Природные</span>
        </div>
        <div className="fire-activity-panel__divider" />
        <div className="fire-activity-panel__stat">
          <span className="fire-activity-panel__stat-value fire-activity-panel__stat-value--tech">
            {fireStats.fireTypes.technogenic}
          </span>
          <span className="fire-activity-panel__stat-label">Техногенные</span>
        </div>
      </div>

      <div className="fire-activity-panel__actions">
        <button
          className="fire-activity-panel__btn fire-activity-panel__btn--primary"
          onClick={handleShowStats}
          disabled={isLoadingStats}
        >
          {isLoadingStats
            ? <RefreshCw size={13} className="fire-controls__spinning" />
            : <BarChart3 size={13} />}
          {isLoadingStats ? 'Загрузка...' : 'Подробнее'}
        </button>
        <button
          className="fire-activity-panel__btn"
          onClick={handleExportData}
          title="Экспорт данных"
        >
          <Download size={13} />
        </button>
      </div>
    </div>,
    document.body
  );

  /* ── Render ──────────────────────────────────────────── */
  return (
    <>
      <div className="fire-controls">

        {/* ── Header ── */}
        <div className="fire-controls__header">
          <div className="fire-controls__toggle" onClick={handleToggleLayer}>
            <div className="fire-controls__toggle-icon">
              {fireLayerVisible
                ? <Eye size={16} className="fire-controls__icon-active" />
                : <EyeOff size={16} className="fire-controls__icon-inactive" />}
            </div>
            <span className="fire-controls__toggle-label">
              Слой пожарных точек
            </span>
            {fireLength > 0 && (
              <span className="fire-controls__count-badge">{fireLength}</span>
            )}
            <Flame
              size={16}
              className={`fire-controls__flame-icon ${fireLayerVisible ? 'fire-controls__flame-icon--active' : ''}`}
            />
          </div>

          <button
            className={`fire-controls__expand-btn ${isExpanded ? 'fire-controls__expand-btn--expanded' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Sliders size={14} />
          </button>
        </div>

        {/* ── Expanded panel (inline in sidebar) ── */}
        {isExpanded && (
          <div className="fire-controls__content">

            {/* Date range */}
            <div className="fire-controls__section">
              <label className="fire-controls__label">
                <Calendar size={12} />
                Диапазон дат (макс. {MAX_DAYS} дн.)
              </label>

              {/* Quick presets */}
              <div className="fire-controls__seg-group" style={{ marginBottom: '8px' }}>
                {QUICK_PRESETS.map(({ label, days }) => (
                  <button
                    key={label}
                    className="fire-controls__seg-btn"
                    onClick={() => handleQuickPreset(days)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="fire-controls__date-inputs">
                <input
                  type="date"
                  value={fireStartDate || lastWeek}
                  onChange={handleStartDateChange}
                  max={today}
                  className="fire-controls__date-input"
                />
                <span className="fire-controls__date-separator">—</span>
                <input
                  type="date"
                  value={fireEndDate || today}
                  onChange={handleEndDateChange}
                  min={fireStartDate || lastWeek}
                  max={getMaxEndDate()}
                  className="fire-controls__date-input"
                />
              </div>
              <div className="fire-controls__buttons">
                <button
                  onClick={handleUpdateData}
                  disabled={!hasDateChanges}
                  className={`fire-controls__update-btn ${hasDateChanges ? 'fire-controls__update-btn--active' : ''}`}
                  title="Загрузить данные за выбранный период"
                >
                  <RefreshCw size={14} />
                  Обновить данные
                </button>
                <button
                  className="fire-controls__update-btn fire-controls__update-btn--active"
                  onClick={() => setShowTimeline(true)}
                  title="Выбрать период на календаре"
                >
                  <History size={14} />
                  Календарь
                </button>
              </div>
            </div>

            {/* ── Filters section ── */}
            <div className="fire-controls__filters">
              <button
                className="fire-controls__filter-toggle"
                onClick={() => setShowFilters(!showFilters)}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Filter size={13} />
                  Фильтры
                  {activeFilterCount > 0 && (
                    <span className="fire-controls__filter-badge">{activeFilterCount}</span>
                  )}
                </span>
                {showFilters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {showFilters && (
                <div className="fire-controls__filter-body">

                  {/* Confidence slider */}
                  <div className="fire-controls__section">
                    <label className="fire-controls__label">
                      <Target size={12} />
                      Достоверность (мин.) — {confidenceFilter}%
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={confidenceFilter}
                      onChange={(e) => handleConfidenceChange(Number(e.target.value))}
                      className="fire-controls__slider"
                    />
                    <div className="fire-controls__confidence-presets">
                      {[0, 30, 70, 90].map((p) => (
                        <button
                          key={p}
                          className={`fire-controls__confidence-preset ${confidenceFilter === p ? 'fire-controls__confidence-preset--active' : ''}`}
                          onClick={() => handleConfidenceChange(p)}
                        >
                          {p}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Area type */}
                  <div className="fire-controls__section">
                    <label className="fire-controls__label">
                      <MapPin size={12} />
                      Тип территории
                    </label>
                    <div className="fire-controls__seg-group">
                      {[
                        { value: 'all',    label: 'Все' },
                        { value: 'nature', label: 'Природные' },
                        { value: 'urban',  label: 'Техногенные' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          className={`fire-controls__seg-btn ${areaTypeFilter === opt.value ? 'fire-controls__seg-btn--active' : ''}`}
                          onClick={() => handleAreaTypeChange(opt.value)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Detection model */}
                  <div className="fire-controls__section">
                    <label className="fire-controls__label">
                      <Activity size={12} />
                      Модель обнаружения
                    </label>
                    <div className="fire-controls__seg-group">
                      {[
                        { value: null, label: 'Все' },
                        { value: 0,    label: 'Модель 0' },
                        { value: 1,    label: 'Модель 1' },
                      ].map((opt) => (
                        <button
                          key={String(opt.value)}
                          className={`fire-controls__seg-btn ${selectedModel === opt.value ? 'fire-controls__seg-btn--active' : ''}`}
                          onClick={() => setSelectedModel(opt.value)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Region filter */}
                  {Object.keys(firesByRegion).length > 0 && (
                    <div className="fire-controls__section">
                      <label className="fire-controls__label">
                        <Map size={12} />
                        Регион
                        {selectedRegions.length > 0 && (
                          <span style={{ marginLeft: 'auto', color: 'rgba(249,115,22,0.9)', fontSize: '10px' }}>
                            {selectedRegions.length} выбр.
                          </span>
                        )}
                      </label>

                      {selectedRegions.length > 0 && (
                        <div className="fire-controls__selected-regions">
                          {selectedRegions.map((r) => (
                            <span key={r} className="fire-controls__selected-tag">
                              {r}
                              <button
                                className="fire-controls__tag-remove"
                                onClick={() => setSelectedRegions(selectedRegions.filter((x) => x !== r))}
                              >
                                <X size={10} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="fire-controls__region-options">
                        {Object.entries(firesByRegion).map(([region, count]) => {
                          const checked = selectedRegions.includes(region);
                          return (
                            <label key={region} className="fire-controls__checkbox">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  setSelectedRegions(
                                    e.target.checked
                                      ? [...selectedRegions, region]
                                      : selectedRegions.filter((r) => r !== region)
                                  );
                                }}
                              />
                              <span className="fire-controls__checkbox-label">
                                {region} <span style={{ color: 'rgba(217,218,245,0.4)', fontSize: '10px' }}>({count})</span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Reset button */}
                  {activeFilterCount > 0 && (
                    <button className="fire-controls__clear-btn" onClick={handleResetFilters}>
                      <X size={11} />
                      Сбросить фильтры
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* ── Activity summary side panel ── */}
      {activityPanel}

      {/* ── Detailed stats modal (portal) ── */}
      {showStats && createPortal(
        <div className="fire-stats-modal">
          <div className="fire-stats-modal__backdrop" onClick={() => setShowStats(false)} />
          <div className="fire-stats-modal__content">

            <div className="fire-stats-modal__header">
              <h2 className="fire-stats-modal__title">
                <Flame size={20} />
                Статистика активности пожаров
              </h2>
              <div className="fire-stats-modal__header-right">
                <span className="fire-stats-modal__date-range">
                  {fireStartDate} — {fireEndDate}
                </span>
                <button className="fire-stats-modal__close" onClick={() => setShowStats(false)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="fire-stats-modal__columns">

              {/* ── Left: map + region ranking ── */}
              <div className="fire-stats-modal__left">
                <div className="fire-stats-modal__map-wrap">
                  <MapFireControls firesByRegion={firesByRegion} />
                </div>
              </div>

              {/* ── Right: stats panels ── */}
              <div className="fire-stats-modal__right">

                {/* Overview 4 cards */}
                <div className="fire-stats-modal__overview">
                  <div className="fire-stats-card">
                    <div className="fire-stats-card__icon fire-stats-card__icon--total">
                      <Flame size={18} />
                    </div>
                    <div className="fire-stats-card__content">
                      <div className="fire-stats-card__value">{fireStats.totalFires}</div>
                      <div className="fire-stats-card__label">Всего точек</div>
                    </div>
                  </div>

                  <div className="fire-stats-card">
                    <div className="fire-stats-card__icon fire-stats-card__icon--confidence">
                      <AlertTriangle size={18} />
                    </div>
                    <div className="fire-stats-card__content">
                      <div
                        className="fire-stats-card__value"
                        style={{ color: getRiskColor(fireStats.riskLevel) }}
                      >
                        {fireStats.riskLevel ? `${fireStats.riskLevel}%` : '—'}
                      </div>
                      <div className="fire-stats-card__label">Ср. достоверность</div>
                    </div>
                  </div>

                  <div className="fire-stats-card">
                    <div className="fire-stats-card__icon fire-stats-card__icon--nature">
                      🌿
                    </div>
                    <div className="fire-stats-card__content">
                      <div className="fire-stats-card__value fire-stats-card__value--nature">
                        {fireStats.fireTypes.natural}
                      </div>
                      <div className="fire-stats-card__label">
                        Природные
                        <span className="fire-stats-card__pct">
                          {fireStats.totalFires > 0
                            ? ` · ${((fireStats.fireTypes.natural / fireStats.totalFires) * 100).toFixed(0)}%`
                            : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="fire-stats-card">
                    <div className="fire-stats-card__icon fire-stats-card__icon--tech">
                      ⚡
                    </div>
                    <div className="fire-stats-card__content">
                      <div className="fire-stats-card__value fire-stats-card__value--tech">
                        {fireStats.fireTypes.technogenic}
                      </div>
                      <div className="fire-stats-card__label">
                        Техногенные
                        <span className="fire-stats-card__pct">
                          {fireStats.totalFires > 0
                            ? ` · ${((fireStats.fireTypes.technogenic / fireStats.totalFires) * 100).toFixed(0)}%`
                            : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confidence distribution bars */}
                <div className="fire-stats-section">
                  <h3 className="fire-stats-section__title">
                    <Target size={15} />
                    Распределение достоверности
                  </h3>
                  <div className="fire-stats-bars">
                    {[
                      { label: 'Высокая (≥70%)',   key: 'high',   color: '#10b981' },
                      { label: 'Средняя (30–70%)', key: 'medium', color: '#f59e0b' },
                      { label: 'Низкая (<30%)',    key: 'low',    color: '#ef4444' },
                    ].map(({ label, key, color }) => {
                      const count = fireStats.confidenceDistribution[key] ?? 0;
                      const pct = fireStats.totalFires > 0 ? (count / fireStats.totalFires) * 100 : 0;
                      return (
                        <div key={key} className="fire-stats-bars__row">
                          <div className="fire-stats-bars__label">{label}</div>
                          <div className="fire-stats-bars__track">
                            <div
                              className="fire-stats-bars__fill"
                              style={{ width: `${pct}%`, background: color }}
                            />
                          </div>
                          <div className="fire-stats-bars__count">{count}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Satellite sources with bars */}
                <div className="fire-stats-section">
                  <h3 className="fire-stats-section__title">
                    <Activity size={15} />
                    Источники обнаружения
                  </h3>
                  <div className="fire-stats-bars">
                    {Object.entries(fireStats.satelliteDistribution)
                      .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
                      .map(([sat, count]) => {
                        const c = count ?? 0;
                        const pct = fireStats.totalFires > 0 ? (c / fireStats.totalFires) * 100 : 0;
                        return (
                          <div key={sat} className="fire-stats-bars__row">
                            <div className="fire-stats-bars__label">{sat}</div>
                            <div className="fire-stats-bars__track">
                              <div
                                className="fire-stats-bars__fill fire-stats-bars__fill--satellite"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="fire-stats-bars__count">{c}</div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Detection models */}
                {Object.keys(firesByModel).length > 0 && (
                  <div className="fire-stats-section">
                    <h3 className="fire-stats-section__title">
                      <Target size={15} />
                      Модели обнаружения
                    </h3>
                    <div className="fire-stats-bars">
                      {Object.entries(firesByModel).map(([model, count]) => {
                        const c = count ?? 0;
                        const pct = fireStats.totalFires > 0 ? (c / fireStats.totalFires) * 100 : 0;
                        return (
                          <div key={model} className="fire-stats-bars__row">
                            <div className="fire-stats-bars__label">{model}</div>
                            <div className="fire-stats-bars__track">
                              <div
                                className="fire-stats-bars__fill fire-stats-bars__fill--model"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="fire-stats-bars__count">{c}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            </div>

            <div className="fire-stats-modal__footer">
              <button className="fire-stats-modal__btn fire-stats-modal__btn--secondary" onClick={handleExportData}>
                <Download size={16} />
                Экспорт
              </button>
              <button className="fire-stats-modal__btn fire-stats-modal__btn--primary" onClick={() => setShowStats(false)}>
                Закрыть
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* ── Timeline calendar picker ── */}
      {showTimeline && (
        <LinearDateChooser
          startDate={fireStartDate}
          endDate={fireEndDate}
          onDateRangeChange={(start, end) => {
            setFireStartDate(start.toISOString().split('T')[0]);
            setFireEndDate(end.toISOString().split('T')[0]);
            setDateHasChanged();
            if (!fireLayerVisible) setFireLayerVisible();
            setHasDateChanges(false);
          }}
          onClose={() => setShowTimeline(false)}
          maxDays={MAX_DAYS}
        />
      )}
    </>
  );
};

export default FireControls;
