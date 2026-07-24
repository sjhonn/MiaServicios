// Configura Vite y genera la aplicacion en docs.
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: './',
  plugins: [vue()],
  build: {
    outDir: '../docs',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 800
  },
  server: {
    port: 5173,
    strictPort: true
  }
});
