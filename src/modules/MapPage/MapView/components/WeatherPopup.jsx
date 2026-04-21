import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { transform } from 'ol/proj';
import {
  X,
  Wind,
  Eye,
  Droplets,
  Gauge,
  Cloud,
  MapPin,
  Sunrise,
  Sunset,
} from 'lucide-react';

import styles from './WeatherPopup.module.scss';

const OWM_KEY = '59b43714fd1eb5528d8cab44041c7067';

const WIND_DIRS = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'];
const windDir = (deg) => WIND_DIRS[Math.round(deg / 45) % 8];

const fmtTime = (unix) =>
  new Date(unix * 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

/* ── WeatherPopup ────────────────────────────────── */

const WeatherPopup = ({ coordinate, onClose }) => {
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!coordinate) return;
    setLoading(true);
    setError(null);
    setWeather(null);
    setLocation(null);

    const [lon, lat] = transform(coordinate, 'EPSG:3857', 'EPSG:4326');

    Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric&lang=ru`
      ).then((r) => r.json()),
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ru&zoom=18`
      ).then((r) => r.json()),
    ])
      .then(([w, geo]) => { setWeather(w); setLocation(geo); })
      .catch(() => setError('Не удалось загрузить данные о погоде'))
      .finally(() => setLoading(false));
  }, [coordinate]);

  /* ── Location label ── */

  const locationParts = location
    ? [
        location.address?.state || location.address?.province || location.address?.region,
        location.address?.county || location.address?.district,
        location.address?.city || location.address?.town ||
          location.address?.village || location.address?.suburb,
      ].filter(Boolean)
    : [];

  /* ── Render ── */

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />

      <div className={styles.card}>
        <button className={styles.closeBtn} onClick={onClose} title="Закрыть">
          <X size={15} />
        </button>

        {/* ── Loading ── */}
        {loading && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span>Загрузка данных...</span>
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className={styles.error}>{error}</div>
        )}

        {/* ── Content ── */}
        {!loading && !error && weather && (
          <>
            {/* Main: icon + temp */}
            <div className={styles.main}>
              <img
                src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                alt={weather.weather[0].description}
                className={styles.weatherIcon}
              />
              <div className={styles.mainInfo}>
                <div className={styles.temp}>{Math.round(weather.main.temp)}°C</div>
                <div className={styles.desc}>{weather.weather[0].description}</div>
                <div className={styles.feelsLike}>
                  Ощущается как {Math.round(weather.main.feels_like)}°C
                </div>
                <div className={styles.minMax}>
                  <span>↓ {Math.round(weather.main.temp_min)}°</span>
                  <span>↑ {Math.round(weather.main.temp_max)}°</span>
                </div>
              </div>
            </div>

            {/* Location */}
            {locationParts.length > 0 && (
              <div className={styles.locationRow}>
                <MapPin size={12} />
                <span>{locationParts.join(' · ')}</span>
              </div>
            )}

            <div className={styles.divider} />

            {/* Stats grid */}
            <div className={styles.statsGrid}>
              <div className={styles.stat}>
                <Droplets size={14} className={styles.statIcon} />
                <span className={styles.statValue}>{weather.main.humidity}%</span>
                <span className={styles.statLabel}>Влажность</span>
              </div>
              <div className={styles.stat}>
                <Gauge size={14} className={styles.statIcon} />
                <span className={styles.statValue}>{weather.main.pressure}</span>
                <span className={styles.statLabel}>гПа</span>
              </div>
              <div className={styles.stat}>
                <Eye size={14} className={styles.statIcon} />
                <span className={styles.statValue}>
                  {weather.visibility >= 1000
                    ? `${Math.round(weather.visibility / 1000)} км`
                    : `${weather.visibility} м`}
                </span>
                <span className={styles.statLabel}>Видимость</span>
              </div>
              <div className={styles.stat}>
                <Cloud size={14} className={styles.statIcon} />
                <span className={styles.statValue}>{weather.clouds.all}%</span>
                <span className={styles.statLabel}>Облачность</span>
              </div>
            </div>

            {/* Wind */}
            <div className={styles.windRow}>
              <Wind size={14} className={styles.windIcon} />
              <span>
                {windDir(weather.wind.deg)} · {weather.wind.speed.toFixed(1)} м/с
                {weather.wind.gust
                  ? `, порывы до ${weather.wind.gust.toFixed(1)} м/с`
                  : ''}
              </span>
            </div>

            {/* Sunrise / Sunset */}
            <div className={styles.sunRow}>
              <div className={styles.sunItem}>
                <Sunrise size={13} className={styles.sunIcon} />
                <span>Восход {fmtTime(weather.sys.sunrise)}</span>
              </div>
              <div className={styles.sunItem}>
                <Sunset size={13} className={styles.sunIcon} />
                <span>Закат {fmtTime(weather.sys.sunset)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

export default WeatherPopup;
