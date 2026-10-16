import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // In dev, /api/* is forwarded to the local FastAPI, so the app and the API
    // share one origin: the same link works on home wifi and over Tailscale,
    // and the browser needs no CORS preflights. Use VITE_API_BASE_URL=/api.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
