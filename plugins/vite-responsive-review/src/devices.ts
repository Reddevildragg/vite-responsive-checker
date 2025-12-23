export interface Device {
  id?: string;
  label: string;
  width: number;
  height: number;
  groups?: string | string[]; // Smart property: string or array
}

export const INDIVIDUAL_DEVICES: Device[] = [
  // --- APPLE PHONES ---
  { id: 'ip-se', label: 'iPhone SE', width: 375, height: 667, groups: ['Mobile', 'Apple'] },
  { id: 'ip-13m', label: 'iPhone 13 Mini', width: 360, height: 780, groups: ['Mobile', 'Apple'] },
  { id: 'ip-15', label: 'iPhone 15', width: 393, height: 852, groups: ['Mobile', 'Apple'] },
  { id: 'ip-15p', label: 'iPhone 15 Pro', width: 393, height: 852, groups: ['Mobile', 'Apple'] },
  {
    id: 'ip-16pm',
    label: 'iPhone 16 Pro Max',
    width: 440,
    height: 956,
    groups: ['Mobile', 'Apple'],
  },

  // --- ANDROID PHONES ---
  {
    id: 's24-u',
    label: 'Galaxy S24 Ultra',
    width: 384,
    height: 854,
    groups: ['Mobile', 'Android'],
  },
  { id: 'p9-p', label: 'Pixel 9 Pro', width: 412, height: 915, groups: ['Mobile', 'Android'] },
  { id: 'p8', label: 'Pixel 8', width: 412, height: 732, groups: ['Mobile', 'Android'] },
  { id: 'n20-u', label: 'Note 20 Ultra', width: 412, height: 883, groups: ['Mobile', 'Android'] },
  { id: 'moto-g', label: 'Moto G Stylus', width: 395, height: 878, groups: ['Mobile', 'Android'] },
  { id: 'x-14', label: 'Xiaomi 14', width: 393, height: 852, groups: ['Mobile', 'Android'] },

  // --- FOLDABLES ---
  {
    id: 'z-fold',
    label: 'Galaxy Z Fold (Open)',
    width: 1812,
    height: 2176,
    groups: ['Mobile', 'Foldable', 'Android'],
  },
  {
    id: 'z-flip',
    label: 'Galaxy Z Flip',
    width: 412,
    height: 1004,
    groups: ['Mobile', 'Foldable', 'Android'],
  },
  {
    id: 'p-fold',
    label: 'Pixel Fold (Open)',
    width: 1840,
    height: 2208,
    groups: ['Mobile', 'Foldable', 'Android'],
  },

  // --- TABLETS ---
  { id: 'ipad-m', label: 'iPad Mini', width: 768, height: 1024, groups: ['Tablet', 'Apple'] },
  { id: 'ipad-a', label: 'iPad Air', width: 820, height: 1180, groups: ['Tablet', 'Apple'] },
  { id: 'ipad-p11', label: 'iPad Pro 11"', width: 834, height: 1194, groups: ['Tablet', 'Apple'] },
  {
    id: 'ipad-p12',
    label: 'iPad Pro 12.9"',
    width: 1024,
    height: 1366,
    groups: ['Tablet', 'Apple'],
  },
  { id: 'tab-s9', label: 'Galaxy Tab S9', width: 800, height: 1280, groups: ['Tablet', 'Android'] },
  {
    id: 'surface-p',
    label: 'Surface Pro 9',
    width: 1440,
    height: 960,
    groups: ['Tablet', 'Windows'],
  },

  // --- LAPTOPS & DESKTOPS ---
  { id: 'mb-a13', label: 'MacBook Air 13"', width: 1280, height: 800, groups: ['Laptop', 'Apple'] },
  { id: 'mb-p14', label: 'MacBook Pro 14"', width: 1512, height: 982, groups: ['Laptop', 'Apple'] },
  {
    id: 'mb-p16',
    label: 'MacBook Pro 16"',
    width: 1728,
    height: 1117,
    groups: ['Laptop', 'Apple'],
  },
  { id: 'dell-xps', label: 'Dell XPS 15', width: 1536, height: 960, groups: ['Laptop', 'Windows'] },
  {
    id: 'razer-15',
    label: 'Razer Blade 15',
    width: 1920,
    height: 1080,
    groups: ['Laptop', 'Windows'],
  },
  { id: 'desk-hd', label: 'Monitor (HD)', width: 1280, height: 720, groups: ['Desktop'] },
  { id: 'desk-fhd', label: 'Monitor (Full HD)', width: 1920, height: 1080, groups: ['Desktop'] },
  { id: 'desk-qhd', label: 'Monitor (QHD)', width: 2560, height: 1440, groups: ['Desktop'] },
  { id: 'desk-4k', label: 'Monitor (4K)', width: 3840, height: 2160, groups: ['Desktop'] },
  { id: 'ultra-w', label: 'Ultrawide 21:9', width: 3440, height: 1440, groups: ['Desktop'] },
];

// Helper for grouping
const filter = (name: string) =>
  INDIVIDUAL_DEVICES.filter((d) =>
    Array.isArray(d.groups) ? d.groups.includes(name) : d.groups === name,
  );

export const GROUP_MOBILE = filter('Mobile');
export const GROUP_TABLET = filter('Tablet');
export const GROUP_DESKTOP = [...filter('Desktop'), ...filter('Laptop')];
export const GROUP_APPLE = filter('Apple');
export const GROUP_ANDROID = filter('Android');
