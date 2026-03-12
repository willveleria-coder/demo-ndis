// ============================================================
// useBrandStyles.js — Hook returning brand-aware style objects
// ============================================================
// Returns ready-to-use style objects for buttons, badges, etc.
// so you don't need to repeat brand.colors.xxx everywhere.
// ============================================================

import { useMemo } from 'react';
import { brand } from '../config/branding';

export function useBrandStyles(variant = 'admin') {
  return useMemo(() => {
    const isStaff = variant === 'staff';
    const primary = isStaff ? brand.colors.staff : brand.colors.primary;
    const hover = isStaff ? brand.colors.staffHover : brand.colors.adminHover;
    const bg = isStaff ? brand.colors.staffBg : brand.colors.adminBg;
    const ring = isStaff ? brand.colors.staffRing : brand.colors.adminRing;
    const text = isStaff ? brand.colors.staffText : brand.colors.adminText;

    return {
      // For primary action buttons
      primaryButton: {
        backgroundColor: primary,
        color: '#fff',
        borderRadius: '0.5rem',
        padding: '0.5rem 1rem',
        fontWeight: 600,
        border: 'none',
        cursor: 'pointer',
      },
      primaryButtonHover: {
        backgroundColor: hover,
      },

      // For outlined / secondary buttons
      outlineButton: {
        backgroundColor: 'transparent',
        color: primary,
        border: `2px solid ${primary}`,
        borderRadius: '0.5rem',
        padding: '0.5rem 1rem',
        fontWeight: 600,
        cursor: 'pointer',
      },

      // For subtle backgrounds (cards, panels)
      subtleBg: {
        backgroundColor: bg,
      },

      // For focus rings
      focusRing: {
        boxShadow: `0 0 0 3px ${ring}`,
      },

      // For badge / chip elements
      badge: {
        backgroundColor: bg,
        color: text,
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
      },

      // For sidebar active items
      sidebarActive: {
        backgroundColor: bg,
        color: text,
        borderLeft: `3px solid ${primary}`,
      },

      // Raw colors for custom use
      colors: { primary, hover, bg, ring, text },
    };
  }, [variant]);
}

export default useBrandStyles;