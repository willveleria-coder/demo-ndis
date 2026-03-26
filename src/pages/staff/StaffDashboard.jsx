import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, FileText, Clock, AlertTriangle, Play, Square, MapPin,
  ChevronLeft, ChevronRight, Timer, Zap, Activity, Coffee, Briefcase,
  ChevronRight as ChevronR, TrendingUp, CheckCircle, Heart, Users,
  Sunrise, Sun, Moon, Star, Target, Award, Bell, ArrowRight,
  BarChart3, Flame, Shield, Sparkles, Eye, Loader2, RefreshCw
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useStaff } from '../../context/StaffContext'
import { useBrandColors } from '../../hooks/useBrandColors'
import { useTheme } from '../../context/ThemeContext'
import Modal from '../../components/ui/Modal'
import GpsVerification from '../../components/GpsVerification'


/* ═══════════════════════════════════════════════
   HELPERS — all original helpers preserved
   ═══════════════════════════════════════════════ */
function formatTime(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
}
function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso), today = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return { text: 'Good morning', emoji: '☀️', icon: Sunrise, period: 'morning' }
  if (h < 17) return { text: 'Good afternoon', emoji: '🌤️', icon: Sun, period: 'afternoon' }
  if (h < 21) return { text: 'Good evening', emoji: '🌙', icon: Moon, period: 'evening' }
  return { text: 'Good night', emoji: '🌙', icon: Moon, period: 'night' }
}
function getLiveTimer(clockInTime) {
  if (!clockInTime) return '0:00:00'
  const diff = Date.now() - new Date(clockInTime).getTime()
  const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000)
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
function getStreak(shifts) {
  let streak = 0
  const completed = shifts.filter(s => s.status === 'completed').sort((a, b) => new Date(b.shift_date) - new Date(a.shift_date))
  const today = new Date(); today.setHours(0, 0, 0, 0)
  for (let i = 0; i < completed.length; i++) {
    const d = new Date(completed[i].shift_date); d.setHours(0, 0, 0, 0)
    const expected = new Date(today); expected.setDate(expected.getDate() - i)
    if (d.getTime() === expected.getTime()) streak++; else break
  }
  return streak
}
function getWeekHours(shifts) {
  const now = new Date(), startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); startOfWeek.setHours(0, 0, 0, 0)
  return shifts.filter(s => s.status === 'completed' && new Date(s.shift_date) >= startOfWeek)
    .reduce((a, s) => s.clock_in && s.clock_out ? a + (new Date(s.clock_out) - new Date(s.clock_in)) / 3600000 : a, 0)
}
function getWeekShiftsCompleted(shifts) {
  const now = new Date(), startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); startOfWeek.setHours(0, 0, 0, 0)
  return shifts.filter(s => s.status === 'completed' && new Date(s.shift_date) >= startOfWeek).length
}
function getTodayShifts(shifts) {
  const today = new Date().toISOString().split('T')[0]
  return shifts.filter(s => s.shift_date === today)
}
function getThisWeekShifts(shifts) {
  const now = new Date(), startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(endOfWeek.getDate() + 6); endOfWeek.setHours(23, 59, 59, 999)
  return shifts.filter(s => { const d = new Date(s.shift_date); return d >= startOfWeek && d <= endOfWeek })
}
function getShiftsByDay(shifts) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const now = new Date(), startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); startOfWeek.setHours(0, 0, 0, 0)
  return days.map((name, i) => {
    const dayDate = new Date(startOfWeek); dayDate.setDate(dayDate.getDate() + i)
    const dayStr = dayDate.toISOString().split('T')[0]
    const dayShifts = shifts.filter(s => s.shift_date === dayStr)
    const hours = dayShifts.reduce((a, s) => s.clock_in && s.clock_out ? a + (new Date(s.clock_out) - new Date(s.clock_in)) / 3600000 : a, 0)
    return { name, shifts: dayShifts.length, hours: Math.round(hours * 10) / 10, completed: dayShifts.filter(s => s.status === 'completed').length }
  })
}
function getUniqueParticipants(shifts) {
  const map = {}
  shifts.forEach(s => {
    if (s.participants) {
      const id = s.participant_id || s.participants.id
      if (!map[id]) map[id] = { ...s.participants, shiftCount: 0, lastShift: null }
      map[id].shiftCount++
      if (!map[id].lastShift || new Date(s.shift_date) > new Date(map[id].lastShift)) map[id].lastShift = s.shift_date
    }
  })
  return Object.values(map).sort((a, b) => b.shiftCount - a.shiftCount)
}
function getServiceTypeBreakdown(shifts) {
  const map = {}
  shifts.filter(s => s.status === 'completed').forEach(s => {
    const type = s.service_type || s.title || 'Support'
    if (!map[type]) map[type] = 0
    map[type]++
  })
  return Object.entries(map).map(([name, value]) => ({ name: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), value })).sort((a, b) => b.value - a.value)
}
function getMotivationalQuote() {
  const quotes = [
    { text: "Making a difference, one shift at a time.", icon: Heart },
    { text: "Your dedication transforms lives.", icon: Star },
    { text: "Every interaction matters.", icon: Sparkles },
    { text: "You're the heart of quality care.", icon: Award },
    { text: "Support work is hero work.", icon: Shield },
  ]
  return quotes[new Date().getDate() % quotes.length]
}

const CHART_COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#14b8a6']

/* ═══════════════════════════════════════════════
   DESIGN SYSTEM COMPONENTS
   ═══════════════════════════════════════════════ */

