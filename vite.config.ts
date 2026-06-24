import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  // basicSsl provides a self-signed cert so the dev server can run over https.
  // Vite 7 no longer generates a cert from `https: true` alone (T11).
  plugins: [react(), basicSsl()],
  server: {
    // SSO requires FE served over https on port 5174 to match the registered
    // redirect URI https://localhost:5174/signin-oidc (T11).
    https: {},
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
