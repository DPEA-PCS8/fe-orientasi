import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Update this to your backend API URL
        changeOrigin: true,
        secure: false, // Bypass SSL certificate validation
        // rewrite: (path) => path.replace(/^\/api/, ''), // Don't rewrite if backend expects /api
      },
    },
  },
})