function Glass({ children, className = '', glow, style = {}, hover = false, isDark = false, ...p }) {
  const base = isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.55)'
  const border = isDark ? 'rgba(51,65,85,0.4)' : 'rgba(255,255,255,0.7)'
  return (
    <div
      className={className}
      style={{
        background: base,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${border}`,
        borderRadius: '1.25rem',
        boxShadow: glow
          ? `0 8px 32px -8px ${glow}`
          : '0 4px 24px -4px rgba(0,0,0,0.06)',
        transition: hover ? 'all .3s cubic-bezier(.16,1,.3,1)' : undefined,
        cursor: hover ? 'pointer' : undefined,
        ...style,
      }}
      onMouseEnter={hover ? e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = glow
          ? `0 16px 48px -8px ${glow}`
          : '0 12px 40px -8px rgba(0,0,0,0.12)'
      } : undefined}
      onMouseLeave={hover ? e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = glow
          ? `0 8px 32px -8px ${glow}`
          : '0 4px 24px -4px rgba(0,0,0,0.06)'
      } : undefined}
      {...p}
    >
      {children}
    </div>
  )
}

function Orb({ color, size = 200, top, left, right, bottom, delay = 0 }) {
  return (
    <div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        top, left, right, bottom,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        opacity: 0.12,
        borderRadius: '50%',
        animation: `orbFloat ${6 + delay}s ease-in-out ${delay}s infinite`,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
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
    gray:   isDark ? { bg: 'rgba(100,116,139,0.2)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)' }
                   : { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
    green:  isDark ? { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' }
                   : { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
    amber:  isDark ? { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' }
                   : { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    red:    isDark ? { bg: 'rgba(239,68,68,0.15)', text: '#f87171', border: 'rgba(239,68,68,0.3)' }
                   : { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    blue:   isDark ? { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' }
                   : { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    purple: isDark ? { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa', border: 'rgba(139,92,246,0.3)' }
                   : { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
    orange: isDark ? { bg: 'rgba(249,115,22,0.15)', text: '#fb923c', border: 'rgba(249,115,22,0.3)' }
                   : { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
    teal:   isDark ? { bg: 'rgba(20,184,166,0.15)', text: '#2dd4bf', border: 'rgba(20,184,166,0.3)' }
                   : { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
  }
  const p = palettes[color] || palettes.gray
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
      fontSize: 10, fontWeight: 700, letterSpacing: '0.02em',
      borderRadius: 999, background: p.bg, color: p.text,
      border: `1px solid ${p.border}`, whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}

/* ─── Chart tooltip ─── */
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
   SUB-COMPONENTS
   ═══════════════════════════════════════════════ */

function LiveClock({ clockInTime, isDark }) {
  const [time, setTime] = useState(getLiveTimer(clockInTime))
  useEffect(() => { const i = setInterval(() => setTime(getLiveTimer(clockInTime)), 1000); return () => clearInterval(i) }, [clockInTime])
  return <span style={{ fontFamily: 'monospace', fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em', color: isDark ? 'white' : '#1f2937' }}>{time}</span>
}

function CompletionRing({ completed, total, size = 68, isDark, color }) {
  const pct = total === 0 ? 100 : Math.round((completed / total) * 100)
  const r = (size - 8) / 2, circ = 2 * Math.PI * r, offset = circ - (pct / 100) * circ
  const ringColor = color || (pct === 100 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444')
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9'} strokeWidth="6" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={ringColor} strokeWidth="6" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.16,1,.3,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 900, color: isDark ? '#e2e8f0' : '#1f2937' }}>{pct}%</span>
      </div>
    </div>
  )
}

function WeeklyHoursBar({ hours, target = 38, dk, c }) {
  const pct = Math.min((hours / target) * 100, 100)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: dk.textMuted }}>Weekly Hours</p>
        <p style={{ fontSize: 12, color: dk.textFaint }}><span style={{ fontWeight: 800, color: dk.text }}>{hours.toFixed(1)}h</span> / {target}h</p>
      </div>
      <div style={{ height: 10, borderRadius: 999, overflow: 'hidden', background: dk.subtleBg2 }}>
        <div style={{
          height: '100%', borderRadius: 999, transition: 'width 1.5s cubic-bezier(.16,1,.3,1)',
          width: `${pct}%`,
          background: pct >= 100 ? 'linear-gradient(90deg, #10b981, #059669)' : pct >= 70 ? `linear-gradient(90deg, ${c.staff}, ${c.staffHover})` : 'linear-gradient(90deg, #f59e0b, #f97316)',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 10, color: dk.textFaint }}>{Math.round(pct)}% of target</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: pct >= 100 ? '#10b981' : pct >= 70 ? c.staff : '#f59e0b' }}>
          {pct >= 100 ? 'Target reached!' : `${(target - hours).toFixed(1)}h remaining`}
        </span>
      </div>
    </div>
  )
}

function Sparkline({ data, width = 80, height = 28, color = '#3b82f6' }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ')
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <circle cx={(data.length - 1) / (data.length - 1) * width} cy={height - ((data[data.length-1] - min) / range) * (height - 4) - 2} r="3" fill={color} />
    </svg>
  )
}

function ActivityFeed({ shifts, dk, isDark }) {
  const events = []
  shifts.forEach(s => {
    const pName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Shift'
    if (s.clock_in) events.push({ type: 'in', time: s.clock_in, text: `Clocked in — ${pName}`, icon: Play, color: isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5', iconColor: '#10b981' })
    if (s.clock_out) events.push({ type: 'out', time: s.clock_out, text: `Clocked out — ${pName}`, icon: Square, color: isDark ? 'rgba(249,115,22,0.15)' : '#fff7ed', iconColor: '#f97316' })
    if (s.notes_submitted) events.push({ type: 'note', time: s.updated_at || s.clock_out, text: `Note submitted — ${pName}`, icon: FileText, color: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff', iconColor: '#3b82f6' })
  })
  events.sort((a, b) => new Date(b.time) - new Date(a.time))
  if (events.length === 0) return (
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      <Activity size={32} style={{ color: dk.textFaint, margin: '0 auto 8px' }} />
      <p style={{ fontSize: 13, fontWeight: 600, color: dk.textMuted }}>No recent activity</p>
      <p style={{ fontSize: 11, color: dk.textFaint, marginTop: 2 }}>Clock in to start tracking</p>
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {events.slice(0, 6).map((e, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 12, background: dk.subtleBg, transition: 'all .2s' }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: e.color }}>
            <e.icon size={14} style={{ color: e.iconColor }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: dk.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.text}</p>
            <p style={{ fontSize: 10, color: dk.textFaint }}>{formatDate(e.time)} · {formatTime(e.time)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function MiniCalendar({ shifts, selectedDate, onSelectDate, c, dk, isDark }) {
  const [viewDate, setViewDate] = useState(new Date())
  const year = viewDate.getFullYear(), month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay(), daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date(), adjustedFirst = firstDay === 0 ? 6 : firstDay - 1
  const shiftDates = {}
  shifts.forEach(s => { if (!shiftDates[s.shift_date]) shiftDates[s.shift_date] = []; shiftDates[s.shift_date].push(s) })
  const cells = []; for (let i = 0; i < adjustedFirst; i++) cells.push(null); for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))} style={{ padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: dk.textFaint }}><ChevronLeft size={16} /></button>
        <p style={{ fontSize: 13, fontWeight: 800, color: dk.text }}>{viewDate.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}</p>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} style={{ padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: dk.textFaint }}><ChevronRight size={16} /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {['M','T','W','T','F','S','S'].map((d,i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, padding: '4px 0', color: dk.textFaint }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const hasShifts = shiftDates[dateStr], isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year, isSelected = selectedDate === dateStr
          return (
            <button key={day} onClick={() => onSelectDate(dateStr)}
              style={{
                position: 'relative', height: 36, borderRadius: 10, fontSize: 12, fontWeight: 600,
                border: isToday && !isSelected ? `1.5px solid ${c.staff}40` : '1.5px solid transparent',
                background: isSelected ? `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` : isToday ? (isDark ? `${c.staff}15` : `${c.staff}10`) : 'transparent',
                color: isSelected ? 'white' : hasShifts ? dk.text : dk.textFaint,
                cursor: 'pointer', transition: 'all .2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              {day}
              {hasShifts && !isSelected && (
                <div style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 2 }}>
                  {hasShifts.slice(0,3).map((s,j) => (
                    <div key={j} style={{ width: 4, height: 4, borderRadius: 2, background: s.status === 'completed' ? '#10b981' : s.status === 'in_progress' ? '#f97316' : c.staff }} />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function StaffDashboard() {
  const navigate = useNavigate()
  const { staffProfile, myShifts, inProgressShift, upcomingShifts, completedShifts, pendingNotes, handleClockIn, handleClockOut } = useStaff()
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loaded, setLoaded] = useState(false)
  const [selectedCalDate, setSelectedCalDate] = useState(null)
  const [gpsModal, setGpsModal] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [showMotivation, setShowMotivation] = useState(true)

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

  /* ─── computed data (all original preserved + new ones) ─── */
  const greeting = getGreeting()
  const streak = getStreak(myShifts)
  const totalHours = completedShifts.reduce((a, s) => s.clock_in && s.clock_out ? a + (new Date(s.clock_out) - new Date(s.clock_in)) / 3600000 : a, 0)
  const weekHours = getWeekHours(myShifts)
  const weekShiftsCompleted = getWeekShiftsCompleted(myShifts)
  const todayShifts = getTodayShifts(myShifts)
  const thisWeekShifts = getThisWeekShifts(myShifts)
  const notesCompleted = completedShifts.length - pendingNotes.length
  const selectedDayShifts = selectedCalDate ? myShifts.filter(s => s.shift_date === selectedCalDate) : []
  const shiftsByDay = getShiftsByDay(myShifts)
  const uniqueParticipants = getUniqueParticipants(myShifts)
  const serviceBreakdown = getServiceTypeBreakdown(myShifts)
  const motivationalQuote = getMotivationalQuote()
  const noteCompliancePct = completedShifts.length === 0 ? 100 : Math.round((notesCompleted / completedShifts.length) * 100)
  const weeklySparkline = shiftsByDay.map(d => d.hours)
  const todayCompleted = todayShifts.filter(s => s.status === 'completed').length
  const todayScheduled = todayShifts.length

  /* ─── clock in/out handlers (100% preserved) ─── */
  const startClockIn = (shift) => setGpsModal({ shift, action: 'in' })
  const startClockOut = (shift) => setGpsModal({ shift, action: 'out' })

  const handleGpsVerified = (gpsData) => {
    if (!gpsModal) return
    const { shift, action } = gpsModal
    if (action === 'in') {
      handleClockIn(shift.id, gpsData)
    } else {
      handleClockOut(shift.id, gpsData)
    }
    setGpsModal(null)
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'shifts', label: 'Shifts', icon: Calendar, count: todayScheduled },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
  ]

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* ─── Keyframes ─── */}
      <style>{`
        @keyframes orbFloat { 0%,100% { transform:translateY(0) scale(1) } 50% { transform:translateY(-15px) scale(1.03) } }
        @keyframes ping { 75%,100% { transform:scale(1.8);opacity:0 } }
        @keyframes pulse-dot { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes countUp { from { opacity:0;transform:translateY(8px) scale(0.95) } to { opacity:1;transform:translateY(0) scale(1) } }
        @keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
        @keyframes livePulse { 0%,100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.4) } 50% { box-shadow: 0 0 0 8px rgba(255,255,255,0) } }
        @keyframes wizardFloat { 0%,100% { transform:translateY(0) rotate(-2deg) } 50% { transform:translateY(-8px) rotate(2deg) } }
        @keyframes wizardWave { 0%,100% { transform:rotate(0deg) } 25% { transform:rotate(15deg) } 75% { transform:rotate(-5deg) } }
        @keyframes speechBubblePop { 0% { opacity:0;transform:scale(0.8) translateY(8px) } 100% { opacity:1;transform:scale(1) translateY(0) } }
        .count-up { animation: countUp .7s cubic-bezier(.16,1,.3,1) forwards }
        .shimmer-text { background: linear-gradient(90deg, rgba(255,255,255,0.6), rgba(255,255,255,1), rgba(255,255,255,0.6)); background-size: 200% 100%; -webkit-background-clip: text; animation: shimmer 3s infinite; }
 @media (min-width: 768px) { .staff-wizard { display: flex !important; } }
@media (min-width: 768px) { .staff-wizard-mobile { display: none !important; } }
      @media (max-width: 767px) {
  .staff-sidebar { flex: 1 1 100% !important; max-width: 100% !important; }
  .staff-overview-grid { flex-direction: column !important; }
  @media (min-width: 768px) { .staff-wizard-mobile { display: none !important; } }
@media (max-width: 767px) { .staff-wizard-mobile { display: flex !important; } }
@media (max-width: 767px) { .staff-content-wrap { padding: 0 8px 40px !important; } }
}
      `}</style>

      {/* ─── Background Orbs ─── */}
      <Orb color={c.staff} size={280} top="-80px" right="-60px" delay={0} />
      <Orb color={c.staffHover} size={200} bottom="10%" left="-40px" delay={2} />
      <Orb color="#8b5cf6" size={160} top="40%" right="15%" delay={4} />
      <Orb color="#06b6d4" size={220} bottom="-60px" right="30%" delay={1} />
      <Orb color="#f59e0b" size={140} top="20%" left="20%" delay={3} />

      {/* ─── Content ─── */}
<div className="staff-content-wrap" style={{ position: 'relative', zIndex: 1, padding: '0 16px 40px' }}>

        {/* ═══════ HERO BANNER ═══════ */}
    <div data-tour="tour-hero" style={{
          ...stg(0),
        background: `linear-gradient(135deg, ${c.staff} 0%, ${c.staffHover} 40%, #3b82f6 70%, #06b6d4 100%)`,
        borderRadius: 12, padding: '20px 16px', marginBottom: 16, margin: '0 -8px 16px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative circles - ALWAYS rgba(255,255,255,0.1) */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', bottom: -60, left: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', top: '50%', right: '20%', width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          {/* Dot grid overlay */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.15,
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }} />
          {/* Floating animated dots */}
          {[
            { top: '15%', left: '80%', size: 6, delay: '0s' },
            { top: '70%', left: '90%', size: 4, delay: '1s' },
            { top: '30%', left: '10%', size: 5, delay: '2s' },
          ].map((dot, i) => (
            <div key={i} style={{
              position: 'absolute', top: dot.top, left: dot.left, width: dot.size, height: dot.size,
              borderRadius: '50%', background: 'rgba(255,255,255,0.4)',
              animation: `pulse-dot 2s ease-in-out ${dot.delay} infinite`,
            }} />
          ))}

         <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 400px', minWidth: 0 }}>
            {/* Category badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 999,
                background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                fontSize: 11, fontWeight: 700, color: 'white', letterSpacing: '0.04em',
              }}>
                <greeting.icon size={12} /> STAFF PORTAL
              </span>
              {pendingNotes.length > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', borderRadius: 999,
                  background: 'rgba(245,158,11,0.3)', backdropFilter: 'blur(8px)',
                  fontSize: 10, fontWeight: 700, color: '#fde68a',
                }}>
                  <AlertTriangle size={10} /> {pendingNotes.length} NOTES DUE
                </span>
              )}
              {inProgressShift && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', borderRadius: 999,
                  background: 'rgba(16,185,129,0.3)', backdropFilter: 'blur(8px)',
                  fontSize: 10, fontWeight: 700, color: '#a7f3d0',
                  animation: 'livePulse 2s infinite',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: '#34d399' }} /> LIVE
                </span>
              )}
            </div>

            {/* Title */}
            <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', lineHeight: 1.2, marginBottom: 4 }}>
              {greeting.text}, {staffProfile?.first_name || 'Team Member'} {greeting.emoji}
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 16 }}>
              {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {motivationalQuote && showMotivation && <span style={{ marginLeft: 8, fontStyle: 'italic' }}>— "{motivationalQuote.text}"</span>}
            </p>

            {/* Stat pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {[
                { label: 'Today', value: `${todayCompleted}/${todayScheduled}`, icon: Calendar },
                { label: 'Week Hours', value: `${weekHours.toFixed(1)}h`, icon: Clock },
                { label: 'Streak', value: `${streak}d`, icon: Flame },
                { label: 'Participants', value: uniqueParticipants.length, icon: Users },
              ].map((pill, i) => (
                <div key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 999,
                  background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}>
                  <pill.icon size={12} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>{pill.value}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{pill.label}</span>
                </div>
              ))}
            </div>

            {/* Hero action buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/staff/shifts')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                <Calendar size={16} /> My Roster
              </button>
              <button onClick={() => navigate('/staff/notes')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                <FileText size={16} /> Shift Notes
              </button>
              {inProgressShift && (
                <button onClick={() => startClockOut(inProgressShift)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '10px 20px', borderRadius: 12,
                    background: 'rgba(239,68,68,0.3)', backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(239,68,68,0.4)',
                    color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    transition: 'all .2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.45)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.3)'}
                >
                  <Square size={16} /> Clock Out
                </button>
              )}
            </div>
          </div>{/* end left side */}

          {/* Mobile wizard — small inline */}
            <div className="staff-wizard-mobile" style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <img src="/wizard.png" alt="VelCare Wizard" style={{ width: 48, height: 48, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))' }} />
              <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}>
                {inProgressShift ? "You're doing great!" : upcomingShifts.length > 0 ? 'Ready for your shift?' : 'Enjoy your day off!'}
              </p>
            </div>

            {/* Right side — Wizard mascot — desktop only */}
            <div style={{
              flex: '0 0 auto', display: 'none', flexDirection: 'column', alignItems: 'center',
              alignSelf: 'center', position: 'relative',
            }} className="staff-wizard">
              {/* Speech bubble */}
              <div style={{
                background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 16, padding: '10px 16px', marginBottom: 10,
                position: 'relative', maxWidth: 180, textAlign: 'center',
                animation: 'speechBubblePop .6s cubic-bezier(.16,1,.3,1) .3s both',
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'white', lineHeight: 1.4 }}>
                  Hey {staffProfile?.first_name || 'there'}! 👋<br />
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>
                    {inProgressShift ? "You're doing great!" : upcomingShifts.length > 0 ? 'Ready for your shift?' : 'Enjoy your day off!'}
                  </span>
                </p>
                {/* Speech bubble tail */}
                <div style={{
                  position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%) rotate(45deg)',
                  width: 12, height: 12, background: 'rgba(255,255,255,0.2)',
                  borderRight: '1px solid rgba(255,255,255,0.25)',
                  borderBottom: '1px solid rgba(255,255,255,0.25)',
                }} />
              </div>

              {/* Wizard character — actual mascot */}
              <div style={{
                width: 120, height: 120,
                animation: 'wizardFloat 4s ease-in-out infinite',
              }}>
                <img src="/wizard.png" alt="VelCare Wizard" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }} />
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* ═══════ STAT CARDS ═══════ */}
        <div data-tour="tour-stats" style={{ ...stg(1), display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { icon: Calendar, label: 'Upcoming Shifts', value: upcomingShifts.length, gradient: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, glow: `${c.staff}40`, sparkData: shiftsByDay.map(d => d.shifts) },
            { icon: FileText, label: 'Notes Due', value: pendingNotes.length, gradient: 'linear-gradient(135deg, #f59e0b, #f97316)', glow: 'rgba(245,158,11,0.3)', alert: pendingNotes.length > 0, onClick: () => navigate('/staff/notes') },
            { icon: Clock, label: 'Total Hours', value: totalHours, suffix: 'h', decimals: 1, gradient: 'linear-gradient(135deg, #14b8a6, #06b6d4)', glow: 'rgba(20,184,166,0.3)', sparkData: weeklySparkline },
            { icon: Flame, label: 'Day Streak', value: streak, gradient: 'linear-gradient(135deg, #f97316, #ef4444)', glow: 'rgba(249,115,22,0.3)' },
            { icon: CheckCircle, label: 'Week Shifts', value: weekShiftsCompleted, gradient: 'linear-gradient(135deg, #10b981, #059669)', glow: 'rgba(16,185,129,0.3)' },
            { icon: Users, label: 'Participants', value: uniqueParticipants.length, gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)', glow: 'rgba(139,92,246,0.3)' },
          ].map((stat, i) => (
            <Glass key={i} isDark={isDark} hover glow={stat.glow}
              style={{ padding: '18px 16px', cursor: stat.onClick ? 'pointer' : 'default' }}
              onClick={stat.onClick}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: stat.gradient, boxShadow: `0 4px 12px -2px ${stat.glow}`,
                }}>
                  <stat.icon size={18} style={{ color: 'white' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {stat.alert && (
                    <span style={{
                      width: 8, height: 8, borderRadius: 4, background: '#ef4444',
                      animation: 'pulse-dot 1.5s ease-in-out infinite',
                    }} />
                  )}
                  {stat.sparkData && <Sparkline data={stat.sparkData} color={c.staff} width={60} height={24} />}
                </div>
              </div>
              <p style={{ fontSize: 26, fontWeight: 900, color: dk.text, lineHeight: 1 }}>
                <AnimNum value={stat.decimals ? Math.round(stat.value * 10) / 10 : stat.value} suffix={stat.suffix || ''} />
              </p>
              <p style={{ fontSize: 11, fontWeight: 600, color: dk.textFaint, marginTop: 4 }}>{stat.label}</p>
            </Glass>
          ))}
        </div>

        {/* ═══════ TAB NAVIGATION ═══════ */}
        <Glass isDark={isDark} data-tour="tour-tabs" style={{ padding: 6, marginBottom: 24, display: 'flex', gap: 4, flexWrap: 'wrap', ...stg(2) }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px 16px', borderRadius: 14, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, transition: 'all .25s cubic-bezier(.16,1,.3,1)',
                background: activeTab === tab.id ? `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` : 'transparent',
                color: activeTab === tab.id ? 'white' : dk.textMuted,
                boxShadow: activeTab === tab.id ? `0 4px 16px -4px ${c.staff}50` : 'none',
              }}
            >
              <tab.icon size={15} />
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  padding: '1px 7px', borderRadius: 999, fontSize: 10, fontWeight: 800,
                  background: activeTab === tab.id ? 'rgba(255,255,255,0.25)' : dk.subtleBg2,
                  color: activeTab === tab.id ? 'white' : dk.textMuted,
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </Glass>

        {/* ═══════ ACTIVE SHIFT BANNER ═══════ */}
        {inProgressShift && (
          <div data-tour="tour-shift">
          <Glass isDark={isDark} glow={`${c.staff}30`} style={{ padding: 24, marginBottom: 24, ...stg(3), position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.06,
              background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`,
            }} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ position: 'relative', display: 'flex', width: 12, height: 12 }}>
                  <span style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: '#10b981', opacity: 0.75, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
                  <span style={{ position: 'relative', width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#10b981' }}>Active Shift</span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20 }}>
                <div style={{ flex: '0 0 auto' }}>
                  <LiveClock clockInTime={inProgressShift.clock_in} isDark={isDark} />
                  <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 4 }}>Clocked in at {formatTime(inProgressShift.clock_in)}</p>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ fontSize: 18, fontWeight: 800, color: dk.text }}>
                    {inProgressShift.participants ? `${inProgressShift.participants.first_name} ${inProgressShift.participants.last_name}` : 'Shift'}
                  </p>
                  <p style={{ fontSize: 13, color: dk.textMuted }}>{inProgressShift.service_type || inProgressShift.title || 'Support'}</p>
                  {inProgressShift.location && (
                    <p style={{ fontSize: 12, color: dk.textFaint, display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <MapPin size={12} />{inProgressShift.location}
                    </p>
                  )}
                  {inProgressShift.clock_in_lat && (
                    <p style={{ fontSize: 10, color: dk.textFaint, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Shield size={10} style={{ color: '#10b981' }} /> GPS verified
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => startClockOut(inProgressShift)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
                      borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white',
                      boxShadow: '0 4px 12px -2px rgba(239,68,68,0.4)', transition: 'all .2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Square size={16} /> Clock Out
                  </button>
                  <button onClick={() => navigate('/staff/notes')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
                      borderRadius: 12, border: `1.5px solid ${dk.divider}`, cursor: 'pointer',
                      fontWeight: 700, fontSize: 13, background: 'transparent', color: dk.text,
                      transition: 'all .2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = dk.subtleBg2}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <FileText size={16} /> Add Note
                  </button>
                </div>
              </div>
            </div>
        </Glass>
          </div>
        )}
        {/* ═══════ TAB CONTENT ═══════ */}

{activeTab === 'overview' && (
          <div className="staff-overview-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
            {/* ─── Main Column ─── */}
            <div style={{ flex: '1 1 500px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Next Shift / No Shift Card */}
              {!inProgressShift && upcomingShifts.length > 0 ? (
                <Glass isDark={isDark} data-tour="tour-shift" glow={`${c.staff}25`} style={{ padding: 20, ...stg(4) }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, boxShadow: `0 6px 20px -4px ${c.staff}50`,
                      flexShrink: 0,
                    }}>
                      <Calendar size={24} style={{ color: 'white' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: c.staff, marginBottom: 2 }}>Next Shift</p>
                      <p style={{ fontSize: 18, fontWeight: 900, color: dk.text }}>
                        {upcomingShifts[0].participants ? `${upcomingShifts[0].participants.first_name} ${upcomingShifts[0].participants.last_name}` : 'Shift'}
                      </p>
                      <p style={{ fontSize: 13, color: dk.textMuted }}>
                        {formatDate(upcomingShifts[0].shift_date)} · {formatTime(upcomingShifts[0].start_time)} – {formatTime(upcomingShifts[0].end_time)}
                      </p>
                      {upcomingShifts[0].location && (
                        <p style={{ fontSize: 12, color: dk.textFaint, display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                          <MapPin size={12} />{upcomingShifts[0].location}
                        </p>
                      )}
                    </div>
                    <button onClick={() => startClockIn(upcomingShifts[0])}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px',
                        borderRadius: 14, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 14,
                        background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, color: 'white',
                        boxShadow: `0 6px 20px -4px ${c.staff}50`, transition: 'all .2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Play size={18} /> Clock In
                    </button>
                  </div>
                </Glass>
              ) : !inProgressShift ? (
                <Glass isDark={isDark} style={{ padding: '40px 24px', textAlign: 'center', ...stg(4) }}>
                  <Coffee size={40} style={{ color: dk.textFaint, margin: '0 auto 12px' }} />
                  <p style={{ fontSize: 16, fontWeight: 800, color: dk.text }}>No shifts right now</p>
                  <p style={{ fontSize: 13, color: dk.textFaint, marginTop: 4 }}>Enjoy your downtime — you've earned it!</p>
                  <button onClick={() => navigate('/staff/shifts')}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16,
                      padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, color: 'white',
                      fontSize: 13, fontWeight: 700, transition: 'all .2s',
                    }}
                  >
                    <Calendar size={14} /> View Full Roster
                  </button>
                </Glass>
              ) : null}

              {/* Weekly Progress + Note Completion */}
              <div data-tour="tour-progress" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, ...stg(5) }}>
                <Glass isDark={isDark} style={{ padding: 20 }}>
                  <WeeklyHoursBar hours={weekHours} target={38} dk={dk} c={c} />
                </Glass>
                <Glass isDark={isDark} style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <CompletionRing completed={notesCompleted} total={completedShifts.length} size={68} isDark={isDark} color={c.staff} />
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: dk.textMuted }}>Note Completion</p>
                      <p style={{ fontSize: 14, marginTop: 2, color: dk.text }}>
                        <span style={{ fontWeight: 800 }}>{notesCompleted}</span> of {completedShifts.length} completed
                      </p>
                      {pendingNotes.length > 0 && (
                        <button onClick={() => navigate('/staff/notes')}
                          style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4, padding: 0 }}>
                          {pendingNotes.length} pending →
                        </button>
                      )}
                    </div>
                  </div>
                </Glass>
              </div>

              {/* Compliance Alert Banner */}
              {pendingNotes.length > 0 && (
                <div style={{
                  ...stg(6),
                  background: 'linear-gradient(135deg, #f59e0b, #f97316)', borderRadius: 16,
                  padding: 20, display: 'flex', alignItems: 'flex-start', gap: 14,
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                  <AlertTriangle size={22} style={{ color: 'white', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>{pendingNotes.length} shift note{pendingNotes.length > 1 ? 's' : ''} overdue</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Submit within 24 hours for NDIS compliance. Late submissions may be flagged in audits.</p>
                    <button onClick={() => navigate('/staff/notes')}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10,
                        padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)',
                        background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: 12, fontWeight: 700,
                        cursor: 'pointer', transition: 'all .2s', backdropFilter: 'blur(8px)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                    >
                      Submit now <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <Glass isDark={isDark} style={{ padding: 20, ...stg(7) }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` }}>
                      <Activity size={14} style={{ color: 'white' }} />
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: dk.text }}>Recent Activity</p>
                  </div>
                </div>
                <ActivityFeed shifts={myShifts} dk={dk} isDark={isDark} />
              </Glass>

              {/* Upcoming Shifts List */}
