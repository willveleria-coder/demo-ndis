// ============================================================
// branding.js — Central branding config driven by env vars
// ============================================================
// Usage:  import { brand } from '@/config/branding'
//         <h1>{brand.appName}</h1>
//         <div style={{ background: brand.colors.primary }}>
//
// INSTANCES:
//   maple    → Maple Care Support (existing production client)
//   demo     → Demo instance with fake data for prospects
//   veleria  → Your own company site (veleria.com.au)
//   custom   → White-label base sold to new clients
//              (all colors auto-derived from VITE_PRIMARY_COLOR
//               and VITE_STAFF_COLOR — buyer only sets those + name + logo)
// ============================================================

// --- Color math helpers (no dependencies) ---
function hexToHSL(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Derive a full shade palette from a single hex color
function deriveShades(hex) {
  const [h, s] = hexToHSL(hex);
  return {
    base: hex,
    50:  hslToHex(h, Math.min(s, 100), 97),   // very light bg
    200: hslToHex(h, Math.min(s, 90),  87),    // ring / border
    600: hslToHex(h, s,                 45),    // hover
    800: hslToHex(h, Math.min(s + 10, 100), 28), // dark text
  };
}

// ============================================================
// BRAND PRESETS — known instances with hand-picked colors
// ============================================================

const BRAND_PRESETS = {
  veleria: {
    appName: 'Veleria NDIS',
    adminColor: '#f97316',   // orange-500
    staffColor: '#14b8a6',   // teal-500
    adminBg: '#fff7ed',      // orange-50
    staffBg: '#f0fdfa',      // teal-50
    adminHover: '#ea580c',   // orange-600
    staffHover: '#0d9488',   // teal-600
    adminRing: '#fed7aa',    // orange-200
    staffRing: '#99f6e4',    // teal-200
    adminText: '#9a3412',    // orange-800
    staffText: '#115e59',    // teal-800
    leafAdmin: '#f97316',
    leafStaff: '#22c55e',
    landingGradient: 'from-orange-50 to-teal-50',
  },
  demo: {
    appName: 'NDIS CRM Demo',
    adminColor: '#6366f1',   // indigo-500
    staffColor: '#06b6d4',   // cyan-500
    adminBg: '#eef2ff',      // indigo-50
    staffBg: '#ecfeff',      // cyan-50
    adminHover: '#4f46e5',   // indigo-600
    staffHover: '#0891b2',   // cyan-600
    adminRing: '#c7d2fe',    // indigo-200
    staffRing: '#a5f3fc',    // cyan-200
    adminText: '#3730a3',    // indigo-800
    staffText: '#155e75',    // cyan-800
    leafAdmin: '#6366f1',
    leafStaff: '#06b6d4',
    landingGradient: 'from-indigo-50 to-cyan-50',
  },
  veleria: {
    appName: 'Veleria CRM',
    adminColor: '#7c3aed',   // violet-600
    staffColor: '#3b82f6',   // blue-500
    adminBg: '#f5f3ff',      // violet-50
    staffBg: '#eff6ff',      // blue-50
    adminHover: '#6d28d9',   // violet-700
    staffHover: '#2563eb',   // blue-600
    adminRing: '#ddd6fe',    // violet-200
    staffRing: '#bfdbfe',    // blue-200
    adminText: '#5b21b6',    // violet-800
    staffText: '#1e40af',    // blue-800
    leafAdmin: '#7c3aed',
    leafStaff: '#3b82f6',
    landingGradient: 'from-violet-50 to-blue-50',
  },
  // "custom" is the white-label preset — all colors are auto-derived
  // from just VITE_PRIMARY_COLOR and VITE_STAFF_COLOR at runtime.
  // Buyers only need to set: name, logo, primary color, staff color.
  custom: null, // computed below
};

// ============================================================
// RESOLVE THE ACTIVE BRAND
// ============================================================

const style = import.meta.env.VITE_BRAND_STYLE || 'maple';

function resolvePreset() {
  // For known presets, use the hand-tuned values
  if (style !== 'custom' && BRAND_PRESETS[style]) {
    return BRAND_PRESETS[style];
  }

  // For "custom" (white-label), auto-derive everything from two hex colors
  const primaryHex = import.meta.env.VITE_PRIMARY_COLOR || '#2563eb'; // default blue-600
  const staffHex   = import.meta.env.VITE_STAFF_COLOR   || '#10b981'; // default emerald-500
  const p = deriveShades(primaryHex);
  const s = deriveShades(staffHex);

  return {
    appName: import.meta.env.VITE_APP_NAME || 'NDIS Care CRM',
    adminColor: p.base,
    staffColor: s.base,
    adminBg: p[50],
    staffBg: s[50],
    adminHover: p[600],
    staffHover: s[600],
    adminRing: p[200],
    staffRing: s[200],
    adminText: p[800],
    staffText: s[800],
    leafAdmin: p.base,
    leafStaff: s.base,
    landingGradient: null, // custom uses inline CSS gradients instead
  };
}

const preset = resolvePreset();

export const brand = {
  // Core identity
  appName: import.meta.env.VITE_APP_NAME || preset.appName,
  logoUrl: import.meta.env.VITE_APP_LOGO_URL || null,
  style,
  isCustom: style === 'custom',

  // Colors — env overrides always win, then preset, then derived
  colors: {
    primary:    import.meta.env.VITE_PRIMARY_COLOR || preset.adminColor,
    staff:      import.meta.env.VITE_STAFF_COLOR   || preset.staffColor,
    adminBg:    preset.adminBg,
    staffBg:    preset.staffBg,
    adminHover: preset.adminHover,
    staffHover: preset.staffHover,
    adminRing:  preset.adminRing,
    staffRing:  preset.staffRing,
    adminText:  preset.adminText,
    staffText:  preset.staffText,
    leafAdmin:  preset.leafAdmin,
    leafStaff:  preset.leafStaff,
  },

  // Tailwind class fragments (null for custom — use inline styles instead)
  tw: {
    landingGradient: preset.landingGradient,
  },
};

// CSS custom properties — inject once at app boot
export function injectBrandCSS() {
  const root = document.documentElement;
  root.style.setProperty('--brand-primary', brand.colors.primary);
  root.style.setProperty('--brand-staff', brand.colors.staff);
  root.style.setProperty('--brand-admin-bg', brand.colors.adminBg);
  root.style.setProperty('--brand-staff-bg', brand.colors.staffBg);
  root.style.setProperty('--brand-admin-hover', brand.colors.adminHover);
  root.style.setProperty('--brand-staff-hover', brand.colors.staffHover);
  root.style.setProperty('--brand-admin-ring', brand.colors.adminRing);
  root.style.setProperty('--brand-staff-ring', brand.colors.staffRing);
  root.style.setProperty('--brand-admin-text', brand.colors.adminText);
  root.style.setProperty('--brand-staff-text', brand.colors.staffText);
}

export default brand;