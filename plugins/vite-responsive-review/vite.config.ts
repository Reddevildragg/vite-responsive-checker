import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ViteResponsiveReview',
      fileName: 'index',
      formats: ['es']
    },
    rollupOptions: {
      // Ensure we don't bundle Vite itself into the plugin
      external: ['vite', 'fs', 'path'],
      output: {
        globals: {
          vite: 'Vite'
        }
      }
    }
  },
  plugins: [
    dts({ rollupTypes: true }) // Merges all types into one .d.ts file
  ]
});