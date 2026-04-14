import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://backend-app-test-orientasi.apps.ocp.ojk.go.id',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
