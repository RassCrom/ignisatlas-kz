import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { createInitialStyle } from '../../../../../../../modules/MapPage/utils/basemaps';
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

const getRegionNameExpression = ['coalesce', ['get', 'name'], ['get', 'name_igmass'], ''];

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
      { t: 0, hex: '#0f1535' },
      { t: 0.15, hex: '#1e3a6e' },
      { t: 0.35, hex: '#f59e0b' },
      { t: 0.6, hex: '#ef4444' },
      { t: 0.8, hex: '#cc0000' },
      { t: 1, hex: '#7a0000' },
    ];

    for (let i = 0; i < ramp.length - 1; i += 1) {
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
    return 'rgba(122,0,0,0.82)';
  }, [fireData]);

  const colorExpression = useMemo(() => {
    const match = ['match', getRegionNameExpression];
    Object.entries(fireData).forEach(([region, count]) => {
      match.push(region, getColorForValue(count));
    });
    match.push('rgba(255,255,255,0.04)');
    return match;
  }, [fireData, getColorForValue]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return undefined;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: createInitialStyle('osm'),
      center: DEFAULT_POSITION.center,
      zoom: DEFAULT_POSITION.zoom,
      minZoom: DEFAULT_POSITION.zoom,
      maxZoom: 22,
      attributionControl: false,
      interactive: true,
    });

    mapRef.current = map;

    map.on('load', () => {
      map.addSource('regions-source', {
        type: 'geojson',
        data: '/layers/KAZ_OSM_BORDER_LVL2.geojson',
      });
      map.addLayer({
        id: 'regions-fill',
        type: 'fill',
        source: 'regions-source',
        paint: {
          'fill-color': colorExpression,
          'fill-opacity': 1,
        },
      });
      map.addLayer({
        id: 'regions-line',
        type: 'line',
        source: 'regions-source',
        paint: {
          'line-color': 'rgba(136,139,224,0.25)',
          'line-width': 0.8,
        },
      });
    });

    const handleMove = (event) => {
      if (!map.getLayer('regions-fill')) return;
      const feature = map.queryRenderedFeatures(event.point, { layers: ['regions-fill'] })[0];
      if (feature) {
        map.getCanvas().style.cursor = 'pointer';
        const regionName = feature.properties?.name || feature.properties?.name_igmass;
        setHoveredRegion({ name: regionName, count: fireData[regionName] || 0 });
      } else {
        map.getCanvas().style.cursor = '';
        setHoveredRegion(null);
      }
    };

    map.on('mousemove', handleMove);
    return () => {
      map.off('mousemove', handleMove);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (map?.getLayer('regions-fill')) {
      map.setPaintProperty('regions-fill', 'fill-color', colorExpression);
    }
  }, [colorExpression]);

  const sortedRegions = Object.entries(fireData).sort(([, a], [, b]) => b - a);
  const totalFires = sortedRegions.reduce((s, [, c]) => s + c, 0);

  return (
    <div className={styles.mapFireWrapper}>
      <div className={styles.mapSection}>
        <div ref={mapContainerRef} className={styles.mapFireControls} />

        {hoveredRegion && (
          <div className={styles.hoverBox}>
            <span className={styles.hoverBox__name}>{hoveredRegion.name}</span>
            <span className={styles.hoverBox__count}>{hoveredRegion.count}</span>
            <span className={styles.hoverBox__label}>fires</span>
          </div>
        )}

        <div className={styles.colorLegend}>
          <div className={styles.gradientBar} />
          <div className={styles.gradientLabels}>
            <span>Low</span>
            <span>High</span>
          </div>
        </div>
      </div>

      <div className={styles.legendSection}>
        <div className={styles.legend}>
          <h4 className={styles.legendTitle}>Regions by fire count</h4>
          <div className={styles.legendItems}>
            {sortedRegions.map(([region, count], idx) => {
              const pct = totalFires > 0 ? (count / totalFires) * 100 : 0;
              return (
                <div key={region} className={styles.legendItem}>
                  <span className={styles.legendRank}>{idx + 1}</span>
                  <div className={styles.legendColor} style={{ backgroundColor: getColorForValue(count) }} />
                  <span className={styles.regionName}>{region}</span>
                  <div className={styles.legendBarWrap}>
                    <div className={styles.legendBar} style={{ width: `${pct}%` }} />
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
