import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ─── Content Security Policy ────────────────────────────────────────────────
//
// PRODUCTION  →  copy PROD_CSP into your web-server config as an HTTP header:
//
//   nginx:   add_header Content-Security-Policy "..." always;
//   Vercel:  vercel.json → headers[].values["Content-Security-Policy"]
//
// DEVELOPMENT →  DEV_CSP is sent by Vite's dev server (see server.headers).
//                It relaxes script-src with 'unsafe-inline' because
//                @vitejs/plugin-react injects an inline <script> preamble
//                for React Fast Refresh — the production build does not.
//
// ────────────────────────────────────────────────────────────────────────────

const CONNECT_ORIGINS = [
  'https://api.igmass.kz',
  'https://api.open-meteo.com',
  'https://api.openweathermap.org',
  'https://catalogue.dataspace.copernicus.eu',
  'https://demotiles.maplibre.org',
  'https://gibs.earthdata.nasa.gov',
  'https://mt1.google.com',
  'https://nominatim.openstreetmap.org',
  'https://planetarycomputer.microsoft.com',
  'https://sh.dataspace.copernicus.eu',
  'https://stac.dataspace.copernicus.eu',
  'https://tile.openstreetmap.org',
  'https://tiles.openfreemap.org',
].join(' ');

const SHARED_DIRECTIVES = [
  "worker-src  blob:",
  "style-src   'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src    'self' data: https://fonts.gstatic.com",
  "img-src     'self' data: blob: https://planetarycomputer.microsoft.com https://sh.dataspace.copernicus.eu https://openweathermap.org",
  "object-src  'none'",
  "base-uri    'self'",
];

// Strict — no inline scripts. For production HTTP headers only.
export const PROD_CSP = [
  "default-src 'self'",
  "script-src  'self' blob: 'wasm-unsafe-eval'",
  ...SHARED_DIRECTIVES,
  `connect-src 'self' ${CONNECT_ORIGINS}`,
].join('; ');

// Relaxed — allows Vite's HMR inline preamble and WebSocket.
const DEV_CSP = [
  "default-src 'self'",
  "script-src  'self' blob: 'wasm-unsafe-eval' 'unsafe-inline'",
  ...SHARED_DIRECTIVES,
  `connect-src 'self' ws://localhost:* wss://localhost:* ${CONNECT_ORIGINS}`,
].join('; ');

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Content-Security-Policy': DEV_CSP,
    },
    proxy: {
      '/fire-haz-tiles': {
        target: 'http://old.fires.kz',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/fire-haz-tiles/, '/data/fire_haz'),
      },
    },
  },
  build: {
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'maplibre':      ['maplibre-gl'],
          'recharts':      ['recharts'],
          'framer-motion': ['framer-motion'],
          'turf':          ['@turf/turf'],
        },
      },
    },
  },
  resolve: {
    alias: {
      src: "/src",
    },
    extensions: ['.js', '.jsx'],
  },
})
