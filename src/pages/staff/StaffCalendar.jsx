import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Calendar, MapPin, Play, Square, Activity,
  CheckCircle2, Clock, X, User, FileText, Filter, Search, ArrowRight,
  Sunrise, Sun, Moon, AlertTriangle, Eye, Flame, TrendingUp, Users,
  BarChart3, Target, Loader2, Shield, ChevronRight as ChevronR
} from 'lucide-react'
import { useStaff } from '../../context/StaffContext'
import { useBrandColors } from '../../hooks/useBrandColors'
import { useTheme } from '../../context/ThemeContext'
import Modal from '../../components/ui/Modal'
import GpsVerification from '../../components/GpsVerification'

/* ═══════════════════════════════════════════════
   HELPERS — all original preserved + new ones
   ═══════════════════════════════════════════════ */
function formatTime(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
}
function formatDateLong(iso) {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function formatDateShort(iso) {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00'), today = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}
function getShiftDuration(s) {
  if (s.clock_in && s.clock_out) return ((new Date(s.clock_out) - new Date(s.clock_in)) / 3600000).toFixed(1)
  if (s.start_time && s.end_time) {
    const start = new Date(s.start_time), end = new Date(s.end_time)
    return ((end - start) / 3600000).toFixed(1)
  }
  return null
}

/* ═══════════════════════════════════════════════
   DESIGN SYSTEM COMPONENTS
   ═══════════════════════════════════════════════ */

function Glass({ children, className = '', glow, style = {}, hover = false, isDark = false, onClick, ...p }) {
  const base = isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.55)'
  const border = isDark ? 'rgba(51,65,85,0.4)' : 'rgba(255,255,255,0.7)'
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: base,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${border}`,
        borderRadius: '1.25rem',
        boxShadow: glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)',
        transition: hover ? 'all .3s cubic-bezier(.16,1,.3,1)' : undefined,
        cursor: hover || onClick ? 'pointer' : undefined,
        ...style,
      }}
      onMouseEnter={hover ? e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = glow ? `0 16px 48px -8px ${glow}` : '0 12px 40px -8px rgba(0,0,0,0.12)'
      } : undefined}
      onMouseLeave={hover ? e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)'
      } : undefined}
      {...p}
    >
      {children}
    </div>
  )
}

function Orb({ color, size = 200, top, left, right, bottom, delay = 0 }) {
  return (
    <div style={{
      position: 'absolute', width: size, height: size, top, left, right, bottom,
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      opacity: 0.12, borderRadius: '50%',
      animation: `orbFloat ${6 + delay}s ease-in-out ${delay}s infinite`,
      pointerEvents: 'none', zIndex: 0,
    }} />
  )
}

function AnimNum({ value, duration = 1200, suffix = '' }) {
  const [display, setDisplay] = useState(0)
  const frameRef = useRef()
  useEffect(() => {
    const num = typeof value === 'number' ? value : parseFloat(value) || 0
    const start = performance.now()
    function tick(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(num * eased * 10) / 10)
      if (progress < 1) frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [value, duration])
  const isInt = Number.isInteger(typeof value === 'number' ? value : parseFloat(value))
  return <>{isInt ? Math.round(display) : display.toFixed(1)}{suffix}</>
}

function Badge({ children, color = 'gray', isDark }) {
  const palettes = {
    gray:   isDark ? { bg: 'rgba(100,116,139,0.2)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)' } : { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
    green:  isDark ? { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' } : { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
    amber:  isDark ? { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' } : { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    red:    isDark ? { bg: 'rgba(239,68,68,0.15)', text: '#f87171', border: 'rgba(239,68,68,0.3)' } : { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    blue:   isDark ? { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' } : { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    purple: isDark ? { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa', border: 'rgba(139,92,246,0.3)' } : { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
    orange: isDark ? { bg: 'rgba(249,115,22,0.15)', text: '#fb923c', border: 'rgba(249,115,22,0.3)' } : { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
    teal:   isDark ? { bg: 'rgba(20,184,166,0.15)', text: '#2dd4bf', border: 'rgba(20,184,166,0.3)' } : { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
  }
  const pl = palettes[color] || palettes.gray
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
      fontSize: 10, fontWeight: 700, letterSpacing: '0.02em',
      borderRadius: 999, background: pl.bg, color: pl.text,
      border: `1px solid ${pl.border}`, whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}

function CT({ active, payload, label, isDark }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(12px)', border: `1px solid ${isDark ? 'rgba(51,65,85,0.5)' : 'rgba(0,0,0,0.08)'}`,
      borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 32px -4px rgba(0,0,0,0.15)',
    }}>
      {label && <p style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#e2e8f0' : '#1f2937', marginBottom: 4 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#6b7280' }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: p.color || '#3b82f6', marginRight: 6 }} />
          {p.name}: <span style={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#1f2937' }}>{p.value}</span>
        </p>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   MAP PREVIEW — 100% preserved original logic
   ═══════════════════════════════════════════════ */
function MapPreview({ location, c, isDark, dk }) {
  const [coords, setCoords] = useState(null)
  const [loading, setLoading] = useState(false)
  const fetched = useRef(false)

  if (!location || location.length < 5) return null

  if (!fetched.current) {
    fetched.current = true
    setLoading(true)
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location + ', Australia')}&limit=1`, {
      headers: { 'User-Agent': 'VelCare/1.0' }
    }).then(r => r.json()).then(data => {
      if (data?.[0]) setCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display: data[0].display_name })
    }).catch(() => {}).finally(() => setLoading(false))
  }

  if (loading) return (
    <div style={{
      height: 190, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: dk.subtleBg, border: `1px solid ${dk.divider}`,
    }}>
      <Loader2 size={20} style={{ color: c.staff, animation: 'spin 1s linear infinite' }} />
    </div>
  )
  if (!coords) return null

  const zoom = 15
  const n = Math.pow(2, zoom)
  const xtile = ((coords.lon + 180) / 360) * n
  const ytile = ((1 - Math.log(Math.tan(coords.lat * Math.PI / 180) + 1 / Math.cos(coords.lat * Math.PI / 180)) / Math.PI) / 2) * n
  const cx = Math.floor(xtile), cy = Math.floor(ytile)
  const tiles = []
  for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) tiles.push({ x: cx + dx, y: cy + dy, dx, dy })
  const offsetX = (xtile - cx) * 256, offsetY = (ytile - cy) * 256
  const tileStyle = isDark ? 'dark_all' : 'light_all'

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${isDark ? `${c.staff}30` : c.staffBg}`, background: isDark ? '#1e293b' : '#f8f9fa' }}>
      <div style={{ position: 'relative', height: 190, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: `calc(50% - ${offsetX}px - 512px)`, top: `calc(50% - ${offsetY}px - 512px)`, width: `${256 * 5}px`, height: `${256 * 5}px` }}>
          {tiles.map(t => (
            <img key={`${t.x}-${t.y}`} src={`https://a.basemaps.cartocdn.com/${tileStyle}/${zoom}/${t.x}/${t.y}@2x.png`}
              alt="" style={{ position: 'absolute', left: `${(t.dx + 2) * 256}px`, top: `${(t.dy + 2) * 256}px`, width: 256, height: 256 }} draggable={false} />
          ))}
        </div>
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -100%)', zIndex: 10, filter: `drop-shadow(0 2px 4px ${c.staff}66)` }}>
          <svg width="36" height="46" viewBox="0 0 36 46" fill="none">
            <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.06 27.94 0 18 0z" fill={c.staff} />
            <circle cx="18" cy="16.5" r="7" fill="white" />
            <circle cx="18" cy="16.5" r="3.5" fill={c.staffHover} />
          </svg>
        </div>
      </div>
      <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, background: isDark ? `${c.staff}12` : c.staffBg }}>
        <div style={{
          width: 28, height: 28, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, flexShrink: 0,
        }}>
          <MapPin size={13} style={{ color: 'white' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: dk.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{coords.display?.split(',').slice(0, 3).join(',')}</p>
          <p style={{ fontSize: 9, color: dk.textFaint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{coords.display?.split(',').slice(3).join(',').trim()}</p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <a href={`https://maps.apple.com/?q=${encodeURIComponent(coords.display)}&ll=${coords.lat},${coords.lon}`}
            target="_blank" rel="noopener noreferrer"
            style={{ padding: '4px 10px', borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.15)' : '#1f2937', fontSize: 10, color: 'white', fontWeight: 700, textDecoration: 'none' }}>
            Apple
          </a>
          <a href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lon}`}
            target="_blank" rel="noopener noreferrer"
            style={{ padding: '4px 10px', borderRadius: 8, background: c.staff, fontSize: 10, color: 'white', fontWeight: 700, textDecoration: 'none' }}>
            Google
          </a>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function StaffCalendar() {
  const navigate = useNavigate()
  const { myShifts, handleClockIn, handleClockOut } = useStaff()
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loaded, setLoaded] = useState(false)
  const [viewDate, setViewDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('month')
  const [selectedDate, setSelectedDate] = useState(null)
  const [viewShift, setViewShift] = useState(null)
  const [gpsModal, setGpsModal] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { const t = setTimeout(() => setLoaded(true), 80); return () => clearTimeout(t) }, [])

  /* ─── color tokens ─── */
  const dk = {
    text: isDark ? '#e2e8f0' : '#1f2937',
    textSoft: isDark ? '#cbd5e1' : '#374151',
    textMuted: isDark ? '#94a3b8' : '#6b7280',
    textFaint: isDark ? '#64748b' : '#9ca3af',
    subtleBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    subtleBg2: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    inputBg: isDark ? 'rgba(30,41,59,0.8)' : 'white',
    inputBorder: isDark ? 'rgba(51,65,85,0.5)' : '#e5e7eb',
    divider: isDark ? 'rgba(51,65,85,0.3)' : 'rgba(0,0,0,0.05)',
    cellBorder: isDark ? 'rgba(51,65,85,0.2)' : 'rgba(0,0,0,0.04)',
  }

  const stg = (i) => ({
    transitionDelay: `${i * 50}ms`,
    opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(14px)',
    transition: 'all .6s cubic-bezier(.16,1,.3,1)',
  })

  const inputStyle = {
    width: '100%', padding: '10px 14px', background: dk.inputBg,
    border: `1.5px solid ${dk.inputBorder}`, borderRadius: 12,
    fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none',
    transition: 'all .2s',
  }

  const today = new Date()
  const year = viewDate.getFullYear(), month = viewDate.getMonth()

  /* ─── shift grouping (original preserved) ─── */
  const shiftsByDate = {}
  myShifts.forEach(s => { if (!shiftsByDate[s.shift_date]) shiftsByDate[s.shift_date] = []; shiftsByDate[s.shift_date].push(s) })

  /* ─── nav functions (original preserved) ─── */
  const navPrev = () => {
    if (viewMode === 'month') setViewDate(new Date(year, month - 1, 1))
    else if (viewMode === 'week') setViewDate(new Date(viewDate.getTime() - 7 * 86400000))
    else setViewDate(new Date(viewDate.getTime() - 86400000))
  }
  const navNext = () => {
    if (viewMode === 'month') setViewDate(new Date(year, month + 1, 1))
    else if (viewMode === 'week') setViewDate(new Date(viewDate.getTime() + 7 * 86400000))
    else setViewDate(new Date(viewDate.getTime() + 86400000))
  }
  const navLabel = () => {
    if (viewMode === 'month') return viewDate.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
    if (viewMode === 'day') return viewDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const start = getWeekStart(viewDate)
    const end = new Date(start.getTime() + 6 * 86400000)
    return `${start.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }

  function getWeekStart(d) { const date = new Date(d); const day = date.getDay(); const diff = day === 0 ? 6 : day - 1; date.setDate(date.getDate() - diff); date.setHours(0, 0, 0, 0); return date }
  function ds(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
  function isSameDay(d1, d2) { return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear() }

  const openShift = (s) => setViewShift(s)

  /* ─── GPS handlers ─── */
  const startClockIn = (shift) => setGpsModal({ shift, action: 'in' })
  const startClockOut = (shift) => setGpsModal({ shift, action: 'out' })
  const handleGpsVerified = (gpsData) => {
    if (!gpsModal) return
    const { shift, action } = gpsModal
    if (action === 'in') handleClockIn(shift.id, gpsData)
    else handleClockOut(shift.id, gpsData)
    setGpsModal(null)
  }

  /* ─── computed stats ─── */
  const totalShifts = myShifts.length
  const completedCount = myShifts.filter(s => s.status === 'completed').length
  const upcomingCount = myShifts.filter(s => s.status === 'scheduled' || s.status === 'upcoming').length
  const inProgressCount = myShifts.filter(s => s.status === 'in_progress').length
  const totalHours = myShifts.filter(s => s.status === 'completed').reduce((a, s) => s.clock_in && s.clock_out ? a + (new Date(s.clock_out) - new Date(s.clock_in)) / 3600000 : a, 0)
  const thisMonthShifts = myShifts.filter(s => { const d = new Date(s.shift_date); return d.getMonth() === month && d.getFullYear() === year })
  const thisMonthCompleted = thisMonthShifts.filter(s => s.status === 'completed').length
  const thisMonthHours = thisMonthShifts.filter(s => s.status === 'completed').reduce((a, s) => s.clock_in && s.clock_out ? a + (new Date(s.clock_out) - new Date(s.clock_in)) / 3600000 : a, 0)

  const selectedShifts = selectedDate ? (shiftsByDate[selectedDate] || []) : []

  /* ─── filter shifts for day/week views ─── */
  const filterShifts = (shifts) => {
    let filtered = [...shifts]
    if (statusFilter !== 'all') filtered = filtered.filter(s => s.status === statusFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(s => {
        const pName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}`.toLowerCase() : ''
        const sType = (s.service_type || s.title || '').toLowerCase()
        const loc = (s.location || '').toLowerCase()
        return pName.includes(q) || sType.includes(q) || loc.includes(q)
      })
    }
    return filtered
  }

  /* ═══════════════════════════════════════════════
     SHIFT DETAIL MODAL — redesigned with gradient hero
     ═══════════════════════════════════════════════ */
  const ShiftDetailModal = () => {
    if (!viewShift) return null
    const s = viewShift
    const pName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Unassigned'
    const isActive = s.status === 'in_progress', isDone = s.status === 'completed'
    const shiftDate = s.shift_date ? formatDateLong(s.shift_date) : ''
    const duration = getShiftDuration(s)

    return (
      <Modal isOpen={!!viewShift} onClose={() => setViewShift(null)} title="" wide>
       <div style={{ margin: '-20px -20px 0', marginBottom: 0 }}>
          {/* Gradient hero header */}
          <div style={{
            background: isDone ? 'linear-gradient(135deg, #64748b, #475569)' : isActive ? `linear-gradient(135deg, #10b981, #059669)` : `linear-gradient(135deg, ${c.staff}, ${c.staffHover}, #3b82f6)`,
            padding: '28px 24px', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)',
                }}>
                  {isActive ? <Activity size={24} style={{ color: 'white' }} /> : isDone ? <CheckCircle2 size={24} style={{ color: 'white' }} /> : <Calendar size={24} style={{ color: 'white' }} />}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 900, color: 'white' }}>{pName}</h3>
                    <span style={{
                      padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                      background: 'rgba(255,255,255,0.2)', color: 'white',
                    }}>
                      {(s.status || 'scheduled').replace('_', ' ')}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{s.service_type || s.title || 'Support'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 0 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <div style={{ padding: 14, borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.divider}` }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: dk.textFaint }}>Date</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: dk.text, marginTop: 4 }}>{shiftDate}</p>
            </div>
            <div style={{ padding: 14, borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.divider}` }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: dk.textFaint }}>Time</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: dk.text, marginTop: 4 }}>{formatTime(s.start_time)} – {formatTime(s.end_time)}</p>
            </div>
            {duration && (
              <div style={{ padding: 14, borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.divider}` }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: dk.textFaint }}>Duration</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: dk.text, marginTop: 4 }}>{duration}h</p>
              </div>
            )}
            {s.clock_in && (
              <div style={{ padding: 14, borderRadius: 14, background: isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5', border: `1px solid ${isDark ? 'rgba(16,185,129,0.2)' : '#a7f3d0'}` }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#10b981' }}>Clocked In</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#10b981', marginTop: 4 }}>{formatTime(s.clock_in)}</p>
                {s.clock_in_lat && <p style={{ fontSize: 9, color: dk.textFaint, marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}><Shield size={8} style={{ color: '#10b981' }} /> GPS verified</p>}
              </div>
            )}
            {s.clock_out && (
              <div style={{ padding: 14, borderRadius: 14, background: isDark ? 'rgba(249,115,22,0.1)' : '#fff7ed', border: `1px solid ${isDark ? 'rgba(249,115,22,0.2)' : '#fed7aa'}` }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f97316' }}>Clocked Out</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#f97316', marginTop: 4 }}>{formatTime(s.clock_out)}</p>
                {s.clock_out_lat && <p style={{ fontSize: 9, color: dk.textFaint, marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}><Shield size={8} style={{ color: '#f97316' }} /> GPS verified</p>}
              </div>
            )}
          </div>

          {/* Participant info */}
          {s.participants && (
            <div style={{ padding: 16, borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.divider}`, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `linear-gradient(135deg, ${c.staff}30, ${c.staffHover}20)`,
                fontSize: 14, fontWeight: 800, color: c.staff,
              }}>
                {s.participants.first_name?.[0]}{s.participants.last_name?.[0]}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: dk.text }}>{pName}</p>
                {s.participants.ndis_number && <p style={{ fontSize: 11, color: dk.textFaint }}>NDIS: {s.participants.ndis_number}</p>}
                {s.participants.phone && <p style={{ fontSize: 11, color: dk.textFaint }}>{s.participants.phone}</p>}
              </div>
            </div>
          )}

          {/* Location & Map */}
          {s.location && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: dk.textFaint, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                <MapPin size={10} /> Location
              </p>
              <p style={{ fontSize: 13, fontWeight: 600, color: dk.text, marginBottom: 10 }}>{s.location}</p>
              <MapPreview key={s.id} location={s.location} c={c} isDark={isDark} dk={dk} />
            </div>
          )}

          {/* Notes */}
          {s.notes && (
            <div style={{ padding: 14, borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.divider}` }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: dk.textFaint, marginBottom: 6 }}>Notes</p>
              <p style={{ fontSize: 13, color: dk.text, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{s.notes}</p>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4, flexWrap: 'wrap' }}>
            {(s.status === 'scheduled' || s.status === 'upcoming') && (
              <button onClick={() => { startClockIn(s); setViewShift(null) }}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px 20px', borderRadius: 14, border: 'none', cursor: 'pointer',
                  background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, color: 'white',
                  fontSize: 13, fontWeight: 700, boxShadow: `0 4px 16px -4px ${c.staff}50`, transition: 'all .2s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Play size={16} /> Clock In
              </button>
            )}
            {isActive && (
              <button onClick={() => { startClockOut(s); setViewShift(null) }}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px 20px', borderRadius: 14, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white',
                  fontSize: 13, fontWeight: 700, boxShadow: '0 4px 16px -4px rgba(239,68,68,0.4)', transition: 'all .2s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Square size={14} /> Clock Out
              </button>
            )}
            {!isDone && (
                <button onClick={() => { setViewShift(null); navigate('/staff/shifts') }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '12px 20px', borderRadius: 14, border: `1.5px solid ${dk.divider}`,
                  background: 'transparent', color: dk.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = dk.subtleBg2}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Eye size={14} /> View Detail
              </button>
            )}
            <button onClick={() => setViewShift(null)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '12px 20px', borderRadius: 14, border: `1.5px solid ${dk.divider}`,
                background: 'transparent', color: dk.textMuted, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = dk.subtleBg2}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  /* ═══════════════════════════════════════════════
     MONTH VIEW — redesigned with glass cells
     ═══════════════════════════════════════════════ */
  const MonthView = () => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const adjustedFirst = firstDay === 0 ? 6 : firstDay - 1
    const cells = []; for (let i = 0; i < adjustedFirst; i++) cells.push(null); for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    return (
      <Glass isDark={isDark} style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${dk.divider}` }}>
         {['M','T','W','T','F','S','S'].map((d, i) => (
            <div key={i} style={{ padding: '10px 0', textAlign: 'center', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: dk.textFaint }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} style={{ minHeight: 80, borderBottom: `1px solid ${dk.cellBorder}`, borderRight: `1px solid ${dk.cellBorder}` }} />
            const dStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
            const dayShifts = shiftsByDate[dStr] || []
            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
            const isSelected = selectedDate === dStr
            const hasActive = dayShifts.some(s => s.status === 'in_progress')
            return (
              <button key={day} onClick={() => setSelectedDate(dStr === selectedDate ? null : dStr)}
                style={{
                  minHeight: 64, padding: 6, textAlign: 'left', cursor: 'pointer', transition: 'all .2s',
                  borderBottom: `1px solid ${dk.cellBorder}`, borderRight: `1px solid ${dk.cellBorder}`,
                  background: isSelected ? (isDark ? `${c.staff}15` : `${c.staff}08`) : 'transparent',
                  border: 'none', borderBottom: `1px solid ${dk.cellBorder}`, borderRight: `1px solid ${dk.cellBorder}`,
                  outline: isSelected ? `2px solid ${c.staff}` : 'none', outlineOffset: -2,
                }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                    background: isToday ? `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` : 'transparent',
                    color: isToday ? 'white' : dk.text,
                    boxShadow: isToday ? `0 2px 8px -2px ${c.staff}50` : 'none',
                  }}>{day}</span>
                  {dayShifts.length > 0 && (
                    <span style={{
                      padding: '1px 6px', borderRadius: 999, fontSize: 9, fontWeight: 700,
                      background: isDark ? `${c.staff}20` : `${c.staff}10`, color: c.staff,
                    }}>{dayShifts.length}</span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {dayShifts.slice(0, 2).map(s => {
                    const isInProgress = s.status === 'in_progress'
                    const isCompleted = s.status === 'completed'
                    return (
                     <div key={s.id} style={{
                        fontSize: 8, fontWeight: 600, padding: '1px 4px', borderRadius: 4,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        background: isInProgress ? c.staff : isCompleted ? dk.subtleBg2 : (isDark ? `${c.staff}15` : `${c.staff}08`),
                        color: isInProgress ? 'white' : isCompleted ? dk.textMuted : c.staff,
                      }}>
                        {formatTime(s.start_time)} {s.participants ? s.participants.first_name : ''}
                      </div>
                    )
                  })}
                  {dayShifts.length > 2 && <p style={{ fontSize: 9, fontWeight: 600, color: dk.textFaint }}>+{dayShifts.length - 2} more</p>}
                </div>
              </button>
            )
          })}
        </div>
      </Glass>
    )
  }

  /* ═══════════════════════════════════════════════
     WEEK VIEW — redesigned with glass columns
     ═══════════════════════════════════════════════ */
  const WeekView = () => {
    const weekStart = getWeekStart(viewDate)
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart.getTime() + i * 86400000); return { date: d, str: ds(d) } })
    return (
      <Glass isDark={isDark} style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {days.map(day => {
            const dayShifts = filterShifts(shiftsByDate[day.str] || [])
            const isToday = isSameDay(day.date, today)
            return (
              <div key={day.str} style={{ minHeight: 400, borderRight: `1px solid ${dk.cellBorder}` }}>
                <div style={{
                  padding: 12, textAlign: 'center',
                  borderBottom: `1px solid ${dk.divider}`,
                  background: isToday ? (isDark ? `${c.staff}12` : `${c.staff}06`) : 'transparent',
                }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: isToday ? c.staff : dk.textFaint }}>{day.date.toLocaleDateString('en-AU', { weekday: 'short' })}</p>
                  <p style={{
                    fontSize: 20, fontWeight: 900, marginTop: 2,
                    color: isToday ? c.staff : dk.text,
                  }}>{day.date.getDate()}</p>
                  {dayShifts.length > 0 && (
                    <span style={{
                      display: 'inline-block', marginTop: 4, padding: '1px 8px',
                      borderRadius: 999, fontSize: 9, fontWeight: 700,
                      background: isDark ? `${c.staff}20` : `${c.staff}10`, color: c.staff,
                    }}>{dayShifts.length}</span>
                  )}
                </div>
                <div style={{ padding: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {dayShifts.length > 0 ? dayShifts.map(s => {
                    const isActive = s.status === 'in_progress', isDone = s.status === 'completed'
                    return (
                      <button key={s.id} onClick={() => openShift(s)}
                        style={{
                          width: '100%', textAlign: 'left', padding: 8, borderRadius: 10,
                          fontSize: 11, cursor: 'pointer', transition: 'all .2s', border: 'none',
                          background: isActive ? (isDark ? `${c.staff}15` : `${c.staff}06`) : dk.subtleBg,
                          borderLeft: `3px solid ${isActive ? '#10b981' : isDone ? '#94a3b8' : c.staff}`,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = dk.subtleBg2}
                        onMouseLeave={e => e.currentTarget.style.background = isActive ? (isDark ? `${c.staff}15` : `${c.staff}06`) : dk.subtleBg}
                      >
                        <p style={{ fontWeight: 700, color: dk.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.participants ? s.participants.first_name : 'Shift'}
                        </p>
                        <p style={{ color: dk.textMuted, marginTop: 2 }}>{formatTime(s.start_time)} – {formatTime(s.end_time)}</p>
                        <p style={{ color: dk.textFaint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{s.service_type || 'Support'}</p>
                        {s.location && <p style={{ color: dk.textFaint, display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}><MapPin size={8} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.location}</span></p>}
                      </button>
                    )
                  }) : <p style={{ fontSize: 10, textAlign: 'center', color: dk.textFaint, marginTop: 16 }}>No shifts</p>}
                </div>
              </div>
            )
          })}
        </div>
      </Glass>
    )
  }

  /* ═══════════════════════════════════════════════
     DAY VIEW — redesigned timeline layout
     ═══════════════════════════════════════════════ */
  const DayView = () => {
    const dStr = ds(viewDate)
    const dayShifts = filterShifts((shiftsByDate[dStr] || []).sort((a, b) => new Date(a.start_time) - new Date(b.start_time)))
    return (
      <Glass isDark={isDark} style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${dk.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 800, color: dk.text }}>{viewDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>{dayShifts.length} shift{dayShifts.length !== 1 ? 's' : ''}</p>
          </div>
          <Badge color={dayShifts.length > 0 ? 'blue' : 'gray'} isDark={isDark}>{dayShifts.length} scheduled</Badge>
        </div>
        <div>
          {dayShifts.length > 0 ? dayShifts.map((s, idx) => {
            const isActive = s.status === 'in_progress', isDone = s.status === 'completed'
            const pName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Unassigned'
            const duration = getShiftDuration(s)
            return (
              <button key={s.id} onClick={() => openShift(s)}
                style={{
                  width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                  borderBottom: `1px solid ${dk.cellBorder}`, cursor: 'pointer', transition: 'all .2s', border: 'none',
                  background: isActive ? (isDark ? `${c.staff}08` : `${c.staff}04`) : 'transparent',
                }}
                onMouseEnter={e => e.currentTarget.style.background = dk.subtleBg}
                onMouseLeave={e => e.currentTarget.style.background = isActive ? (isDark ? `${c.staff}08` : `${c.staff}04`) : 'transparent'}
              >
                <div style={{ width: 60, textAlign: 'center', flexShrink: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: dk.text }}>{formatTime(s.start_time)}</p>
                  <p style={{ fontSize: 10, color: dk.textFaint }}>{formatTime(s.end_time)}</p>
                  {duration && <p style={{ fontSize: 9, fontWeight: 600, color: c.staff, marginTop: 2 }}>{duration}h</p>}
                </div>
                <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 4, background: isDone ? (isDark ? '#475569' : '#d1d5db') : isActive ? '#10b981' : c.staff, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: dk.text }}>{pName}</p>
                    <Badge color={isActive ? 'green' : isDone ? 'gray' : 'blue'} isDark={isDark}>{(s.status || 'scheduled').replace('_', ' ')}</Badge>
                  </div>
                  <p style={{ fontSize: 12, color: dk.textMuted }}>{s.service_type || s.title || 'Support'}</p>
                  {s.location && <p style={{ fontSize: 11, color: dk.textFaint, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}><MapPin size={10} />{s.location}</p>}
                </div>
                {!isDone && !isActive && (
                  <button onClick={(e) => { e.stopPropagation(); startClockIn(s) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px',
                      borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, color: 'white',
                      fontSize: 11, fontWeight: 700, flexShrink: 0, transition: 'all .2s',
                    }}>
                    <Play size={12} /> Clock In
                  </button>
                )}
                {isActive && (
                  <button onClick={(e) => { e.stopPropagation(); startClockOut(s) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4, padding: '8px 14px',
                      borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white',
                      fontSize: 11, fontWeight: 700, flexShrink: 0, transition: 'all .2s',
                    }}>
                    <Square size={12} /> Out
                  </button>
                )}
                {isDone && <CheckCircle2 size={20} style={{ color: '#10b981', flexShrink: 0 }} />}
              </button>
            )
          }) : (
            <div style={{ textAlign: 'center', padding: '50px 20px' }}>
              <Calendar size={44} style={{ color: dk.textFaint, margin: '0 auto 10px' }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: dk.textMuted }}>No shifts scheduled</p>
              <p style={{ fontSize: 12, color: dk.textFaint, marginTop: 4 }}>Enjoy your day off!</p>
            </div>
          )}
        </div>
      </Glass>
    )
  }

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */
  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* ─── Keyframes ─── */}
      <style>{`
        @keyframes orbFloat { 0%,100% { transform:translateY(0) scale(1) } 50% { transform:translateY(-15px) scale(1.03) } }
        @keyframes ping { 75%,100% { transform:scale(1.8);opacity:0 } }
        @keyframes pulse-dot { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes countUp { from { opacity:0;transform:translateY(8px) scale(0.95) } to { opacity:1;transform:translateY(0) scale(1) } }
        @keyframes spin { to { transform:rotate(360deg) } }
        .count-up { animation: countUp .7s cubic-bezier(.16,1,.3,1) forwards }
      `}</style>

      {/* ─── Background Orbs ─── */}
      <Orb color={c.staff} size={300} top="-100px" right="-80px" delay={0} />
      <Orb color={c.staffHover} size={220} bottom="5%" left="-60px" delay={2} />
      <Orb color="#8b5cf6" size={180} top="35%" right="10%" delay={4} />
      <Orb color="#06b6d4" size={200} bottom="-40px" left="30%" delay={1} />
      <Orb color="#f59e0b" size={150} top="15%" left="15%" delay={3} />

      {/* ─── Content ─── */}
      <div style={{ position: 'relative', zIndex: 1, padding: '0 0 40px' }}>

        {/* ═══════ HERO BANNER ═══════ */}
        <div style={{
          ...stg(0),
          background: `linear-gradient(135deg, ${c.staff} 0%, ${c.staffHover} 40%, #3b82f6 70%, #06b6d4 100%)`,
          borderRadius: 20, padding: '28px 24px', marginBottom: 24,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', bottom: -50, left: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', top: '60%', right: '25%', width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          {/* Dot grid */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
          {/* Floating dots */}
          {[{ top: '20%', left: '85%', size: 5, delay: '0s' }, { top: '75%', left: '92%', size: 3, delay: '1s' }, { top: '40%', left: '5%', size: 4, delay: '2s' }].map((dot, i) => (
            <div key={i} style={{ position: 'absolute', top: dot.top, left: dot.left, width: dot.size, height: dot.size, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', animation: `pulse-dot 2s ease-in-out ${dot.delay} infinite` }} />
          ))}

          <div style={{ position: 'relative', zIndex: 2 }}>
            {/* Category badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', fontSize: 11, fontWeight: 700, color: 'white', letterSpacing: '0.04em' }}>
                <Calendar size={12} /> MY ROSTER
              </span>
              {inProgressCount > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.3)', backdropFilter: 'blur(8px)', fontSize: 10, fontWeight: 700, color: '#a7f3d0' }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: '#34d399', animation: 'pulse-dot 1.5s infinite' }} /> {inProgressCount} ACTIVE
                </span>
              )}
            </div>

            {/* Title */}
            <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', lineHeight: 1.2, marginBottom: 4 }}>Shift Calendar</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 16 }}>
              {viewDate.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })} — {thisMonthShifts.length} shift{thisMonthShifts.length !== 1 ? 's' : ''} this month
            </p>

            {/* Stat pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'This Month', value: thisMonthShifts.length, icon: Calendar },
                { label: 'Completed', value: thisMonthCompleted, icon: CheckCircle2 },
                { label: 'Hours', value: `${thisMonthHours.toFixed(1)}h`, icon: Clock },
                { label: 'Upcoming', value: upcomingCount, icon: TrendingUp },
              ].map((pill, i) => (
                <div key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999,
                  background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)',
                }}>
                  <pill.icon size={12} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>{pill.value}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{pill.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════ STAT CARDS ═══════ */}
        <div style={{ ...stg(1), display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { icon: Calendar, label: 'Total Shifts', value: totalShifts, gradient: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, glow: `${c.staff}40` },
            { icon: CheckCircle2, label: 'Completed', value: completedCount, gradient: 'linear-gradient(135deg, #10b981, #059669)', glow: 'rgba(16,185,129,0.3)' },
            { icon: Activity, label: 'In Progress', value: inProgressCount, gradient: 'linear-gradient(135deg, #f59e0b, #f97316)', glow: 'rgba(245,158,11,0.3)', alert: inProgressCount > 0 },
            { icon: Clock, label: 'Total Hours', value: totalHours, suffix: 'h', decimals: 1, gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)', glow: 'rgba(6,182,212,0.3)' },
          ].map((stat, i) => (
            <Glass key={i} isDark={isDark} hover glow={stat.glow} style={{ padding: '18px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: stat.gradient, boxShadow: `0 4px 12px -2px ${stat.glow}`,
                }}>
                  <stat.icon size={18} style={{ color: 'white' }} />
                </div>
                {stat.alert && <span style={{ width: 8, height: 8, borderRadius: 4, background: '#f59e0b', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />}
              </div>
              <p style={{ fontSize: 26, fontWeight: 900, color: dk.text, lineHeight: 1 }}>
                <AnimNum value={stat.decimals ? Math.round(stat.value * 10) / 10 : stat.value} suffix={stat.suffix || ''} />
              </p>
              <p style={{ fontSize: 11, fontWeight: 600, color: dk.textFaint, marginTop: 4 }}>{stat.label}</p>
            </Glass>
          ))}
        </div>

        {/* ═══════ VIEW MODE + NAV ═══════ */}
        <div style={{ ...stg(2), display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20, alignItems: 'center' }}>
          {/* View mode pills */}
          <Glass isDark={isDark} style={{ padding: 6, display: 'flex', gap: 4 }}>
            {['month', 'week', 'day'].map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                style={{
                  padding: '9px 18px', borderRadius: 14, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 700, transition: 'all .25s cubic-bezier(.16,1,.3,1)',
                  background: viewMode === mode ? `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` : 'transparent',
                  color: viewMode === mode ? 'white' : dk.textMuted,
                  boxShadow: viewMode === mode ? `0 4px 16px -4px ${c.staff}50` : 'none',
                }}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </Glass>

          {/* Navigation */}
          <Glass isDark={isDark} style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 auto' }}>
            <button onClick={navPrev} style={{ padding: 6, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: dk.textMuted, transition: 'all .2s' }}
              onMouseEnter={e => e.currentTarget.style.background = dk.subtleBg2}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <ChevronLeft size={18} />
            </button>
            <p style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 800, color: dk.text }}>{navLabel()}</p>
            <button onClick={() => setViewDate(new Date())}
              style={{
                padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 700,
                background: isDark ? `${c.staff}20` : `${c.staff}10`, color: c.staff,
                transition: 'all .2s',
              }}>
              Today
            </button>
            <button onClick={navNext} style={{ padding: 6, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: dk.textMuted, transition: 'all .2s' }}
              onMouseEnter={e => e.currentTarget.style.background = dk.subtleBg2}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <ChevronRight size={18} />
            </button>
          </Glass>

          {/* Status filter */}
          {(viewMode === 'day' || viewMode === 'week') && (
            <Glass isDark={isDark} style={{ padding: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'scheduled', label: 'Scheduled' },
                { id: 'in_progress', label: 'Active' },
                { id: 'completed', label: 'Done' },
              ].map(f => (
                <button key={f.id} onClick={() => setStatusFilter(f.id)}
                  style={{
                    padding: '6px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontSize: 11, fontWeight: 700, transition: 'all .2s',
                    background: statusFilter === f.id ? (isDark ? `${c.staff}25` : `${c.staff}12`) : 'transparent',
                    color: statusFilter === f.id ? c.staff : dk.textFaint,
                  }}>
                  {f.label}
                </button>
              ))}
            </Glass>
          )}
        </div>

        {/* ═══════ CALENDAR VIEWS ═══════ */}
        <div style={stg(3)}>
          {viewMode === 'month' && <MonthView />}
          {viewMode === 'week' && <WeekView />}
          {viewMode === 'day' && <DayView />}
        </div>

        {/* ═══════ SELECTED DATE DETAIL (month view) ═══════ */}
        {viewMode === 'month' && selectedDate && (
          <div style={{ ...stg(4), marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: dk.text }}>{formatDateLong(selectedDate)}</h3>
                <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>{selectedShifts.length} shift{selectedShifts.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setSelectedDate(null)} style={{ padding: 8, borderRadius: 10, border: 'none', cursor: 'pointer', background: dk.subtleBg, color: dk.textFaint, transition: 'all .2s' }}>
                <X size={16} />
              </button>
            </div>
            {selectedShifts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedShifts.map(s => {
                  const pName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Unassigned'
                  const isActive = s.status === 'in_progress', isDone = s.status === 'completed'
                  const duration = getShiftDuration(s)
                  return (
                    <Glass key={s.id} isDark={isDark} hover onClick={() => openShift(s)} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isDone ? 'linear-gradient(135deg, #94a3b8, #64748b)' : isActive ? 'linear-gradient(135deg, #10b981, #059669)' : `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`,
                        boxShadow: isDone ? 'none' : `0 4px 12px -2px ${isActive ? 'rgba(16,185,129,0.4)' : `${c.staff}40`}`,
                        flexShrink: 0,
                      }}>
                        {isActive ? <Activity size={20} style={{ color: 'white' }} /> : isDone ? <CheckCircle2 size={20} style={{ color: 'white' }} /> : <Calendar size={20} style={{ color: 'white' }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: dk.text }}>{pName}</p>
                          <Badge color={isActive ? 'green' : isDone ? 'gray' : 'blue'} isDark={isDark}>{(s.status || 'scheduled').replace('_', ' ')}</Badge>
                        </div>
                        <p style={{ fontSize: 12, color: dk.textMuted }}>{s.service_type || s.title || 'Support'}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, color: dk.textFaint, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} />{formatTime(s.start_time)} – {formatTime(s.end_time)}</span>
                          {duration && <span style={{ fontSize: 11, fontWeight: 600, color: c.staff }}>{duration}h</span>}
                          {s.location && <span style={{ fontSize: 11, color: dk.textFaint, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={10} />{s.location}</span>}
                        </div>
                      </div>
                      <ChevronR size={16} style={{ color: dk.textFaint, flexShrink: 0 }} />
                    </Glass>
                  )
                })}
              </div>
            ) : (
              <Glass isDark={isDark} style={{ padding: '40px 20px', textAlign: 'center' }}>
                <Calendar size={40} style={{ color: dk.textFaint, margin: '0 auto 10px' }} />
                <p style={{ fontSize: 14, fontWeight: 700, color: dk.textMuted }}>No shifts this day</p>
                <p style={{ fontSize: 12, color: dk.textFaint, marginTop: 4 }}>Select another date or check your roster</p>
              </Glass>
            )}
          </div>
        )}
      </div>

      {/* ═══════ MODALS ═══════ */}
      <ShiftDetailModal />

      <Modal isOpen={!!gpsModal} onClose={() => setGpsModal(null)} title={`GPS Verification — Clock ${gpsModal?.action === 'in' ? 'In' : 'Out'}`} wide>
        {gpsModal && (
          <GpsVerification
            participant={gpsModal.shift.participants}
            shiftLocation={gpsModal.shift.location}
            onVerified={handleGpsVerified}
            onCancel={() => setGpsModal(null)}
            action={gpsModal.action}
            maxDistance={200}
            accentColor={c.staff}
            accentHover={c.staffHover}
            isDark={isDark}
          />
        )}
      </Modal>
    </div>
  )
}