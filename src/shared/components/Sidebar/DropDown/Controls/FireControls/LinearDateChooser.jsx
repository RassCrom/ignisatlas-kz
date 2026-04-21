import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

import './LinearDateChooser.scss';

const RU_MONTHS = [
  'Январь','Февраль','Март','Апрель','Май','Июнь',
  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'
];
const RU_DAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

const LinearDateChooser = ({
  startDate,
  endDate,
  onDateRangeChange,
  onClose,
  maxDays = 31
}) => {
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const initDate = (d) => {
    if (!d) return null;
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const [selectedStart, setSelectedStart] = useState(() => initDate(startDate));
  const [selectedEnd, setSelectedEnd] = useState(() => initDate(endDate));
  const [isSelecting, setIsSelecting] = useState(false);
  const [hoveredDate, setHoveredDate] = useState(null);
  const [viewMonth, setViewMonth] = useState(() => {
    const base = initDate(startDate) || todayDate;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const generateGrid = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7; // Mon = 0
    const days = [];
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const grid = generateGrid(viewMonth.getFullYear(), viewMonth.getMonth());

  const prevMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
    if (next <= todayDate) setViewMonth(next);
  };

  const isNextDisabled = () => {
    const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
    return next > todayDate;
  };

  const clampEnd = (start, end) => {
    if (!start || !end) return end;
    let s = start, e = end;
    if (e < s) [s, e] = [e, s];
    const diff = (e - s) / 864e5;
    if (diff > maxDays) {
      const capped = new Date(s);
      capped.setDate(s.getDate() + maxDays);
      return capped;
    }
    return e;
  };

  const handleDateClick = (date) => {
    if (!date || date > todayDate) return;

    if (!isSelecting) {
      setSelectedStart(date);
      setSelectedEnd(null);
      setIsSelecting(true);
    } else {
      let start = selectedStart;
      let end = date;
      if (end < start) [start, end] = [end, start];
      end = clampEnd(start, end);
      setSelectedStart(start);
      setSelectedEnd(end);
      setIsSelecting(false);
      setHoveredDate(null);
    }
  };

  const effectiveHoverEnd = isSelecting && hoveredDate && selectedStart
    ? clampEnd(selectedStart, hoveredDate)
    : null;

  const isInRange = (date) => {
    if (!date) return false;
    const s = selectedStart;
    const e = isSelecting ? effectiveHoverEnd : selectedEnd;
    if (!s || !e) return false;
    const lo = s < e ? s : e;
    const hi = s < e ? e : s;
    return date > lo && date < hi;
  };

  const isEndpoint = (date) => {
    if (!date) return false;
    const s = selectedStart;
    const e = isSelecting ? effectiveHoverEnd : selectedEnd;
    return (s && date.getTime() === s.getTime()) || (e && date.getTime() === e.getTime());
  };

  const isCapped = (date) => {
    if (!date || !isSelecting || !effectiveHoverEnd || !hoveredDate) return false;
    return effectiveHoverEnd.getTime() !== hoveredDate.getTime() &&
           date.getTime() === effectiveHoverEnd.getTime();
  };

  const handleApply = () => {
    if (selectedStart && selectedEnd) {
      onDateRangeChange(selectedStart, selectedEnd);
      onClose();
    }
  };

  const fmt = (date) =>
    date
      ? date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—';

  const diffDays =
    selectedStart && selectedEnd
      ? Math.ceil((selectedEnd - selectedStart) / 864e5) + 1
      : null;

  return (
    <div className="linear-date-chooser-overlay">
      <div className="linear-date-chooser">

        {/* Header */}
        <div className="linear-date-chooser__header">
          <div className="linear-date-chooser__title">
            <Calendar size={16} />
            Выберите диапазон дат (макс. {maxDays} дн.)
          </div>
          <button className="linear-date-chooser__close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Selection info + actions */}
        <div className="linear-date-chooser__info">
          <div className="linear-date-chooser__range">
            {isSelecting ? (
              <span className="linear-date-chooser__instruction">Выберите дату окончания</span>
            ) : selectedStart && selectedEnd ? (
              <>
                <span className="linear-date-chooser__range-text">
                  {fmt(selectedStart)} — {fmt(selectedEnd)}
                </span>
                <span className="linear-date-chooser__range-days">{diffDays} дн.</span>
              </>
            ) : (
              <span className="linear-date-chooser__instruction">Выберите дату начала</span>
            )}
          </div>
          <div className="linear-date-chooser__btns">
            <button
              className="linear-date-chooser__btn linear-date-chooser__btn--secondary"
              onClick={onClose}
            >
              Отмена
            </button>
            <button
              className="linear-date-chooser__btn linear-date-chooser__btn--primary"
              onClick={handleApply}
              disabled={!selectedStart || !selectedEnd}
            >
              Применить
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div className="ldc-calendar">
          {/* Month navigation */}
          <div className="ldc-calendar__nav">
            <button className="ldc-calendar__nav-btn" onClick={prevMonth}>
              <ChevronLeft size={16} />
            </button>
            <span className="ldc-calendar__month-label">
              {RU_MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </span>
            <button
              className="ldc-calendar__nav-btn"
              onClick={nextMonth}
              disabled={isNextDisabled()}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="ldc-calendar__weekdays">
            {RU_DAYS.map((d) => (
              <span key={d} className="ldc-calendar__weekday">{d}</span>
            ))}
          </div>

          {/* Days grid */}
          <div className="ldc-calendar__grid">
            {grid.map((date, i) => {
              if (!date) {
                return <span key={`e-${i}`} className="ldc-calendar__day ldc-calendar__day--empty" />;
              }
              const future = date > todayDate;
              const selected = isEndpoint(date);
              const inRange = isInRange(date);
              const isToday = date.getTime() === todayDate.getTime();
              const capped = isCapped(date);

              return (
                <button
                  key={date.toISOString()}
                  className={[
                    'ldc-calendar__day',
                    future       ? 'ldc-calendar__day--future'   : '',
                    selected     ? 'ldc-calendar__day--selected'  : '',
                    inRange      ? 'ldc-calendar__day--in-range'  : '',
                    isToday      ? 'ldc-calendar__day--today'     : '',
                    capped       ? 'ldc-calendar__day--capped'    : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => handleDateClick(date)}
                  onMouseEnter={() => isSelecting && setHoveredDate(date)}
                  onMouseLeave={() => isSelecting && setHoveredDate(null)}
                  disabled={future}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LinearDateChooser;
