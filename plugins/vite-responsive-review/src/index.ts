import { Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INDIVIDUAL_DEVICES, Device } from './devices';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export * from './devices';

export interface ResponsiveReviewOptions {
  devices?: Device[];
  offsets?: {
    toolbar?: number;
    taskbar?: number;
    sideNav?: number;
  };
}

export function viteResponsiveReview(options: ResponsiveReviewOptions = {}): Plugin {
  return {
    name: 'vite-responsive-review',
    apply: 'serve',
    transformIndexHtml(html) {
      const inputDevices = options.devices || INDIVIDUAL_DEVICES;

      const offsets = {
        toolbar: 70,
        taskbar: 40,
        sideNav: 200,
        ...options.offsets,
      };

      const normalized = inputDevices.map((d, i) => ({
        ...d,
        id: d.id || `${d.label}-${i}`.toLowerCase().replace(/\s+/g, '-'),
        groups: Array.isArray(d.groups) ? d.groups : d.groups ? [d.groups] : ['Other'],
      }));

      const clientPath = path.resolve(__dirname, './client.ts');
      const clientCode = fs
        .readFileSync(clientPath, 'utf-8')
        .replace(/export\s+/g, '')
        .replace(/:\s*any/g, '');

      return [
        {
          tag: 'script',
          attrs: { type: 'module' },
          children: `
          ${clientCode}
          initResponsiveUI(${JSON.stringify(normalized)}, ${JSON.stringify(offsets)});
        `,
          injectTo: 'body',
        },
      ];
    },
  };
}
