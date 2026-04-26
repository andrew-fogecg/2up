import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: '../dist/frontend',
    emptyOutDir: false,
  },
});