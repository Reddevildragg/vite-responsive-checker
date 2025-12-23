import { Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INDIVIDUAL_DEVICES, Device } from './devices';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export * from './devices';

export interface GroupOffsets {
  toolbar?: number;
  taskbar?: number;
  sideNav?: number;
}

export interface ResponsiveReviewOptions {
  devices?: Device[];
  // Map group names to specific offsets
  groupOffsets?: Record<string, GroupOffsets>;
}

export function viteResponsiveReview(options: ResponsiveReviewOptions = {}): Plugin {
  return {
    name: 'vite-responsive-review',
    apply: 'serve',
    transformIndexHtml(html) {
      const inputDevices = options.devices || INDIVIDUAL_DEVICES;

      // Sensible defaults per common group
      const defaultGroupOffsets: Record<string, GroupOffsets> = {
        Desktop: { toolbar: 85, taskbar: 48, sideNav: 80 },
        Laptop: { toolbar: 85, taskbar: 48, sideNav: 80 },
        Tablet: { toolbar: 70, taskbar: 0, sideNav: 60 },
        Mobile: { toolbar: 60, taskbar: 0, sideNav: 0 },
        Other: { toolbar: 40, taskbar: 0, sideNav: 0 },
      };

      const finalOffsets = { ...defaultGroupOffsets, ...options.groupOffsets };

      const normalized = inputDevices.map((d, i) => ({
        ...d,
        id: d.id || `${d.label}-${i}`.toLowerCase().replace(/\s+/g, '-'),
        groups: Array.isArray(d.groups) ? d.groups : d.groups ? [d.groups] : ['Other'],
      }));

      const clientCode = fs
        .readFileSync(path.resolve(__dirname, './client.ts'), 'utf-8')
        .replace(/export\s+/g, '')
        .replace(/:\s*any/g, '');

      return [
        {
          tag: 'script',
          attrs: { type: 'module' },
          children: `${clientCode} initResponsiveUI(${JSON.stringify(normalized)}, ${JSON.stringify(finalOffsets)});`,
          injectTo: 'body',
        },
      ];
    },
  };
}
