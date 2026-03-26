import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check, Loader2, Save, Clock, Sun, Moon, Sunrise, Sunset,
  Calendar, ChevronRight, AlertTriangle, BarChart3, Zap,
  RotateCcw, CheckCircle, Sparkles, Shield, Eye, Target
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useStaff } from '../../context/StaffContext'
import { useBrandColors } from '../../hooks/useBrandColors'
import { useTheme } from '../../context/ThemeContext'

/* ═══════════════════════════════════════════════
   CONSTANTS — all original preserved
   ═══════════════════════════════════════════════ */
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' }
const SHORT_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' }
const SINGLE_LABELS = { monday: 'M', tuesday: 'T', wednesday: 'W', thursday: 'T', friday: 'F', saturday: 'S', sunday: 'S' }

const TIME_SLOTS = [
  { key: 'morning', label: 'Morning', sub: '6am – 12pm', icon: Sunrise, gradient: 'linear-gradient(135deg, #f59e0b, #f97316)', lightBg: '#fffbeb', lightBorder: '#fde68a', lightText: '#d97706', darkBg: 'rgba(245,158,11,0.15)', darkBorder: 'rgba(245,158,11,0.3)', darkText: '#fbbf24' },
  { key: 'afternoon', label: 'Afternoon', sub: '12pm – 6pm', icon: Sun, gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)', lightBg: '#eff6ff', lightBorder: '#bfdbfe', lightText: '#2563eb', darkBg: 'rgba(59,130,246,0.15)', darkBorder: 'rgba(59,130,246,0.3)', darkText: '#60a5fa' },
  { key: 'evening', label: 'Evening', sub: '6pm – 10pm', icon: Sunset, gradient: 'linear-gradient(135deg, #8b5cf6, #a855f7)', lightBg: '#f5f3ff', lightBorder: '#ddd6fe', lightText: '#7c3aed', darkBg: 'rgba(139,92,246,0.15)', darkBorder: 'rgba(139,92,246,0.3)', darkText: '#a78bfa' },
  { key: 'night', label: 'Night', sub: '10pm – 6am', icon: Moon, gradient: 'linear-gradient(135deg, #6366f1, #475569)', lightBg: '#eef2ff', lightBorder: '#c7d2fe', lightText: '#4f46e5', darkBg: 'rgba(99,102,241,0.15)', darkBorder: 'rgba(99,102,241,0.3)', darkText: '#818cf8' },
]

function defaultAvailability() {
  const avail = {}
  DAYS.forEach(d => { avail[d] = { available: false, morning: false, afternoon: false, evening: false, night: false, notes: '' } })
  return avail
}

/* ═══════════════════════════════════════════════
   DESIGN SYSTEM COMPONENTS
   ═══════════════════════════════════════════════ */