<Glass isDark={isDark} data-tour="tour-upcoming" style={{ padding: 20, ...stg(8) }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` }}>
                      <Calendar size={14} style={{ color: 'white' }} />
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: dk.text }}>Upcoming Shifts</p>
                  </div>
                  <button onClick={() => navigate('/staff/shifts')}
                    style={{ fontSize: 12, fontWeight: 700, color: c.staff, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    View all <ArrowRight size={12} />
                  </button>
                </div>
                {upcomingShifts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {upcomingShifts.slice(0, 5).map((s, idx) => {
                      const pName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Shift'
                      const isToday = s.shift_date === new Date().toISOString().split('T')[0]
                      return (
                        <div key={s.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                            borderRadius: 14, transition: 'all .2s', cursor: 'pointer',
                            background: isToday ? (isDark ? `${c.staff}15` : `${c.staff}08`) : dk.subtleBg,
                            border: isToday ? `1.5px solid ${c.staff}30` : `1px solid ${dk.divider}`,
                          }}
                          onClick={() => navigate('/staff/shifts')}
                          onMouseEnter={e => e.currentTarget.style.background = isToday ? (isDark ? `${c.staff}20` : `${c.staff}12`) : dk.subtleBg2}
                          onMouseLeave={e => e.currentTarget.style.background = isToday ? (isDark ? `${c.staff}15` : `${c.staff}08`) : dk.subtleBg}
                        >
                          <div style={{
                            width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, flexShrink: 0,
                          }}>
                            <Calendar size={16} style={{ color: 'white' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: dk.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pName}</p>
                            <p style={{ fontSize: 11, color: dk.textMuted }}>{formatDate(s.shift_date)} · {formatTime(s.start_time)} – {formatTime(s.end_time)}</p>
                            <p style={{ fontSize: 10, color: dk.textFaint }}>{s.service_type || s.title || 'Support'}{s.location ? ` · ${s.location}` : ''}</p>
                          </div>
                          <Badge color={isToday ? 'green' : 'blue'} isDark={isDark}>{isToday ? 'Today' : formatDate(s.shift_date)}</Badge>
                          <ChevronR size={16} style={{ color: dk.textFaint, flexShrink: 0 }} />
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <Calendar size={36} style={{ color: dk.textFaint, margin: '0 auto 8px' }} />
                    <p style={{ fontSize: 13, fontWeight: 600, color: dk.textMuted }}>No upcoming shifts</p>
                    <p style={{ fontSize: 11, color: dk.textFaint, marginTop: 2 }}>Check your roster for schedule updates</p>
                  </div>
                )}
              </Glass>
            </div>

            {/* ─── Sidebar ─── */}
           <div data-tour="tour-sidebar" className="staff-sidebar" style={{ flex: '0 0 320px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Calendar */}
              <Glass isDark={isDark} style={{ padding: 20, ...stg(4) }}>
                <MiniCalendar shifts={myShifts} selectedDate={selectedCalDate} onSelectDate={d => setSelectedCalDate(d === selectedCalDate ? null : d)} c={c} dk={dk} isDark={isDark} />
                {selectedCalDate && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${dk.divider}` }}>
                    {selectedDayShifts.length > 0 ? selectedDayShifts.map(s => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                        <div style={{ width: 8, height: 8, borderRadius: 4, flexShrink: 0, background: s.status === 'completed' ? '#10b981' : s.status === 'in_progress' ? '#f97316' : c.staff }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: dk.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Shift'}
                          </p>
                          <p style={{ fontSize: 10, color: dk.textFaint }}>{formatTime(s.start_time)} – {formatTime(s.end_time)}</p>
                        </div>
                        <Badge color={s.status === 'completed' ? 'green' : s.status === 'in_progress' ? 'orange' : 'blue'} isDark={isDark}>
                          {(s.status || 'scheduled').replace('_', ' ')}
                        </Badge>
                      </div>
                    )) : (
                      <p style={{ fontSize: 12, color: dk.textFaint, textAlign: 'center', padding: '8px 0' }}>No shifts this day</p>
                    )}
                  </div>
                )}
              </Glass>

              {/* Quick Actions */}
              <Glass isDark={isDark} style={{ padding: 20, ...stg(5) }}>
                <p style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: dk.textMuted, marginBottom: 12 }}>Quick Actions</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { label: 'View All Shifts', icon: Calendar, gradient: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, action: () => navigate('/staff/shifts') },
                    { label: 'Submit a Form', icon: Briefcase, gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)', action: () => navigate('/staff/forms') },
                    { label: 'Report Incident', icon: AlertTriangle, gradient: 'linear-gradient(135deg, #f97316, #ef4444)', action: () => navigate('/staff/incidents') },
                    { label: 'My Profile', icon: Eye, gradient: 'linear-gradient(135deg, #10b981, #059669)', action: () => navigate('/staff/profile') },
                  ].map((item, idx) => (
                    <button key={item.label} onClick={item.action}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                        borderRadius: 12, border: 'none', cursor: 'pointer', background: 'transparent',
                        transition: 'all .2s', textAlign: 'left',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = dk.subtleBg2}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: item.gradient, flexShrink: 0 }}>
                        <item.icon size={15} style={{ color: 'white' }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: dk.text, flex: 1 }}>{item.label}</span>
                      <ChevronR size={14} style={{ color: dk.textFaint }} />
                    </button>
                  ))}
                </div>
              </Glass>

              {/* Frequent Participants */}
              {uniqueParticipants.length > 0 && (
                <Glass isDark={isDark} style={{ padding: 20, ...stg(6) }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <p style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: dk.textMuted }}>Frequent Participants</p>
                    <button onClick={() => navigate('/staff/participants')}
                      style={{ fontSize: 11, fontWeight: 700, color: c.staff, background: 'none', border: 'none', cursor: 'pointer' }}>
                      All →
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {uniqueParticipants.slice(0, 5).map((p, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: dk.subtleBg }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: `linear-gradient(135deg, ${CHART_COLORS[idx % CHART_COLORS.length]}40, ${CHART_COLORS[idx % CHART_COLORS.length]}20)`,
                          fontSize: 12, fontWeight: 800, color: CHART_COLORS[idx % CHART_COLORS.length], flexShrink: 0,
                        }}>
                          {p.first_name?.[0]}{p.last_name?.[0]}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: dk.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.first_name} {p.last_name}</p>
                          <p style={{ fontSize: 10, color: dk.textFaint }}>{p.shiftCount} shift{p.shiftCount !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Glass>
              )}
            </div>
          </div>
        )}

        {/* ═══════ SHIFTS TAB ═══════ */}
        {activeTab === 'shifts' && (
          <div style={{ ...stg(3), display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Today's Schedule */}
            <Glass isDark={isDark} style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` }}>
                  <Calendar size={14} style={{ color: 'white' }} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 800, color: dk.text }}>Today's Schedule</p>
                <Badge color={todayShifts.length > 0 ? 'blue' : 'gray'} isDark={isDark}>{todayShifts.length} shift{todayShifts.length !== 1 ? 's' : ''}</Badge>
              </div>
              {todayShifts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {todayShifts.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || '')).map((s, idx) => {
                    const pName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Shift'
                    const isActive = s.status === 'in_progress'
                    const isDone = s.status === 'completed'
                    return (
                      <div key={s.id} style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16,
                        background: isActive ? (isDark ? `${c.staff}12` : `${c.staff}06`) : dk.subtleBg,
                        border: isActive ? `1.5px solid ${c.staff}40` : isDone ? `1px solid rgba(16,185,129,0.2)` : `1px solid ${dk.divider}`,
                        cursor: 'pointer', transition: 'all .2s', opacity: isDone ? 0.75 : 1,
                      }}
                        onClick={() => navigate('/staff/shifts')}
                        onMouseEnter={e => { if (!isDone) e.currentTarget.style.transform = 'translateX(4px)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)' }}
                      >
                        {/* Timeline dot */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{
                            width: 12, height: 12, borderRadius: 6,
                            background: isActive ? '#10b981' : isDone ? '#94a3b8' : c.staff,
                            boxShadow: isActive ? '0 0 0 4px rgba(16,185,129,0.2)' : 'none',
                            animation: isActive ? 'pulse-dot 1.5s infinite' : 'none',
                          }} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: dk.text }}>{pName}</p>
                            <Badge color={isActive ? 'green' : isDone ? 'gray' : 'blue'} isDark={isDark}>
                              {isActive ? 'In Progress' : isDone ? 'Completed' : 'Scheduled'}
                            </Badge>
                          </div>
                          <p style={{ fontSize: 12, color: dk.textMuted }}>
                            {formatTime(s.start_time)} – {formatTime(s.end_time)} · {s.service_type || s.title || 'Support'}
                          </p>
                          {s.location && <p style={{ fontSize: 11, color: dk.textFaint, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}><MapPin size={10} />{s.location}</p>}
                        </div>

                        {/* Action buttons */}
                        {!isDone && !isActive && (
                          <button onClick={(e) => { e.stopPropagation(); startClockIn(s) }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                              borderRadius: 10, border: 'none', cursor: 'pointer',
                              background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, color: 'white',
                              fontSize: 12, fontWeight: 700, transition: 'all .2s', whiteSpace: 'nowrap',
                            }}>
                            <Play size={14} /> Clock In
                          </button>
                        )}
                        {isActive && (
                          <button onClick={(e) => { e.stopPropagation(); startClockOut(s) }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                              borderRadius: 10, border: 'none', cursor: 'pointer',
                              background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white',
                              fontSize: 12, fontWeight: 700, transition: 'all .2s', whiteSpace: 'nowrap',
                            }}>
                            <Square size={14} /> Clock Out
                          </button>
                        )}
                        {isDone && <CheckCircle size={20} style={{ color: '#10b981', flexShrink: 0 }} />}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Coffee size={40} style={{ color: dk.textFaint, margin: '0 auto 12px' }} />
                  <p style={{ fontSize: 14, fontWeight: 700, color: dk.textMuted }}>No shifts scheduled today</p>
                  <p style={{ fontSize: 12, color: dk.textFaint, marginTop: 4 }}>Check the calendar for upcoming shifts</p>
                </div>
              )}
            </Glass>

            {/* This Week's Shifts */}
            <Glass isDark={isDark} style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
                  <BarChart3 size={14} style={{ color: 'white' }} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 800, color: dk.text }}>This Week Overview</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                {shiftsByDay.map((day, i) => {
                  const isToday = i === ((new Date().getDay() + 6) % 7)
                  const hasFuture = i > ((new Date().getDay() + 6) % 7)
                  return (
                    <div key={i} style={{
                      textAlign: 'center', padding: '12px 4px', borderRadius: 12,
                      background: isToday ? (isDark ? `${c.staff}15` : `${c.staff}08`) : dk.subtleBg,
                      border: isToday ? `1.5px solid ${c.staff}40` : `1px solid ${dk.divider}`,
                      opacity: hasFuture ? 0.6 : 1,
                    }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: isToday ? c.staff : dk.textFaint, textTransform: 'uppercase', marginBottom: 6 }}>{day.name}</p>
                      <p style={{ fontSize: 20, fontWeight: 900, color: day.shifts > 0 ? dk.text : dk.textFaint }}>{day.shifts}</p>
                      <p style={{ fontSize: 9, color: dk.textFaint, marginTop: 2 }}>shift{day.shifts !== 1 ? 's' : ''}</p>
                      {day.hours > 0 && <p style={{ fontSize: 10, fontWeight: 600, color: c.staff, marginTop: 4 }}>{day.hours}h</p>}
                      {day.completed > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
                          <CheckCircle size={12} style={{ color: '#10b981' }} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Glass>

            {/* All Upcoming Shifts */}
            <Glass isDark={isDark} style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={{ fontSize: 16, fontWeight: 800, color: dk.text }}>All Upcoming</p>
                <Badge color="blue" isDark={isDark}>{upcomingShifts.length} scheduled</Badge>
              </div>
              {upcomingShifts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {upcomingShifts.map(s => {
                    const pName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Shift'
                    return (
                      <div key={s.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                        borderRadius: 12, background: dk.subtleBg, border: `1px solid ${dk.divider}`,
                        cursor: 'pointer', transition: 'all .2s',
                      }}
                        onClick={() => navigate('/staff/shifts')}
                        onMouseEnter={e => e.currentTarget.style.background = dk.subtleBg2}
                        onMouseLeave={e => e.currentTarget.style.background = dk.subtleBg}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, flexShrink: 0 }}>
                          <Calendar size={14} style={{ color: 'white' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: dk.text }}>{pName}</p>
                          <p style={{ fontSize: 11, color: dk.textMuted }}>{formatDate(s.shift_date)} · {formatTime(s.start_time)} – {formatTime(s.end_time)}</p>
                        </div>
                        <Badge color="blue" isDark={isDark}>{formatDate(s.shift_date)}</Badge>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <Calendar size={36} style={{ color: dk.textFaint, margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13, color: dk.textFaint }}>No upcoming shifts</p>
                </div>
              )}
            </Glass>
          </div>
        )}

        {/* ═══════ INSIGHTS TAB ═══════ */}
        {activeTab === 'insights' && (
          <div style={{ ...stg(3), display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Weekly Hours Chart */}
            <Glass isDark={isDark} style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` }}>
                  <BarChart3 size={14} style={{ color: 'white' }} />
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 800, color: dk.text }}>Weekly Hours Breakdown</p>
                  <p style={{ fontSize: 12, color: dk.textMuted }}>Hours worked each day this week</p>
                </div>
              </div>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={shiftsByDay.filter(d => d.hours > 0).length > 0 ? shiftsByDay.filter(d => d.hours > 0) : [{ name: 'No data', hours: 1 }]}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={90}
                      paddingAngle={4}
                      dataKey="hours"
                      nameKey="name"
                      stroke="none"
                    >
                      {shiftsByDay.filter(d => d.hours > 0).length > 0
                        ? shiftsByDay.filter(d => d.hours > 0).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)
                        : <Cell fill={isDark ? '#334155' : '#e2e8f0'} />
                      }
                    </Pie>
                    <Tooltip content={<CT isDark={isDark} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 12 }}>
                {shiftsByDay.filter(d => d.hours > 0).map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span style={{ fontSize: 11, color: dk.textMuted }}>{d.name}: <span style={{ fontWeight: 700, color: dk.text }}>{d.hours}h</span></span>
                  </div>
                ))}
              </div>
            </Glass>

            {/* Service Type Breakdown */}
            <Glass isDark={isDark} style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
                  <Target size={14} style={{ color: 'white' }} />
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 800, color: dk.text }}>Service Type Breakdown</p>
                  <p style={{ fontSize: 12, color: dk.textMuted }}>Types of support delivered</p>
                </div>
              </div>
              {serviceBreakdown.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {serviceBreakdown.map((s, i) => {
                    const total = serviceBreakdown.reduce((a, b) => a + b.value, 0)
                    const pct = Math.round((s.value / total) * 100)
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: dk.text }}>{s.name}</span>
                          <span style={{ fontSize: 11, color: dk.textMuted }}>{s.value} shifts ({pct}%)</span>
                        </div>
                        <div style={{ height: 8, borderRadius: 999, overflow: 'hidden', background: dk.subtleBg2 }}>
                          <div style={{ height: '100%', borderRadius: 999, width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length], transition: 'width 1s ease' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <Target size={36} style={{ color: dk.textFaint, margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13, color: dk.textFaint }}>No completed shifts yet</p>
                </div>
              )}
            </Glass>

            {/* Performance Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              {/* Note Compliance */}
              <Glass isDark={isDark} style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: dk.text }}>Note Compliance</p>
                  <Badge color={noteCompliancePct === 100 ? 'green' : noteCompliancePct >= 80 ? 'amber' : 'red'} isDark={isDark}>
                    {noteCompliancePct}%
                  </Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  <CompletionRing completed={notesCompleted} total={completedShifts.length} size={100} isDark={isDark} color={noteCompliancePct === 100 ? '#10b981' : noteCompliancePct >= 80 ? '#f59e0b' : '#ef4444'} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: dk.textMuted }}>{notesCompleted} of {completedShifts.length} notes submitted</p>
                  {pendingNotes.length > 0 && (
                    <button onClick={() => navigate('/staff/notes')}
                      style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', background: 'none', border: 'none', cursor: 'pointer', marginTop: 6, padding: 0 }}>
                      Submit {pendingNotes.length} pending →
                    </button>
                  )}
                </div>
              </Glass>

              {/* Shift Stats */}
              <Glass isDark={isDark} style={{ padding: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: dk.text, marginBottom: 14 }}>Shift Statistics</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Total Shifts', value: myShifts.length, color: c.staff },
                    { label: 'Completed', value: completedShifts.length, color: '#10b981' },
                    { label: 'Upcoming', value: upcomingShifts.length, color: '#3b82f6' },
                    { label: 'Total Hours', value: `${totalHours.toFixed(1)}h`, color: '#06b6d4' },
                    { label: 'Avg Hours/Shift', value: completedShifts.length > 0 ? `${(totalHours / completedShifts.length).toFixed(1)}h` : '—', color: '#8b5cf6' },
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: idx < 4 ? `1px solid ${dk.divider}` : 'none' }}>
                      <span style={{ fontSize: 12, color: dk.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: 3, background: item.color }} />
                        {item.label}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: dk.text }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </Glass>

              {/* Participant Stats */}
              <Glass isDark={isDark} style={{ padding: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: dk.text, marginBottom: 14 }}>Participant Overview</p>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: `linear-gradient(135deg, ${c.staff}15, ${c.staffHover}15)`,
                    border: `2px solid ${c.staff}30`,
                  }}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: c.staff }}><AnimNum value={uniqueParticipants.length} /></span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: dk.textFaint, textTransform: 'uppercase' }}>Total</span>
                  </div>
                </div>
                {uniqueParticipants.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {uniqueParticipants.slice(0, 4).map((p, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                        <span style={{ fontSize: 12, color: dk.textMuted }}>{p.first_name} {p.last_name}</span>
                        <Badge color="blue" isDark={isDark}>{p.shiftCount} shifts</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: dk.textFaint, textAlign: 'center' }}>No participants yet</p>
                )}
              </Glass>
            </div>
          </div>
        )}

        {/* ═══════ GPS VERIFICATION MODAL ═══════ */}
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