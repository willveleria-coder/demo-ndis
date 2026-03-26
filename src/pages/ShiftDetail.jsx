import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Calendar, Clock, MapPin, User, Play, Square, FileText, Car,
  AlertTriangle, Check, Phone, Navigation, Loader2, ChevronRight, Activity,
  Shield, Zap, MessageSquare, Gauge, ArrowRight, CheckCircle,
  Timer, Hash, Clipboard, Star, TrendingUp, XCircle, Eye
} from 'lucide-react'
import { getShift, clockIn, clockOut, updateShift } from '../services/shiftService'
import { useBrandColors } from '../hooks/useBrandColors'
import { useTheme } from '../context/ThemeContext'
import Modal from '../components/ui/Modal'
import { supabase } from '../lib/supabase'


/* ─────────────────────────────────────────────
   DESIGN SYSTEM COMPONENTS
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

function AnimNum({ value, duration = 900 }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef()
  useEffect(() => {
    const num = typeof value === 'number' ? value : parseInt(value) || 0
    const start = performance.now()
    function tick(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(num * eased))
      if (progress < 1) ref.current = requestAnimationFrame(tick)
    }
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
    letterSpacing: '0.01em', whiteSpace: 'nowrap',
  }}>{children}</span>)
}


/* ─────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────── */

