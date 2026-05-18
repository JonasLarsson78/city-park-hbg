import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/parking': {
        target: 'https://oppnadata.helsingborg.se',
        changeOrigin: true,
        rewrite: path => '/sbf/transport/parkeringsautomater/parkeringsautomater.geojson',
      },
    },
  },
})
