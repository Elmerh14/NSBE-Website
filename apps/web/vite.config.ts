import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Read the shared .env at the repo root (only VITE_* vars reach the browser).
  envDir: '../../',
  server: {
    port: 5173,
    strictPort: true,
    // In dev, /api is forwarded to the local API, so no CORS is needed locally.
    // Production calls the API's own domain via VITE_API_URL.
    proxy: { '/api': 'http://localhost:3000' },
  },
});
