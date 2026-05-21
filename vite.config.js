import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],  
  server: {
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
  },
  resolve: {
    alias: {
      src: "/src",
    },
    extensions: ['.js', '.jsx']
  },
  // define: {
  //   __APP_VERSION__: JSON.stringify("0.0.1"),
  //   __BUILD_TIMESTAMP__: JSON.stringify(dayjs().format("DD.MM.YYYY HH:mm:ss")),
  //   __FIRES_SERVER_HOST__: JSON.stringify(env.FIRES_SERVER_HOST),
  // },
})
