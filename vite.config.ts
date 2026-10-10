import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backend = (globalThis as any).process?.env?.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // Proxy API and media to the FastAPI backend so everything is same-origin
    // in development (no CORS issues for canvas export / clipboard).
    proxy: {
      '/api': backend,
      '/media': backend,
      '/sitemap.xml': backend,
      '/robots.txt': backend,
    },
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          konva: ['konva', 'react-konva'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
