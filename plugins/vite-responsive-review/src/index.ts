import type { Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface Device {
  label: string;
  width: number;
  height: number;
}

export interface ResponsiveReviewOptions {
  devices?: Device[];
}

const defaultDevices: Device[] = [
  { label: 'Mobile (SE)', width: 375, height: 667 },
  { label: 'Tablet', width: 768, height: 1024 },
  { label: 'Laptop', width: 1280, height: 800 },
  { label: 'Desktop', width: 1920, height: 1080 },
];

export function viteResponsiveReview(options: ResponsiveReviewOptions = {}): Plugin {
  return {
    name: 'vite-responsive-review',
    apply: 'serve',
    transformIndexHtml(html) {
      const devices = options.devices || defaultDevices;

      // Resolve the client script path (works in dev and after build)
      const clientPath = path.resolve(__dirname, './client.ts');
      let clientCode = '';

      if (fs.existsSync(clientPath)) {
        clientCode = fs.readFileSync(clientPath, 'utf-8');
      } else {
        // Fallback for production/dist builds
        clientCode = fs.readFileSync(path.resolve(__dirname, './client.js'), 'utf-8');
      }

      // Clean the code: Remove 'export' and any leftover TS 'any' types just in case
      const executableCode = clientCode
        .replace(/export\s+/g, '')
        .replace(/:\s*any/g, '')
        .replace(/:\s*string/g, '');

      return [
        {
          tag: 'script',
          attrs: { type: 'module' },
          children: `
            ${executableCode}
            if (typeof initResponsiveUI === 'function') {
              initResponsiveUI(${JSON.stringify(devices)});
            }
          `,
          injectTo: 'body',
        },
      ];
    },
  };
}
