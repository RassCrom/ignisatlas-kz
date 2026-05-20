import { useState, useEffect, useRef, useCallback } from 'react';
import { TrendingUp, X, Trash2, RefreshCw } from 'lucide-react';
import * as turf from '@turf/turf';
import axios from 'axios';
import Draw from 'ol/interaction/Draw';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Stroke, Fill, Circle as CircleStyle } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import useAnalysisStore from 'src/app/store/analysisStore';
import { getMapInstance } from 'src/modules/MapPage/services/mapService';
import baseStyles from './ToolsControls.module.scss';
import styles from './AnalysisTools.module.scss';

const TOOL_ID = 'profile_tool';

const LINE_STYLE = new Style({
  stroke: new Stroke({ color: 'rgba(167, 139, 250, 0.85)', width: 2, lineDash: [6, 4] }),
  image: new CircleStyle({
    radius: 4,
    fill: new Fill({ color: 'rgba(167, 139, 250, 0.8)' }),
    stroke: new Stroke({ color: 'rgba(167, 139, 250, 0.4)', width: 1 }),
  }),
});

const geojsonFormat = new GeoJSON();

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const ProfileTool = () => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null); // [{ distance, elevation }]
  const [stats, setStats] = useState(null);             // { min, max, gain, loss }
  const [lastLine, setLastLine] = useState(null);        // GeoJSON LineString (4326)
  const [error, setError] = useState(null);

  const drawRef = useRef(null);
  const sourceRef = useRef(null);
  const layerRef = useRef(null);

  const { activeToolId, setActiveTool } = useAnalysisStore();

  useEffect(() => {
    const map = getMapInstance();
    if (!map) return;

    const source = new VectorSource();
    const layer = new VectorLayer({ source, style: LINE_STYLE, zIndex: 489 });
    layer.set('id', 'profile-line-layer');
    map.addLayer(layer);
    sourceRef.current = source;
    layerRef.current = layer;

    return () => { map.removeLayer(layer); };
  }, []);

  const fetchProfile = useCallback(async (lineGeojson) => {
    setLoading(true);
    setError(null);
    setProfileData(null);
    setStats(null);

    try {
      const line = turf.feature(lineGeojson);
      const lengthKm = turf.length(line, { units: 'kilometers' });
      const n = clamp(Math.round(lengthKm * 5), 10, 100);

      const points = Array.from({ length: n }, (_, i) => {
        const dist = (lengthKm / (n - 1)) * i;
        return turf.along(line, dist, { units: 'kilometers' });
      });

      const locations = points
        .map((p) => `${p.geometry.coordinates[1]},${p.geometry.coordinates[0]}`)
        .join('|');

      const { data } = await axios.get('https://api.opentopodata.org/v1/copernicus30', {
        params: { locations },
      });

      if (data.status !== 'OK') throw new Error(`API error: ${data.status}`);

      const chartData = data.results.map((r, i) => ({
        distance: +((lengthKm / (n - 1)) * i).toFixed(2),
        elevation: r.elevation ?? 0,
      }));

      // Compute stats
      const elevations = chartData.map((d) => d.elevation);
      let gain = 0;
      let loss = 0;
      for (let i = 1; i < elevations.length; i++) {
        const diff = elevations[i] - elevations[i - 1];
        if (diff > 0) gain += diff;
        else loss += Math.abs(diff);
      }

      setProfileData(chartData);
      setStats({
        min: Math.min(...elevations).toFixed(0),
        max: Math.max(...elevations).toFixed(0),
        gain: gain.toFixed(0),
        loss: loss.toFixed(0),
      });
    } catch (e) {
      setError(e.message || 'Failed to fetch elevation data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const startDrawing = useCallback(() => {
    const map = getMapInstance();
    if (!map || (activeToolId !== null && activeToolId !== TOOL_ID)) return;

    setActiveTool(TOOL_ID);
    setIsDrawing(true);
    sourceRef.current?.clear();
    setProfileData(null);
    setStats(null);
    setError(null);
    setLastLine(null);

    const draw = new Draw({ source: sourceRef.current, type: 'LineString', style: LINE_STYLE });
    drawRef.current = draw;

    draw.on('drawend', (e) => {
      const geom = e.feature.getGeometry();
      const geojson = geojsonFormat.writeGeometryObject(geom, {
        featureProjection: 'EPSG:3857',
        dataProjection: 'EPSG:4326',
      });
      setLastLine(geojson);

      map.removeInteraction(draw);
      drawRef.current = null;
      setIsDrawing(false);
      setActiveTool(null);

      fetchProfile(geojson);
    });

    map.addInteraction(draw);
  }, [activeToolId, setActiveTool, fetchProfile]);

  const cancelDrawing = useCallback(() => {
    const map = getMapInstance();
    if (drawRef.current && map) {
      map.removeInteraction(drawRef.current);
      drawRef.current = null;
    }
    setIsDrawing(false);
    setActiveTool(null);
  }, [setActiveTool]);

  const retryFetch = useCallback(() => {
    if (lastLine) fetchProfile(lastLine);
  }, [lastLine, fetchProfile]);

  const clearAll = useCallback(() => {
    sourceRef.current?.clear();
    setProfileData(null);
    setStats(null);
    setLastLine(null);
    setError(null);
  }, []);

  const blocked = activeToolId !== null && activeToolId !== TOOL_ID;

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{
        background: 'rgba(9,10,36,0.92)',
        border: '1px solid rgba(167,139,250,0.3)',
        borderRadius: '0.3rem',
        padding: '0.3rem 0.5rem',
        fontSize: '0.65rem',
        color: 'rgba(217,218,245,0.85)',
      }}>
        <div>{d.distance} km</div>
        <div style={{ color: 'rgba(167,139,250,0.9)' }}>{d.elevation} m</div>
      </div>
    );
  };

  return (
    <div className={styles.toolWrap}>
      <p className={baseStyles.toolDesc}>
        Draw a transect line to generate an elevation profile from Copernicus DEM GLO-30.
      </p>

      {isDrawing ? (
        <button className={styles.cancelBtn} onClick={cancelDrawing}>
          <X size={13} /> Cancel
        </button>
      ) : (
        <button className={styles.activateBtn} onClick={startDrawing} disabled={blocked || loading}>
          <TrendingUp size={13} /> Draw Transect Line
        </button>
      )}

      {loading && (
        <div className={styles.loadingRow}>
          <span className={styles.spinner} />
          Fetching elevation data…
        </div>
      )}

      {error && (
        <>
          <p className={`${baseStyles.statusMsg} ${baseStyles.statusError}`}>{error}</p>
          {lastLine && (
            <button className={styles.applyBtn} onClick={retryFetch}>
              <RefreshCw size={13} /> Retry
            </button>
          )}
        </>
      )}

      {profileData && stats && (
        <>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span>Min elevation</span>
              <span>{stats.min} m</span>
            </div>
            <div className={styles.statCard}>
              <span>Max elevation</span>
              <span>{stats.max} m</span>
            </div>
            <div className={styles.statCard}>
              <span>Total gain</span>
              <span style={{ color: 'rgba(52,211,153,0.9)' }}>+{stats.gain} m</span>
            </div>
            <div className={styles.statCard}>
              <span>Total loss</span>
              <span style={{ color: 'rgba(248,113,113,0.9)' }}>-{stats.loss} m</span>
            </div>
          </div>

          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={110}>
              <AreaChart data={profileData} margin={{ top: 4, right: 6, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="rgba(167,139,250,0.6)" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="rgba(167,139,250,0.05)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="distance"
                  tick={{ fontSize: 9, fill: 'rgba(217,218,245,0.35)' }}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: 'km', position: 'insideRight', offset: 4, fontSize: 9, fill: 'rgba(217,218,245,0.25)' }}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: 'rgba(217,218,245,0.35)' }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="elevation"
                  stroke="rgba(167,139,250,0.8)"
                  strokeWidth={1.5}
                  fill="url(#elevGrad)"
                  dot={false}
                  activeDot={{ r: 3, fill: 'rgba(167,139,250,0.9)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {(profileData || lastLine) && !loading && (
        <button className={styles.cancelBtn} onClick={clearAll}>
          <Trash2 size={13} /> Clear
        </button>
      )}
    </div>
  );
};

export default ProfileTool;
