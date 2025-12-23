import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite'; // v4 Vite plugin
import checker from 'vite-plugin-checker';
import path from 'path';
import { viteResponsiveReview } from './plugins/vite-responsive-review/src';


export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    checker({
      enableBuild: false,
      typescript: true,
      vueTsc: true,
      eslint: {
        // tell the plugin we’re on ESLint 9 flat config
        useFlatConfig: true,
        lintCommand: 'eslint --ext .ts,.tsx,.vue src',
      },
      stylelint: { lintCommand: 'stylelint "./**/*.{css,vue}"' },
    }),
    viteResponsiveReview({
      // your custom devices here if needed
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@plugins': path.resolve(__dirname, './plugins'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
});
