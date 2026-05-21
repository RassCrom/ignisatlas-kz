import { showToast } from 'src/shared/utils/showToast';
import { DEFAULT_POSITION } from './mapConstants';

export const flyHome = (map) => {
  if (!map) return;
  showToast('Карта обновлена');
  map.flyTo({
    center: DEFAULT_POSITION.center,
    zoom: DEFAULT_POSITION.zoom,
    bearing: DEFAULT_POSITION.bearing,
    duration: 800,
  });
};
