import { useEffect, useRef, useCallback, useState } from 'react';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import OSM from 'ol/source/OSM.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import { Style, Fill, Stroke } from 'ol/style.js';
import { DEFAULT_POSITION } from '../../../../../../../modules/MapPage/utils/mapConstants';

import styles from './MapFireControls.module.scss';

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
};

const MapFireControls = ({ firesByRegion }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [hoveredRegion, setHoveredRegion] = useState(null);

  const fireData = firesByRegion;

  const getColorForValue = useCallback((value) => {
    const values = Object.values(fireData);
    if (!values.length) return 'rgba(255,255,255,0.04)';
    const maxValue = Math.max(...values);
    if (maxValue === 0) return 'rgba(255,255,255,0.04)';

    const intensity = value / maxValue;

    const ramp = [
      { t: 0,    hex: '#0f1535' },
      { t: 0.15, hex: '#1e3a6e' },
      { t: 0.35, hex: '#f59e0b' },
      { t: 0.6,  hex: '#ef4444' },
      { t: 0.8,  hex: '#cc0000' },
      { t: 1,    hex: '#7a0000' },
    ];

    for (let i = 0; i < ramp.length - 1; i++) {
      const s = ramp[i];
      const e = ramp[i + 1];
      if (intensity >= s.t && intensity <= e.t) {
        const f = (intensity - s.t) / (e.t - s.t);
        const sr = hexToRgb(s.hex);
        const er = hexToRgb(e.hex);
        const r = Math.round(sr.r + (er.r - sr.r) * f);
        const g = Math.round(sr.g + (er.g - sr.g) * f);
        const b = Math.round(sr.b + (er.b - sr.b) * f);
        return `rgba(${r},${g},${b},0.82)`;
      }
    }
    return `rgba(122,0,0,0.82)`;
  }, [fireData]);

  const styleFunction = useCallback((feature) => {
    const regionName = feature.get('name') || feature.get('name_igmass');
    const fireCount = fireData[regionName] || 0;
    return new Style({
      fill: new Fill({ color: getColorForValue(fireCount) }),
      stroke: new Stroke({ color: 'rgba(136,139,224,0.25)', width: 0.8 }),
    });
  }, [fireData, getColorForValue]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const vectorSource = new VectorSource({
      url: '/layers/KAZ_OSM_BORDER_LVL2.geojson',
      format: new GeoJSON(),
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: styleFunction,
    });

    const map = new Map({
      target: mapContainerRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
          opacity: 0.12,
        }),
        vectorLayer,
      ],
      view: new View({
        center: DEFAULT_POSITION.center,
        zoom: DEFAULT_POSITION.zoom,
        minZoom: DEFAULT_POSITION.zoom,
        maxZoom: 22,
      }),
    });

    mapRef.current = map;

    let lastFeature = null;

    map.on('pointermove', (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (feat) => feat);
      if (feature) {
        map.getTargetElement().style.cursor = 'pointer';
        const regionName = feature.get('name') || feature.get('name_igmass');
        const fireCount = fireData[regionName] || 0;
        setHoveredRegion({ name: regionName, count: fireCount });
      } else {
        map.getTargetElement().style.cursor = '';
        setHoveredRegion(null);
      }
    });

    map.on('click', (evt) => {
      if (lastFeature) lastFeature.setStyle(undefined);
      const feature = map.forEachFeatureAtPixel(evt.pixel, (feat) => feat);
      if (feature) {
        feature.setStyle(new Style({
          fill: new Fill({ color: getColorForValue(fireData[feature.get('name') || feature.get('name_igmass')] || 0) }),
          stroke: new Stroke({ color: 'rgba(217,218,245,0.8)', width: 2 }),
        }));
        lastFeature = feature;
      } else {
        lastFeature = null;
      }
    });

    return () => { map.setTarget(null); };
  }, [styleFunction, fireData, getColorForValue]);

  const sortedRegions = Object.entries(fireData).sort(([, a], [, b]) => b - a);
  const totalFires = sortedRegions.reduce((s, [, c]) => s + c, 0);

  return (
    <div className={styles.mapFireWrapper}>

      {/* Map */}
      <div className={styles.mapSection}>
        <div ref={mapContainerRef} className={styles.mapFireControls} />

        {hoveredRegion && (
          <div className={styles.hoverBox}>
            <span className={styles.hoverBox__name}>{hoveredRegion.name}</span>
            <span className={styles.hoverBox__count}>{hoveredRegion.count}</span>
            <span className={styles.hoverBox__label}>пожаров</span>
          </div>
        )}

        {/* Gradient legend overlay */}
        <div className={styles.colorLegend}>
          <div className={styles.gradientBar} />
          <div className={styles.gradientLabels}>
            <span>Мало</span>
            <span>Много</span>
          </div>
        </div>
      </div>

      {/* Region ranking */}
      <div className={styles.legendSection}>
        <div className={styles.legend}>
          <h4 className={styles.legendTitle}>Регионы по количеству пожаров</h4>
          <div className={styles.legendItems}>
            {sortedRegions.map(([region, count], idx) => {
              const pct = totalFires > 0 ? (count / totalFires) * 100 : 0;
              return (
                <div key={region} className={styles.legendItem}>
                  <span className={styles.legendRank}>{idx + 1}</span>
                  <div
                    className={styles.legendColor}
                    style={{ backgroundColor: getColorForValue(count) }}
                  />
                  <span className={styles.regionName}>{region}</span>
                  <div className={styles.legendBarWrap}>
                    <div
                      className={styles.legendBar}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={styles.fireCount}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};

export default MapFireControls;
