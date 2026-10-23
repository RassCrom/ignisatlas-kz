// Dev-only feasibility page (M0, Task 10): 20 000 deck.gl points drawn interleaved with the
// MapLibre 5 globe. It answers one question: can the story's embers be a deck.gl layer on the
// globe, or do they need a custom MapLibre layer. The page is served only under import.meta.env.DEV
// (see App.jsx), so deck.gl never reaches the production bundle. Findings: docs/superpowers/notes/.
import { useCallback, useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer } from '@deck.gl/layers';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/dark';
const POINT_COUNT = 20_000;
const SEED = 20261023;
// Frame of Kazakhstan: lon 46-87, lat 40-56.
const LON_RANGE = [46, 87];
const LAT_RANGE = [40, 56];
const START_VIEW = { center: [67, 48], zoom: 3 };
const ZOOM_PRESETS = [1.5, 3, 5];
const MAX_LOG_ENTRIES = 200;
const WINDOW_MS = 500;
// ?baseline: the same page without deck.gl (map and native rings only), to tell what deck.gl adds to
// the console and to the frame time.
const BASELINE = new URLSearchParams(window.location.search).has('baseline');

// Reference points at known coordinates: the corners of the frame, its centre, Astana and Almaty.
// Each is drawn twice - a ring by a native MapLibre layer and a dot by deck.gl - so any drift of
// the deck.gl layer against the map shows as a dot leaving the middle of its ring.
const ANCHORS = [
  { name: 'SW corner', lngLat: [LON_RANGE[0], LAT_RANGE[0]] },
  { name: 'SE corner', lngLat: [LON_RANGE[1], LAT_RANGE[0]] },
  { name: 'NW corner', lngLat: [LON_RANGE[0], LAT_RANGE[1]] },
  { name: 'NE corner', lngLat: [LON_RANGE[1], LAT_RANGE[1]] },
  { name: 'centre', lngLat: [66.5, 48] },
  { name: 'Astana', lngLat: [71.4304, 51.1282] },
  { name: 'Almaty', lngLat: [76.8897, 43.2389] },
];

// The flyover that check 3 (frame rate) measures: out at z1.5, down to z5 over five places, back out.
const FLIGHT_LEGS = [
  { center: [76.8897, 43.2389], zoom: 5 },
  { center: [51.2, 43.65], zoom: 5 },
  { center: [71.4304, 51.1282], zoom: 5 },
  { center: [82.6, 49.95], zoom: 5 },
  { center: START_VIEW.center, zoom: 1.5 },
];

// Deterministic PRNG (mulberry32): the same seed gives the same 20 000 points on every load.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makePoints(count, seed) {
  const random = mulberry32(seed);
  const points = new Array(count);
  for (let i = 0; i < count; i += 1) {
    points[i] = [
      LON_RANGE[0] + random() * (LON_RANGE[1] - LON_RANGE[0]),
      LAT_RANGE[0] + random() * (LAT_RANGE[1] - LAT_RANGE[0]),
    ];
  }
  return points;
}

// Finding of the spike: on the globe, deck.gl puts a point at altitude 0 on the same sphere that
// MapLibre's own tiles already wrote into the depth buffer, so with the default depth test many
// points lose the z-fight and vanish (z3: about 80 % of the ember pixels, some reference dots
// entirely; the share depends on zoom and GPU). `depthCompare: 'always'` turns the test against the
// basemap off; deck.gl still hides points on the far side of the globe by itself. The page's
// "depth test" button switches the default back on only to reproduce the problem.
function buildLayers(points, depthTest) {
  const parameters = depthTest ? undefined : { depthCompare: 'always' };
  return [
    new ScatterplotLayer({
      id: 'spike-embers',
      data: points,
      getPosition: (d) => d,
      getRadius: 4000,
      radiusUnits: 'meters',
      radiusMinPixels: 1.2,
      radiusMaxPixels: 5,
      getFillColor: [255, 122, 43, 190],
      parameters,
    }),
    new ScatterplotLayer({
      id: 'spike-anchors-deck',
      data: ANCHORS,
      getPosition: (d) => d.lngLat,
      getRadius: 3,
      radiusUnits: 'pixels',
      getFillColor: [0, 229, 255, 255],
      parameters,
    }),
  ];
}

function addNativeAnchors(map) {
  map.addSource('spike-anchors', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: ANCHORS.map((a) => ({
        type: 'Feature',
        properties: { name: a.name },
        geometry: { type: 'Point', coordinates: a.lngLat },
      })),
    },
  });
  map.addLayer({
    id: 'spike-anchors-ring',
    type: 'circle',
    source: 'spike-anchors',
    paint: {
      'circle-radius': 9,
      'circle-color': 'rgba(0,0,0,0)',
      'circle-stroke-color': '#ff3b6b',
      'circle-stroke-width': 1.5,
    },
  });
}

