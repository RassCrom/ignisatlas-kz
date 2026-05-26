import dayjs from 'dayjs';

import useBookmarksStore from 'src/app/store/bookmarksStore';
import useFireStore from 'src/app/store/fireStore';
import useMenuStore from 'src/app/store/store';
import { showToast } from 'src/shared/utils/showToast';
import { flyHome } from './flyHome';
import { getMapBoundsArray } from './maplibreHelpers';

const svg = (path, color = '#4999E8') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;

const ICONS = {
  crosshair: svg('<circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/>'),
  scanEye: svg('<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="1"/><path d="M18.944 12.33a1 1 0 0 0 0-.66 7.5 7.5 0 0 0-13.888 0 1 1 0 0 0 0 .66 7.5 7.5 0 0 0 13.888 0"/>'),
  home: svg('<path d="M18 8c0 3.613-3.869 7.429-5.393 8.795a1 1 0 0 1-1.214 0C9.87 15.429 6 11.613 6 8a6 6 0 0 1 12 0"/><circle cx="12" cy="8" r="2"/><path d="M8.714 14h-3.71a1 1 0 0 0-.948.683l-2.004 6A1 1 0 0 0 3 22h18a1 1 0 0 0 .948-1.316l-2-6a1 1 0 0 0-.949-.684h-3.712"/>'),
  copy: svg('<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'),
  maps: svg('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>', '#34d399'),
  weather: svg('<path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/>', '#60a5fa'),
  ruler: svg('<path d="M21.3 8.7 8.7 21.3c-1 1-2.5 1-3.4 0l-2.6-2.6c-1-1-1-2.5 0-3.4L15.3 2.7c1-1 2.5-1 3.4 0l2.6 2.6c1 1 1 2.5 0 3.4Z"/><path d="m7.5 10.5 2 2"/><path d="m10.5 7.5 2 2"/><path d="m13.5 4.5 2 2"/><path d="m4.5 13.5 2 2"/>'),
  bookmark: svg('<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>', '#f59e0b'),
};

/**
 * Parse a trusted static SVG string into a live DOM node.
 * DOMParser with image/svg+xml produces an inert document — any <script>
 * elements inside are NOT executed, even after adoptNode().
 */
const parseSvg = (svgString) => {
  const doc = new DOMParser().parseFromString(svgString, 'image/svg+xml');
  return document.adoptNode(doc.documentElement);
};

const menuItem = (icon, label, onClick) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'context-menu-item';

  // Icon — always a static SVG from the svg() helper above, parsed safely.
  button.appendChild(parseSvg(icon));

  // Label — textContent guarantees no HTML injection even if a caller ever
  // passes a user-supplied string (e.g. a bookmark name).
  const labelSpan = document.createElement('span');
  labelSpan.textContent = label;
  button.appendChild(labelSpan);

  button.addEventListener('click', onClick);
  return button;
};

const separator = () => {
  const line = document.createElement('div');
  line.className = 'context-menu-separator';
  return line;
};

const copyCoordinates = async ([lon, lat]) => {
  try {
    await navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
    showToast(`Координаты скопированы: ${lat.toFixed(5)}, ${lon.toFixed(5)}`, 'success');
  } catch {
    showToast('Не удалось скопировать координаты', 'error');
  }
};

const openInGoogleMaps = ([lon, lat]) => {
  window.open(`https://www.google.com/maps?q=${lat.toFixed(6)},${lon.toFixed(6)}`, '_blank', 'noopener,noreferrer');
};

export const createContextMenu = (map) => {
  const menu = document.createElement('div');
  menu.className = 'maplibre-context-menu';
  menu.hidden = true;
  document.body.appendChild(menu);

  const hide = () => {
    menu.hidden = true;
    menu.innerHTML = '';
  };

  const open = (event) => {
    event.preventDefault();
    hide();

    const lngLat = [event.lngLat.lng, event.lngLat.lat];
    const run = (callback) => () => {
      hide();
      callback();
    };

    menu.append(
      menuItem(ICONS.crosshair, 'Центрировать карту здесь', run(() => {
        map.flyTo({ center: lngLat, zoom: Math.max(map.getZoom(), 12), duration: 900 });
        showToast('Карта отцентрирована', 'success');
      })),
      menuItem(ICONS.scanEye, 'Приблизить к точке', run(() => {
        map.flyTo({ center: lngLat, zoom: 14, duration: 900 });
      })),
      menuItem(ICONS.home, 'Вернуться на главную позицию', run(() => flyHome(map))),
      menuItem(ICONS.scanEye, 'Определить пиксель', run(() => {
        const menuStore = useMenuStore.getState();
        if (menuStore.openTabIndex !== 4 || !menuStore.isMenuOpen) {
          menuStore.setTabIndex(4);
          if (!menuStore.isMenuOpen) menuStore.toggleMenu();
        }
        const fireStore = useFireStore.getState();
        if (!fireStore.expandedItems.data_tools) fireStore.toggleExpandedItem('data_tools');
        window.dispatchEvent(new CustomEvent('cm:identify_pixel', { detail: { coordinate: lngLat } }));
      })),
      separator(),
      menuItem(ICONS.copy, 'Копировать координаты', run(() => copyCoordinates(lngLat))),
      menuItem(ICONS.maps, 'Открыть в Google Maps', run(() => openInGoogleMaps(lngLat))),
      separator(),
      menuItem(ICONS.weather, 'Погода в этом месте', run(() => {
        window.dispatchEvent(new CustomEvent('cm:weather', { detail: { coordinate: lngLat } }));
      })),
      menuItem(ICONS.bookmark, 'Сохранить закладку', run(() => {
        const center = [map.getCenter().lng, map.getCenter().lat];
        const zoom = map.getZoom();
        const extent = getMapBoundsArray(map);
        const date = dayjs().format('YYYY-MM-DD');
        const title = `Bookmark ${useBookmarksStore.getState().bookmarks.length + 1}`;
        useBookmarksStore.getState().addBookmark(title, date, '', center, zoom, extent);
        showToast('Закладка для этой области сохранена', 'success');
      })),
      menuItem(ICONS.ruler, 'Измерить расстояние', run(() => {
        window.dispatchEvent(new CustomEvent('cm:measure', { detail: { coordinate: lngLat } }));
      })),
    );

    menu.style.left = `${event.point.x + map.getCanvas().getBoundingClientRect().left}px`;
    menu.style.top = `${event.point.y + map.getCanvas().getBoundingClientRect().top}px`;
    menu.hidden = false;
  };

  map.on('contextmenu', open);
  window.addEventListener('click', hide);
  window.addEventListener('blur', hide);

  return () => {
    map.off('contextmenu', open);
    window.removeEventListener('click', hide);
    window.removeEventListener('blur', hide);
    menu.remove();
  };
};
