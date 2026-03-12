// ============================================================
// BrandLogo.jsx — Swappable logo component
// ============================================================
// Renders either a custom logo URL (from env) or the built-in
// SVG with brand-appropriate colors.
//
// For Maple Care production: set VITE_APP_LOGO_URL to your
// Supabase storage logo URL. For demo/veleria/custom: leave
// unset to use the built-in SVG with auto-colored brand hues.
// ============================================================

import React from 'react';
import { brand } from '../config/branding';

// Built-in leaf SVG (works for all brand presets)
function LeafIcon({ color1, color2, size = 32, className = '' }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color1} />
          <stop offset="100%" stopColor={color2} />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#brandGrad)" opacity="0.12" />
      <path d="M24 8c-2 4-6 8-12 10 2 6 8 14 12 22 4-8 10-16 12-22-6-2-10-6-12-10z" fill="url(#brandGrad)" />
      <path d="M24 14v18" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <path d="M24 20c-3-1-5 1-7 3M24 26c3-1 5 1 7 3" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.35" />
    </svg>
  );
}

/**
 * @param {'admin'|'staff'} variant - Which color set to use
 * @param {number} size - Icon size in px (default 32)
 * @param {string} className - Additional CSS classes
 */
export default function BrandLogo({ variant = 'admin', size = 32, className = '' }) {
  // If a custom logo URL is set, always use that
  if (brand.logoUrl) {
    return (
      <img
        src={brand.logoUrl}
        alt={brand.appName}
        width={size}
        height={size}
        className={`object-contain ${className}`}
        onError={e => { e.target.style.display = 'none' }}
      />
    );
  }

  // Otherwise render the built-in SVG with brand colors
  const color1 = variant === 'staff' ? brand.colors.staff : brand.colors.primary;
  const color2 = variant === 'staff' ? brand.colors.staffHover : brand.colors.adminHover;
  return <LeafIcon color1={color1} color2={color2} size={size} className={className} />;
}

/**
 * Full brand header with logo + app name + subtitle
 */
export function BrandHeader({ variant = 'admin', logoSize = 36, subtitle, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <BrandLogo variant={variant} size={logoSize} />
      <div>
        <span className="text-base font-bold text-gray-800">{brand.appName}</span>
        {subtitle && <p className="text-[10px] text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}