import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite'; // v4 Vite plugin
import checker from 'vite-plugin-checker';
import path from 'path';
import {
  GROUP_ANDROID,
  GROUP_APPLE,
  GROUP_DESKTOP,
  viteResponsiveReview,
} from './plugins/vite-responsive-review/src';

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
      devices: [
        ...GROUP_APPLE,
        ...GROUP_ANDROID,
        ...GROUP_DESKTOP,
        // This will now work correctly!
        // Plugin turns group: 'Desktop' into groups: ['Desktop']
        { label: 'Ultra Wide', width: 3440, height: 1440, group: 'Desktop' },
        // This will default to group: ['Other']
        { label: 'Custom View', width: 500, height: 500 },
      ],
      offsets: {
        toolbar: 100, // Custom height for Chrome UI
        taskbar: 48, // Windows 11 Taskbar
        sideNav: 280, // Custom side navigation width
      },
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