function fmtTime(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDateShort(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}


/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

export default function ShiftDetail() {
  const c = useBrandColors()
  const { isDark } = useTheme()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [shift, setShift] = useState(null)
  const [showNote, setShowNote] = useState(false)
  const [showMileage, setShowMileage] = useState(false)
  const [noteSubmitted, setNoteSubmitted] = useState(false)
  const [noteForm, setNoteForm] = useState({ mood: '', activities: '', goals_progress: '', concerns: '', recommendations: '' })
  const [mileageForm, setMileageForm] = useState({ start: '', end: '', purpose: 'Transport participant' })

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


  /* ═══════════════════════════════════════════════
     ALL BACKEND — 100% PRESERVED
     ═══════════════════════════════════════════════ */

  useEffect(() => {
    async function load() {
      try {
        const data = await getShift(id)
        setShift(data)
        const { data: existingNotes } = await supabase
          .from('shift_notes')
          .select('id')
          .eq('shift_id', id)
          .limit(1)
        if (existingNotes && existingNotes.length > 0) setNoteSubmitted(true)
      } catch (err) {
        console.error('Failed to load shift:', err)
      } finally {
        setLoading(false)
        setTimeout(() => setLoaded(true), 50)
      }
    }
    load()
  }, [id])

  const handleClockIn = async () => {
    try {
      const updated = await clockIn(id)
      setShift(prev => ({ ...prev, ...updated, staff: prev.staff, participants: prev.participants }))
    } catch (err) { alert('Failed to clock in') }
  }

  const handleClockOut = async () => {
    try {
      const updated = await clockOut(id)
      setShift(prev => ({ ...prev, ...updated, staff: prev.staff, participants: prev.participants }))
    } catch (err) { alert('Failed to clock out') }
  }

  const handleSubmitNote = async () => {
    try {
      await supabase.from('shift_notes').insert({
        shift_id: id, staff_id: shift.staff_id, ...noteForm,
      })
    } catch (err) { console.error('Note insert failed:', err) }
    setShowNote(false)
    setNoteSubmitted(true)
    setNoteForm({ mood: '', activities: '', goals_progress: '', concerns: '', recommendations: '' })
  }

  const handleSaveMileage = async () => {
    try {
      await updateShift(id, {
        mileage_start: Number(mileageForm.start) || null,
        mileage_end: Number(mileageForm.end) || null,
        mileage_purpose: mileageForm.purpose,
      })
      setShift(prev => ({
        ...prev,
        mileage_start: Number(mileageForm.start) || null,
        mileage_end: Number(mileageForm.end) || null,
        mileage_purpose: mileageForm.purpose,
      }))
    } catch (err) { console.error('Mileage save failed:', err) }
    setShowMileage(false)
  }


  /* ─── Loading state ─── */
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: 72, height: 72, borderRadius: 22, background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${c.staff}40` }}>
            <Calendar size={32} color="white" />
          </div>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.3 }} />
        </div>
        <p style={{ color: dk.textMuted, fontSize: 14, fontWeight: 600 }}>Loading shift...</p>
      </div>
    )
  }

  /* ─── Not found ─── */
  if (!shift) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px', background: `linear-gradient(135deg, ${c.staff}15, ${c.staff}05)`, border: `1px solid ${c.staff}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Calendar size={32} style={{ color: c.staff }} />
        </div>
        <p style={{ color: dk.textMuted, fontWeight: 600, fontSize: 16 }}>Shift not found</p>
        <Link to="/admin/roster" style={{ color: c.staff, fontSize: 14, fontWeight: 600, marginTop: 8, display: 'inline-block' }}>Back to roster</Link>
      </div>
    )
  }


  /* ─── Derived data ─── */
  const s = shift
  const status = s.status || 'scheduled'
  const participant = s.participants
  const staff = s.staff
  const pName = participant ? `${participant.first_name} ${participant.last_name}` : 'Unassigned'
  const wName = staff ? `${staff.first_name} ${staff.last_name}` : 'Unassigned'
  const mileageTotal = (s.mileage_start && s.mileage_end) ? s.mileage_end - s.mileage_start : null

  const statusConfig = {
    scheduled:   { color: c.staff, hoverColor: c.staffHover, label: 'Scheduled', badge: 'blue', icon: Calendar, grad: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` },
    upcoming:    { color: c.staff, hoverColor: c.staffHover, label: 'Upcoming', badge: 'cyan', icon: Clock, grad: `linear-gradient(135deg, ${c.staff}, #06b6d4)` },
    in_progress: { color: '#10b981', hoverColor: '#14b8a6', label: 'In Progress', badge: 'green', icon: Play, grad: 'linear-gradient(135deg, #10b981, #14b8a6)' },
    completed:   { color: c.primary, hoverColor: c.adminHover, label: 'Completed', badge: 'purple', icon: Check, grad: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})` },
  }
  const sc = statusConfig[status] || statusConfig.scheduled


  /* ─────────────────────────────────────────────
     RENDER
     ───────────────────────────────────────────── */

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>

      {/* Keyframes */}
      <style>{`
        @keyframes orbFloat { 0%,100% { transform:translateY(0) scale(1) } 50% { transform:translateY(-15px) scale(1.03) } }
        @keyframes ping { 75%,100% { transform:scale(1.8);opacity:0 } }
        @keyframes pulse-dot { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes pulse-glow { 0%,100% { box-shadow: 0 0 12px rgba(16,185,129,0.3) } 50% { box-shadow: 0 0 24px rgba(16,185,129,0.6) } }
        @keyframes countUp { from { opacity:0;transform:translateY(8px) scale(0.95) } to { opacity:1;transform:translateY(0) scale(1) } }
        .count-up { animation: countUp .7s cubic-bezier(.16,1,.3,1) forwards }
      `}</style>

      {/* Background orbs */}
      <Orb color={sc.color} size={380} top="-100px" right="-80px" delay={0} />
      <Orb color="#3b82f6" size={260} bottom="20%" left="-60px" delay={2} />
      <Orb color="#8b5cf6" size={180} top="50%" right="5%" delay={3.5} />
      <Orb color="#10b981" size={140} bottom="35%" left="40%" delay={5} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>


        {/* ══════════════════════════════════════════
            BACK BUTTON
            ══════════════════════════════════════════ */}
        <div style={stg(0)}>
          <Link to="/admin/roster" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isDark ? 'rgba(51,65,85,0.5)' : 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(12px)', border: `1px solid ${isDark ? 'rgba(51,65,85,0.4)' : 'rgba(255,255,255,0.8)'}`,
              transition: 'all .2s', cursor: 'pointer',
            }}>
              <ArrowLeft size={18} style={{ color: dk.textMuted }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: dk.textMuted }}>Back to Roster</span>
          </Link>
        </div>


        {/* ══════════════════════════════════════════
            HERO BANNER
            ══════════════════════════════════════════ */}
        <div style={stg(1)}>
          <div style={{
            borderRadius: 24, padding: '32px 28px', position: 'relative', overflow: 'hidden',
            background: sc.grad.replace('135deg', '135deg') + ', ' + sc.grad.split(',').pop().trim().replace(')', '') + ' 100%)',
            // Fallback
            backgroundImage: sc.grad,
          }}>
            {/* Decorative circles */}
            <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: -80, right: -40 }} />
            <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -50, left: '25%' }} />
            <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent)', top: 30, left: '55%', animation: 'orbFloat 8s ease-in-out infinite' }} />
            {/* Dot grid */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.5 }} />
            {/* Floating dots */}
            {[{ top: '15%', right: '20%', s: 4, d: 0 }, { top: '65%', right: '12%', s: 3, d: 1.5 }, { bottom: '20%', left: '30%', s: 5, d: 3 }].map((dot, i) => (
              <div key={i} style={{ position: 'absolute', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', width: dot.s * 2, height: dot.s * 2, top: dot.top, right: dot.right, bottom: dot.bottom, left: dot.left, animation: `orbFloat ${4 + dot.d}s ease-in-out infinite ${dot.d}s` }} />
            ))}

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Badge row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                  <Calendar size={13} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Shift Detail</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: status === 'in_progress' ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                  {status === 'in_progress' && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', animation: 'pulse-dot 2s ease-in-out infinite' }} />}
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{sc.label}</span>
                </div>
                {noteSubmitted && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.25)', backdropFilter: 'blur(8px)' }}>
                    <CheckCircle size={13} style={{ color: 'rgba(255,255,255,0.9)' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>Notes ✓</span>
                  </div>
                )}
              </div>

              {/* Title row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 20,
                    background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: status === 'in_progress' ? 'pulse-glow 3s ease-in-out infinite' : undefined,
                  }}>
                    <sc.icon size={30} color="white" />
                  </div>
                  <div>
                    <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                      {pName}
                    </h1>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                      {s.service_type || s.title || 'Shift'} · {fmtDateShort(s.shift_date)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Hero stat pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
                {[
                  { icon: Calendar, text: fmtDateShort(s.shift_date) },
                  { icon: Clock, text: `${fmtTime(s.start_time) || '—'} – ${fmtTime(s.end_time) || '—'}` },
                  { icon: MapPin, text: s.location || 'No location' },
                  { icon: User, text: wName },
                ].map((pill, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <pill.icon size={14} style={{ color: 'rgba(255,255,255,0.7)' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{pill.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>


        {/* ══════════════════════════════════════════
            ACTION BUTTONS
            ══════════════════════════════════════════ */}
        {(status === 'scheduled' || status === 'upcoming') && (
          <div style={stg(2)}>
            <button onClick={handleClockIn} style={{
              width: '100%', padding: '16px 0', borderRadius: 16, border: 'none',
              background: 'linear-gradient(135deg, #10b981, #14b8a6)',
              color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 8px 28px -6px rgba(16,185,129,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'all .2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <Play size={20} /> Clock In
            </button>
          </div>
        )}

        {status === 'in_progress' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, ...stg(2) }}>
            <button onClick={handleClockOut} style={{
              padding: '16px 0', borderRadius: 16, border: 'none',
              background: 'linear-gradient(135deg, #f97316, #ef4444)',
              color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 8px 28px -6px rgba(239,68,68,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all .2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <Square size={18} /> Clock Out
            </button>
            <button onClick={() => setShowNote(true)} style={{
              padding: '16px 0', borderRadius: 16,
              background: isDark ? 'rgba(51,65,85,0.5)' : 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(12px)',
              border: `2px solid ${c.staff}40`, color: c.staff,
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all .2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <FileText size={18} /> Add Note
            </button>
          </div>
        )}

        {status === 'completed' && !noteSubmitted && (
          <Glass dark={isDark} glow="rgba(245,158,11,0.15)" style={{ ...stg(2), padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 20px -4px rgba(245,158,11,0.4)',
                }}>
                  <AlertTriangle size={22} color="white" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>Shift Note Required</p>
                  <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>Submit within 24 hours for NDIS compliance</p>
                </div>
              </div>
              <button onClick={() => setShowNote(true)} style={{
                padding: '10px 20px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 16px -4px rgba(245,158,11,0.4)',
                flexShrink: 0, transition: 'all .2s',
              }}>
                Submit
              </button>
            </div>
          </Glass>
        )}


        {/* ══════════════════════════════════════════
            INFO CARDS GRID
            ══════════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, ...stg(3) }}>
          {[
            { icon: Calendar, label: 'Date', value: fmtDate(s.shift_date), color: c.primary, grad: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})` },
            { icon: Clock, label: 'Time', value: `${fmtTime(s.start_time) || '—'} – ${fmtTime(s.end_time) || '—'}`, color: c.staff, grad: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` },
            { icon: MapPin, label: 'Location', value: s.location || 'Not specified', color: '#ef4444', grad: 'linear-gradient(135deg, #ef4444, #f87171)',
              action: s.location ? (
                <a href={`https://maps.google.com/?q=${encodeURIComponent(s.location)}`} target="_blank" rel="noopener noreferrer"
                  style={{ width: 34, height: 34, borderRadius: 10, background: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .2s' }}>
                  <Navigation size={14} style={{ color: '#3b82f6' }} />
                </a>
              ) : null },
            { icon: User, label: 'Worker', value: wName, color: c.staff, grad: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` },
          ].map((card, i) => (
            <Glass key={i} dark={isDark} glow={`${card.color}15`} style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: card.grad, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 4px 14px -4px ${card.color}40`,
                  }}>
                    <card.icon size={18} color="white" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: dk.text, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.value}</p>
                  </div>
                </div>
                {card.action}
              </div>
            </Glass>
          ))}
        </div>


        {/* ══════════════════════════════════════════
            TIME TRACKING
            ══════════════════════════════════════════ */}
        {(s.clock_in || s.clock_out) && (
          <Glass dark={isDark} glow="rgba(16,185,129,0.12)" style={{ ...stg(4), padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <Timer size={18} style={{ color: '#10b981' }} />
              <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Time Tracking</h3>
              {status === 'in_progress' && (
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5', border: `1px solid ${isDark ? 'rgba(16,185,129,0.3)' : '#a7f3d0'}` }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse-dot 2s ease-in-out infinite' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>Live</span>
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center' }}>
              {/* Clock In */}
              <div style={{
                padding: '18px', borderRadius: 14, textAlign: 'center',
                background: isDark ? 'rgba(16,185,129,0.08)' : '#ecfdf5',
                border: `1px solid ${isDark ? 'rgba(16,185,129,0.2)' : '#a7f3d0'}`,
              }}>
                <Play size={18} style={{ color: '#10b981', margin: '0 auto 8px' }} />
                <p style={{ fontSize: 10, fontWeight: 600, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Clocked In</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: '#10b981', marginTop: 4 }}>{fmtTime(s.clock_in) || '—'}</p>
              </div>
              {/* Arrow */}
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: dk.subtleBg2, border: `1px solid ${dk.divider}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ArrowRight size={16} style={{ color: dk.textFaint }} />
              </div>
              {/* Clock Out */}
              <div style={{
                padding: '18px', borderRadius: 14, textAlign: 'center',
                background: isDark ? `rgba(124,58,237,0.08)` : '#f5f3ff',
                border: `1px solid ${isDark ? 'rgba(124,58,237,0.2)' : '#ddd6fe'}`,
              }}>
                <Square size={18} style={{ color: c.primary, margin: '0 auto 8px' }} />
                <p style={{ fontSize: 10, fontWeight: 600, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Clocked Out</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: c.primary, marginTop: 4 }}>{fmtTime(s.clock_out) || '—'}</p>
              </div>
            </div>
          </Glass>
        )}


        {/* ══════════════════════════════════════════
            SHIFT INSTRUCTIONS
            ══════════════════════════════════════════ */}
        {(s.notes || s.details) && (
          <Glass dark={isDark} glow={`${c.staff}10`} style={{ ...stg(5), padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Clipboard size={18} style={{ color: c.staff }} />
              <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Shift Instructions</h3>
            </div>
            <div style={{
              padding: '16px', borderRadius: 14,
              background: dk.subtleBg, border: `1px solid ${dk.subtleBg2}`,
            }}>
              <p style={{ fontSize: 14, color: dk.textSoft, lineHeight: 1.6 }}>{s.notes || s.details}</p>
            </div>
          </Glass>
        )}


        {/* ══════════════════════════════════════════
            PARTICIPANT INFO
            ══════════════════════════════════════════ */}
        {participant && (
          <Glass dark={isDark} glow={`${c.primary}10`} style={{ ...stg(6), padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={18} style={{ color: c.primary }} />
                <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Participant</h3>
              </div>
              <Link to={`/admin/participants/${participant.id}`} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 12, fontWeight: 700, color: c.staff, textDecoration: 'none',
              }}>
                View Profile <ChevronRight size={14} />
              </Link>
            </div>
            <div style={{
              padding: '16px 18px', borderRadius: 14,
              background: isDark ? `rgba(124,58,237,0.06)` : '#f5f3ff',
              border: `1px solid ${isDark ? 'rgba(124,58,237,0.15)' : '#ddd6fe'}`,
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 15, fontWeight: 800,
                boxShadow: `0 4px 16px -4px ${c.primary}40`, flexShrink: 0,
              }}>
                {participant.first_name?.[0]}{participant.last_name?.[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{pName}</p>
                <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>
                  NDIS: {participant.ndis_number || '—'}
                </p>
              </div>
              {participant.phone && (
                <a href={`tel:${participant.phone}`} style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: isDark ? 'rgba(51,65,85,0.5)' : 'white',
                  border: `1px solid ${dk.inputBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'all .2s',
                }}>
                  <Phone size={18} style={{ color: c.staff }} />
                </a>
              )}
            </div>
          </Glass>
        )}


        {/* ══════════════════════════════════════════
            MILEAGE
            ══════════════════════════════════════════ */}
        <Glass dark={isDark} glow="rgba(59,130,246,0.1)" style={{ ...stg(7), padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Car size={18} style={{ color: '#3b82f6' }} />
              <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Mileage</h3>
            </div>
            {status !== 'scheduled' && status !== 'upcoming' && (
              <button onClick={() => {
                setMileageForm({ start: s.mileage_start || '', end: s.mileage_end || '', purpose: s.mileage_purpose || 'Transport participant' })
                setShowMileage(true)
              }} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 12, fontWeight: 700, color: c.staff, background: 'none', border: 'none', cursor: 'pointer',
              }}>
                {mileageTotal ? 'Edit' : 'Add'} <ChevronRight size={14} />
              </button>
            )}
          </div>

          {mileageTotal ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                { label: 'Start', value: `${s.mileage_start} km`, color: dk.text, bg: dk.subtleBg, border: dk.subtleBg2 },
                { label: 'End', value: `${s.mileage_end} km`, color: dk.text, bg: dk.subtleBg, border: dk.subtleBg2 },
                { label: 'Total', value: `${mileageTotal} km`, color: '#3b82f6', bg: isDark ? 'rgba(59,130,246,0.08)' : '#eff6ff', border: isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe' },
              ].map((m, i) => (
                <div key={i} style={{
                  padding: '16px', borderRadius: 14, textAlign: 'center',
                  background: m.bg, border: `1px solid ${m.border}`,
                }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: m.color, marginTop: 6 }}>{m.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '32px 24px', borderRadius: 14, textAlign: 'center',
              background: dk.subtleBg, border: `1px dashed ${isDark ? 'rgba(51,65,85,0.4)' : '#e2e8f0'}`,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, margin: '0 auto 12px',
                background: `linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.05))`,
                border: '1px solid rgba(59,130,246,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Car size={22} style={{ color: '#3b82f6', opacity: 0.5 }} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: dk.textFaint }}>No mileage recorded</p>
            </div>
          )}

          {s.mileage_purpose && mileageTotal && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: dk.subtleBg, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={14} style={{ color: dk.textFaint }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: dk.textMuted }}>Purpose: {s.mileage_purpose}</span>
            </div>
          )}
        </Glass>

      </div>


      {/* ══════════════════════════════════════════
          SHIFT NOTE MODAL
          ══════════════════════════════════════════ */}
      <Modal isOpen={showNote} onClose={() => setShowNote(false)} title="Shift Note" wide>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Modal hero */}
          <div style={{
            margin: '-24px -24px 0 -24px', padding: '24px 28px 20px',
            background: `linear-gradient(135deg, ${c.staff} 0%, ${c.staffHover} 50%, #3b82f6 100%)`,
            position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0',
          }}>
            <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -40, right: -20 }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={26} color="white" />
              </div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>Shift Note</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Complete all sections for NDIS compliance</p>
              </div>
            </div>
          </div>

          {/* Compliance info */}
          <div style={{
            padding: '12px 16px', borderRadius: 12,
            background: isDark ? 'rgba(59,130,246,0.08)' : '#eff6ff',
            border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe'}`,
            fontSize: 12, fontWeight: 600, color: isDark ? '#60a5fa' : '#2563eb',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Shield size={14} /> All sections are required for NDIS compliance documentation.
          </div>

          {/* Note fields */}
          {[
            { key: 'mood', label: "Participant's mood today", icon: Star, placeholder: 'Describe mood and wellbeing...' },
            { key: 'activities', label: 'Activities completed', icon: Activity, placeholder: 'List activities and tasks...' },
            { key: 'goals_progress', label: 'Progress toward goals', icon: TrendingUp, placeholder: 'Note any progress observed...' },
            { key: 'concerns', label: 'Concerns or incidents', icon: AlertTriangle, placeholder: 'Document any issues...' },
            { key: 'recommendations', label: 'Recommendations for next shift', icon: MessageSquare, placeholder: 'Handover notes...' },
          ].map(field => (
            <div key={field.key}>
              <p style={{
                fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <field.icon size={11} /> {field.label}
              </p>
              <textarea
                value={noteForm[field.key]}
                onChange={e => setNoteForm({ ...noteForm, [field.key]: e.target.value })}
                rows={2}
                placeholder={field.placeholder}
                style={{
                  width: '100%', padding: '12px 14px', background: dk.inputBg,
                  border: `1.5px solid ${dk.inputBorder}`, borderRadius: 12,
                  fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none',
                  resize: 'vertical', fontFamily: 'inherit', transition: 'all .2s',
                }}
                onFocus={e => e.target.style.borderColor = c.staff}
                onBlur={e => e.target.style.borderColor = dk.inputBorder}
              />
            </div>
          ))}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 12, borderTop: `1px solid ${dk.divider}`, paddingTop: 16 }}>
            <button onClick={() => setShowNote(false)} style={{
              flex: 1, padding: '15px 0', borderRadius: 14,
              background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9',
              border: `1px solid ${dk.inputBorder}`, color: dk.textMuted,
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>Cancel</button>
            <button onClick={handleSubmitNote} style={{
              flex: 2, padding: '15px 0', borderRadius: 14, border: 'none',
              background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`,
              color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: `0 8px 28px -6px ${c.staff}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <CheckCircle size={16} /> Submit Note
            </button>
          </div>
        </div>
      </Modal>


      {/* ══════════════════════════════════════════
          MILEAGE MODAL
          ══════════════════════════════════════════ */}
      <Modal isOpen={showMileage} onClose={() => setShowMileage(false)} title="Record Mileage">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Modal hero */}
          <div style={{
            margin: '-24px -24px 0 -24px', padding: '24px 28px 20px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #06b6d4 100%)',
            position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0',
          }}>
            <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -30, right: -10 }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Car size={24} color="white" />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>Record Mileage</h3>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Track vehicle kilometres for this shift</p>
              </div>
            </div>
          </div>

          {/* Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Start (km)', key: 'start', icon: Gauge },
              { label: 'End (km)', key: 'end', icon: Gauge },
            ].map(f => (
              <div key={f.key}>
                <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <f.icon size={11} /> {f.label}
                </p>
                <input
                  type="number"
                  value={mileageForm[f.key]}
                  onChange={e => setMileageForm({ ...mileageForm, [f.key]: e.target.value })}
                  style={{
                    width: '100%', padding: '12px 14px', background: dk.inputBg,
                    border: `1.5px solid ${dk.inputBorder}`, borderRadius: 12,
                    fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none',
                    transition: 'all .2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#3b82f6'}
                  onBlur={e => e.target.style.borderColor = dk.inputBorder}
                />
              </div>
            ))}
          </div>

          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}>
              <MapPin size={11} /> Purpose
            </p>
            <select
              value={mileageForm.purpose}
              onChange={e => setMileageForm({ ...mileageForm, purpose: e.target.value })}
              style={{
                width: '100%', padding: '12px 14px', background: dk.inputBg,
                border: `1.5px solid ${dk.inputBorder}`, borderRadius: 12,
                fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none', cursor: 'pointer',
              }}
            >
              <option>Transport participant</option>
              <option>Community access</option>
              <option>Shopping/errands</option>
              <option>Other</option>
            </select>
          </div>

          {/* Preview */}
          {mileageForm.start && mileageForm.end && Number(mileageForm.end) > Number(mileageForm.start) && (
            <div style={{
              padding: '12px 16px', borderRadius: 12,
              background: isDark ? 'rgba(59,130,246,0.08)' : '#eff6ff',
              border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#60a5fa' : '#2563eb' }}>Estimated Distance</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: isDark ? '#60a5fa' : '#2563eb' }}>
                {Number(mileageForm.end) - Number(mileageForm.start)} km
              </span>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 12, borderTop: `1px solid ${dk.divider}`, paddingTop: 16 }}>
            <button onClick={() => setShowMileage(false)} style={{
              flex: 1, padding: '15px 0', borderRadius: 14,
              background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9',
              border: `1px solid ${dk.inputBorder}`, color: dk.textMuted,
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>Cancel</button>
            <button onClick={handleSaveMileage} style={{
              flex: 2, padding: '15px 0', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 8px 28px -6px rgba(59,130,246,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Check size={16} /> Save Mileage
            </button>
          </div>
        </div>
      </Modal>

    </div>
  )
}