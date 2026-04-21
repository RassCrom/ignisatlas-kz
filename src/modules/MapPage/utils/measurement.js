import { getArea, getLength } from 'ol/sphere';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';

// Create measurement style
export const createMeasureStyle = () => {
  return new Style({
    fill: new Fill({
      color: 'rgba(73, 153, 232, 0.3)',
    }),
    stroke: new Stroke({
      color: 'rgba(73, 153, 232, 0.8)',
      lineDash: [10, 10],
      width: 2,
    }),
    image: new CircleStyle({
      radius: 5,
      stroke: new Stroke({
        color: 'rgba(73, 153, 232, 0.8)',
      }),
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.8)',
      }),
    }),
  });
};

// Format length output
export const formatLength = (line) => {
  const length = getLength(line);
  let output;
  if (length > 1000) {
    output = (Math.round((length / 1000) * 100) / 100) + ' km';
  } else {
    output = (Math.round(length * 100) / 100) + ' m';
  }
  return output;
};

// Format area output
export const formatArea = (polygon) => {
  const area = getArea(polygon);
  let output;
  if (area > 1000000) {
    output = (Math.round((area / 1000000) * 100) / 100) + ' km²';
  } else {
    output = (Math.round(area * 100) / 100) + ' m²';
  }
  return output;
};