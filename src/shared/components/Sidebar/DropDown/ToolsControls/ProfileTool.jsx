import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, Trash2, TrendingUp, X } from 'lucide-react';
import { feature, length, along } from '@turf/turf';
import axios from 'axios';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import useAnalysisStore from 'src/app/store/analysisStore';
import { getMapInstance } from 'src/modules/MapPage/services/mapService';
import { startMapLibreDraw } from 'src/modules/MapPage/utils/maplibreDraw';
import { removeSourceWithLayers } from 'src/modules/MapPage/utils/maplibreHelpers';
import baseStyles from './ToolsControls.module.scss';
import styles from './AnalysisTools.module.scss';

const TOOL_ID = 'profile_tool';
const SOURCE_ID = 'profile-line-source';
const LAYER_ID = 'profile-line-layer';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const ensureLayer = (map) => {
  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }
  if (!map.getLayer(LAYER_ID)) {
    map.addLayer({
      id: LAYER_ID,
      type: 'line',
      source: SOURCE_ID,
      paint: {
        'line-color': 'rgba(167, 139, 250, 0.85)',
        'line-width': 2,
        'line-dasharray': [2, 1],
      },
    });
  }
};

const setLineData = (map, feature) => {
  map.getSource(SOURCE_ID)?.setData({
    type: 'FeatureCollection',
    features: feature ? [feature] : [],
  });
};

const ProfileTool = () => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState(null);
  const [lastLine, setLastLine] = useState(null);
  const [error, setError] = useState(null);
  const drawCleanupRef = useRef(null);

  const { activeToolId, setActiveTool } = useAnalysisStore();

  useEffect(() => {
    const map = getMapInstance();
    if (!map) return undefined;
    ensureLayer(map);
    return () => {
      drawCleanupRef.current?.();
      removeSourceWithLayers(map, SOURCE_ID);
    };
  }, []);

  const fetchProfile = useCallback(async (lineGeojson) => {
    setLoading(true);
    setError(null);
    setProfileData(null);
    setStats(null);

    try {
      const line = feature(lineGeojson);
      const lengthKm = length(line, { units: 'kilometers' });
      const n = clamp(Math.round(lengthKm * 5), 10, 100);
      const points = Array.from({ length: n }, (_, i) => {
        const dist = (lengthKm / (n - 1)) * i;
        return along(line, dist, { units: 'kilometers' });
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

      const elevations = chartData.map((d) => d.elevation);
      let gain = 0;
      let loss = 0;
      for (let i = 1; i < elevations.length; i += 1) {
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

    ensureLayer(map);
    setActiveTool(TOOL_ID);
    setIsDrawing(true);
    setLineData(map, null);
    setProfileData(null);
    setStats(null);
    setError(null);
    setLastLine(null);

    drawCleanupRef.current = startMapLibreDraw(map, {
      idPrefix: 'profile-line-draw',
      type: 'LineString',
      minPoints: 2,
      onComplete: (feature) => {
        setLineData(map, feature);
        setLastLine(feature.geometry);
        setIsDrawing(false);
        setActiveTool(null);
        fetchProfile(feature.geometry);
      },
      onCancel: () => {
        setIsDrawing(false);
        setActiveTool(null);
      },
    });
  }, [activeToolId, setActiveTool, fetchProfile]);

  const cancelDrawing = useCallback(() => {
    drawCleanupRef.current?.();
    drawCleanupRef.current = null;
    setIsDrawing(false);
    setActiveTool(null);
  }, [setActiveTool]);

  const retryFetch = useCallback(() => {
    if (lastLine) fetchProfile(lastLine);
  }, [lastLine, fetchProfile]);

  const clearAll = useCallback(() => {
    const map = getMapInstance();
    if (map) setLineData(map, null);
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
          Fetching elevation data...
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
            <div className={styles.statCard}><span>Min elevation</span><span>{stats.min} m</span></div>
            <div className={styles.statCard}><span>Max elevation</span><span>{stats.max} m</span></div>
            <div className={styles.statCard}><span>Total gain</span><span style={{ color: 'rgba(52,211,153,0.9)' }}>+{stats.gain} m</span></div>
            <div className={styles.statCard}><span>Total loss</span><span style={{ color: 'rgba(248,113,113,0.9)' }}>-{stats.loss} m</span></div>
          </div>

          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={110}>
              <AreaChart data={profileData} margin={{ top: 4, right: 6, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgba(167,139,250,0.6)" stopOpacity={0.6} />
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
                <YAxis tick={{ fontSize: 9, fill: 'rgba(217,218,245,0.35)' }} tickLine={false} axisLine={false} width={36} />
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
