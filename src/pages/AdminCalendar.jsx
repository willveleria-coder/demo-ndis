import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar, ChevronLeft, ChevronRight, Clock, Plus, User, Play, Check,
  MapPin, Filter, Loader2, Sparkles, ArrowRight, Activity, Layers,
  Shield, ChevronDown, Eye, Search
} from 'lucide-react'
import { getShifts, createShift } from '../services/shiftService'
import { getStaffMembers } from '../services/staffService'
import { getParticipants } from '../services/participantService'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Modal from '../components/ui/Modal'
import { useBrandColors } from '../hooks/useBrandColors'
import { useTheme } from '../context/ThemeContext'


/* ─────────────────────────────────────────────
   DESIGN SYSTEM
   ───────────────────────────────────────────── */

function Glass({ children, dark, glow, hover, style, ...p }) {
  const base = dark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.55)'
  const border = dark ? 'rgba(51,65,85,0.4)' : 'rgba(255,255,255,0.7)'
  return (
    <div
      style={{
        background: base, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${border}`, borderRadius: '1.25rem',
        boxShadow: glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)',
        transition: hover ? 'all .3s cubic-bezier(.16,1,.3,1)' : undefined,
        ...style,
      }}
      onMouseEnter={hover ? e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = glow ? `0 16px 48px -8px ${glow}` : '0 12px 40px -8px rgba(0,0,0,0.12)' } : undefined}
      onMouseLeave={hover ? e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)' } : undefined}
      {...p}
    >{children}</div>
  )
}

function Orb({ color, size = 200, top, left, right, bottom, delay = 0 }) {
  return (<div style={{ position: 'absolute', width: size, height: size, top, left, right, bottom, background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, opacity: 0.12, borderRadius: '50%', animation: `orbFloat ${6 + delay}s ease-in-out ${delay}s infinite`, pointerEvents: 'none', zIndex: 0 }} />)
}

function AnimNum({ value, duration = 900 }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef()
  useEffect(() => {
    const num = typeof value === 'number' ? value : parseInt(value) || 0
    const start = performance.now()
    function tick(now) { const p = Math.min((now - start) / duration, 1); setDisplay(Math.round(num * (1 - Math.pow(1 - p, 3)))); if (p < 1) ref.current = requestAnimationFrame(tick) }
    ref.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(ref.current)
  }, [value, duration])
  return <>{display}</>
}

function Badge({ children, color = 'gray', dark }) {
  const palettes = {
    gray: dark ? { bg: 'rgba(100,116,139,0.2)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)' } : { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
    green: dark ? { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' } : { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
    amber: dark ? { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' } : { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    blue: dark ? { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' } : { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    orange: dark ? { bg: 'rgba(249,115,22,0.15)', text: '#fb923c', border: 'rgba(249,115,22,0.3)' } : { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
  }
  const pl = palettes[color] || palettes.gray
  return (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: pl.bg, color: pl.text, border: `1px solid ${pl.border}`, whiteSpace: 'nowrap' }}>{children}</span>)
}


/* ─── Config (100% preserved) ─── */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const SERVICE_TYPES = ['Community Access', 'Personal Care', 'Cleaning', 'Gardening', 'Respite Care', 'Transport', 'Social Support', 'Other']

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
}


/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

export default function AdminCalendar() {
  const { user } = useAuth()
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loaded, setLoaded] = useState(false)

  const dk = {
    text: isDark ? '#e2e8f0' : '#1f2937',
    textSoft: isDark ? '#cbd5e1' : '#374151',
    textMuted: isDark ? '#94a3b8' : '#6b7280',
    textFaint: isDark ? '#64748b' : '#9ca3af',
    subtleBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    subtleBg2: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    inputBg: isDark ? 'rgba(30,41,59,0.8)' : '#f9fafb',
    inputBorder: isDark ? 'rgba(51,65,85,0.5)' : '#e5e7eb',
    calDayBg: isDark ? 'rgba(30,41,59,0.4)' : 'rgba(255,255,255,0.5)',
    calDayBorder: isDark ? 'rgba(51,65,85,0.3)' : 'rgba(255,255,255,0.6)',
    divider: isDark ? 'rgba(51,65,85,0.3)' : 'rgba(0,0,0,0.05)',
  }

  const inputStyle = { width: '100%', padding: '12px 14px', background: dk.inputBg, border: `1.5px solid ${dk.inputBorder}`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none', transition: 'all .2s' }

  const WORKER_COLORS_HEX = [c.staff, c.primary, '#a855f7', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e']

  /* ─── State ─── */
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [shifts, setShifts] = useState([])
  const [staffList, setStaffList] = useState([])
  const [participants, setParticipants] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedShifts, setSelectedShifts] = useState([])
  const [showDayModal, setShowDayModal] = useState(false)
  const [showNewShift, setShowNewShift] = useState(false)
  const [filterWorker, setFilterWorker] = useState('all')
  const [viewMode, setViewMode] = useState('month')
  const [newShift, setNewShift] = useState({
    participant_id: '', staff_id: '', shift_date: '', start_time: '', end_time: '',
    service_type: '', location: '', notes: '',
  })
  const [staffAvailability, setStaffAvailability] = useState([])
  const [mapCoords, setMapCoords] = useState(null)
  const geocodeTimer = useRef(null)

  const stg = (i) => ({ transitionDelay: `${i * 50}ms`, opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(14px)', transition: 'all .6s cubic-bezier(.16,1,.3,1)' })


  /* ═══════════════════════════════════════════
     ALL BACKEND LOGIC — 100% PRESERVED
     ═══════════════════════════════════════════ */

  const geocodeLocation = (address, instant = false) => {
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current)
    if (!address || address.length < 5) { setMapCoords(null); return }
    const doGeocode = async () => {
      try {
        let formatted = address.trim()
        formatted = formatted.replace(/\s+(VIC|NSW|QLD|SA|WA|TAS|NT|ACT)\s+/i, ', $1 ')
        formatted = formatted.replace(/,?\s*(\d{4})$/, ', $1')
        const q = encodeURIComponent(formatted + ', Australia')
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1&countrycodes=au`, {
          headers: { 'User-Agent': 'VelCare/1.0' },
        })
        const data = await res.json()
        if (data?.[0]) {
          setMapCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display: data[0].display_name })
        } else {
          const parts = address.trim().split(/\s+/)
          const fallback = parts.slice(Math.max(0, parts.length - 4)).join(' ') + ', Australia'
          const res2 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallback)}&limit=1&countrycodes=au`, {
            headers: { 'User-Agent': 'VelCare/1.0' },
          })
          const data2 = await res2.json()
          if (data2?.[0]) {
            setMapCoords({ lat: parseFloat(data2[0].lat), lon: parseFloat(data2[0].lon), display: data2[0].display_name })
          } else { setMapCoords(null) }
        }
      } catch { setMapCoords(null) }
    }
    if (instant) { doGeocode() } else { geocodeTimer.current = setTimeout(doGeocode, 400) }
  }

  useEffect(() => {
    async function load() {
      try {
        const [sh, s, p, av] = await Promise.all([
          getShifts().catch(() => []),
          getStaffMembers().catch(() => []),
          getParticipants().catch(() => []),
          supabase.from('staff_availability').select('*').then(r => r.data || []).catch(() => []),
        ])
        setShifts(sh); setStaffList(s); setParticipants(p); setStaffAvailability(av)
      } catch (err) { console.error('Calendar load error:', err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  useEffect(() => { if (!loading) setTimeout(() => setLoaded(true), 50) }, [loading])

  const CAL_DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const getStaffAvailForDate = (staffId, dateStr) => {
    if (!dateStr) return { hasData: false }
    const dayName = CAL_DAY_NAMES[new Date(dateStr + 'T00:00:00').getDay()]
    const row = staffAvailability.find(a => a.staff_id === staffId && a.day_of_week === dayName)
    const hasAnyAvail = staffAvailability.some(a => a.staff_id === staffId)
    if (!hasAnyAvail) return { hasData: false }
    if (!row) return { hasData: true, available: false, slots: [] }
    const slots = []
    if (row.morning) slots.push('Morning')
    if (row.afternoon) slots.push('Afternoon')
    if (row.evening) slots.push('Evening')
    if (row.night) slots.push('Night')
    return { hasData: true, available: true, slots, notes: row.notes }
  }

  const year = currentDate.getFullYear(), month = currentDate.getMonth()
  const today = new Date()

  const getShiftsForDate = (dateStr) => {
    let filtered = shifts.filter(s => s.shift_date === dateStr)
    if (filterWorker !== 'all') filtered = filtered.filter(s => s.staff_id === filterWorker)
    return filtered
  }

  const getWorkerColor = (staffId) => {
    const idx = staffList.findIndex(s => s.id === staffId)
    return WORKER_COLORS_HEX[idx % WORKER_COLORS_HEX.length]
  }

  const handleParticipantChange = (pid) => {
    const p = participants.find(x => x.id === pid)
    const loc = p?.address || newShift.location
    setNewShift({ ...newShift, participant_id: pid, location: loc })
    if (loc) geocodeLocation(loc, true)
  }

  const handleCreateShift = async () => {
    const shiftDate = newShift.shift_date || selectedDate || ''
    if (!newShift.staff_id || !shiftDate || !newShift.start_time || !newShift.end_time) {
      alert('Please fill in staff, date, start and end time'); return
    }
    setSaving(true)
    try {
      const created = await createShift({
        org_id: user.org_id, staff_id: newShift.staff_id,
        participant_id: newShift.participant_id || null,
        shift_date: shiftDate,
        start_time: `${shiftDate}T${newShift.start_time}:00`,
        end_time: `${shiftDate}T${newShift.end_time}:00`,
        service_type: newShift.service_type || null,
        location: newShift.location || null,
        notes: newShift.notes || null, status: 'scheduled',
      })
      setShifts([...shifts, created])
      setShowNewShift(false); setMapCoords(null)
      setNewShift({ participant_id: '', staff_id: '', shift_date: '', start_time: '', end_time: '', service_type: '', location: '', notes: '' })
    } catch (err) { alert('Failed to create shift: ' + err.message) }
    finally { setSaving(false) }
  }

  const navPrev = () => {
    if (viewMode === 'month') setCurrentDate(new Date(year, month - 1, 1))
    else if (viewMode === 'week') setCurrentDate(new Date(currentDate.getTime() - 7 * 86400000))
    else setCurrentDate(new Date(currentDate.getTime() - 86400000))
  }
  const navNext = () => {
    if (viewMode === 'month') setCurrentDate(new Date(year, month + 1, 1))
    else if (viewMode === 'week') setCurrentDate(new Date(currentDate.getTime() + 7 * 86400000))
    else setCurrentDate(new Date(currentDate.getTime() + 86400000))
  }
  const navLabel = () => {
    if (viewMode === 'month') return `${MONTHS[month]} ${year}`
    if (viewMode === 'day') return currentDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const start = getWeekStart(currentDate)
    const end = new Date(start.getTime() + 6 * 86400000)
    return `${start.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }

  function getWeekStart(d) { const date = new Date(d); const day = date.getDay(); const diff = day === 0 ? 6 : day - 1; date.setDate(date.getDate() - diff); date.setHours(0, 0, 0, 0); return date }
  function dateStr(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
  function isSameDay(d1, d2) { return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear() }

  const todayStr = today.toISOString().split('T')[0]
  const todayShifts = getShiftsForDate(todayStr)
  const inProgressCount = todayShifts.filter(s => s.status === 'in_progress').length
  const scheduledCount = todayShifts.filter(s => s.status === 'scheduled').length
  const completedCount = todayShifts.filter(s => s.status === 'completed').length
  const totalShifts = shifts.length


  /* ─── MONTH VIEW — REDESIGNED WITH SQUARE CELLS ─── */
  const MonthView = () => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const calendarDays = []

    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(<div key={`empty-${i}`} style={{ minHeight: 100, borderRadius: 12, background: dk.subtleBg, opacity: 0.4 }} />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayShifts = getShiftsForDate(ds)
      const isCurrent = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
      const hasInProgress = dayShifts.some(s => s.status === 'in_progress')
      const isWeekend = new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6

      calendarDays.push(
        <button
          key={day}
          onClick={() => { setSelectedDate(ds); setSelectedShifts(dayShifts); setShowDayModal(true) }}
          style={{
            minHeight: 100, padding: '6px 8px', borderRadius: 14, textAlign: 'left',
            cursor: 'pointer', position: 'relative', display: 'flex', flexDirection: 'column',
            border: isCurrent ? `2px solid ${c.primary}` : `1px solid ${dk.calDayBorder}`,
            background: isCurrent
              ? (isDark ? `${c.primary}18` : `${c.primary}06`)
              : dayShifts.length > 0
                ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)')
                : dk.calDayBg,
            boxShadow: isCurrent ? `0 0 0 3px ${c.primary}20, 0 4px 16px -4px ${c.primary}15` : 'none',
            transition: 'all .25s cubic-bezier(.16,1,.3,1)',
            overflow: 'hidden',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
            e.currentTarget.style.boxShadow = `0 12px 32px -8px ${c.primary}25`
            e.currentTarget.style.borderColor = `${c.primary}50`
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = isCurrent ? `0 0 0 3px ${c.primary}20, 0 4px 16px -4px ${c.primary}15` : 'none'
            e.currentTarget.style.borderColor = isCurrent ? c.primary : dk.calDayBorder
          }}
        >
          {/* Today indicator glow */}
          {isCurrent && <div style={{ position: 'absolute', inset: 0, borderRadius: 14, background: `radial-gradient(circle at 30% 30%, ${c.primary}10, transparent 70%)`, pointerEvents: 'none' }} />}

          {/* Day number + count */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
            <div style={{
              width: isCurrent ? 28 : 'auto', height: isCurrent ? 28 : 'auto',
              borderRadius: isCurrent ? 8 : 0,
              background: isCurrent ? `linear-gradient(135deg, ${c.primary}, ${c.adminHover})` : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: isCurrent ? 0 : '0',
            }}>
              <span style={{
                fontSize: 14, fontWeight: 800,
                color: isCurrent ? 'white' : isWeekend ? dk.textFaint : dk.textSoft,
              }}>{day}</span>
            </div>
            {dayShifts.length > 0 && (
              <span style={{
                padding: '2px 7px', borderRadius: 999, fontSize: 10, fontWeight: 800,
                background: hasInProgress ? 'rgba(16,185,129,0.15)' : `${c.staff}15`,
                color: hasInProgress ? '#10b981' : c.staff,
                border: `1px solid ${hasInProgress ? 'rgba(16,185,129,0.25)' : `${c.staff}25`}`,
              }}>{dayShifts.length}</span>
            )}
          </div>

          {/* Shift previews */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6, position: 'relative', zIndex: 1, overflow: 'hidden' }}>
            {dayShifts.slice(0, 3).map((shift, i) => {
              const statusColor = shift.status === 'in_progress' ? '#10b981' : shift.status === 'completed' ? (isDark ? '#64748b' : '#9ca3af') : c.staff
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '3px 6px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                  background: isDark ? `${statusColor}15` : `${statusColor}08`,
                  borderLeft: `3px solid ${statusColor}`,
                  color: shift.status === 'in_progress' ? '#059669' : shift.status === 'completed' ? dk.textFaint : dk.textSoft,
                  overflow: 'hidden', whiteSpace: 'nowrap',
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: getWorkerColor(shift.staff_id), boxShadow: `0 0 4px ${getWorkerColor(shift.staff_id)}40` }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{shift.staff ? shift.staff.first_name : '?'}</span>
                </div>
              )
            })}
            {dayShifts.length > 3 && <p style={{ fontSize: 9, fontWeight: 700, paddingLeft: 6, color: dk.textFaint }}>+{dayShifts.length - 3} more</p>}
          </div>

          {/* Live pulse indicator */}
          {hasInProgress && (
            <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', alignItems: 'center', gap: 3, zIndex: 2 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'pulse-dot 2s ease-in-out infinite', boxShadow: '0 0 8px rgba(16,185,129,0.5)' }} />
            </div>
          )}

          {/* Bottom accent for days with shifts */}
          {dayShifts.length > 0 && (
            <div style={{ position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 3, borderRadius: '3px 3px 0 0', background: `linear-gradient(90deg, ${c.staff}40, ${c.primary}40)` }} />
          )}
        </button>
      )
    }

    return (
      <Glass dark={isDark} glow={`${c.primary}08`} style={{ padding: '18px 20px' }}>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 7, marginBottom: 10 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => {
            const isWeekendHeader = i === 0 || i === 6
            return (
              <div key={d} style={{
                textAlign: 'center', fontSize: 11, fontWeight: 700, padding: '10px 0',
                color: isWeekendHeader ? dk.textFaint : dk.textMuted,
                borderRadius: 10, background: dk.subtleBg,
              }}>{d}</div>
            )
          })}
        </div>
        {/* Calendar grid with square cells — capped width for smaller squares */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 7 }}>{calendarDays}</div>
      </Glass>
    )
  }


  /* ─── WEEK VIEW (100% preserved render logic) ─── */
  const WeekView = () => {
    const weekStart = getWeekStart(currentDate)
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart.getTime() + i * 86400000)
      return { date: d, str: dateStr(d) }
    })

    return (
      <Glass dark={isDark} glow={`${c.primary}08`} style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {days.map(day => {
            const dayShifts = getShiftsForDate(day.str)
            const isToday = isSameDay(day.date, today)

            return (
              <div key={day.str} style={{ minHeight: 400, borderRight: `1px solid ${dk.divider}`, background: isToday ? (isDark ? `${c.primary}10` : `${c.primary}05`) : 'transparent' }}>
                <div style={{ padding: '12px', textAlign: 'center', borderBottom: `1px solid ${dk.divider}`, background: isToday ? (isDark ? `${c.primary}15` : `${c.primary}08`) : 'transparent' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: isToday ? c.primary : dk.textFaint }}>{day.date.toLocaleDateString('en-AU', { weekday: 'short' })}</p>
                  <p style={{ fontSize: 20, fontWeight: 900, color: isToday ? c.primary : dk.text }}>{day.date.getDate()}</p>
                </div>
                <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {dayShifts.length > 0 ? dayShifts.map(shift => (
                    <Link key={shift.id} to={`/admin/roster/shift/${shift.id}`} style={{
                      display: 'block', padding: 10, borderRadius: 12, fontSize: 12, textDecoration: 'none', transition: 'all .2s',
                      border: `1px solid ${shift.status === 'in_progress' ? (isDark ? 'rgba(16,185,129,0.2)' : '#a7f3d0') : shift.status === 'completed' ? (isDark ? 'rgba(107,114,128,0.2)' : '#e5e7eb') : (isDark ? 'rgba(51,65,85,0.3)' : '#f3f4f6')}`,
                      background: shift.status === 'in_progress' ? (isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5') : shift.status === 'completed' ? (isDark ? 'rgba(107,114,128,0.1)' : '#f9fafb') : (isDark ? 'rgba(30,41,59,0.5)' : 'white'),
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: getWorkerColor(shift.staff_id) }} />
                        <p style={{ fontWeight: 700, color: dk.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shift.staff ? shift.staff.first_name : '?'}</p>
                      </div>
                      <p style={{ color: dk.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shift.participants ? `${shift.participants.first_name} ${shift.participants.last_name}` : shift.service_type || 'Shift'}</p>
                      <p style={{ color: dk.textFaint, marginTop: 2 }}>{formatTime(shift.start_time)} – {formatTime(shift.end_time)}</p>
                      {shift.location && <p style={{ color: dk.textFaint, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={8} />{shift.location}</p>}
                      <div style={{ marginTop: 6 }}><Badge color={shift.status === 'in_progress' ? 'green' : shift.status === 'completed' ? 'orange' : 'blue'} dark={isDark}>{shift.status === 'in_progress' ? '● Live' : shift.status.replace('_', ' ')}</Badge></div>
                    </Link>
                  )) : <p style={{ fontSize: 10, textAlign: 'center', marginTop: 16, color: dk.textFaint }}>No shifts</p>}
                </div>
              </div>
            )
          })}
        </div>
      </Glass>
    )
  }


  /* ─── DAY VIEW (100% preserved render logic) ─── */
  const DayView = () => {
    const dStr = dateStr(currentDate)
    const dayShifts = getShiftsForDate(dStr).sort((a, b) => new Date(a.start_time) - new Date(b.start_time))

    return (
      <Glass dark={isDark} glow={`${c.primary}08`} style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${dk.divider}` }}>
          <p style={{ fontSize: 18, fontWeight: 900, color: dk.text }}>{currentDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <p style={{ fontSize: 13, color: dk.textMuted, marginTop: 2 }}>{dayShifts.length} shift{dayShifts.length !== 1 ? 's' : ''}</p>
        </div>
        <div>
          {dayShifts.length > 0 ? dayShifts.map((shift, i) => (
            <Link key={shift.id} to={`/admin/roster/shift/${shift.id}`} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px', textDecoration: 'none', transition: 'all .2s',
              borderBottom: i < dayShifts.length - 1 ? `1px solid ${dk.divider}` : undefined,
              background: shift.status === 'in_progress' ? (isDark ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.04)') : 'transparent',
            }}
            onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.02)' : `${c.primary}04`}
            onMouseLeave={e => e.currentTarget.style.background = shift.status === 'in_progress' ? (isDark ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.04)') : 'transparent'}>
              <div style={{ width: 64, textAlign: 'center', flexShrink: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: dk.text }}>{formatTime(shift.start_time)}</p>
                <p style={{ fontSize: 10, color: dk.textFaint }}>{formatTime(shift.end_time)}</p>
              </div>
              <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 999, background: shift.status === 'in_progress' ? '#10b981' : shift.status === 'completed' ? (isDark ? '#475569' : '#d1d5db') : c.primary }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, background: getWorkerColor(shift.staff_id) }} />
                  <p style={{ fontWeight: 700, fontSize: 14, color: dk.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shift.participants ? `${shift.participants.first_name} ${shift.participants.last_name}` : 'Shift'}</p>
                  <Badge color={shift.status === 'in_progress' ? 'green' : shift.status === 'completed' ? 'orange' : 'blue'} dark={isDark}>{shift.status === 'in_progress' ? '● Live' : shift.status.replace('_', ' ')}</Badge>
                </div>
                <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><User size={10} />{shift.staff ? `${shift.staff.first_name} ${shift.staff.last_name}` : '?'} · {shift.service_type || 'Support'}</p>
                {shift.location && <p style={{ fontSize: 12, color: dk.textFaint, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={10} />{shift.location}</p>}
              </div>
            </Link>
          )) : (
            <div style={{ textAlign: 'center', padding: '64px 24px' }}>
              <Calendar size={44} style={{ color: isDark ? '#334155' : '#e5e7eb', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, fontWeight: 500, color: dk.textMuted }}>No shifts scheduled for this day</p>
            </div>
          )}
        </div>
      </Glass>
    )
  }


  /* ─── Loading ─── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${c.primary}40` }}><Calendar size={32} color="white" /></div>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.3 }} />
      </div>
      <p style={{ color: dk.textMuted, fontSize: 14, fontWeight: 600 }}>Loading calendar...</p>
    </div>
  )

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <style>{`
        @keyframes orbFloat { 0%,100% { transform:translateY(0) scale(1) } 50% { transform:translateY(-15px) scale(1.03) } }
        @keyframes ping { 75%,100% { transform:scale(1.8);opacity:0 } }
        @keyframes pulse-dot { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes countUp { from { opacity:0;transform:translateY(8px) scale(0.95) } to { opacity:1;transform:translateY(0) scale(1) } }
        .count-up { animation: countUp .7s cubic-bezier(.16,1,.3,1) forwards }
      `}</style>

      <Orb color={c.primary} size={380} top="-100px" right="-80px" delay={0} />
      <Orb color="#3b82f6" size={280} bottom="15%" left="-60px" delay={2} />
      <Orb color="#10b981" size={200} top="45%" right="8%" delay={3.5} />
      <Orb color="#8b5cf6" size={160} bottom="30%" left="40%" delay={5} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ══════════ HERO ══════════ */}
        <div style={stg(0)}>
          <div style={{ borderRadius: 24, padding: '28px 24px', position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 40%, #3b82f6 70%, #06b6d4 100%)` }}>
            <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: -80, right: -40 }} />
            <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -50, left: '25%' }} />
            <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent)', top: 30, left: '55%', animation: 'orbFloat 8s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.5 }} />
            {[{ top: '15%', right: '20%', s: 4, d: 0 }, { top: '60%', right: '10%', s: 3, d: 1.5 }, { bottom: '25%', left: '35%', s: 5, d: 3 }].map((dot, i) => (
              <div key={i} style={{ position: 'absolute', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', width: dot.s * 2, height: dot.s * 2, top: dot.top, right: dot.right, bottom: dot.bottom, left: dot.left, animation: `orbFloat ${4 + dot.d}s ease-in-out infinite ${dot.d}s` }} />
            ))}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}><Calendar size={13} style={{ color: 'rgba(255,255,255,0.7)' }} /><span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Staff Calendar</span></div>
                {inProgressCount > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.25)', backdropFilter: 'blur(8px)' }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', animation: 'pulse-dot 2s ease-in-out infinite' }} /><span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{inProgressCount} live now</span></div>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15 }}>{navLabel()}</h1>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>View and manage all shifts and schedules</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowNewShift(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 16, border: 'none', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}><Plus size={18} /> New Shift</button>
                  <Link to="/admin/roster" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}><ArrowRight size={16} /> Roster</Link>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
                {[
                  { icon: Activity, text: `${todayShifts.length} shifts today` },
                  { icon: Calendar, text: `${totalShifts} total shifts` },
                  { icon: User, text: `${staffList.length} staff members` },
                ].map((pill, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <pill.icon size={14} style={{ color: 'rgba(255,255,255,0.8)' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{pill.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════ STAT CARDS ══════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, ...stg(1) }}>
          {[
            { icon: Play, label: 'In Progress', value: inProgressCount, grad: 'linear-gradient(135deg, #10b981, #06b6d4)', glow: 'rgba(16,185,129,0.2)', pulse: inProgressCount > 0 },
            { icon: Clock, label: 'Upcoming Today', value: scheduledCount, grad: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, glow: `${c.staff}25` },
            { icon: Check, label: 'Completed Today', value: completedCount, grad: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, glow: `${c.primary}25` },
            { icon: Calendar, label: 'Total Shifts', value: totalShifts, grad: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', glow: 'rgba(139,92,246,0.2)' },
          ].map((card, i) => (
            <Glass key={i} dark={isDark} hover glow={card.glow} style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
              {card.pulse && <div style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'pulse-dot 2s ease-in-out infinite' }} />}
              <div style={{ width: 42, height: 42, borderRadius: 12, background: card.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 20px -4px ${card.glow}`, marginBottom: 12 }}><card.icon size={20} color="white" /></div>
              <p style={{ fontSize: 22, fontWeight: 800, color: dk.text, lineHeight: 1 }} className="count-up"><AnimNum value={card.value} /></p>
              <p style={{ fontSize: 11, fontWeight: 600, color: dk.textFaint, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</p>
            </Glass>
          ))}
        </div>

        {/* ══════════ CONTROLS BAR ══════════ */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', ...stg(2) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Glass dark={isDark} style={{ padding: 4, display: 'flex', gap: 4 }}>
              {['month', 'week', 'day'].map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)} style={{
                  padding: '10px 16px', borderRadius: 12, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  background: viewMode === mode ? `linear-gradient(135deg, ${c.primary}, ${c.adminHover})` : 'transparent',
                  color: viewMode === mode ? 'white' : dk.textMuted,
                  boxShadow: viewMode === mode ? `0 4px 16px -4px ${c.primary}60` : 'none',
                }}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</button>
              ))}
            </Glass>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={15} style={{ color: dk.textFaint }} />
              <div style={{ position: 'relative' }}>
                <select value={filterWorker} onChange={e => setFilterWorker(e.target.value)} style={{ padding: '10px 32px 10px 12px', background: dk.inputBg, border: `1px solid ${dk.inputBorder}`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none', appearance: 'none', cursor: 'pointer' }}>
                  <option value="all">All Staff</option>
                  {staffList.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint, pointerEvents: 'none' }} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {staffList.slice(0, 5).map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: dk.textMuted }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: WORKER_COLORS_HEX[i % WORKER_COLORS_HEX.length] }} />
                <span>{s.first_name}</span>
              </div>
            ))}
            {staffList.length > 5 && <span style={{ fontSize: 11, color: dk.textFaint }}>+{staffList.length - 5} more</span>}
          </div>
        </div>

        {/* ══════════ NAVIGATION BAR ══════════ */}
        <Glass dark={isDark} style={{ ...stg(3), padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={navPrev} style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: 'transparent', color: dk.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => e.currentTarget.style.background = dk.subtleBg2}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><ChevronLeft size={20} /></button>
          <h3 style={{ fontSize: 18, fontWeight: 900, color: dk.text }}>{navLabel()}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setCurrentDate(new Date())} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: c.primary, background: isDark ? `${c.primary}15` : `${c.primary}08` }}>Today</button>
            <button onClick={navNext} style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: 'transparent', color: dk.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => e.currentTarget.style.background = dk.subtleBg2}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><ChevronRight size={20} /></button>
          </div>
        </Glass>

        {/* ══════════ CALENDAR VIEW ══════════ */}
        <div style={stg(4)}>
          {viewMode === 'month' && <MonthView />}
          {viewMode === 'week' && <WeekView />}
          {viewMode === 'day' && <DayView />}
        </div>


        {/* ══════════ TODAY'S SCHEDULE (month view) ══════════ */}
        {viewMode === 'month' && (
          <Glass dark={isDark} glow={`${c.primary}08`} style={{ ...stg(5), padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontWeight: 800, color: dk.text, fontSize: 16 }}>Today's Schedule</h3>
                <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 10, background: `${c.primary}15`, color: c.primary }}>{todayShifts.length}</span>
              </div>
              <Link to="/admin/roster" style={{ fontSize: 12, fontWeight: 600, color: c.primary, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>View Roster <ArrowRight size={12} /></Link>
            </div>
            {todayShifts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {todayShifts.slice(0, 6).map((shift, i) => (
                  <Link key={shift.id} to={`/admin/roster/shift/${shift.id}`} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, textDecoration: 'none',
                    background: dk.subtleBg, border: `1px solid ${dk.divider}`, transition: 'all .2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 16px -4px ${c.primary}15`; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = 'translateY(0)' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px -2px rgba(0,0,0,0.15)',
                      background: shift.status === 'in_progress' ? 'linear-gradient(135deg, #10b981, #14b8a6)' : shift.status === 'completed' ? `linear-gradient(135deg, ${c.primary}, ${c.adminHover})` : `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`,
                    }}>
                      {shift.status === 'in_progress' ? <Play size={18} color="white" /> : shift.status === 'completed' ? <Check size={18} color="white" /> : <Clock size={18} color="white" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <p style={{ fontWeight: 700, fontSize: 13, color: dk.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shift.participants ? `${shift.participants.first_name} ${shift.participants.last_name}` : shift.service_type || 'Shift'}</p>
                        <Badge color={shift.status === 'in_progress' ? 'green' : shift.status === 'completed' ? 'orange' : 'blue'} dark={isDark}>{shift.status === 'in_progress' ? '● Live' : shift.status.replace('_', ' ')}</Badge>
                      </div>
                      <p style={{ fontSize: 11, color: dk.textMuted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <User size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />{shift.staff ? `${shift.staff.first_name} ${shift.staff.last_name}` : 'Unassigned'} · {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 24px' }}>
                <Calendar size={40} style={{ color: isDark ? '#334155' : '#e5e7eb', margin: '0 auto 12px' }} />
                <p style={{ fontSize: 13, color: dk.textMuted }}>No shifts scheduled for today</p>
              </div>
            )}
          </Glass>
        )}

        {/* ══════════ DAY DETAIL MODAL — REDESIGNED ══════════ */}
        <Modal isOpen={showDayModal} onClose={() => setShowDayModal(false)} title={selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Shifts'} wide>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Hero header */}
            <div style={{ margin: '-24px -24px 0 -24px', padding: '24px 28px 20px', position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0', background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 40%, #3b82f6 70%, #06b6d4 100%)` }}>
              <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -60, right: -30 }} />
              <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', bottom: -30, left: '35%' }} />
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.4 }} />
              {[{ top: '20%', right: '15%', s: 3, d: 0 }, { bottom: '25%', left: '25%', s: 4, d: 1 }].map((dot, i) => (
                <div key={i} style={{ position: 'absolute', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', width: dot.s * 2, height: dot.s * 2, top: dot.top, right: dot.right, bottom: dot.bottom, left: dot.left, animation: `orbFloat ${4 + dot.d}s ease-in-out infinite ${dot.d}s` }} />
              ))}
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Calendar size={28} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  {selectedDate && <>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long' })}</div>
                    <h3 style={{ fontSize: 24, fontWeight: 900, color: 'white', letterSpacing: '-0.01em', lineHeight: 1.1, marginTop: 2 }}>{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}</h3>
                  </>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', fontSize: 13, fontWeight: 700, color: 'white' }}>{selectedShifts.length} shift{selectedShifts.length !== 1 ? 's' : ''}</span>
                  {selectedShifts.some(s => s.status === 'in_progress') && <span style={{ padding: '6px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.3)', fontSize: 13, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', animation: 'pulse-dot 2s infinite' }} /> Live</span>}
                </div>
              </div>
            </div>

            {/* Shift cards */}
            {selectedShifts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedShifts.map(shift => {
                  const statusGrad = shift.status === 'in_progress' ? 'linear-gradient(135deg, #10b981, #14b8a6)' : shift.status === 'completed' ? `linear-gradient(135deg, ${c.primary}, ${c.adminHover})` : `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`
                  const statusColor = shift.status === 'in_progress' ? '#10b981' : shift.status === 'completed' ? '#8b5cf6' : c.staff
                  return (
                    <div key={shift.id} style={{ padding: '18px 20px', borderRadius: 16, background: dk.subtleBg, border: `1.5px solid ${dk.inputBorder}`, position: 'relative', overflow: 'hidden', transition: 'all .2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = `${statusColor}40`; e.currentTarget.style.transform = 'translateY(-1px)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = dk.inputBorder; e.currentTarget.style.transform = 'translateY(0)' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderRadius: '0 4px 4px 0', background: statusColor }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingLeft: 8 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: statusGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 16px -4px ${statusColor}40` }}>
                          {shift.status === 'in_progress' ? <Play size={22} color="white" /> : shift.status === 'completed' ? <Check size={22} color="white" /> : <Clock size={22} color="white" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <p style={{ fontWeight: 700, fontSize: 14, color: dk.text }}>{shift.participants ? `${shift.participants.first_name} ${shift.participants.last_name}` : shift.service_type || 'Shift'}</p>
                            <Badge color={shift.status === 'in_progress' ? 'green' : shift.status === 'completed' ? 'orange' : 'blue'} dark={isDark}>{shift.status === 'in_progress' ? '● Live' : shift.status.replace('_', ' ')}</Badge>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
                            <span style={{ fontSize: 12, color: dk.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}><User size={12} /> {shift.staff ? `${shift.staff.first_name} ${shift.staff.last_name}` : '?'}</span>
                            <span style={{ fontSize: 12, color: dk.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {formatTime(shift.start_time)} – {formatTime(shift.end_time)}</span>
                            {shift.location && <span style={{ fontSize: 12, color: dk.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {shift.location}</span>}
                          </div>
                        </div>
                        <Link to={`/admin/roster/shift/${shift.id}`} style={{ padding: '10px 16px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, color: 'white', fontSize: 12, fontWeight: 700, textDecoration: 'none', flexShrink: 0, boxShadow: `0 4px 12px -3px ${c.primary}40` }}>View</Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 24px' }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px', background: dk.subtleBg2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={32} style={{ color: dk.textFaint }} /></div>
                <p style={{ fontSize: 16, fontWeight: 700, color: dk.text }}>No shifts scheduled</p>
                <p style={{ fontSize: 13, color: dk.textFaint, marginTop: 4 }}>Add a shift to this day</p>
                <button onClick={() => { setShowDayModal(false); setShowNewShift(true) }} style={{ marginTop: 16, padding: '12px 24px', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: `0 6px 20px -4px ${c.primary}40`, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Plus size={16} /> Add Shift</button>
              </div>
            )}

            {/* Quick add button when shifts exist */}
            {selectedShifts.length > 0 && (
              <button onClick={() => { setShowDayModal(false); setShowNewShift(true) }} style={{ padding: '14px 0', borderRadius: 14, border: `2px dashed ${c.primary}25`, background: `${c.primary}04`, color: c.primary, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${c.primary}10`; e.currentTarget.style.borderColor = `${c.primary}40` }}
                onMouseLeave={e => { e.currentTarget.style.background = `${c.primary}04`; e.currentTarget.style.borderColor = `${c.primary}25` }}>
                <Plus size={16} /> Add another shift
              </button>
            )}
          </div>
        </Modal>

        {/* ══════════ NEW SHIFT MODAL — REDESIGNED ══════════ */}
        <Modal isOpen={showNewShift} onClose={() => { setShowNewShift(false); setMapCoords(null) }} title="Create New Shift" wide>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Hero */}
            <div style={{ margin: '-24px -24px 0 -24px', padding: '24px 28px 20px', position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0', background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 40%, #3b82f6 70%, #10b981 100%)` }}>
              <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -60, right: -30 }} />
              <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', bottom: -30, left: '35%' }} />
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.4 }} />
              {[{ top: '20%', right: '15%', s: 3, d: 0 }, { bottom: '25%', left: '25%', s: 4, d: 1.5 }, { top: '50%', right: '40%', s: 2, d: 3 }].map((dot, i) => (
                <div key={i} style={{ position: 'absolute', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', width: dot.s * 2, height: dot.s * 2, top: dot.top, right: dot.right, bottom: dot.bottom, left: dot.left, animation: `orbFloat ${4 + dot.d}s ease-in-out infinite ${dot.d}s` }} />
              ))}
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Plus size={28} color="white" /></div>
                <div>
                  <h3 style={{ fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: '-0.01em' }}>Create New Shift</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Schedule a support session for your team</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 24 }}>

              {/* Section: Shift Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${c.primary}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={14} style={{ color: c.primary }} /></div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: dk.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Shift Details</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: dk.textFaint, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}><User size={11} /> Participant</p>
                    <select value={newShift.participant_id} onChange={e => handleParticipantChange(e.target.value)} style={inputStyle}>
                      <option value="">Select Participant</option>
                      {participants.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: dk.textFaint, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} /> Date *</p>
                    <input type="date" value={newShift.shift_date || selectedDate || ''} onChange={e => setNewShift({ ...newShift, shift_date: e.target.value, staff_id: '' })} style={inputStyle} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: dk.textFaint, marginBottom: 6 }}>Service Type</p>
                    <select value={newShift._isOther ? 'Other' : newShift.service_type} onChange={e => {
                      if (e.target.value === 'Other') setNewShift({ ...newShift, service_type: '', _isOther: true })
                      else setNewShift({ ...newShift, service_type: e.target.value, _isOther: false })
                    }} style={inputStyle}>
                      <option value="">Select type</option>
                      {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  {newShift._isOther ? (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: dk.textFaint, marginBottom: 6 }}>Custom Type</p>
                      <input placeholder="Specify service type..." value={newShift.service_type} onChange={e => setNewShift({ ...newShift, service_type: e.target.value })} style={inputStyle} autoFocus />
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: dk.textFaint, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} /> Location</p>
                      <input placeholder="Address" value={newShift.location} onChange={e => { setNewShift({ ...newShift, location: e.target.value }); geocodeLocation(e.target.value) }} style={inputStyle} />
                    </div>
                  )}
                </div>
                {newShift._isOther && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: dk.textFaint, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} /> Location</p>
                    <input placeholder="Address" value={newShift.location} onChange={e => { setNewShift({ ...newShift, location: e.target.value }); geocodeLocation(e.target.value) }} style={inputStyle} />
                  </div>
                )}
              </div>

              {/* Section: Time */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={14} style={{ color: '#3b82f6' }} /></div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: dk.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Time *</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 600, color: dk.textFaint, marginBottom: 4, textTransform: 'uppercase' }}>Start</p>
                    <input type="time" value={newShift.start_time} onChange={e => setNewShift({ ...newShift, start_time: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: dk.subtleBg2, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}><ArrowRight size={14} style={{ color: dk.textFaint }} /></div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 600, color: dk.textFaint, marginBottom: 4, textTransform: 'uppercase' }}>End</p>
                    <input type="time" value={newShift.end_time} onChange={e => setNewShift({ ...newShift, end_time: e.target.value })} style={inputStyle} />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: dk.divider }} />

              {/* Section: Staff Assignment */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${c.staff}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={14} style={{ color: c.staff }} /></div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: dk.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Assign Staff *</p>
                  </div>
                  {(newShift.shift_date || selectedDate) && (
                    <span style={{ fontSize: 11, color: dk.textFaint, fontWeight: 500 }}>
                      {new Date((newShift.shift_date || selectedDate) + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
                <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {staffList.filter(s => s.status === 'active').map(s => {
                    const shiftDate = newShift.shift_date || selectedDate || ''
                    const avail = getStaffAvailForDate(s.id, shiftDate)
                    const isUnavailable = avail.hasData && !avail.available
                    const isSelected = newShift.staff_id === s.id
                    return (
                      <button key={s.id} type="button" onClick={() => !isUnavailable && setNewShift({ ...newShift, staff_id: s.id })} disabled={isUnavailable}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, textAlign: 'left',
                          cursor: isUnavailable ? 'not-allowed' : 'pointer', transition: 'all .2s',
                          opacity: isUnavailable ? 0.5 : 1,
                          border: isSelected ? `2px solid ${c.staff}` : `1.5px solid ${isUnavailable ? (isDark ? 'rgba(239,68,68,0.2)' : '#fecaca') : dk.inputBorder}`,
                          background: isSelected ? (isDark ? `${c.staff}10` : `${c.staff}06`) : isUnavailable ? (isDark ? 'rgba(239,68,68,0.04)' : '#fef2f2') : dk.inputBg,
                          boxShadow: isSelected ? `0 0 0 3px ${c.staff}15` : 'none',
                        }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'white', fontSize: 13, fontWeight: 800, background: isUnavailable ? '#d1d5db' : isSelected ? `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` : '#94a3b8', boxShadow: isSelected ? `0 4px 12px -2px ${c.staff}40` : 'none' }}>
                          {s.first_name?.[0]}{s.last_name?.[0]}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: isUnavailable ? dk.textFaint : dk.text }}>{s.first_name} {s.last_name}</p>
                          {shiftDate ? (
                            <p style={{ fontSize: 11, fontWeight: 600, marginTop: 2, color: isUnavailable ? '#ef4444' : avail.hasData && avail.available ? '#10b981' : dk.textFaint }}>
                              {isUnavailable ? '✕ Not available this day' : avail.hasData && avail.available ? `✓ ${avail.slots.join(' · ')}${avail.notes ? ' — ' + avail.notes : ''}` : 'No availability set'}
                            </p>
                          ) : <p style={{ fontSize: 11, color: dk.textFaint }}>Select a date to see availability</p>}
                        </div>
                        {isSelected && <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={14} color="white" /></div>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: dk.textFaint, marginBottom: 6 }}>Notes</p>
                <textarea placeholder="Any additional notes for this shift..." value={newShift.notes} onChange={e => setNewShift({ ...newShift, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>

              {/* Map */}
              {mapCoords && (
                <div style={{ borderRadius: 16, overflow: 'hidden', border: `1.5px solid ${c.primary}20`, background: '#f8f9fa' }}>
                  <div style={{ position: 'relative', height: 190, overflow: 'hidden' }}>
                    {(() => {
                      const zoom = 15; const n = Math.pow(2, zoom)
                      const xtile = ((mapCoords.lon + 180) / 360) * n
                      const ytile = ((1 - Math.log(Math.tan(mapCoords.lat * Math.PI / 180) + 1 / Math.cos(mapCoords.lat * Math.PI / 180)) / Math.PI) / 2) * n
                      const cx = Math.floor(xtile), cy = Math.floor(ytile)
                      const tiles = []; for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) tiles.push({ x: cx + dx, y: cy + dy, dx, dy })
                      const offsetX = (xtile - cx) * 256, offsetY = (ytile - cy) * 256
                      return (<>
                        <div style={{ position: 'absolute', left: `calc(50% - ${offsetX}px - 512px)`, top: `calc(50% - ${offsetY}px - 512px)`, width: 1280, height: 1280 }}>
                          {tiles.map(t => (<img key={`${t.x}-${t.y}`} src={`https://a.basemaps.cartocdn.com/light_all/${zoom}/${t.x}/${t.y}@2x.png`} alt="" style={{ position: 'absolute', left: (t.dx + 2) * 256, top: (t.dy + 2) * 256, width: 256, height: 256 }} draggable={false} />))}
                        </div>
                        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-100%)', zIndex: 10, filter: `drop-shadow(0 2px 6px ${c.primary}66)` }}>
                          <svg width="36" height="46" viewBox="0 0 36 46" fill="none"><path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.06 27.94 0 18 0z" fill={c.primary} /><circle cx="18" cy="16.5" r="7" fill="white" /><circle cx="18" cy="16.5" r="3.5" fill={c.adminHover} /></svg>
                        </div>
                      </>)
                    })()}
                  </div>
                  <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, background: isDark ? 'rgba(30,41,59,0.8)' : '#f8fafc' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, boxShadow: `0 2px 8px -2px ${c.primary}50` }}><MapPin size={13} color="white" /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: dk.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mapCoords.display?.split(',').slice(0, 3).join(',')}</p>
                      <p style={{ fontSize: 9, color: dk.textFaint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mapCoords.display?.split(',').slice(3).join(',').trim()}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <a href={`https://maps.apple.com/?q=${encodeURIComponent(mapCoords.display)}&ll=${mapCoords.lat},${mapCoords.lon}`} target="_blank" rel="noopener noreferrer" style={{ padding: '4px 8px', borderRadius: 8, background: '#1f2937', color: 'white', fontSize: 10, fontWeight: 700, textDecoration: 'none' }}>Apple</a>
                      <a href={`https://www.google.com/maps/search/?api=1&query=${mapCoords.lat},${mapCoords.lon}`} target="_blank" rel="noopener noreferrer" style={{ padding: '4px 8px', borderRadius: 8, background: c.primary, color: 'white', fontSize: 10, fontWeight: 700, textDecoration: 'none' }}>Google</a>
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 12, borderTop: `1px solid ${dk.divider}`, paddingTop: 16 }}>
                <button onClick={() => { setShowNewShift(false); setMapCoords(null) }} style={{ flex: 1, padding: '16px 0', borderRadius: 14, background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9', border: `1px solid ${dk.inputBorder}`, color: dk.textMuted, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleCreateShift} disabled={saving}
                  style={{ flex: 2, padding: '16px 0', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, color: 'white', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: `0 8px 32px -6px ${c.primary}50`, opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all .2s' }}
                  onMouseEnter={e => { if (!saving) e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  {saving ? <><Loader2 size={18} className="animate-spin" /> Creating...</> : <><Plus size={18} /> Create Shift</>}
                </button>
              </div>
            </div>
          </div>
        </Modal>

      </div>
    </div>
  )
}