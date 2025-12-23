import { Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INDIVIDUAL_DEVICES, Device } from './devices';

// Handle directory name for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Re-export all device constants and interfaces for the user
export * from './devices';

export interface GroupOffsets {
  toolbar?: number;
  taskbar?: number;
  sideNav?: number;
}

export interface ResponsiveReviewOptions {
  /** List of devices to display. Defaults to INDIVIDUAL_DEVICES (30+ devices) */
  devices?: Device[];
  /** Custom offsets for specific groups (Desktop, Tablet, Mobile, etc.) */
  groupOffsets?: Record<string, GroupOffsets>;
}

/**
 * Vite Responsive Review Plugin
 * Simulates multiple device resolutions and browser environments simultaneously.
 */
export function viteResponsiveReview(options: ResponsiveReviewOptions = {}): Plugin {
  return {
    name: 'vite-responsive-review',

    // Only apply during development
    apply: 'serve',

    transformIndexHtml(html) {
      // 1. Gather input or use defaults
      const inputDevices = options.devices || INDIVIDUAL_DEVICES;

      // 2. Define standard fallback offsets for major groups
      const defaultGroupOffsets: Record<string, GroupOffsets> = {
        Desktop: { toolbar: 85, taskbar: 48, sideNav: 80 },
        Laptop: { toolbar: 85, taskbar: 48, sideNav: 80 },
        Tablet: { toolbar: 70, taskbar: 0, sideNav: 60 },
        Mobile: { toolbar: 60, taskbar: 0, sideNav: 0 },
        Other: { toolbar: 40, taskbar: 0, sideNav: 0 },
        ...options.groupOffsets, // Merge user overrides
      };

      // 3. Normalize Devices
      // - Ensures 'groups' is always an array
      // - Ensures 'id' is unique
      // - Ensures individual 'offsets' exists
      const normalizedDevices = inputDevices.map((d, i) => {
        const id = d.id || `${d.label}-${d.width}-${i}`.toLowerCase().replace(/\s+/g, '-');

        let finalGroups: string[] = ['Other'];
        if (Array.isArray(d.groups)) {
          finalGroups = d.groups;
        } else if (typeof d.groups === 'string') {
          finalGroups = [d.groups];
        }

        return {
          ...d,
          id,
          groups: finalGroups,
          offsets: d.offsets || {},
        };
      });

      // 4. Resolve and Load the Client Script
      // We look for .ts in source, or fallback to .js if running from a built package
      const clientPath = path.resolve(__dirname, './client.ts');
      let clientCode = '';

      try {
        clientCode = fs.readFileSync(clientPath, 'utf-8');
      } catch (e) {
        // Fallback for production/npm-dist scenarios
        const distPath = path.resolve(__dirname, './client.js');
        clientCode = fs.readFileSync(distPath, 'utf-8');
      }

      /**
       * 5. Clean the code for Browser execution
       * Browsers don't support 'export' in injected scripts without type="module"
       * We also strip TypeScript type annotations to prevent SyntaxErrors
       */
      const executableCode = clientCode
        .replace(/export\s+const/g, 'const')
        .replace(/export\s+function/g, 'function')
        .replace(/:\s*any/g, '')
        .replace(/:\s*Device\[\]/g, '')
        .replace(/:\s*string/g, '')
        .replace(/:\s*number/g, '');

      // 6. Return the script to be injected into the <body>
      return [
        {
          tag: 'script',
          attrs: { type: 'module', 'data-plugin': 'vite-responsive-review' },
          children: `
            ${executableCode}
            
            // Initialize the UI with normalized data
            if (typeof initResponsiveUI === 'function') {
              initResponsiveUI(
                ${JSON.stringify(normalizedDevices)}, 
                ${JSON.stringify(defaultGroupOffsets)}
              );
            }
          `,
          injectTo: 'body',
        },
      ];
    },
  };
}
