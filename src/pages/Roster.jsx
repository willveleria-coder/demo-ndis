import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar, Play, Clock, Plus, MapPin, Check, Loader2, Download, DollarSign,
  FileSpreadsheet, Users, ChevronRight, ChevronDown, Search, Filter, Activity,
  AlertTriangle, TrendingUp, Zap, RefreshCw, BarChart3, Shield, Eye, Star,
  ArrowRight, Timer, Hash, Briefcase, Square, Navigation, XCircle, Layers,
  Sparkles, Sun, Moon, Sunset, CloudMoon, CheckCircle, User
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { supabase } from '../lib/supabase'
import { useBrandColors } from '../hooks/useBrandColors'
import { useTheme } from '../context/ThemeContext'
import Modal from '../components/ui/Modal'
import { generatePayrollData, generateStaffSummary, exportPayroll, exportStaffSummary } from '../utils/payrollExport'


/* ─────────────────────────────────────────────
   DESIGN SYSTEM
   ───────────────────────────────────────────── */

function Glass({ children, dark, glow, hover, style, ...p }) {
  const base = dark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.55)'
  const border = dark ? 'rgba(51,65,85,0.4)' : 'rgba(255,255,255,0.7)'
  return (
    <div style={{
      background: base, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: `1px solid ${border}`, borderRadius: '1.25rem',
      boxShadow: glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)',
      transition: hover ? 'all .3s cubic-bezier(.16,1,.3,1)' : undefined,
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
    {...p}>{children}</div>
  )
}

function Orb({ color, size = 200, top, left, right, bottom, delay = 0 }) {
  return (<div style={{
    position: 'absolute', width: size, height: size, top, left, right, bottom,
    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
    opacity: 0.12, borderRadius: '50%',
    animation: `orbFloat ${6 + delay}s ease-in-out ${delay}s infinite`,
    pointerEvents: 'none', zIndex: 0,
  }} />)
}

