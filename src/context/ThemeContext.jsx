import { createContext, useContext, useState, useEffect, useCallback } from 'react'

// ─── Accent color presets ───
export const ACCENT_PRESETS = [
  { id: 'brand',   label: 'Brand Default', hex: null },          // uses branding.js colors
  { id: 'blue',    label: 'Ocean Blue',    hex: '#3b82f6', hover: '#2563eb', bg: '#eff6ff', ring: '#bfdbfe', text: '#1e40af' },
  { id: 'violet',  label: 'Royal Violet',  hex: '#7c3aed', hover: '#6d28d9', bg: '#f5f3ff', ring: '#ddd6fe', text: '#5b21b6' },
  { id: 'rose',    label: 'Rose Pink',     hex: '#f43f5e', hover: '#e11d48', bg: '#fff1f2', ring: '#fecdd3', text: '#9f1239' },
  { id: 'emerald', label: 'Forest Green',  hex: '#10b981', hover: '#059669', bg: '#ecfdf5', ring: '#a7f3d0', text: '#065f46' },
  { id: 'amber',   label: 'Sunset Amber',  hex: '#f59e0b', hover: '#d97706', bg: '#fffbeb', ring: '#fde68a', text: '#92400e' },
  { id: 'cyan',    label: 'Electric Cyan',  hex: '#06b6d4', hover: '#0891b2', bg: '#ecfeff', ring: '#a5f3fc', text: '#155e75' },
  { id: 'indigo',  label: 'Deep Indigo',   hex: '#6366f1', hover: '#4f46e5', bg: '#eef2ff', ring: '#c7d2fe', text: '#3730a3' },
  { id: 'orange',  label: 'Bright Orange', hex: '#f97316', hover: '#ea580c', bg: '#fff7ed', ring: '#fed7aa', text: '#9a3412' },
]

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  // ─── Load persisted values ───
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('theme-mode') || 'light' } catch { return 'light' }
  })
  const [accentId, setAccentId] = useState(() => {
    try { return localStorage.getItem('theme-accent') || 'brand' } catch { return 'brand' }
  })

  // ─── Apply dark/light class to <html> + force body styles ───
  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    if (mode === 'dark') {
      root.classList.add('dark')
      body.style.backgroundColor = '#0f172a'
      body.style.color = '#e2e8f0'
    } else {
      root.classList.remove('dark')
      body.style.backgroundColor = ''
      body.style.color = ''
    }
    try { localStorage.setItem('theme-mode', mode) } catch {}
  }, [mode])

  // ─── Persist accent choice ───
  useEffect(() => {
    try { localStorage.setItem('theme-accent', accentId) } catch {}
  }, [accentId])

  const toggleMode = useCallback(() => {
    setMode(prev => prev === 'light' ? 'dark' : 'light')
  }, [])

  const accent = ACCENT_PRESETS.find(p => p.id === accentId) || ACCENT_PRESETS[0]

  const value = {
    mode,
    setMode,
    toggleMode,
    isDark: mode === 'dark',
    accentId,
    setAccentId,
    accent,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

export default ThemeContext