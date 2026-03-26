import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar, Clock, XCircle, Check, Loader2, Sun, Sunrise, Sunset, Moon,
  ChevronLeft, ChevronRight, Users, Search, AlertTriangle, Activity,
  Layers, Shield, BarChart3, Eye, Hash
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useBrandColors } from '../hooks/useBrandColors'
import { useTheme } from '../context/ThemeContext'


/* ─────────────────────────────────────────────
   DESIGN SYSTEM
   ───────────────────────────────────────────── */

function Glass({ children, dark, glow, hover, style, ...p }) {
  const base = dark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.55)'
  const border = dark ? 'rgba(51,65,85,0.4)' : 'rgba(255,255,255,0.7)'
  return (
    <div style={{ background: base, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${border}`, borderRadius: '1.25rem', boxShadow: glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)', transition: hover ? 'all .3s cubic-bezier(.16,1,.3,1)' : undefined, ...style }}
    onMouseEnter={hover ? e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = glow ? `0 16px 48px -8px ${glow}` : '0 12px 40px -8px rgba(0,0,0,0.12)' } : undefined}
    onMouseLeave={hover ? e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)' } : undefined}
    {...p}>{children}</div>
  )
}

function Orb({ color, size = 200, top, left, right, bottom, delay = 0 }) {
  return (<div style={{ position: 'absolute', width: size, height: size, top, left, right, bottom, background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, opacity: 0.12, borderRadius: '50%', animation: `orbFloat ${6 + delay}s ease-in-out ${delay}s infinite`, pointerEvents: 'none', zIndex: 0 }} />)
}

function AnimNum({ value, duration = 900 }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef()
  useEffect(() => { const num = typeof value === 'number' ? value : parseInt(value) || 0; const start = performance.now(); function tick(now) { const p = Math.min((now - start) / duration, 1); setDisplay(Math.round(num * (1 - Math.pow(1 - p, 3)))); if (p < 1) ref.current = requestAnimationFrame(tick) }; ref.current = requestAnimationFrame(tick); return () => cancelAnimationFrame(ref.current) }, [value, duration])
  return <>{display}</>
}

function Badge({ children, color = 'gray', dark }) {
  const palettes = {
    gray: dark ? { bg: 'rgba(100,116,139,0.2)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)' } : { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
    green: dark ? { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' } : { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
    amber: dark ? { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' } : { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    red: dark ? { bg: 'rgba(239,68,68,0.15)', text: '#f87171', border: 'rgba(239,68,68,0.3)' } : { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    blue: dark ? { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' } : { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  }
  const pl = palettes[color] || palettes.gray
  return (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: pl.bg, color: pl.text, border: `1px solid ${pl.border}`, whiteSpace: 'nowrap' }}>{children}</span>)
}


/* ─── Config (100% preserved) ─── */
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' }
const DAY_FULL = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' }

const SLOTS = [
  { key: 'morning', label: 'Morning', short: 'AM', time: '6am – 12pm', icon: Sunrise, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', darkBg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', grad: 'linear-gradient(135deg, #f59e0b, #f97316)' },
  { key: 'afternoon', label: 'Afternoon', short: 'PM', time: '12pm – 6pm', icon: Sun, color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)', darkBg: 'rgba(14,165,233,0.12)', border: 'rgba(14,165,233,0.25)', grad: 'linear-gradient(135deg, #0ea5e9, #06b6d4)' },
  { key: 'evening', label: 'Evening', short: 'Eve', time: '6pm – 10pm', icon: Sunset, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', darkBg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)', grad: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
  { key: 'night', label: 'Night', short: 'Night', time: '10pm – 6am', icon: Moon, color: '#6366f1', bg: 'rgba(99,102,241,0.08)', darkBg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)', grad: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
]

function getTodayDay() { return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()] }


/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

export default function Availability() {
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [staff, setStaff] = useState([])
  const [availability, setAvailability] = useState([])
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [view, setView] = useState('week')
  const [selectedDay, setSelectedDay] = useState(getTodayDay())
  const [search, setSearch] = useState('')

  const dk = {
    text: isDark ? '#e2e8f0' : '#1f2937', textSoft: isDark ? '#cbd5e1' : '#374151',
    textMuted: isDark ? '#94a3b8' : '#6b7280', textFaint: isDark ? '#64748b' : '#9ca3af',
    subtleBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    subtleBg2: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    inputBg: isDark ? 'rgba(30,41,59,0.8)' : 'white',
    inputBorder: isDark ? 'rgba(51,65,85,0.5)' : '#e5e7eb',
    divider: isDark ? 'rgba(51,65,85,0.3)' : 'rgba(0,0,0,0.05)',
    stickyBg: isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)',
  }

  const stg = (i) => ({ transitionDelay: `${i * 50}ms`, opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(14px)', transition: 'all .6s cubic-bezier(.16,1,.3,1)' })
  const inputStyle = { width: '100%', padding: '12px 14px', background: dk.inputBg, border: `1.5px solid ${dk.inputBorder}`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none', transition: 'all .2s' }


  /* ═══ ALL BACKEND — 100% PRESERVED ═══ */
  useEffect(() => { loadData() }, [])
  useEffect(() => { if (!loading) setTimeout(() => setLoaded(true), 50) }, [loading])

  async function loadData() {
    try {
      const [staffRes, availRes] = await Promise.all([
        supabase.from('staff').select('id, first_name, last_name, phone, email, status, position').eq('status', 'active').order('first_name'),
        supabase.from('staff_availability').select('*'),
      ])
      setStaff(staffRes.data || []); setAvailability(availRes.data || [])
    } catch (err) { console.error('Failed to load:', err) }
    finally { setLoading(false) }
  }

  const availMap = useMemo(() => {
    const map = {}; availability.forEach(r => { if (!map[r.staff_id]) map[r.staff_id] = {}; map[r.staff_id][r.day_of_week] = r }); return map
  }, [availability])

  const filtered = useMemo(() => staff.filter(s => `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase())), [staff, search])
  const today = getTodayDay()
  const availableToday = filtered.filter(s => { const row = availMap[s.id]?.[today]; return row && (row.morning || row.afternoon || row.evening || row.night) }).length
  const unavailableToday = filtered.length - availableToday
  const notSetCount = filtered.filter(s => !availMap[s.id] || Object.keys(availMap[s.id]).length === 0).length


  /* ─── Loading ─── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${c.staff}40` }}><Calendar size={32} color="white" /></div>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.3 }} />
      </div>
      <p style={{ color: dk.textMuted, fontSize: 14, fontWeight: 600 }}>Loading availability...</p>
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

      <Orb color={c.staff} size={380} top="-100px" right="-80px" delay={0} />
      <Orb color="#3b82f6" size={280} bottom="15%" left="-60px" delay={2} />
      <Orb color="#8b5cf6" size={200} top="45%" right="8%" delay={3.5} />
      <Orb color="#f59e0b" size={160} bottom="30%" left="40%" delay={5} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ══════════ HERO ══════════ */}
        <div style={stg(0)}>
          <div style={{ borderRadius: 24, padding: '28px 24px', position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${c.staff} 0%, ${c.staffHover} 50%, ${c.staffHover} 100%)` }}>
            <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: -80, right: -40 }} />
            <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -50, left: '25%' }} />
            <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent)', top: 30, left: '55%', animation: 'orbFloat 8s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.5 }} />
            {[{ top: '15%', right: '20%', s: 4, d: 0 }, { top: '60%', right: '10%', s: 3, d: 1.5 }, { bottom: '25%', left: '35%', s: 5, d: 3 }].map((dot, i) => (
              <div key={i} style={{ position: 'absolute', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', width: dot.s * 2, height: dot.s * 2, top: dot.top, right: dot.right, bottom: dot.bottom, left: dot.left, animation: `orbFloat ${4 + dot.d}s ease-in-out infinite ${dot.d}s` }} />
            ))}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}><Users size={13} style={{ color: 'rgba(255,255,255,0.7)' }} /><span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Staff Management</span></div>
                {availableToday > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.25)', backdropFilter: 'blur(8px)' }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', animation: 'pulse-dot 2s ease-in-out infinite' }} /><span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{availableToday} available today</span></div>}
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15 }}>Staff Availability</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>See who's available and when across your team</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
                {[
                  { icon: Users, text: `${filtered.length} active staff` },
                  { icon: Calendar, text: DAY_FULL[today] },
                  { icon: Check, text: `${availableToday} available`, bg: 'rgba(16,185,129,0.25)' },
                  notSetCount > 0 && { icon: AlertTriangle, text: `${notSetCount} not configured`, bg: 'rgba(245,158,11,0.35)' },
                ].filter(Boolean).map((pill, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 12, background: pill.bg || 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
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
            { icon: Users, label: 'Active Staff', value: filtered.length, grad: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, glow: `${c.staff}25` },
            { icon: Check, label: 'Available Today', value: availableToday, grad: 'linear-gradient(135deg, #10b981, #34d399)', glow: 'rgba(16,185,129,0.2)' },
            { icon: XCircle, label: 'Unavailable', value: unavailableToday, grad: 'linear-gradient(135deg, #ef4444, #f87171)', glow: 'rgba(239,68,68,0.2)' },
            { icon: Clock, label: 'Not Set', value: notSetCount, grad: 'linear-gradient(135deg, #64748b, #94a3b8)', glow: 'rgba(100,116,139,0.15)' },
          ].map((card, i) => (
            <Glass key={i} dark={isDark} hover glow={card.glow} style={{ padding: '18px 20px' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: card.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 20px -4px ${card.glow}`, marginBottom: 12 }}><card.icon size={20} color="white" /></div>
              <p style={{ fontSize: 22, fontWeight: 800, color: dk.text, lineHeight: 1 }} className="count-up"><AnimNum value={card.value} /></p>
              <p style={{ fontSize: 11, fontWeight: 600, color: dk.textFaint, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</p>
            </Glass>
          ))}
        </div>

        {/* ══════════ CONTROLS ══════════ */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', ...stg(2) }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff..." style={{ ...inputStyle, paddingLeft: 40 }} onFocus={e => e.target.style.borderColor = c.staff} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
          </div>
          <Glass dark={isDark} style={{ padding: 4, display: 'flex', gap: 4 }}>
            {['week', 'day'].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '10px 18px', borderRadius: 12, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: view === v ? `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` : 'transparent',
                color: view === v ? 'white' : dk.textMuted,
                boxShadow: view === v ? `0 4px 16px -4px ${c.staff}60` : 'none',
              }}>{v === 'week' ? 'Week View' : 'Day View'}</button>
            ))}
          </Glass>
        </div>

        {/* ══════════ DAY SELECTOR ══════════ */}
        {view === 'day' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...stg(3) }}>
            <button onClick={() => { const i = DAYS.indexOf(selectedDay); setSelectedDay(DAYS[(i - 1 + 7) % 7]) }} style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: dk.subtleBg2, color: dk.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ChevronLeft size={18} /></button>
            <div style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center' }}>
              {DAYS.map(d => (
                <button key={d} onClick={() => setSelectedDay(d)} style={{
                  padding: '10px 14px', borderRadius: 12, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: d === selectedDay ? `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` : d === today ? (isDark ? `${c.staff}15` : `${c.staff}08`) : dk.subtleBg,
                  color: d === selectedDay ? 'white' : d === today ? c.staff : dk.textMuted,
                  boxShadow: d === selectedDay ? `0 4px 16px -4px ${c.staff}60` : 'none',
                  border: d === today && d !== selectedDay ? `1px solid ${c.staff}30` : 'none',
                }}>{DAY_LABELS[d]}</button>
              ))}
            </div>
            <button onClick={() => { const i = DAYS.indexOf(selectedDay); setSelectedDay(DAYS[(i + 1) % 7]) }} style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: dk.subtleBg2, color: dk.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ChevronRight size={18} /></button>
          </div>
        )}

        {/* ══════════ WEEK VIEW ══════════ */}
        {view === 'week' && (
          <Glass dark={isDark} glow={`${c.staff}08`} style={{ ...stg(3), padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: dk.subtleBg2 }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: dk.textFaint, textTransform: 'uppercase', position: 'sticky', left: 0, zIndex: 10, background: dk.stickyBg, minWidth: 60, borderBottom: `1px solid ${dk.divider}` }}>Staff</th>
                    {DAYS.map(d => (
                      <th key={d} style={{ padding: '12px 10px', textAlign: 'center', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', minWidth: 80, borderBottom: `1px solid ${dk.divider}`, color: d === today ? c.staff : dk.textFaint, background: d === today ? (isDark ? `${c.staff}10` : `${c.staff}06`) : 'transparent' }}>
                        {DAY_LABELS[d]}
                        {d === today && <span style={{ display: 'block', fontSize: 9, fontWeight: 600, color: c.staff, marginTop: 2 }}>Today</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const myAvail = availMap[s.id] || {}; const hasAny = Object.keys(myAvail).length > 0
                    return (
                      <tr key={s.id} style={{ borderTop: `1px solid ${dk.divider}` }}
                        onMouseEnter={e => e.currentTarget.style.background = dk.subtleBg}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '10px 14px', position: 'sticky', left: 0, zIndex: 10, background: dk.stickyBg, backdropFilter: 'blur(12px)' }}>
                          <Link to={`/admin/staff/${s.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 800, flexShrink: 0, boxShadow: `0 2px 8px -2px ${c.staff}40` }}>{s.first_name?.[0]}{s.last_name?.[0]}</div>
                            <div style={{ minWidth: 0, display: 'none' }} className="sm:block"><p style={{ fontSize: 12, fontWeight: 600, color: dk.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.first_name} {s.last_name}</p></div>
                          </Link>
                        </td>
                        {DAYS.map(d => {
                          const row = myAvail[d]; const isToday = d === today
                          const cellBg = isToday ? (isDark ? `${c.staff}08` : `${c.staff}04`) : ''
                          if (!hasAny) return <td key={d} style={{ padding: '8px', textAlign: 'center', background: cellBg }}><span style={{ fontSize: 10, color: dk.textFaint }}>—</span></td>
                          if (!row) return <td key={d} style={{ padding: '8px', textAlign: 'center', background: cellBg }}><div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : '#fecaca'}` }}><XCircle size={12} style={{ color: '#ef4444' }} /></div></td>
                          const activeSlots = SLOTS.filter(sl => row[sl.key])
                          if (activeSlots.length === 0) return <td key={d} style={{ padding: '8px', textAlign: 'center', background: cellBg }}><div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : '#fecaca'}` }}><XCircle size={12} style={{ color: '#ef4444' }} /></div></td>
                          return (
                            <td key={d} style={{ padding: '8px', textAlign: 'center', background: cellBg }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }} title={activeSlots.map(sl => `${sl.label} (${sl.time})`).join(', ') + (row.notes ? '\n' + row.notes : '')}>
                                {activeSlots.map(sl => (<span key={sl.key} style={{ padding: '3px 6px', borderRadius: 6, fontSize: 9, fontWeight: 700, background: isDark ? sl.darkBg : sl.bg, color: sl.color, border: `1px solid ${sl.border}` }}>{sl.short}</span>))}
                              </div>
                              {row.notes && <p style={{ fontSize: 8, marginTop: 2, color: dk.textFaint, maxWidth: 80, margin: '2px auto 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.notes}>{row.notes}</p>}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 48, color: dk.textMuted }}>No active staff found</td></tr>}
                </tbody>
              </table>
            </div>
          </Glass>
        )}

        {/* ══════════ DAY VIEW ══════════ */}
        {view === 'day' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, ...stg(4) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: dk.text }}>{DAY_FULL[selectedDay]}</h3>
              {selectedDay === today && <Badge color="blue" dark={isDark}>Today</Badge>}
            </div>

            {SLOTS.map(slot => {
              const SlotIcon = slot.icon
              const staffInSlot = filtered.filter(s => { const row = availMap[s.id]?.[selectedDay]; return row && row[slot.key] })
              return (
                <Glass key={slot.key} dark={isDark} glow={staffInSlot.length > 0 ? `${slot.color}15` : undefined} style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${dk.divider}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: slot.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px -4px ${slot.color}40` }}><SlotIcon size={18} color="white" /></div>
                      <div><p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{slot.label}</p><p style={{ fontSize: 11, color: dk.textFaint }}>{slot.time}</p></div>
                    </div>
                    <Badge color={staffInSlot.length > 0 ? 'green' : 'red'} dark={isDark}>{staffInSlot.length} staff</Badge>
                  </div>
                  {staffInSlot.length > 0 ? (
                    <div style={{ padding: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {staffInSlot.map(s => {
                        const row = availMap[s.id]?.[selectedDay]
                        return (
                          <Link key={s.id} to={`/admin/staff/${s.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: dk.subtleBg, border: `1px solid ${dk.subtleBg2}`, transition: 'all .2s' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{s.first_name?.[0]}{s.last_name?.[0]}</div>
                            <div><p style={{ fontSize: 12, fontWeight: 700, color: dk.text }}>{s.first_name} {s.last_name}</p>{row?.notes && <p style={{ fontSize: 10, color: dk.textFaint, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.notes}</p>}</div>
                          </Link>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center' }}><p style={{ fontSize: 12, color: dk.textFaint }}>No staff available</p></div>
                  )}
                </Glass>
              )
            })}

            {/* Unavailable */}
            {(() => {
              const unavailStaff = filtered.filter(s => { const row = availMap[s.id]?.[selectedDay]; return !row || (!row.morning && !row.afternoon && !row.evening && !row.night) })
              if (unavailStaff.length === 0) return null
              return (
                <Glass dark={isDark} glow="rgba(239,68,68,0.08)" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${dk.divider}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #ef4444, #f87171)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px -4px rgba(239,68,68,0.4)' }}><XCircle size={18} color="white" /></div>
                      <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>Unavailable / Not Set</p>
                    </div>
                    <Badge color="red" dark={isDark}>{unavailStaff.length} staff</Badge>
                  </div>
                  <div style={{ padding: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {unavailStaff.map(s => (
                      <Link key={s.id} to={`/admin/staff/${s.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: isDark ? 'rgba(239,68,68,0.04)' : 'rgba(239,68,68,0.03)', border: `1px solid ${isDark ? 'rgba(239,68,68,0.12)' : '#fecaca'}` }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: isDark ? '#475569' : '#d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{s.first_name?.[0]}{s.last_name?.[0]}</div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: dk.textMuted }}>{s.first_name} {s.last_name}</p>
                      </Link>
                    ))}
                  </div>
                </Glass>
              )
            })()}
          </div>
        )}

        {/* ══════════ LEGEND ══════════ */}
        <Glass dark={isDark} style={{ ...stg(5), padding: '14px 20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 10, color: dk.textFaint, alignItems: 'center' }}>
            {SLOTS.map(sl => (
              <span key={sl.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ padding: '3px 6px', borderRadius: 6, fontWeight: 700, background: isDark ? sl.darkBg : sl.bg, color: sl.color, border: `1px solid ${sl.border}` }}>{sl.short}</span>
                {sl.time}
              </span>
            ))}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><XCircle size={10} style={{ color: '#ef4444' }} /> Unavailable</span>
            <span style={{ color: isDark ? '#475569' : '#d1d5db' }}>— Not set</span>
          </div>
        </Glass>

      </div>
    </div>
  )
}