function Glass({ children, className = '', glow, style = {}, hover = false, isDark = false, onClick, ...p }) {
  const base = isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.55)'
  const border = isDark ? 'rgba(51,65,85,0.4)' : 'rgba(255,255,255,0.7)'
  return (
    <div className={className} onClick={onClick}
      style={{
        background: base, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${border}`, borderRadius: '1.25rem',
        boxShadow: glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)',
        transition: hover ? 'all .3s cubic-bezier(.16,1,.3,1)' : undefined,
        cursor: hover || onClick ? 'pointer' : undefined, ...style,
      }}
      onMouseEnter={hover ? e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = glow ? `0 16px 48px -8px ${glow}` : '0 12px 40px -8px rgba(0,0,0,0.12)' } : undefined}
      onMouseLeave={hover ? e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)' } : undefined}
      {...p}
    >{children}</div>
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

function AnimNum({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0)
  const frameRef = useRef()
  useEffect(() => {
    const num = typeof value === 'number' ? value : parseInt(value) || 0
    const start = performance.now()
    function tick(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(num * eased))
      if (progress < 1) frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [value, duration])
  return <>{display}</>
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

function Toggle({ active, onToggle, color, isDark }) {
  return (
    <button onClick={onToggle} style={{
      width: 44, height: 24, borderRadius: 12, padding: 2,
      background: active ? (color || '#3b82f6') : (isDark ? '#475569' : '#d1d5db'),
      border: 'none', cursor: 'pointer', transition: 'all .25s cubic-bezier(.16,1,.3,1)',
      position: 'relative', flexShrink: 0,
    }}>
      <span style={{
        display: 'block', width: 20, height: 20, borderRadius: 10,
        background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        transition: 'all .25s cubic-bezier(.16,1,.3,1)',
        transform: active ? 'translateX(20px)' : 'translateX(0)',
      }} />
    </button>
  )
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function StaffAvailability() {
  const navigate = useNavigate()
  const { staffProfile } = useStaff()
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [availability, setAvailability] = useState(defaultAvailability())
  const [hasChanges, setHasChanges] = useState(false)

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
    fontSize: 12, fontWeight: 600, color: dk.text, outline: 'none',
    transition: 'all .2s',
  }

  /* ─── data fetch (100% preserved) ─── */
  useEffect(() => {
    if (!staffProfile?.id) return
    loadAvailability()
  }, [staffProfile?.id])

  const loadAvailability = async () => {
    try {
      const { data, error } = await supabase.from('staff_availability').select('*').eq('staff_id', staffProfile.id)
      if (error) { console.warn('staff_availability query error:', error); setLoading(false); return }
      if (data && data.length > 0) {
        const avail = defaultAvailability()
        data.forEach(row => {
          if (avail[row.day_of_week]) {
            avail[row.day_of_week] = { available: true, morning: row.morning || false, afternoon: row.afternoon || false, evening: row.evening || false, night: row.night || false, notes: row.notes || '' }
          }
        })
        setAvailability(avail)
      }
    } catch (err) { console.error('Load availability error:', err) }
    finally { setLoading(false) }
  }

  /* ─── handlers (100% preserved) ─── */
  const toggleDay = (day) => {
    setAvailability(prev => ({ ...prev, [day]: { ...prev[day], available: !prev[day].available, ...(prev[day].available ? { morning: false, afternoon: false, evening: false, night: false } : { morning: true, afternoon: true, evening: true, night: false }) } }))
    setSaved(false); setHasChanges(true)
  }
  const toggleSlot = (day, slot) => { setAvailability(prev => ({ ...prev, [day]: { ...prev[day], [slot]: !prev[day][slot] } })); setSaved(false); setHasChanges(true) }
  const setNotes = (day, notes) => { setAvailability(prev => ({ ...prev, [day]: { ...prev[day], notes } })); setSaved(false); setHasChanges(true) }

  const selectAllDays = () => {
    const newAvail = {}
    DAYS.forEach(d => { newAvail[d] = { available: true, morning: true, afternoon: true, evening: true, night: false, notes: availability[d]?.notes || '' } })
    setAvailability(newAvail); setSaved(false); setHasChanges(true)
  }
  const selectWeekdays = () => {
    const newAvail = {}
    DAYS.forEach(d => {
      const isWeekday = !['saturday', 'sunday'].includes(d)
      newAvail[d] = { available: isWeekday, morning: isWeekday, afternoon: isWeekday, evening: isWeekday, night: false, notes: availability[d]?.notes || '' }
    })
    setAvailability(newAvail); setSaved(false); setHasChanges(true)
  }
  const clearAll = () => { setAvailability(defaultAvailability()); setSaved(false); setHasChanges(true) }

  /* ─── save (100% preserved) ─── */
  const handleSave = async () => {
    if (!staffProfile?.id) return
    setSaving(true)
    try {
      const { error: delErr } = await supabase.from('staff_availability').delete().eq('staff_id', staffProfile.id)
      if (delErr) console.error('Delete error:', delErr)
      const rows = DAYS.filter(d => availability[d].available).map(d => ({ staff_id: staffProfile.id, day_of_week: d, morning: availability[d].morning || false, afternoon: availability[d].afternoon || false, evening: availability[d].evening || false, night: availability[d].night || false, notes: availability[d].notes || null }))
      if (rows.length > 0) {
        const { error } = await supabase.from('staff_availability').insert(rows).select()
        if (error) throw error
      }
      setSaved(true); setHasChanges(false); setTimeout(() => setSaved(false), 3000)
    } catch (err) { console.error('Save availability error:', err); alert('Failed to save: ' + (err.message || 'Unknown error')) }
    finally { setSaving(false) }
  }

  /* ─── computed ─── */
  const availableDays = DAYS.filter(d => availability[d].available).length
  const totalSlots = DAYS.reduce((sum, d) => {
    if (!availability[d].available) return sum
    return sum + (availability[d].morning ? 1 : 0) + (availability[d].afternoon ? 1 : 0) + (availability[d].evening ? 1 : 0) + (availability[d].night ? 1 : 0)
  }, 0)
  const maxSlots = 28
  const coveragePct = Math.round((totalSlots / maxSlots) * 100)
  const morningCount = DAYS.filter(d => availability[d].available && availability[d].morning).length
  const afternoonCount = DAYS.filter(d => availability[d].available && availability[d].afternoon).length
  const eveningCount = DAYS.filter(d => availability[d].available && availability[d].evening).length
  const nightCount = DAYS.filter(d => availability[d].available && availability[d].night).length
  const notesCount = DAYS.filter(d => availability[d].notes?.trim()).length

  /* ─── loading ─── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` }}>
          <Calendar size={22} style={{ color: 'white' }} />
        </div>
        <div style={{ position: 'absolute', inset: -4, borderRadius: 18, border: `2px solid ${c.staff}`, opacity: 0.3, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: dk.textMuted }}>Loading availability...</p>
    </div>
  )

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */
  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <style>{`
        @keyframes orbFloat { 0%,100% { transform:translateY(0) scale(1) } 50% { transform:translateY(-15px) scale(1.03) } }
        @keyframes ping { 75%,100% { transform:scale(1.8);opacity:0 } }
        @keyframes pulse-dot { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes countUp { from { opacity:0;transform:translateY(8px) scale(0.95) } to { opacity:1;transform:translateY(0) scale(1) } }
        @keyframes expandIn { from { opacity:0;max-height:0;padding-top:0;padding-bottom:0 } to { opacity:1;max-height:400px } }
        .count-up { animation: countUp .7s cubic-bezier(.16,1,.3,1) forwards }
      `}</style>

      <Orb color={c.staff} size={280} top="-80px" right="-60px" delay={0} />
      <Orb color={c.staffHover} size={200} bottom="10%" left="-40px" delay={2} />
      <Orb color="#8b5cf6" size={160} top="40%" right="15%" delay={4} />
      <Orb color="#f59e0b" size={200} bottom="-50px" right="25%" delay={1} />
      <Orb color="#06b6d4" size={140} top="15%" left="18%" delay={3} />

      <div style={{ position: 'relative', zIndex: 1, padding: '0 0 100px' }}>

        {/* ═══════ HERO BANNER ═══════ */}
        <div style={{
          ...stg(0),
          background: `linear-gradient(135deg, ${c.staff} 0%, ${c.staffHover} 40%, #3b82f6 70%, #06b6d4 100%)`,
          borderRadius: 20, padding: '28px 24px', marginBottom: 24,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', bottom: -50, left: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', top: '55%', right: '22%', width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
          {[{ top: '15%', left: '85%', size: 5, delay: '0s' }, { top: '70%', left: '90%', size: 3, delay: '1s' }, { top: '35%', left: '8%', size: 4, delay: '2s' }].map((dot, i) => (
            <div key={i} style={{ position: 'absolute', top: dot.top, left: dot.left, width: dot.size, height: dot.size, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', animation: `pulse-dot 2s ease-in-out ${dot.delay} infinite` }} />
          ))}

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', fontSize: 11, fontWeight: 700, color: 'white', letterSpacing: '0.04em' }}>
                <Calendar size={12} /> AVAILABILITY
              </span>
              {hasChanges && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'rgba(245,158,11,0.3)', backdropFilter: 'blur(8px)', fontSize: 10, fontWeight: 700, color: '#fde68a' }}>
                  <AlertTriangle size={10} /> UNSAVED CHANGES
                </span>
              )}
              {saved && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.3)', backdropFilter: 'blur(8px)', fontSize: 10, fontWeight: 700, color: '#a7f3d0' }}>
                  <CheckCircle size={10} /> SAVED
                </span>
              )}
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', lineHeight: 1.2, marginBottom: 4 }}>My Availability</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 16 }}>
              Set the days and times you're available to work — your admin will see this when scheduling shifts
            </p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {[
                { label: 'Days Set', value: `${availableDays}/7`, icon: Calendar },
                { label: 'Time Slots', value: totalSlots, icon: Clock },
                { label: 'Coverage', value: `${coveragePct}%`, icon: Target },
              ].map((pill, i) => (
                <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <pill.icon size={12} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>{pill.value}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{pill.label}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={selectWeekdays}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                <Zap size={14} /> Weekdays Only
              </button>
              <button onClick={selectAllDays}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                <CheckCircle size={14} /> All Days
              </button>
              <button onClick={clearAll}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                <RotateCcw size={14} /> Clear
              </button>
            </div>
          </div>
        </div>

        {/* ═══════ STAT CARDS ═══════ */}
        <div style={{ ...stg(1), display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { icon: Calendar, label: 'Days Available', value: availableDays, sub: '/ 7', gradient: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, glow: `${c.staff}40` },
            { icon: Clock, label: 'Time Slots', value: totalSlots, gradient: 'linear-gradient(135deg, #f59e0b, #f97316)', glow: 'rgba(245,158,11,0.3)' },
            { icon: Sunrise, label: 'Mornings', value: morningCount, gradient: 'linear-gradient(135deg, #f59e0b, #f97316)', glow: 'rgba(245,158,11,0.25)' },
            { icon: Sun, label: 'Afternoons', value: afternoonCount, gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)', glow: 'rgba(59,130,246,0.25)' },
            { icon: Sunset, label: 'Evenings', value: eveningCount, gradient: 'linear-gradient(135deg, #8b5cf6, #a855f7)', glow: 'rgba(139,92,246,0.25)' },
            { icon: Moon, label: 'Nights', value: nightCount, gradient: 'linear-gradient(135deg, #6366f1, #475569)', glow: 'rgba(99,102,241,0.25)' },
          ].map((stat, i) => (
            <Glass key={i} isDark={isDark} hover glow={stat.glow} style={{ padding: '16px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: stat.gradient, boxShadow: `0 4px 12px -2px ${stat.glow}` }}>
                  <stat.icon size={16} style={{ color: 'white' }} />
                </div>
              </div>
              <p style={{ fontSize: 24, fontWeight: 900, color: dk.text, lineHeight: 1 }}>
                <AnimNum value={stat.value} />{stat.sub && <span style={{ fontSize: 12, fontWeight: 600, color: dk.textFaint }}> {stat.sub}</span>}
              </p>
              <p style={{ fontSize: 10, fontWeight: 600, color: dk.textFaint, marginTop: 4 }}>{stat.label}</p>
            </Glass>
          ))}
        </div>

        {/* ═══════ MINI WEEK OVERVIEW ═══════ */}
        <Glass isDark={isDark} style={{ ...stg(2), padding: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` }}>
              <Eye size={13} style={{ color: 'white' }} />
            </div>
            <p style={{ fontSize: 13, fontWeight: 800, color: dk.text }}>Week at a Glance</p>
            <div style={{ marginLeft: 'auto' }}>
              <Badge color={coveragePct >= 60 ? 'green' : coveragePct >= 30 ? 'amber' : 'red'} isDark={isDark}>{coveragePct}% coverage</Badge>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {DAYS.map(day => {
              const a = availability[day]
              const slots = a.available ? [a.morning, a.afternoon, a.evening, a.night].filter(Boolean).length : 0
              return (
                <div key={day} onClick={() => toggleDay(day)} style={{
                  textAlign: 'center', padding: '10px 4px', borderRadius: 12, cursor: 'pointer', transition: 'all .2s',
                  background: a.available ? (isDark ? `${c.staff}15` : `${c.staff}08`) : dk.subtleBg,
                  border: a.available ? `1.5px solid ${c.staff}30` : `1px solid ${dk.divider}`,
                }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: a.available ? c.staff : dk.textFaint, textTransform: 'uppercase', marginBottom: 4 }}>{SHORT_LABELS[day]}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
                    {TIME_SLOTS.map(slot => (
                      <div key={slot.key} style={{
                        width: 18, height: 4, borderRadius: 2,
                        background: a.available && a[slot.key] ? slot.gradient : dk.subtleBg2,
                        transition: 'all .3s',
                      }} />
                    ))}
                  </div>
                  <p style={{ fontSize: 9, fontWeight: 700, color: a.available ? dk.text : dk.textFaint, marginTop: 4 }}>{slots > 0 ? `${slots}` : '—'}</p>
                </div>
              )
            })}
          </div>
        </Glass>

        {/* ═══════ DAY CARDS ═══════ */}
        <div style={{ ...stg(3), display: 'flex', flexDirection: 'column', gap: 14 }}>
          {DAYS.map((day, dayIdx) => {
            const a = availability[day]
            const isWeekend = day === 'saturday' || day === 'sunday'
            const activeSlots = a.available ? [a.morning && 'Morning', a.afternoon && 'Afternoon', a.evening && 'Evening', a.night && 'Night'].filter(Boolean) : []

            return (
              <Glass key={day} isDark={isDark}
                glow={a.available ? `${c.staff}15` : undefined}
                style={{
                  overflow: 'hidden', transition: 'all .3s cubic-bezier(.16,1,.3,1)',
                  opacity: a.available ? 1 : 0.7,
                  borderLeft: `4px solid ${a.available ? c.staff : (isDark ? 'rgba(51,65,85,0.3)' : '#e5e7eb')}`,
                }}
              >
                {/* Day header with toggle */}
                <button onClick={() => toggleDay(day)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 900, flexShrink: 0, transition: 'all .3s',
                      background: a.available ? `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` : dk.subtleBg2,
                      color: a.available ? 'white' : dk.textFaint,
                      boxShadow: a.available ? `0 4px 12px -2px ${c.staff}40` : 'none',
                    }}>
                      {SINGLE_LABELS[day]}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <p style={{ fontSize: 15, fontWeight: 800, color: a.available ? dk.text : dk.textFaint }}>{DAY_LABELS[day]}</p>
                        {isWeekend && <Badge color="purple" isDark={isDark}>Weekend</Badge>}
                        {a.available && activeSlots.length > 0 && <Badge color="green" isDark={isDark}>{activeSlots.length} slots</Badge>}
                      </div>
                      <p style={{ fontSize: 11, color: dk.textFaint, marginTop: 2 }}>
                        {a.available ? (activeSlots.length > 0 ? activeSlots.join(' · ') : 'No time slots selected') : (isWeekend ? 'Weekend — tap to enable' : 'Not available — tap to enable')}
                      </p>
                    </div>
                  </div>
                  <Toggle active={a.available} onToggle={() => {}} color={c.staff} isDark={isDark} />
                </button>

                {/* Expanded time slots */}
                {a.available && (
                  <div style={{ padding: '0 18px 18px', animation: 'expandIn .3s ease' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 12 }}>
                      {TIME_SLOTS.map(slot => {
                        const active = a[slot.key]
                        const Icon = slot.icon
                        const slotBg = active ? (isDark ? slot.darkBg : slot.lightBg) : dk.subtleBg
                        const slotBorder = active ? (isDark ? slot.darkBorder : slot.lightBorder) : dk.divider
                        const slotText = active ? (isDark ? slot.darkText : slot.lightText) : dk.textFaint
                        return (
                          <button key={slot.key} onClick={() => toggleSlot(day, slot.key)}
                            style={{
                              padding: 14, borderRadius: 14, border: `2px solid ${slotBorder}`,
                              background: slotBg, cursor: 'pointer', textAlign: 'left',
                              transition: 'all .25s cubic-bezier(.16,1,.3,1)',
                              transform: active ? 'scale(1)' : 'scale(0.98)',
                            }}
                            onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = isDark ? slot.darkBorder : slot.lightBorder }}
                            onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = dk.divider }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: active ? slot.gradient : dk.subtleBg2,
                                boxShadow: active ? `0 2px 8px -2px ${isDark ? slot.darkBorder : slot.lightBorder}` : 'none',
                              }}>
                                <Icon size={14} style={{ color: active ? 'white' : dk.textFaint }} />
                              </div>
                              <div style={{
                                width: 18, height: 18, borderRadius: 6, border: `2px solid ${slotBorder}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: active ? slotBg : 'transparent', transition: 'all .2s',
                              }}>
                                {active && <Check size={10} style={{ color: slotText }} />}
                              </div>
                            </div>
                            <p style={{ fontSize: 12, fontWeight: 700, color: active ? (isDark ? slot.darkText : dk.text) : dk.textFaint }}>{slot.label}</p>
                            <p style={{ fontSize: 10, color: active ? dk.textMuted : dk.textFaint, marginTop: 1 }}>{slot.sub}</p>
                          </button>
                        )
                      })}
                    </div>

                    {/* Notes input */}
                    <div style={{ position: 'relative' }}>
                      <input
                        placeholder="Add notes (e.g. prefer morning shifts, school pickup at 3pm)"
                        value={a.notes}
                        onChange={e => setNotes(day, e.target.value)}
                        style={inputStyle}
                        onFocus={e => { e.currentTarget.style.borderColor = c.staff; e.currentTarget.style.boxShadow = `0 0 0 3px ${c.staff}15` }}
                        onBlur={e => { e.currentTarget.style.borderColor = dk.inputBorder; e.currentTarget.style.boxShadow = 'none' }}
                      />
                    </div>
                  </div>
                )}
              </Glass>
            )
          })}
        </div>

        {/* ═══════ STICKY SAVE BUTTON ═══════ */}
        <div style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 50, width: '100%', maxWidth: 500, padding: '0 16px',
        }}>
          <button onClick={handleSave} disabled={saving}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '16px 24px', borderRadius: 16, border: 'none', cursor: saving ? 'default' : 'pointer',
              fontSize: 14, fontWeight: 800, color: 'white',
              background: saved ? 'linear-gradient(135deg, #10b981, #059669)' : `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`,
              boxShadow: saved ? '0 8px 32px -4px rgba(16,185,129,0.5)' : `0 8px 32px -4px ${c.staff}60`,
              opacity: saving ? 0.7 : 1, transition: 'all .3s cubic-bezier(.16,1,.3,1)',
              backdropFilter: 'blur(12px)',
            }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.transform = 'scale(1.02)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            {saving ? (
              <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
            ) : saved ? (
              <><CheckCircle size={18} /> Availability Saved!</>
            ) : (
              <><Save size={18} /> Save Availability {hasChanges && <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 800, background: 'rgba(255,255,255,0.25)' }}>Changed</span>}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}