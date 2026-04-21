import ContextMenu from "ol-contextmenu";
import { transform } from 'ol/proj';

import { showToast } from "src/shared/utils/showToast";
import { flyHome } from "./flyHome";

function flyTo(view, location, zoom = null, done = () => {}) {
  if (!view || !location) { done(false); return; }
  const currentZoom = view.getZoom();
  const targetZoom = zoom || (currentZoom < 12 ? 12 : currentZoom);
  view.animate({ center: location, zoom: targetZoom, duration: 1500 }, done);
}

function formatCoordinates(coordinate, precision = 5) {
  if (!coordinate || coordinate.length !== 2) return 'Invalid coordinates';
  return `${coordinate[1].toFixed(precision)}, ${coordinate[0].toFixed(precision)}`;
}

async function copyCoordinates(coordinate, isWGS84 = false) {
  try {
    let coords = coordinate;
    let coordSystem = 'Web Mercator';
    if (isWGS84) {
      coords = transform(coordinate, 'EPSG:3857', 'EPSG:4326');
      coordSystem = 'WGS84';
    }
    await navigator.clipboard.writeText(`${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}`);
    showToast(`Координаты скопированы (${coordSystem}): ${formatCoordinates(coords)}`, 'success');
  } catch {
    showToast('Не удалось скопировать координаты', 'error');
  }
}

function openInGoogleMaps(coordinate) {
  const [lon, lat] = transform(coordinate, 'EPSG:3857', 'EPSG:4326');
  window.open(`https://www.google.com/maps?q=${lat.toFixed(6)},${lon.toFixed(6)}`, '_blank');
}

/* ── SVG helpers ───────────────────────────────────── */

const svg = (path, color = '#4999E8') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;

const menuItem = (icon, label) =>
  `<div class="context-menu-item">${icon}<span>${label}</span></div>`;

/* ── Icons ─────────────────────────────────────────── */

const ICONS = {
  crosshair: svg('<circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/>'),
  scanEye:   svg('<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="1"/><path d="M18.944 12.33a1 1 0 0 0 0-.66 7.5 7.5 0 0 0-13.888 0 1 1 0 0 0 0 .66 7.5 7.5 0 0 0 13.888 0"/>'),
  home:      svg('<path d="M18 8c0 3.613-3.869 7.429-5.393 8.795a1 1 0 0 1-1.214 0C9.87 15.429 6 11.613 6 8a6 6 0 0 1 12 0"/><circle cx="12" cy="8" r="2"/><path d="M8.714 14h-3.71a1 1 0 0 0-.948.683l-2.004 6A1 1 0 0 0 3 22h18a1 1 0 0 0 .948-1.316l-2-6a1 1 0 0 0-.949-.684h-3.712"/>'),
  copy:      svg('<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'),
  globe:     svg('<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>'),
  maps:      svg('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>', '#34d399'),
  weather:   svg('<path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/>', '#60a5fa'),
  ruler:     svg('<path d="M21.3 8.7 8.7 21.3c-1 1-2.5 1-3.4 0l-2.6-2.6c-1-1-1-2.5 0-3.4L15.3 2.7c1-1 2.5-1 3.4 0l2.6 2.6c1 1 1 2.5 0 3.4Z"/><path d="m7.5 10.5 2 2"/><path d="m10.5 7.5 2 2"/><path d="m13.5 4.5 2 2"/><path d="m4.5 13.5 2 2"/>'),
};

/* ── Context menu factory ──────────────────────────── */

export const createContextMenu = (_map, view, _DEFAULT_POSITION, styles) => {
  const cls = styles.contextmenu__style;

  return new ContextMenu({
    width: 265,
    defaultItems: false,
    items: [
      {
        text: menuItem(ICONS.crosshair, 'Центрировать карту здесь'),
        classname: cls,
        callback: (e) => flyTo(view, e.coordinate, null, (ok) => ok && showToast('Карта отцентрирована', 'success')),
      },
      {
        text: menuItem(ICONS.scanEye, 'Приблизить к точке'),
        classname: cls,
        callback: (e) => flyTo(view, e.coordinate, 14, (ok) => ok && showToast('Приближено к точке', 'success')),
      },
      {
        text: menuItem(ICONS.home, 'Вернуться на главную позицию'),
        classname: cls,
        callback: () => { flyHome(view); showToast('Возвращение к главной позиции', 'success'); },
      },

      '-',

      {
        text: menuItem(ICONS.copy, 'Копировать координаты'),
        classname: cls,
        callback: (e) => copyCoordinates(e.coordinate, false),
      },
      {
        text: menuItem(ICONS.copy, 'Копировать коор. (WGS84)'),
        classname: cls,
        callback: (e) => copyCoordinates(e.coordinate, true),
      },
      {
        text: menuItem(ICONS.maps, 'Открыть в Google Maps'),
        classname: cls,
        callback: (e) => openInGoogleMaps(e.coordinate),
      },

      '-',

      {
        text: menuItem(ICONS.weather, 'Погода в этом месте'),
        classname: cls,
        callback: (e) => {
          window.dispatchEvent(new CustomEvent('cm:weather', { detail: { coordinate: e.coordinate } }));
        },
      },
      {
        text: menuItem(ICONS.ruler, 'Измерить расстояние'),
        classname: cls,
        callback: (e) => {
          window.dispatchEvent(new CustomEvent('cm:measure', { detail: { coordinate: e.coordinate } }));
        },
      },
    ],
  });
};
