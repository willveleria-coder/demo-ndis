import { useState, useRef, useEffect } from 'react'
import { Palette, Sun, Moon, Check } from 'lucide-react'
import { useTheme, ACCENT_PRESETS } from '../context/ThemeContext'
import { brand } from '../config/branding'

export default function ThemeDropdown() {
  const { mode, setMode, isDark, accentId, setAccentId } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Dark mode tokens
  const dk = {
    cardBg: isDark ? '#1e293b' : '#ffffff',
    border: isDark ? '#334155' : '#e5e7eb',
    text: isDark ? '#e2e8f0' : '#1f2937',
    textMuted: isDark ? '#94a3b8' : '#6b7280',
    textFaint: isDark ? '#64748b' : '#9ca3af',
    hover: isDark ? '#334155' : '#f3f4f6',
    inactiveBg: isDark ? '#334155' : '#f3f4f6',
  }

  const modes = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg transition-colors"
        title="Theme settings"
        style={{ color: dk.textMuted }}
      >
        <Palette size={19} />
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-64 rounded-2xl shadow-2xl z-[100] overflow-hidden" style={{ backgroundColor: dk.cardBg, border: `1px solid ${dk.border}` }}>
          {/* Mode toggle */}
          <div className="p-3" style={{ borderBottom: `1px solid ${dk.border}` }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: dk.textFaint }}>Appearance</p>
            <div className="flex gap-1.5">
              {modes.map(m => {
                const active = mode === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={active
                      ? { background: `linear-gradient(135deg, ${brand.colors.primary}, ${brand.colors.adminHover})`, color: '#fff' }
                      : { backgroundColor: dk.inactiveBg, color: dk.textMuted }
                    }
                  >
                    <m.icon size={14} />
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Accent color picker */}
          <div className="p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: dk.textFaint }}>Accent Colour</p>
            <div className="grid grid-cols-3 gap-1.5">
              {ACCENT_PRESETS.map(preset => {
                const isActive = accentId === preset.id
                const displayColor = preset.hex || brand.colors.primary
                return (
                  <button
                    key={preset.id}
                    onClick={() => setAccentId(preset.id)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-[11px] font-semibold transition-all"
                    style={isActive
                      ? { background: `${displayColor}18`, boxShadow: `0 0 0 2px ${displayColor}, 0 0 0 3px ${dk.cardBg}` }
                      : {}
                    }
                  >
                    <div
                      className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center shadow-sm"
                      style={{ background: displayColor }}
                    >
                      {isActive && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className="truncate" style={{ color: dk.text }}>
                      {preset.id === 'brand' ? 'Default' : preset.label.split(' ').pop()}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Preview strip */}
          <div className="px-3 pb-3">
            <div
              className="h-2 rounded-full"
              style={{
                background: `linear-gradient(to right, ${
                  (ACCENT_PRESETS.find(p => p.id === accentId)?.hex || brand.colors.primary)
                }, ${
                  (ACCENT_PRESETS.find(p => p.id === accentId)?.hover || brand.colors.adminHover)
                })`
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}