function AnimNum({ value, duration = 900, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef()
  useEffect(() => {
    const num = typeof value === 'number' ? value : parseFloat(value) || 0
    const start = performance.now()
    function tick(now) {
      const p = Math.min((now - start) / duration, 1)
      setDisplay(Math.round(num * (1 - Math.pow(1 - p, 3))))
      if (p < 1) ref.current = requestAnimationFrame(tick)
    }
    ref.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(ref.current)
  }, [value, duration])
  return <>{prefix}{display.toLocaleString()}{suffix}</>
}

function Badge({ children, color = 'gray', dark }) {
  const palettes = {
    gray: dark ? { bg: 'rgba(100,116,139,0.2)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)' } : { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
    green: dark ? { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' } : { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
    amber: dark ? { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' } : { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    red: dark ? { bg: 'rgba(239,68,68,0.15)', text: '#f87171', border: 'rgba(239,68,68,0.3)' } : { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    blue: dark ? { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' } : { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    purple: dark ? { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa', border: 'rgba(139,92,246,0.3)' } : { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
    teal: dark ? { bg: 'rgba(20,184,166,0.15)', text: '#2dd4bf', border: 'rgba(20,184,166,0.3)' } : { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
    orange: dark ? { bg: 'rgba(249,115,22,0.15)', text: '#fb923c', border: 'rgba(249,115,22,0.3)' } : { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
    cyan: dark ? { bg: 'rgba(6,182,212,0.15)', text: '#22d3ee', border: 'rgba(6,182,212,0.3)' } : { bg: '#ecfeff', text: '#0891b2', border: '#a5f3fc' },
  }
  const p = palettes[color] || palettes.gray
  return (<span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
    background: p.bg, color: p.text, border: `1px solid ${p.border}`,
    whiteSpace: 'nowrap',
  }}>{children}</span>)
}


/* ─────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────── */

function formatTime(t) {
  if (!t) return ''
  try {
    if (t.includes('T')) return new Date(t).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
    const [h, m] = t.split(':')
    const d = new Date(); d.setHours(+h, +m)
    return d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
  } catch { return t }
}

function getDateLabel(dateStr) {
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (dateStr === today) return 'Today'
  if (dateStr === tomorrow) return 'Tomorrow'
  if (dateStr === yesterday) return 'Yesterday'
  return new Date(dateStr).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}

const statusGrad = {
  in_progress: 'linear-gradient(135deg, #10b981, #14b8a6)',
  completed: null, // set dynamically with c.primary
  scheduled: null,
  upcoming: null,
}
const statusBadgeColor = { in_progress: 'green', completed: 'purple', scheduled: 'blue', upcoming: 'cyan' }


/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

export default function Roster() {
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [shifts, setShifts] = useState([])
  const [participants, setParticipants] = useState([])
  const [staffList, setStaffList] = useState([])
  const [staffAvailability, setStaffAvailability] = useState([])
  const [showNewShift, setShowNewShift] = useState(false)
  const [showPayroll, setShowPayroll] = useState(false)
  const [payrollBaseRate, setPayrollBaseRate] = useState(35)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [newShift, setNewShift] = useState({ participant_id: '', staff_id: '', shift_date: '', start_time: '', end_time: '', service_type: '', location: '', notes: '' })
  const [mapCoords, setMapCoords] = useState(null)
  const geocodeTimer = useRef(null)

  const dk = {
    text: isDark ? '#e2e8f0' : '#1f2937', textSoft: isDark ? '#cbd5e1' : '#374151',
    textMuted: isDark ? '#94a3b8' : '#6b7280', textFaint: isDark ? '#64748b' : '#9ca3af',
    inputBg: isDark ? 'rgba(30,41,59,0.8)' : 'white', inputBorder: isDark ? 'rgba(51,65,85,0.5)' : '#e5e7eb',
    divider: isDark ? 'rgba(51,65,85,0.3)' : 'rgba(0,0,0,0.05)',
    subtleBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    subtleBg2: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
  }

  const stg = (i) => ({
    transitionDelay: `${i * 50}ms`, opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(14px)',
    transition: 'all .6s cubic-bezier(.16,1,.3,1)',
  })

  const inputStyle = {
    width: '100%', padding: '12px 14px', background: dk.inputBg,
    border: `1.5px solid ${dk.inputBorder}`, borderRadius: 12,
    fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none', transition: 'all .2s',
  }

  const CT = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (<div style={{
      background: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.96)',
      backdropFilter: 'blur(20px)', borderRadius: 16,
      border: `1px solid ${isDark ? 'rgba(51,65,85,0.6)' : 'rgba(0,0,0,0.08)'}`,
      padding: '14px 18px',
      boxShadow: isDark ? '0 16px 40px -8px rgba(0,0,0,0.5)' : '0 16px 40px -8px rgba(0,0,0,0.12)',
    }}>
      <p style={{ fontWeight: 800, fontSize: 13, color: dk.text, marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${isDark ? 'rgba(51,65,85,0.4)' : 'rgba(0,0,0,0.06)'}` }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: i > 0 ? 6 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 3, background: p.color || p.fill }} />
            <span style={{ fontSize: 12, color: dk.textMuted }}>{p.name}</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color: dk.text }}>{p.value}</span>
        </div>
      ))}
    </div>)
  }


  /* ═══════════════════════════════════════════════
     ALL BACKEND — 100% PRESERVED
     ═══════════════════════════════════════════════ */

  const geocodeLocation = (address, instant = false) => {
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current)
    if (!address || address.length < 5) { setMapCoords(null); return }
    const doGeocode = async () => {
      try {
        let formatted = address.trim()
        formatted = formatted.replace(/\s+(VIC|NSW|QLD|SA|WA|TAS|NT|ACT)\s+/i, ', $1 ')
        formatted = formatted.replace(/,?\s*(\d{4})$/, ', $1')
        const q = encodeURIComponent(formatted + ', Australia')
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1&countrycodes=au`, { headers: { 'User-Agent': 'VelCare/1.0' } })
        const data = await res.json()
        if (data?.[0]) setMapCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display: data[0].display_name })
        else {
          const parts = address.trim().split(/\s+/)
          const fallback = parts.slice(Math.max(0, parts.length - 4)).join(' ') + ', Australia'
          const res2 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallback)}&limit=1&countrycodes=au`, { headers: { 'User-Agent': 'VelCare/1.0' } })
          const data2 = await res2.json()
          if (data2?.[0]) setMapCoords({ lat: parseFloat(data2[0].lat), lon: parseFloat(data2[0].lon), display: data2[0].display_name })
          else setMapCoords(null)
        }
      } catch { setMapCoords(null) }
    }
    if (instant) { doGeocode() } else { geocodeTimer.current = setTimeout(doGeocode, 400) }
  }

  useEffect(() => {
    async function load() {
      try {
        const [shiftRes, partRes, staffRes, availRes] = await Promise.all([
          supabase.from('shifts').select('*, staff(id, first_name, last_name), participants(id, first_name, last_name)').order('shift_date', { ascending: false }).order('start_time', { ascending: true }),
          supabase.from('participants').select('id, first_name, last_name, status, address'),
          supabase.from('staff').select('id, first_name, last_name, status, role'),
          supabase.from('staff_availability').select('*').then(r => r).catch(() => ({ data: [] })),
        ])
        setShifts(shiftRes.data || [])
        setParticipants((partRes.data || []).filter(p => p.status === 'active'))
        setStaffList(staffRes.data || [])
        setStaffAvailability(availRes.data || [])
      } catch (err) { console.error('Roster load error:', err) }
      finally { setLoading(false); setTimeout(() => setLoaded(true), 50) }
    }
    load()
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const todayShifts = shifts.filter(s => s.shift_date === today)
  const inProgress = shifts.filter(s => s.status === 'in_progress')
  const scheduled = shifts.filter(s => s.status === 'scheduled')
  const completedShifts = shifts.filter(s => s.status === 'completed')
  const payrollData = generatePayrollData(shifts, payrollBaseRate)
  const staffSummary = generateStaffSummary(payrollData)
  const totalPayroll = payrollData.reduce((sum, r) => sum + parseFloat(r.total_pay.replace('$', '')), 0)

  const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const getStaffAvailForDate = (staffId, dateStr) => {
    if (!dateStr) return { hasData: false }
    const dayName = DAY_NAMES[new Date(dateStr + 'T00:00:00').getDay()]
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

  /* ── Filtered shifts ── */
  const filteredShifts = useMemo(() => {
    return shifts.filter(s => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const pN = s.participants ? `${s.participants.first_name} ${s.participants.last_name}`.toLowerCase() : ''
        const sN = s.staff ? `${s.staff.first_name} ${s.staff.last_name}`.toLowerCase() : ''
        return pN.includes(q) || sN.includes(q) || (s.location || '').toLowerCase().includes(q)
      }
      return true
    })
  }, [shifts, statusFilter, search])

  const groupedShifts = useMemo(() => {
    const groups = filteredShifts.reduce((acc, s) => {
      const label = getDateLabel(s.shift_date)
      if (!acc[label]) acc[label] = { label, date: s.shift_date, shifts: [] }
      acc[label].shifts.push(s)
      return acc
    }, {})
    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date))
  }, [filteredShifts])

  /* ── Chart data ── */
  const statusPie = useMemo(() => [
    { name: 'In Progress', value: inProgress.length, color: '#10b981' },
    { name: 'Scheduled', value: scheduled.length, color: '#3b82f6' },
    { name: 'Completed', value: completedShifts.length, color: '#8b5cf6' },
  ].filter(s => s.value > 0), [inProgress, scheduled, completedShifts])

  /* ── Top staff by shift count ── */
  const topStaff = useMemo(() => {
    const map = {}
    shifts.forEach(s => {
      if (s.staff) {
        const name = `${s.staff.first_name} ${s.staff.last_name}`
        map[name] = (map[name] || 0) + 1
      }
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }))
  }, [shifts])

  const handleCreateShift = async () => {
    if (!newShift.staff_id || !newShift.shift_date || !newShift.start_time || !newShift.end_time) { alert('Please fill in staff, date, start and end time'); return }
    setSaving(true)
    try {
      const payload = { staff_id: newShift.staff_id, shift_date: newShift.shift_date, start_time: `${newShift.shift_date}T${newShift.start_time}:00`, end_time: `${newShift.shift_date}T${newShift.end_time}:00`, service_type: newShift.service_type || null, location: newShift.location || null, notes: newShift.notes || null, status: 'scheduled' }
      if (newShift.participant_id) payload.participant_id = newShift.participant_id
      const { data: inserted, error: insertErr } = await supabase.from('shifts').insert(payload).select().single()
      if (insertErr) throw insertErr
      const { data: full } = await supabase.from('shifts').select('*, staff(id, first_name, last_name), participants(id, first_name, last_name)').eq('id', inserted.id).maybeSingle()
      setShifts([full || inserted, ...shifts]); setShowNewShift(false); setMapCoords(null)
      setNewShift({ participant_id: '', staff_id: '', shift_date: '', start_time: '', end_time: '', service_type: '', location: '', notes: '' })
    } catch (err) { console.error('Failed to create shift:', err); alert('Failed to create shift: ' + (err.message || 'Unknown error')) }
    finally { setSaving(false) }
  }


  /* ─── Loading ─── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${c.staff}40` }}>
          <Calendar size={32} color="white" />
        </div>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.3 }} />
      </div>
      <p style={{ color: dk.textMuted, fontSize: 14, fontWeight: 600 }}>Loading roster...</p>
    </div>
  )


  /* ─────────────────────────────────────────────
     RENDER
     ───────────────────────────────────────────── */

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>

      <style>{`
        @keyframes orbFloat { 0%,100% { transform:translateY(0) scale(1) } 50% { transform:translateY(-15px) scale(1.03) } }
        @keyframes ping { 75%,100% { transform:scale(1.8);opacity:0 } }
        @keyframes pulse-dot { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes pulse-glow { 0%,100% { box-shadow: 0 0 8px rgba(16,185,129,0.25) } 50% { box-shadow: 0 0 20px rgba(16,185,129,0.5) } }
        @keyframes countUp { from { opacity:0;transform:translateY(8px) scale(0.95) } to { opacity:1;transform:translateY(0) scale(1) } }
        .count-up { animation: countUp .7s cubic-bezier(.16,1,.3,1) forwards }
      `}</style>

      <Orb color={c.staff} size={380} top="-100px" right="-80px" delay={0} />
      <Orb color="#3b82f6" size={280} bottom="15%" left="-60px" delay={2} />
      <Orb color="#10b981" size={200} top="45%" right="8%" delay={3.5} />
      <Orb color="#8b5cf6" size={160} bottom="30%" left="40%" delay={5} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>


        {/* ══════════ HERO BANNER ══════════ */}
        <div style={stg(0)}>
          <div style={{ borderRadius: 24, padding: '32px 28px', position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${c.staff} 0%, ${c.staffHover} 40%, #3b82f6 70%, #06b6d4 100%)` }}>
            <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: -80, right: -40 }} />
            <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -50, left: '25%' }} />
            <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent)', top: 30, left: '55%', animation: 'orbFloat 8s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.5 }} />
            {[{ top: '15%', right: '20%', s: 4, d: 0 }, { top: '60%', right: '10%', s: 3, d: 1.5 }, { bottom: '25%', left: '35%', s: 5, d: 3 }].map((dot, i) => (
              <div key={i} style={{ position: 'absolute', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', width: dot.s * 2, height: dot.s * 2, top: dot.top, right: dot.right, bottom: dot.bottom, left: dot.left, animation: `orbFloat ${4 + dot.d}s ease-in-out infinite ${dot.d}s` }} />
            ))}

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                  <Calendar size={13} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Shift Management</span>
                </div>
                {inProgress.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.3)', backdropFilter: 'blur(8px)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', animation: 'pulse-dot 2s ease-in-out infinite' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{inProgress.length} live now</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h1 style={{ fontSize: 32, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15 }}>Roster</h1>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>Schedule shifts, track time, and manage payroll</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowPayroll(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderRadius: 16, border: 'none', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}>
                    <DollarSign size={16} /> Payroll
                  </button>
                  <button onClick={() => setShowNewShift(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 16, border: 'none', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}>
                    <Plus size={18} /> New Shift
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
                {[
                  { icon: Layers, text: `${shifts.length} total shifts` },
                  { icon: Calendar, text: `${todayShifts.length} today` },
                  { icon: Play, text: `${inProgress.length} in progress`, bg: inProgress.length > 0 ? 'rgba(16,185,129,0.3)' : undefined },
                  { icon: Clock, text: `${scheduled.length} scheduled` },
                  { icon: Check, text: `${completedShifts.length} completed` },
                ].map((pill, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 12, background: pill.bg || 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <pill.icon size={14} style={{ color: 'rgba(255,255,255,0.8)' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{pill.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>


        {/* ══════════ LIVE NOW BANNER ══════════ */}
        {inProgress.length > 0 && (
          <Glass dark={isDark} glow="rgba(16,185,129,0.2)" style={{ ...stg(1), padding: '16px 22px', animation: 'pulse-glow 4s ease-in-out infinite' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #10b981, #14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px -4px rgba(16,185,129,0.4)' }}>
                <Play size={22} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{inProgress.length} Shift{inProgress.length > 1 ? 's' : ''} In Progress</p>
                <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>
                  {inProgress.slice(0, 3).map(s => s.staff ? `${s.staff.first_name} ${s.staff.last_name}` : 'Unknown').join(', ')}
                  {inProgress.length > 3 && ` +${inProgress.length - 3} more`}
                </p>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'pulse-dot 2s ease-in-out infinite', flexShrink: 0 }} />
            </div>
          </Glass>
        )}


        {/* ══════════ STAT CARDS ══════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 14, ...stg(2) }}>
          {[
            { icon: Calendar, label: "Today's Shifts", value: todayShifts.length, grad: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, glow: `${c.primary}35` },
            { icon: Play, label: 'In Progress', value: inProgress.length, grad: 'linear-gradient(135deg, #10b981, #34d399)', glow: 'rgba(16,185,129,0.2)', pulse: inProgress.length > 0 },
            { icon: Clock, label: 'Scheduled', value: scheduled.length, grad: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, glow: `${c.staff}25` },
            { icon: Check, label: 'Completed', value: completedShifts.length, grad: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', glow: 'rgba(139,92,246,0.2)' },
            { icon: DollarSign, label: 'Payroll Est.', value: totalPayroll, prefix: '$', grad: 'linear-gradient(135deg, #f59e0b, #fbbf24)', glow: 'rgba(245,158,11,0.2)' },
            { icon: Users, label: 'Staff Rostered', value: new Set(shifts.map(s => s.staff_id)).size, grad: 'linear-gradient(135deg, #06b6d4, #22d3ee)', glow: 'rgba(6,182,212,0.2)' },
          ].map((card, i) => (
            <Glass key={i} dark={isDark} hover glow={card.glow} style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
              {card.pulse && <div style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'pulse-dot 2s ease-in-out infinite' }} />}
              <div style={{ width: 42, height: 42, borderRadius: 12, background: card.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 20px -4px ${card.glow}`, marginBottom: 12 }}>
                <card.icon size={20} color="white" />
              </div>
              <p style={{ fontSize: 22, fontWeight: 800, color: dk.text, lineHeight: 1 }} className="count-up">
                <AnimNum value={card.value} prefix={card.prefix || ''} />
              </p>
              <p style={{ fontSize: 11, fontWeight: 600, color: dk.textFaint, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</p>
            </Glass>
          ))}
        </div>


        {/* ══════════ FILTER TABS + SEARCH ══════════ */}
        <Glass dark={isDark} style={{ padding: 6, ...stg(3) }}>
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }} className="no-scrollbar">
            {[
              { key: 'all', icon: Layers, label: 'All', count: shifts.length },
              { key: 'in_progress', icon: Play, label: 'Live', count: inProgress.length },
              { key: 'scheduled', icon: Clock, label: 'Scheduled', count: scheduled.length },
              { key: 'completed', icon: Check, label: 'Completed', count: completedShifts.length },
            ].map(t => {
              const isActive = statusFilter === t.key
              return (
                <button key={t.key} onClick={() => setStatusFilter(t.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderRadius: 14, border: 'none',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
                  transition: 'all .25s cubic-bezier(.16,1,.3,1)',
                  background: isActive ? `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` : 'transparent',
                  color: isActive ? 'white' : dk.textMuted,
                  boxShadow: isActive ? `0 4px 16px -4px ${c.staff}60` : 'none',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = isDark ? 'rgba(51,65,85,0.4)' : 'rgba(0,0,0,0.04)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
                  <t.icon size={15} />
                  {t.label}
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 8, background: isActive ? 'rgba(255,255,255,0.2)' : dk.subtleBg2, color: isActive ? 'rgba(255,255,255,0.9)' : dk.textFaint }}>{t.count}</span>
                </button>
              )
            })}
          </div>
        </Glass>

        <Glass dark={isDark} style={{ ...stg(4), padding: '12px 18px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search shifts by staff, participant, or location..."
                style={{ ...inputStyle, paddingLeft: 40 }}
                onFocus={e => e.target.style.borderColor = c.staff}
                onBlur={e => e.target.style.borderColor = dk.inputBorder} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: dk.textFaint, padding: '6px 12px', borderRadius: 10, background: dk.subtleBg }}>{filteredShifts.length} shift{filteredShifts.length !== 1 ? 's' : ''}</span>
          </div>
        </Glass>


        {/* ══════════ SHIFT GROUPS ══════════ */}
        {groupedShifts.length > 0 ? groupedShifts.map((group, gi) => (
          <div key={group.label} style={stg(gi + 5)}>
            {/* Date header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                padding: '6px 14px', borderRadius: 10,
                background: group.label === 'Today' ? `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` : dk.subtleBg2,
                border: group.label === 'Today' ? 'none' : `1px solid ${dk.divider}`,
              }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: group.label === 'Today' ? 'white' : dk.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {group.label}
                </span>
              </div>
              <div style={{ flex: 1, height: 1, background: dk.divider }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: dk.textFaint }}>{group.shifts.length} shift{group.shifts.length !== 1 ? 's' : ''}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {group.shifts.map(s => {
                const sGrad = s.status === 'in_progress' ? 'linear-gradient(135deg, #10b981, #14b8a6)'
                  : s.status === 'completed' ? `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`
                  : `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`
                const sColor = s.status === 'in_progress' ? '#10b981' : s.status === 'completed' ? c.primary : c.staff
                const pName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : s.title || 'Shift'
                const wName = s.staff ? `${s.staff.first_name} ${s.staff.last_name}` : 'Unassigned'

                return (
                  <Link key={s.id} to={`/admin/roster/shift/${s.id}`} style={{ textDecoration: 'none' }}>
                    <Glass dark={isDark} hover glow={`${sColor}12`} style={{ padding: '18px 22px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        {/* Accent bar */}
                        <div style={{ width: 4, height: 52, borderRadius: 4, flexShrink: 0, background: `linear-gradient(to bottom, ${sColor}, ${sColor}60)` }} />
                        {/* Status icon */}
                        <div style={{
                          width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: sGrad,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: `0 4px 16px -4px ${sColor}50`,
                          animation: s.status === 'in_progress' ? 'pulse-glow 3s ease-in-out infinite' : undefined,
                        }}>
                          {s.status === 'in_progress' ? <Play size={22} color="white" /> : s.status === 'completed' ? <Check size={22} color="white" /> : <Calendar size={22} color="white" />}
                        </div>
                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                            <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{pName}</p>
                            <p style={{ fontSize: 13, fontWeight: 700, color: dk.textSoft, flexShrink: 0 }}>{formatTime(s.start_time)} – {formatTime(s.end_time)}</p>
                          </div>
                          <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 3 }}>{wName}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                            <Badge color={statusBadgeColor[s.status] || 'gray'} dark={isDark}>
                              {s.status === 'in_progress' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block', marginRight: 3, animation: 'pulse-dot 2s ease-in-out infinite' }} />}
                              {(s.status || 'scheduled').replace('_', ' ')}
                            </Badge>
                            {s.location && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: dk.textFaint }}>
                                <MapPin size={10} /> {s.location.length > 30 ? s.location.slice(0, 30) + '...' : s.location}
                              </span>
                            )}
                            {s.clock_in && <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981' }}>In: {formatTime(s.clock_in)}</span>}
                            {s.clock_out && <span style={{ fontSize: 10, fontWeight: 700, color: c.primary }}>Out: {formatTime(s.clock_out)}</span>}
                          </div>
                        </div>
                        <ChevronRight size={18} style={{ color: dk.textFaint, flexShrink: 0 }} />
                      </div>
                    </Glass>
                  </Link>
                )
              })}
            </div>
          </div>
        )) : (
          <Glass dark={isDark} style={{ ...stg(5), padding: '56px 24px', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px', background: `linear-gradient(135deg, ${c.staff}15, ${c.staff}05)`, border: `1px solid ${c.staff}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={32} style={{ color: c.staff }} />
            </div>
            <p style={{ color: dk.textMuted, fontWeight: 600, fontSize: 16 }}>{search || statusFilter !== 'all' ? 'No shifts match your filter' : 'No shifts yet. Create your first one!'}</p>
            <p style={{ color: dk.textFaint, fontSize: 13, marginTop: 4 }}>{search ? 'Try adjusting your search' : 'Click "New Shift" to get started'}</p>
          </Glass>
        )}


        {/* ══════════ INSIGHTS ══════════ */}
        {shifts.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, ...stg(8) }}>
            {/* Status Pie */}
            <Glass dark={isDark} glow={`${c.staff}10`} style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Activity size={18} style={{ color: c.staff }} />
                <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Shift Status</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <ResponsiveContainer width={120} height={120}>
                  <PieChart><Pie data={statusPie} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} stroke="none">
                    {statusPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie><Tooltip content={<CT />} /></PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {statusPie.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
                      <span style={{ fontSize: 12, color: dk.textMuted }}>{s.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: dk.text, marginLeft: 'auto' }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Glass>

            {/* Top Staff */}
            <Glass dark={isDark} glow="rgba(59,130,246,0.1)" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Users size={18} style={{ color: '#3b82f6' }} />
                <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Most Rostered Staff</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {topStaff.length > 0 ? topStaff.map((item, i) => {
                  const maxVal = Math.max(...topStaff.map(e => e.count))
                  const pct = Math.round((item.count / maxVal) * 100)
                  const colors = [c.staff, '#3b82f6', '#10b981', '#f59e0b', '#ec4899']
                  const col = colors[i % colors.length]
                  return (<div key={item.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: dk.textSoft }}>{item.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: col }}>{item.count}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, overflow: 'hidden', background: dk.subtleBg2 }}>
                      <div style={{ height: '100%', borderRadius: 999, width: `${pct}%`, background: col, transition: 'width 1s cubic-bezier(.16,1,.3,1)' }} />
                    </div>
                  </div>)
                }) : <p style={{ fontSize: 13, color: dk.textFaint }}>No data yet</p>}
              </div>
            </Glass>

            {/* Payroll Quick Stats */}
            <Glass dark={isDark} glow="rgba(245,158,11,0.1)" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <DollarSign size={18} style={{ color: '#f59e0b' }} />
                <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Payroll Overview</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Total Payroll', value: `$${totalPayroll.toFixed(0)}`, color: '#f59e0b' },
                  { label: 'Completed Shifts', value: `${payrollData.length}`, color: '#8b5cf6' },
                  { label: 'Staff Paid', value: `${staffSummary.length}`, color: '#3b82f6' },
                  { label: 'Base Rate', value: `$${payrollBaseRate}/hr`, color: '#10b981' },
                ].map((stat, i) => (
                  <div key={i} style={{ padding: '12px 16px', borderRadius: 12, background: dk.subtleBg, border: `1px solid ${dk.subtleBg2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: dk.textMuted }}>{stat.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: stat.color }}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </Glass>
          </div>
        )}

      </div>


      {/* ══════════ PAYROLL MODAL ══════════ */}
      <Modal isOpen={showPayroll} onClose={() => setShowPayroll(false)} title="Payroll Export" wide>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ margin: '-20px -20px 0 -20px', padding: '24px 28px 20px', background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%)', position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
            <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -40, right: -20 }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={26} color="white" />
              </div>
              <div><h3 style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>Payroll Export</h3><p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>SCHADS Award compliant payroll data</p></div>
            </div>
          </div>

          {/* Payroll stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[
              { label: 'Completed Shifts', value: payrollData.length, color: '#10b981', bg: isDark ? 'rgba(16,185,129,0.08)' : '#ecfdf5', border: isDark ? 'rgba(16,185,129,0.2)' : '#a7f3d0' },
              { label: 'Staff Members', value: staffSummary.length, color: '#3b82f6', bg: isDark ? 'rgba(59,130,246,0.08)' : '#eff6ff', border: isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe' },
              { label: 'Total Payroll', value: `$${totalPayroll.toFixed(2)}`, color: '#f59e0b', bg: isDark ? 'rgba(245,158,11,0.08)' : '#fffbeb', border: isDark ? 'rgba(245,158,11,0.2)' : '#fde68a' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '16px', borderRadius: 14, textAlign: 'center', background: s.bg, border: `1px solid ${s.border}` }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</p>
                <p style={{ fontSize: 11, fontWeight: 600, color: dk.textMuted, marginTop: 4 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Base rate */}
          <div style={{ padding: '14px 18px', borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.subtleBg2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: dk.text }}>Base Hourly Rate</p>
              <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>SCHADS Award penalties applied automatically</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: dk.textMuted }}>$</span>
              <input type="number" value={payrollBaseRate} onChange={e => setPayrollBaseRate(Math.max(0, parseFloat(e.target.value) || 0))}
                style={{ width: 80, padding: '10px 12px', background: dk.inputBg, border: `1.5px solid ${dk.inputBorder}`, borderRadius: 10, fontSize: 14, fontWeight: 700, color: dk.text, textAlign: 'right', outline: 'none' }} />
              <span style={{ fontSize: 12, color: dk.textFaint }}>/hr</span>
            </div>
          </div>

          {/* Penalty info */}
          <div style={{ padding: '14px 18px', borderRadius: 14, background: isDark ? 'rgba(59,130,246,0.06)' : '#eff6ff', border: `1px solid ${isDark ? 'rgba(59,130,246,0.15)' : '#bfdbfe'}` }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: isDark ? '#60a5fa' : '#2563eb', marginBottom: 8 }}>Penalty Rates (SCHADS Award)</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px' }}>
              {[['Weekday', '100%'], ['Saturday', '150%'], ['Sunday', '200%'], ['Public Holiday', '250%'], ['Overtime (>8hrs)', '+50%'], ['Break', '30min (5hr+)']].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: dk.textMuted }}>{label}</span>
                  <span style={{ fontWeight: 700, color: isDark ? '#60a5fa' : '#2563eb' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Staff summary table */}
          {staffSummary.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Staff Summary</p>
              <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${dk.inputBorder}` }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: dk.subtleBg2 }}>
                        {['Staff', 'Shifts', 'Hours', 'OT', 'Total Pay'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', fontWeight: 700, color: dk.textMuted, textAlign: h === 'Staff' ? 'left' : 'right', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {staffSummary.map((s, i) => (
                        <tr key={i} style={{ borderTop: `1px solid ${dk.divider}` }}>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: dk.text }}>{s.staff_name}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', color: dk.textMuted }}>{s.total_shifts}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', color: dk.textMuted }}>{s.total_hours}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', color: dk.textMuted }}>{parseFloat(s.overtime_hours) > 0 ? s.overtime_hours : '—'}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: dk.text }}>{s.total_pay}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Export buttons */}
          <div style={{ display: 'flex', gap: 12, borderTop: `1px solid ${dk.divider}`, paddingTop: 16 }}>
            <button onClick={() => exportPayroll(shifts, payrollBaseRate)} disabled={payrollData.length === 0} style={{
              flex: 1, padding: '15px 0', borderRadius: 14, border: 'none',
              background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`,
              color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: `0 6px 24px -6px ${c.staff}50`, opacity: payrollData.length === 0 ? 0.5 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <FileSpreadsheet size={16} /> Export Detailed CSV
            </button>
            <button onClick={() => exportStaffSummary(shifts, payrollBaseRate)} disabled={staffSummary.length === 0} style={{
              flex: 1, padding: '15px 0', borderRadius: 14,
              background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9',
              border: `1px solid ${dk.inputBorder}`, color: dk.textMuted,
              fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: staffSummary.length === 0 ? 0.5 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Users size={16} /> Export Summary CSV
            </button>
          </div>
          {payrollData.length === 0 && <p style={{ textAlign: 'center', fontSize: 13, color: dk.textFaint }}>No completed shifts with clock in/out data to export</p>}
        </div>
      </Modal>


      {/* ══════════ NEW SHIFT MODAL ══════════ */}
      <Modal isOpen={showNewShift} onClose={() => { setShowNewShift(false); setMapCoords(null) }} title="Create New Shift" wide>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ 
            margin: '-20px -20px 0 -20px', padding: '24px 28px 20px', background: `linear-gradient(135deg, ${c.staff} 0%, ${c.staffHover} 50%, #3b82f6 100%)`, position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
            <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -40, right: -20 }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={26} color="white" />
              </div>
              <div><h3 style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>New Shift</h3><p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Schedule a new shift for your team</p></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><User size={11} /> Participant</p>
              <select value={newShift.participant_id} onChange={e => { const pid = e.target.value; const p = participants.find(p => p.id === pid); const loc = p?.address || newShift.location; setNewShift({...newShift, participant_id: pid, location: loc}); if (loc) geocodeLocation(loc, true) }}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Select Participant</option>
                {participants.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
              </select>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={11} /> Date *</p>
              <input type="date" value={newShift.shift_date} onChange={e => setNewShift({...newShift, shift_date: e.target.value, staff_id: ''})}
                style={inputStyle} onFocus={e => e.target.style.borderColor = c.staff} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={11} /> Start Time *</p>
              <input type="time" value={newShift.start_time} onChange={e => setNewShift({...newShift, start_time: e.target.value})}
                style={inputStyle} onFocus={e => e.target.style.borderColor = c.staff} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={11} /> End Time *</p>
              <input type="time" value={newShift.end_time} onChange={e => setNewShift({...newShift, end_time: e.target.value})}
                style={inputStyle} onFocus={e => e.target.style.borderColor = c.staff} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><Briefcase size={11} /> Service Type</p>
              <select value={newShift._isOther ? 'Other' : newShift.service_type} onChange={e => { if (e.target.value === 'Other') setNewShift({...newShift, service_type: '', _isOther: true}); else setNewShift({...newShift, service_type: e.target.value, _isOther: false}) }}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Select Service Type</option>
                {['Community Access', 'Personal Care', 'Cleaning', 'Gardening', 'Respite Care', 'Transport', 'Social Support', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {newShift._isOther && <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Custom Type</p>
              <input placeholder="Specify service type..." value={newShift.service_type} onChange={e => setNewShift({...newShift, service_type: e.target.value})}
                style={inputStyle} autoFocus onFocus={e => e.target.style.borderColor = c.staff} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
            </div>}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={11} /> Location</p>
              <input placeholder="Location" value={newShift.location} onChange={e => { setNewShift({...newShift, location: e.target.value}); geocodeLocation(e.target.value) }}
                style={inputStyle} onFocus={e => e.target.style.borderColor = c.staff} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
            </div>
          </div>

          {/* Staff selection */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Users size={11} /> Assign Staff *
              {newShift.shift_date && <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0, marginLeft: 4, color: dk.textFaint }}>
                — {new Date(newShift.shift_date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })}
              </span>}
            </p>
            <div style={{ maxHeight: 200, overflowY: 'auto', borderRadius: 14, border: `1px solid ${dk.inputBorder}`, padding: 8, background: dk.subtleBg, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {staffList.map(s => {
                const avail = getStaffAvailForDate(s.id, newShift.shift_date)
                const isUnavailable = avail.hasData && !avail.available
                const isSelected = newShift.staff_id === s.id
                return (
                  <button key={s.id} type="button" onClick={() => !isUnavailable && setNewShift({...newShift, staff_id: s.id})} disabled={isUnavailable}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                      borderRadius: 12, border: isSelected ? `2px solid ${c.staff}` : `1px solid ${isUnavailable ? (isDark ? 'rgba(239,68,68,0.2)' : '#fecaca') : dk.inputBorder}`,
                      background: isSelected ? (isDark ? `${c.staff}15` : '#f0fdfa') : isUnavailable ? (isDark ? 'rgba(239,68,68,0.05)' : '#fef2f2') : dk.inputBg,
                      cursor: isUnavailable ? 'not-allowed' : 'pointer', opacity: isUnavailable ? 0.6 : 1,
                      textAlign: 'left', transition: 'all .2s',
                    }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800, color: 'white', flexShrink: 0,
                      background: isUnavailable ? '#d1d5db' : isSelected ? c.staff : '#9ca3af',
                    }}>{s.first_name?.[0]}{s.last_name?.[0]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: isUnavailable ? dk.textFaint : dk.text }}>{s.first_name} {s.last_name}</p>
                      {newShift.shift_date ? (
                        <p style={{ fontSize: 11, fontWeight: 600, marginTop: 2, color: isUnavailable ? '#ef4444' : avail.hasData ? '#10b981' : dk.textFaint }}>
                          {isUnavailable ? '✕ Not available' : avail.hasData && avail.available ? `✓ ${avail.slots.join(' · ')}${avail.notes ? ' — ' + avail.notes : ''}` : 'No availability set'}
                        </p>
                      ) : <p style={{ fontSize: 11, color: dk.textFaint }}>Select a date first</p>}
                    </div>
                    {isSelected && <CheckCircle size={18} style={{ color: c.staff, flexShrink: 0 }} />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><FileSpreadsheet size={11} /> Notes</p>
            <textarea placeholder="Notes..." value={newShift.notes} onChange={e => setNewShift({...newShift, notes: e.target.value})} rows={3}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.borderColor = c.staff} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 12, borderTop: `1px solid ${dk.divider}`, paddingTop: 16 }}>
            <button onClick={() => { setShowNewShift(false); setMapCoords(null) }} style={{ flex: 1, padding: '15px 0', borderRadius: 14, background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9', border: `1px solid ${dk.inputBorder}`, color: dk.textMuted, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleCreateShift} disabled={saving} style={{ flex: 2, padding: '15px 0', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 8px 28px -6px ${c.staff}50`, opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {saving ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><Plus size={16} /> Create Shift</>}
            </button>
          </div>

          {/* Map preview */}
          {mapCoords && (
            <div style={{ borderRadius: 20, overflow: 'hidden', border: `1px solid ${dk.inputBorder}`, background: dk.subtleBg }}>
              <div style={{ position: 'relative', height: 190, overflow: 'hidden' }}>
                {(() => {
                  const zoom = 15; const n = Math.pow(2, zoom)
                  const xtile = ((mapCoords.lon + 180) / 360) * n
                  const ytile = ((1 - Math.log(Math.tan(mapCoords.lat * Math.PI / 180) + 1 / Math.cos(mapCoords.lat * Math.PI / 180)) / Math.PI) / 2) * n
                  const cx = Math.floor(xtile); const cy = Math.floor(ytile)
                  const tiles = []; for (let dx = -2; dx <= 2; dx++) { for (let dy = -2; dy <= 2; dy++) { tiles.push({ x: cx + dx, y: cy + dy, dx, dy }) } }
                  const offsetX = (xtile - cx) * 256; const offsetY = (ytile - cy) * 256
                  return (<>
                    <div style={{ position: 'absolute', left: `calc(50% - ${offsetX}px - 512px)`, top: `calc(50% - ${offsetY}px - 512px)`, width: `${256 * 5}px`, height: `${256 * 5}px` }}>
                      {tiles.map(t => (<img key={`${t.x}-${t.y}`} src={`https://a.basemaps.cartocdn.com/light_all/${zoom}/${t.x}/${t.y}@2x.png`} alt="" style={{ position: 'absolute', left: `${(t.dx + 2) * 256}px`, top: `${(t.dy + 2) * 256}px`, width: '256px', height: '256px' }} draggable={false} />))}
                    </div>
                    <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -4px)', zIndex: 9 }}><div style={{ width: 14, height: 6, borderRadius: '50%', background: 'rgba(0,0,0,0.15)', filter: 'blur(2px)', margin: '0 auto' }} /></div>
                    <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -100%)', zIndex: 10, filter: `drop-shadow(0 2px 4px ${c.staff}66)` }}>
                      <svg width="36" height="46" viewBox="0 0 36 46" fill="none"><path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.06 27.94 0 18 0z" fill="url(#rpg)" /><circle cx="18" cy="16.5" r="7" fill="white" /><circle cx="18" cy="16.5" r="3.5" fill="url(#rpg2)" /><defs><linearGradient id="rpg" x1="4" y1="2" x2="32" y2="44"><stop stopColor={c.staff} /><stop offset="1" stopColor={c.staffHover} /></linearGradient><linearGradient id="rpg2" x1="14" y1="13" x2="22" y2="20"><stop stopColor={c.staff} /><stop offset="1" stopColor={c.staffHover} /></linearGradient></defs></svg>
                    </div>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(248,249,250,0.3) 0%, transparent 15%, transparent 80%, rgba(248,249,250,0.6) 100%)', pointerEvents: 'none' }} />
                  </>)
                })()}
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, background: isDark ? 'rgba(30,41,59,0.8)' : '#f8f9fa' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, flexShrink: 0 }}>
                  <MapPin size={14} color="white" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: dk.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mapCoords.display?.split(',').slice(0, 3).join(',')}</p>
                  <p style={{ fontSize: 9, color: dk.textFaint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mapCoords.display?.split(',').slice(3).join(',').trim()}</p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <a href={`https://maps.apple.com/?q=${encodeURIComponent(mapCoords.display)}&ll=${mapCoords.lat},${mapCoords.lon}`} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 10px', borderRadius: 8, background: '#1f2937', color: 'white', fontSize: 10, fontWeight: 700, textDecoration: 'none' }}>Apple</a>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${mapCoords.lat},${mapCoords.lon}`} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 10px', borderRadius: 8, background: c.staff, color: 'white', fontSize: 10, fontWeight: 700, textDecoration: 'none' }}>Google</a>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

    </div>
  )
}