import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  worker: {
    format: 'es',
  },
  resolve: {
    alias: {
      '@sim/elements': resolve(__dirname, '../elements/src/index.ts'),
      '@sim/engine': resolve(__dirname, '../sim-engine/src/index.ts'),
    },
  },
  optimizeDeps: {
    exclude: ['@sim/elements', '@sim/engine'],
  },
});
