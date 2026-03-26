import { useMemo } from 'react'
import { brand } from '../config/branding'
import { useTheme, ACCENT_PRESETS } from '../context/ThemeContext'

/**
 * Returns brand.colors merged with the user's accent choice.
 * If accent is 'brand' (default), returns the original branding.js colors.
 * If a custom accent is picked, overrides the admin/primary colors.
 *
 * Usage:
 *   const c = useBrandColors()
 *   <div style={{ background: c.primary }}>
 */
export function useBrandColors() {
  const { accentId } = useTheme()

  return useMemo(() => {
    const preset = ACCENT_PRESETS.find(p => p.id === accentId)

    // Default: use branding.js as-is
    if (!preset || preset.id === 'brand' || !preset.hex) {
      return brand.colors
    }

    // Override both admin AND staff colors with the user's accent choice
    return {
      ...brand.colors,
      // Admin / primary
      primary: preset.hex,
      adminHover: preset.hover,
      adminBg: preset.bg,
      adminRing: preset.ring,
      adminText: preset.text,
      leafAdmin: preset.hex,
      // Staff
      staff: preset.hex,
      staffHover: preset.hover,
      staffBg: preset.bg,
      staffRing: preset.ring,
      staffText: preset.text,
      leafStaff: preset.hex,
    }
  }, [accentId])
}

export default useBrandColors