function formatConsoleArgs(args) {
  return args
    .map((arg) => {
      if (typeof arg === 'string') return arg.replace(/%c/g, '');
      if (arg instanceof Error) return arg.message;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(' ')
    .trim();
}

// Collects console.error / console.warn calls, uncaught errors and rejected promises so they can be
// listed on the page (check 2: no errors or warnings from deck.gl or MapLibre).
function useConsoleCapture() {
  const [entries, setEntries] = useState([]);
  const counter = useRef(0);

  const push = useCallback((level, text) => {
    // Deferred: a console call made during another component's render must not set state here.
    queueMicrotask(() => {
      counter.current += 1;
      const entry = { id: counter.current, level, text };
      setEntries((prev) => [...prev.slice(-(MAX_LOG_ENTRIES - 1)), entry]);
    });
  }, []);

  useEffect(() => {
    const original = { error: console.error, warn: console.warn };
    console.error = (...args) => {
      original.error.apply(console, args);
      push('error', formatConsoleArgs(args));
    };
    console.warn = (...args) => {
      original.warn.apply(console, args);
      push('warn', formatConsoleArgs(args));
    };
    const onError = (event) => push('error', `uncaught: ${event.message || event.error}`);
    const onRejection = (event) => push('error', `unhandled rejection: ${event.reason?.message ?? event.reason}`);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      console.error = original.error;
      console.warn = original.warn;
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, [push]);

  return { entries, push, clear: () => setEntries([]) };
}

const styles = {
  page: { position: 'fixed', inset: 0, background: '#0c0c0c', color: '#e8e6df', font: '12px/1.4 ui-monospace, Consolas, monospace' },
  map: { position: 'absolute', inset: 0 },
  panel: { position: 'absolute', top: 12, left: 12, padding: 10, background: 'rgba(12,12,12,0.82)', border: '1px solid #3a3a3a', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 230 },
  row: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  button: { font: 'inherit', color: '#e8e6df', background: '#22252e', border: '1px solid #4a4f5c', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' },
  log: { position: 'absolute', left: 12, right: 12, bottom: 12, maxHeight: '28vh', overflow: 'auto', padding: 8, background: 'rgba(12,12,12,0.86)', border: '1px solid #3a3a3a', borderRadius: 6 },
  muted: { color: '#9a978c' },
};

export default function GlobeSpike() {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);
  const pointsRef = useRef(null);
  const zoomRef = useRef(null);
  const flightRef = useRef(null);
  const abortFlightRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [projection, setProjection] = useState('globe');
  const [depthTest, setDepthTest] = useState(false);
  const [fps, setFps] = useState(0);
  const [flightResult, setFlightResult] = useState(null);
  const [flying, setFlying] = useState(false);
  const { entries, push, clear } = useConsoleCapture();

  // The map, the native reference layer and the deck.gl overlay.
  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: START_VIEW.center,
      zoom: START_VIEW.zoom,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    pointsRef.current = makePoints(POINT_COUNT, SEED);
    // The depth switch always starts off (see buildLayers), including after a StrictMode remount.
    const overlay = new MapboxOverlay({ interleaved: true, layers: buildLayers(pointsRef.current, false) });
    overlayRef.current = overlay;

    const showZoom = () => {
      if (zoomRef.current) zoomRef.current.textContent = map.getZoom().toFixed(2);
    };
    map.on('move', showZoom);
    map.on('error', (event) => push('error', `maplibre: ${event.error?.message ?? event.message ?? 'unknown error'}`));
    map.once('style.load', () => {
      map.setProjection({ type: 'globe' });
      addNativeAnchors(map);
      if (!BASELINE) {
        map.addControl(overlay);
        // MapLibre 5.24 fires `projectiontransition` (not `styledata`) when setProjection() swaps the
        // projection, so the overlay would keep its old GlobeView/MapView. An empty setProps() makes it
        // rebuild the view from map.getProjection().
        map.on('projectiontransition', () => overlay.setProps({}));
      }
      showZoom();
      setReady(true);
    });

    // Handles for poking at the page from the browser console while checking.
    window.__globeSpike = { map, overlay };
    return () => {
      abortFlightRef.current = true;
      delete window.__globeSpike;
      map.remove();
      mapRef.current = null;
      overlayRef.current = null;
      setReady(false);
      setDepthTest(false);
    };
  }, [push]);

  // Frame counter. It counts requestAnimationFrame callbacks, so it drops when rendering is slow.
  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let windowStart = performance.now();
    let last = windowStart;
    const tick = (now) => {
      frames += 1;
      const flight = flightRef.current;
      if (flight) {
        flight.frames += 1;
        flight.worstFrame = Math.max(flight.worstFrame, now - last);
      }
      last = now;
      if (now - windowStart >= WINDOW_MS) {
        const value = (frames * 1000) / (now - windowStart);
        setFps(Math.round(value));
        if (flight) flight.windows.push(value);
        frames = 0;
        windowStart = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const toggleProjection = () => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const next = projection === 'globe' ? 'mercator' : 'globe';
    map.setProjection({ type: next });
    setProjection(next);
  };

  const toggleDepthTest = () => {
    if (!overlayRef.current) return;
    const next = !depthTest;
    overlayRef.current.setProps({ layers: buildLayers(pointsRef.current, next) });
    setDepthTest(next);
  };

  const jumpToZoom = (zoom) => mapRef.current?.jumpTo({ zoom });

  const flyOver = async () => {
    const map = mapRef.current;
    if (!map || !ready || flightRef.current) return;
    abortFlightRef.current = false;
    setFlying(true);
    setFlightResult(null);
    map.jumpTo({ center: START_VIEW.center, zoom: 1.5, bearing: 0, pitch: 0 });
    flightRef.current = { start: performance.now(), frames: 0, worstFrame: 0, windows: [] };
    for (const leg of FLIGHT_LEGS) {
      if (abortFlightRef.current) break;
      await new Promise((resolve) => {
        map.once('moveend', resolve);
        map.flyTo({ ...leg, duration: 4000, essential: true });
      });
    }
    const flight = flightRef.current;
    flightRef.current = null;
    if (!abortFlightRef.current) {
      const seconds = (performance.now() - flight.start) / 1000;
      setFlightResult({
        seconds: seconds.toFixed(1),
        avg: Math.round(flight.frames / seconds),
        min: Math.round(Math.min(...flight.windows)),
        worstFrame: Math.round(flight.worstFrame),
      });
      setFlying(false);
    }
  };

  return (
    <div style={styles.page}>
      <div ref={containerRef} style={styles.map} />
      <div style={styles.panel}>
        <div>
          <strong>{fps} fps</strong> <span style={styles.muted}>| zoom </span>
          <span ref={zoomRef}>-</span> <span style={styles.muted}>| {projection}</span>
        </div>
        <div style={styles.muted}>
          {BASELINE ? 'baseline: no deck.gl' : `${POINT_COUNT.toLocaleString('en-US')} points, seed ${SEED}`}
        </div>
        <div style={styles.row}>
          <button type="button" style={styles.button} onClick={toggleProjection} disabled={!ready}>
            {projection === 'globe' ? 'globe -> mercator' : 'mercator -> globe'}
          </button>
          <button type="button" style={styles.button} onClick={toggleDepthTest} disabled={!ready}>
            depth test vs basemap: {depthTest ? 'on' : 'off'}
          </button>
        </div>
        <div style={styles.row}>
          <span style={styles.muted}>zoom</span>
          {ZOOM_PRESETS.map((zoom) => (
            <button key={zoom} type="button" style={styles.button} onClick={() => jumpToZoom(zoom)} disabled={!ready}>
              {zoom}
            </button>
          ))}
        </div>
        <div style={styles.row}>
          <button type="button" style={styles.button} onClick={flyOver} disabled={!ready || flying}>
            {flying ? 'flying...' : 'flyover'}
          </button>
          {flightResult && (
            <span>
              avg {flightResult.avg} / min {flightResult.min} fps, worst frame {flightResult.worstFrame} ms ({flightResult.seconds} s)
            </span>
          )}
        </div>
        <div style={styles.muted}>ring = MapLibre layer, dot = deck.gl at the same coordinates</div>
      </div>
      <div style={styles.log} data-testid="console-log">
        <div style={styles.row}>
          <strong>
            console errors / warnings: {entries.length}
          </strong>
          <button type="button" style={styles.button} onClick={clear}>
            clear
          </button>
        </div>
        {entries.length === 0 && <div style={styles.muted}>none</div>}
        {entries.map((entry) => (
          <div key={entry.id} style={{ color: entry.level === 'error' ? '#ff7a7a' : '#ffd166' }}>
            [{entry.level}] {entry.text}
          </div>
        ))}
      </div>
    </div>
  );
}
