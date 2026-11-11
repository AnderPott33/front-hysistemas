import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: false,
    hmr: {
      host: 'localhost',
      port: 5173,
      protocol: 'ws',
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
    /* proxy: {
      '/ruc-set': {
        target: 'https://ruc.sun.com.py',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/ruc-set/, '/api/ruc'),
      }, 
    },*/
  },
})