import { useState, useCallback, useEffect } from 'react';
import {
  Calendar, Plus, X, AlertTriangle, Flame, Eye, EyeOff, Sliders,
} from 'lucide-react';
import './fireControls.scss';
import useRiskMapStore from 'src/app/store/riskMapStore';

const RISK_LABELS = { Low: 'Низкий', Medium: 'Средний', High: 'Высокий' };

const getRiskLevel = (dateString) => {
  const month = new Date(dateString).getMonth();
  if (month >= 5 && month <= 8) return 'High';
  if ((month >= 3 && month <= 4) || (month >= 9 && month <= 10)) return 'Medium';
  return 'Low';
};

const getRiskColor = (level) => {
  switch (level) {
    case 'Low':    return '#10b981';
    case 'Medium': return '#f59e0b';
    case 'High':   return '#ef4444';
    default:       return '#6b7280';
  }
};

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

const FireRisk = () => {
  const [isExpanded,    setIsExpanded]    = useState(false);
  const [selectedDate,  setSelectedDate]  = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [isLoadingDates, setIsLoadingDates] = useState(true);

  const riskDates            = useRiskMapStore((s) => s.riskDates);
  const isVisible            = useRiskMapStore((s) => s.isVisible);
  const addDate              = useRiskMapStore((s) => s.addDate);
  const removeDate           = useRiskMapStore((s) => s.removeDate);
  const setIsVisible         = useRiskMapStore((s) => s.setIsVisible);
  const updateDateVisibility = useRiskMapStore((s) => s.updateDateVisibility);
  const updateDateOpacity    = useRiskMapStore((s) => s.updateDateOpacity);

  useEffect(() => {
    const fetchFireDates = async () => {
      try {
        const response  = await fetch('https://api.igmass.kz/fire/firehuzdates');
        const textData  = await response.text();
        const cleaned   = textData
          .replace(/'/g, '"')
          .replace(/(\d{4})\.(\d{1,2})\.(\d{1,2})/g, '$1-$2-$3');
        const data      = JSON.parse(cleaned);
        const dates     = data.map(item => new Date(item[0]).toISOString().split('T')[0]);
        setAvailableDates(dates);
      } catch (err) {
        console.error('Error fetching fire dates:', err);
        setAvailableDates([]);
      } finally {
        setIsLoadingDates(false);
      }
    };
    fetchFireDates();
  }, []);

  const handleAddItem = useCallback(() => {
    if (selectedDate && !riskDates.some(item => item.date === selectedDate)) {
      addDate(selectedDate);
      setSelectedDate('');
    }
  }, [selectedDate, riskDates, addDate]);

  const handleToggleItemVisibility = useCallback((id, current) => {
    updateDateVisibility(id, !current);
  }, [updateDateVisibility]);

  const handleItemOpacityChange = useCallback((id, value) => {
    updateDateOpacity(id, value);
  }, [updateDateOpacity]);

  return (
    <div className="fire-controls">
      <div className="fire-controls__header">
        <div className="fire-controls__toggle" onClick={() => setIsVisible(!isVisible)}>
          <div className="fire-controls__toggle-icon">
            {isVisible
              ? <Eye size={16} className="fire-controls__icon-active" />
              : <EyeOff size={16} className="fire-controls__icon-inactive" />}
          </div>
          <span className="fire-controls__toggle-label">Анализ пожарного риска</span>
          <AlertTriangle
            size={16}
            className={`fire-controls__flame-icon ${isVisible ? 'fire-controls__flame-icon--active' : ''}`}
          />
        </div>
        <button
          className={`fire-controls__expand-btn ${isExpanded ? 'fire-controls__expand-btn--expanded' : ''}`}
          onClick={() => setIsExpanded(v => !v)}
        >
          <Sliders size={14} />
        </button>
      </div>

      {isExpanded && (
        <div className="fire-controls__content">
          {/* Date selection */}
          <div className="fire-controls__section">
            <label className="fire-controls__label">
              <Calendar size={12} />
              Выберите дату оценки риска
            </label>
            <div className="fire-controls__date-inputs">
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="fire-controls__select"
                style={{ flex: 1 }}
                disabled={isLoadingDates}
              >
                <option value="">{isLoadingDates ? 'Загрузка дат...' : 'Выберите дату...'}</option>
                {availableDates.map(date => (
                  <option key={date} value={date}>
                    {formatDate(date)} — {RISK_LABELS[getRiskLevel(date)]} риск
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddItem}
                disabled={!selectedDate || riskDates.some(item => item.date === selectedDate)}
                className={`fire-controls__update-btn ${
                  selectedDate && !riskDates.some(item => item.date === selectedDate)
                    ? 'fire-controls__update-btn--active' : ''
                }`}
                title="Добавить оценку риска"
              >
                <Plus size={14} />
                Добавить
              </button>
            </div>
          </div>

          {/* Per-layer cards */}
          {riskDates.length > 0 && (
            <div className="fire-controls__section">
              <label className="fire-controls__label">
                <Flame size={12} />
                Карты оценки риска ({riskDates.length})
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {riskDates.map(item => {
                  const level = getRiskLevel(item.date);
                  const color = getRiskColor(level);
                  return (
                    <div key={item.id} className="fire-modelling__layer-card">
                      <div className="fire-modelling__card-header">
                        <button
                          onClick={() => handleToggleItemVisibility(item.id, item.isVisible)}
                          className={`fire-modelling__icon-btn ${item.isVisible ? 'fire-modelling__icon-btn--eye-on' : ''}`}
                          title={item.isVisible ? 'Скрыть слой' : 'Показать слой'}
                        >
                          {item.isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                        </button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span className="fire-modelling__layer-name" style={{ fontSize: '12px' }}>
                              {formatDate(item.date)}
                            </span>
                            <span style={{
                              color,
                              fontSize: '10px',
                              backgroundColor: color + '22',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontWeight: '600',
                              flexShrink: 0,
                            }}>
                              {RISK_LABELS[level]}
                            </span>
                          </div>
                          <div className="fire-modelling__card-meta">
                            Добавлено: {new Date(item.addedAt).toLocaleTimeString('ru-RU')}
                          </div>
                        </div>
                        <button
                          onClick={() => removeDate(item.id)}
                          className="fire-modelling__icon-btn fire-modelling__icon-btn--danger"
                          title="Удалить"
                        >
                          <X size={13} />
                        </button>
                      </div>
                      <div className="fire-modelling__control-row" style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="fire-modelling__control-label" style={{ marginBottom: 0 }}>
                            Непрозрачность
                          </span>
                          <span style={{ fontSize: '10px', color: 'rgba(217,218,245,0.6)', fontWeight: '600' }}>
                            {Math.round(item.opacity * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={Math.round(item.opacity * 100)}
                          onChange={(e) => handleItemOpacityChange(item.id, Number(e.target.value) / 100)}
                          className="fire-modelling__slider"
                          style={{ marginTop: '4px' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="fire-controls__section">
            <div className="fire-controls__legend">
              <div className="fire-controls__legend-header">
                <AlertTriangle size={12} />
                Легенда шкалы риска
              </div>
              <div className="fire-controls__legend-gradient" />
              <div className="fire-controls__legend-labels">
                <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
              </div>
              <div className="fire-controls__legend-description">
                Зелёный (Низкий) → Жёлтый (Умеренный) → Оранжевый (Высокий) → Красный (Экстремальный)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FireRisk;
