import { useState, useEffect, useRef } from 'react'
import {
  ArrowLeftRight, Loader2, CheckCircle, XCircle, Clock, User, Calendar,
  AlertTriangle, Search, ChevronDown, Filter, ChevronRight, Plus, Trash2,
  Shield, Activity, BarChart3, TrendingUp, Zap, RefreshCw, MessageSquare,
  MapPin, Users, FileText, ArrowRight, Eye, Hash
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { supabase } from '../lib/supabase'
import { useBrandColors } from '../hooks/useBrandColors'
import { useTheme } from '../context/ThemeContext'
import Modal from '../components/ui/Modal'


/* ─────────────────────────────────────────────
   DESIGN SYSTEM COMPONENTS
   ───────────────────────────────────────────── */

function Glass({ children, className = '', dark, glow, hover, style, ...p }) {
  const base = dark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.55)'
  const border = dark ? 'rgba(51,65,85,0.4)' : 'rgba(255,255,255,0.7)'
  return (
    <div
      className={className}
      style={{
        background: base,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${border}`,
        borderRadius: '1.25rem',
        boxShadow: glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)',
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
    >{children}</div>
  )
}

function Orb({ color, size = 200, top, left, right, bottom, delay = 0 }) {
  return (
    <div style={{
      position: 'absolute', width: size, height: size,
      top, left, right, bottom,
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      opacity: 0.12, borderRadius: '50%',
      animation: `orbFloat ${6 + delay}s ease-in-out ${delay}s infinite`,
      pointerEvents: 'none', zIndex: 0,
    }} />
  )
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
    gray:   dark ? { bg: 'rgba(100,116,139,0.2)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)' }
                 : { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
    green:  dark ? { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' }
                 : { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
    amber:  dark ? { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' }
                 : { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    red:    dark ? { bg: 'rgba(239,68,68,0.15)', text: '#f87171', border: 'rgba(239,68,68,0.3)' }
                 : { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    blue:   dark ? { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' }
                 : { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    purple: dark ? { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa', border: 'rgba(139,92,246,0.3)' }
                 : { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
    teal:   dark ? { bg: 'rgba(20,184,166,0.15)', text: '#2dd4bf', border: 'rgba(20,184,166,0.3)' }
                 : { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
    orange: dark ? { bg: 'rgba(249,115,22,0.15)', text: '#fb923c', border: 'rgba(249,115,22,0.3)' }
                 : { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
  }
  const p = palettes[color] || palettes.gray
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
      background: p.bg, color: p.text, border: `1px solid ${p.border}`,
      letterSpacing: '0.01em', whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}


/* ─────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────── */

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

function formatTime(t) {
  if (!t) return ''
  try {
    if (t.includes('T')) return new Date(t).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
    return t.slice(0, 5)
  } catch { return t }
}


/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

export default function ShiftSwaps() {
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [swaps, setSwaps] = useState([])
  const [filter, setFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [showDetail, setShowDetail] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  /* ── Dark mode color system ── */
  const dk = {
    text:        isDark ? '#e2e8f0' : '#1f2937',
    textSoft:    isDark ? '#cbd5e1' : '#374151',
    textMuted:   isDark ? '#94a3b8' : '#6b7280',
    textFaint:   isDark ? '#64748b' : '#9ca3af',
    inputBg:     isDark ? 'rgba(30,41,59,0.8)' : 'white',
    inputBorder: isDark ? 'rgba(51,65,85,0.5)' : '#e5e7eb',
    divider:     isDark ? 'rgba(51,65,85,0.3)' : 'rgba(0,0,0,0.05)',
    subtleBg:    isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    subtleBg2:   isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
  }

  /* ── Stagger helper ── */
  const stg = (i) => ({
    transitionDelay: `${i * 50}ms`,
    opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(14px)',
    transition: 'all .6s cubic-bezier(.16,1,.3,1)',
  })

  /* ── Chart tooltip ── */
  const CT = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{
        background: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(20px)', borderRadius: 16,
        border: `1px solid ${isDark ? 'rgba(51,65,85,0.6)' : 'rgba(0,0,0,0.08)'}`,
        padding: '14px 18px',
        boxShadow: isDark ? '0 16px 40px -8px rgba(0,0,0,0.5)' : '0 16px 40px -8px rgba(0,0,0,0.12)',
      }}>
        <p style={{ fontWeight: 800, fontSize: 13, color: dk.text, marginBottom: 8,
          paddingBottom: 6, borderBottom: `1px solid ${isDark ? 'rgba(51,65,85,0.4)' : 'rgba(0,0,0,0.06)'}` }}>
          {label}
        </p>
        {payload.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: i > 0 ? 6 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 3, background: p.color }} />
              <span style={{ fontSize: 12, color: dk.textMuted }}>{p.name}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: dk.text }}>{p.value}</span>
          </div>
        ))}
      </div>
    )
  }


  /* ═══════════════════════════════════════════════
     ALL BACKEND — 100% PRESERVED
     ═══════════════════════════════════════════════ */

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('shift_swaps')
        .select('*, shift:shift_id(id, shift_date, start_time, end_time, location, participants(first_name, last_name)), requester:requester_id(first_name, last_name), target:target_staff_id(first_name, last_name), approver:approved_by(first_name, last_name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      setSwaps(data || [])
    } catch (err) {
      console.error('Shift swaps load error:', err)
    } finally {
      setLoading(false)
      setTimeout(() => setLoaded(true), 50)
    }
  }

  const handleApprove = async (id) => {
    try {
      const swap = swaps.find(s => s.id === id)
      if (!swap) return
      const { error: swapErr } = await supabase
        .from('shift_swaps')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', id)
      if (swapErr) throw swapErr
      if (swap.target_staff_id && swap.shift_id) {
        await supabase.from('shifts').update({ staff_id: swap.target_staff_id }).eq('id', swap.shift_id)
      }
      setSwaps(swaps.map(s => s.id === id ? { ...s, status: 'approved', approved_at: new Date().toISOString() } : s))
      setShowDetail(null)
    } catch (err) {
      alert('Failed to approve: ' + (err.message || 'Unknown error'))
    }
  }

  const handleReject = async (id, reason = '') => {
    try {
      const { error } = await supabase
        .from('shift_swaps')
        .update({ status: 'rejected', admin_notes: reason })
        .eq('id', id)
      if (error) throw error
      setSwaps(swaps.map(s => s.id === id ? { ...s, status: 'rejected', admin_notes: reason } : s))
      setShowDetail(null)
      setRejectReason('')
    } catch (err) {
      alert('Failed to reject: ' + (err.message || 'Unknown error'))
    }
  }

  /* ── Computed ── */
  const pendingCount = swaps.filter(s => s.status === 'pending').length
  const approvedCount = swaps.filter(s => s.status === 'approved').length
  const rejectedCount = swaps.filter(s => s.status === 'rejected').length

  const filtered = swaps.filter(s => {
    if (filter !== 'all' && s.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      const reqName = s.requester ? `${s.requester.first_name} ${s.requester.last_name}`.toLowerCase() : ''
      const tarName = s.target ? `${s.target.first_name} ${s.target.last_name}`.toLowerCase() : ''
      return reqName.includes(q) || tarName.includes(q)
    }
    return true
  })

  /* ── Pie data ── */
  const statusPie = [
    { name: 'Pending', value: pendingCount, color: '#f59e0b' },
    { name: 'Approved', value: approvedCount, color: '#10b981' },
    { name: 'Rejected', value: rejectedCount, color: '#ef4444' },
  ].filter(s => s.value > 0)

  const statusColorMap = { pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444' }
  const statusGradMap = {
    pending: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    approved: 'linear-gradient(135deg, #10b981, #34d399)',
    rejected: 'linear-gradient(135deg, #ef4444, #f87171)',
  }


  /* ─────────────────────────────────────────────
     LOADING STATE
     ───────────────────────────────────────────── */

  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '60vh', gap: 16,
      }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 22,
            background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 40px ${c.primary}40`,
          }}>
            <ArrowLeftRight size={32} color="white" />
          </div>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 22,
            background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`,
            animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.3,
          }} />
        </div>
        <p style={{ color: dk.textMuted, fontSize: 14, fontWeight: 600 }}>Loading shift swaps...</p>
      </div>
    )
  }


  /* ─────────────────────────────────────────────
     RENDER
     ───────────────────────────────────────────── */

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>

      {/* Keyframes */}
      <style>{`
        @keyframes orbFloat { 0%,100% { transform:translateY(0) scale(1) } 50% { transform:translateY(-15px) scale(1.03) } }
        @keyframes ping { 75%,100% { transform:scale(1.8);opacity:0 } }
        @keyframes shimmer { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }
        @keyframes pulse-dot { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes countUp { from { opacity:0;transform:translateY(8px) scale(0.95) } to { opacity:1;transform:translateY(0) scale(1) } }
        .count-up { animation: countUp .7s cubic-bezier(.16,1,.3,1) forwards }
      `}</style>

      {/* Background orbs */}
      <Orb color={c.primary} size={380} top="-100px" right="-80px" delay={0} />
      <Orb color="#f59e0b" size={280} bottom="15%" left="-60px" delay={2} />
      <Orb color="#10b981" size={200} top="45%" right="8%" delay={3.5} />
      <Orb color="#3b82f6" size={160} bottom="30%" left="40%" delay={5} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>


        {/* ══════════════════════════════════════════
            HERO BANNER
            ══════════════════════════════════════════ */}
        <div style={stg(0)}>
          <div style={{
            borderRadius: 24, padding: '32px 28px', position: 'relative', overflow: 'hidden',
            background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 40%, #3b82f6 70%, #06b6d4 100%)`,
          }}>
            {/* Decorative circles */}
            <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: -80, right: -40 }} />
            <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -50, left: '25%' }} />
            <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent)',
              top: 30, left: '55%', animation: 'orbFloat 8s ease-in-out infinite',
            }} />
            {/* Dot grid */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '24px 24px', opacity: 0.5,
            }} />
            {/* Floating dots */}
            {[
              { top: '15%', right: '20%', s: 4, d: 0 },
              { top: '60%', right: '10%', s: 3, d: 1.5 },
              { bottom: '25%', left: '35%', s: 5, d: 3 },
            ].map((dot, i) => (
              <div key={i} style={{
                position: 'absolute', borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
                width: dot.s * 2, height: dot.s * 2, top: dot.top, right: dot.right,
                bottom: dot.bottom, left: dot.left,
                animation: `orbFloat ${4 + dot.d}s ease-in-out infinite ${dot.d}s`,
              }} />
            ))}

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Badge row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 999,
                  background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                }}>
                  <ArrowLeftRight size={13} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Shift Management</span>
                </div>
                {pendingCount > 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px', borderRadius: 999,
                    background: 'rgba(245,158,11,0.35)', backdropFilter: 'blur(8px)',
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', animation: 'pulse-dot 2s ease-in-out infinite' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{pendingCount} awaiting</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h1 style={{ fontSize: 32, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                    Shift Swaps
                  </h1>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
                    Review and manage staff shift swap requests
                  </p>
                </div>
                <button
                  onClick={loadData}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 22px', borderRadius: 16, border: 'none',
                    background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
                    color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    transition: 'all .2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                >
                  <RefreshCw size={16} /> Refresh
                </button>
              </div>

              {/* Hero stat pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
                {[
                  { icon: Activity, text: `${swaps.length} total requests` },
                  { icon: Clock, text: `${pendingCount} pending`, bg: pendingCount > 0 ? 'rgba(245,158,11,0.35)' : undefined },
                  { icon: CheckCircle, text: `${approvedCount} approved`, bg: 'rgba(16,185,129,0.25)' },
                  { icon: XCircle, text: `${rejectedCount} rejected` },
                ].map((pill, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 12,
                    background: pill.bg || 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    <pill.icon size={14} style={{ color: 'rgba(255,255,255,0.8)' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{pill.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>


        {/* ══════════════════════════════════════════
            PENDING ALERT
            ══════════════════════════════════════════ */}
        {pendingCount > 0 && (
          <Glass dark={isDark} glow="rgba(245,158,11,0.15)" style={{ ...stg(1), padding: '16px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 20px -4px rgba(245,158,11,0.4)',
              }}>
                <Clock size={22} color="white" />
              </div>
              <div>
                <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>Approval Required</p>
                <p style={{ fontSize: 13, color: dk.textMuted, marginTop: 2 }}>
                  {pendingCount} swap request{pendingCount > 1 ? 's' : ''} awaiting your review
                </p>
              </div>
            </div>
          </Glass>
        )}


        {/* ══════════════════════════════════════════
            STAT CARDS
            ══════════════════════════════════════════ */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
          gap: 14, ...stg(2),
        }}>
          {[
            { icon: Activity, label: 'Total Requests', value: swaps.length,
              grad: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, glow: `${c.primary}35` },
            { icon: Clock, label: 'Pending', value: pendingCount,
              grad: 'linear-gradient(135deg, #f59e0b, #fbbf24)', glow: 'rgba(245,158,11,0.2)' },
            { icon: CheckCircle, label: 'Approved', value: approvedCount,
              grad: 'linear-gradient(135deg, #10b981, #34d399)', glow: 'rgba(16,185,129,0.2)' },
            { icon: XCircle, label: 'Rejected', value: rejectedCount,
              grad: 'linear-gradient(135deg, #ef4444, #f87171)', glow: 'rgba(239,68,68,0.2)' },
          ].map((card, i) => (
            <Glass key={i} dark={isDark} hover glow={card.glow} style={{ padding: '18px 20px' }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, background: card.grad,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 6px 20px -4px ${card.glow}`, marginBottom: 12,
              }}>
                <card.icon size={20} color="white" />
              </div>
              <p style={{ fontSize: 24, fontWeight: 800, color: dk.text, lineHeight: 1 }} className="count-up">
                <AnimNum value={card.value} />
              </p>
              <p style={{ fontSize: 11, fontWeight: 600, color: dk.textFaint, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {card.label}
              </p>
            </Glass>
          ))}
        </div>


        {/* ══════════════════════════════════════════
            TAB FILTER + SEARCH BAR
            ══════════════════════════════════════════ */}
        <Glass dark={isDark} style={{ padding: 6, ...stg(3) }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { key: 'pending', icon: Clock, label: 'Pending', count: pendingCount },
              { key: 'approved', icon: CheckCircle, label: 'Approved', count: approvedCount },
              { key: 'rejected', icon: XCircle, label: 'Rejected', count: rejectedCount },
              { key: 'all', icon: Activity, label: 'All', count: swaps.length },
            ].map(t => {
              const isActive = filter === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 20px', borderRadius: 14, border: 'none',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    flex: '1 1 auto', justifyContent: 'center',
                    transition: 'all .25s cubic-bezier(.16,1,.3,1)',
                    background: isActive
                      ? `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`
                      : 'transparent',
                    color: isActive ? 'white' : dk.textMuted,
                    boxShadow: isActive ? `0 4px 16px -4px ${c.primary}60` : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.background = isDark ? 'rgba(51,65,85,0.4)' : 'rgba(0,0,0,0.04)'
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <t.icon size={16} />
                  {t.label}
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 8,
                    background: isActive ? 'rgba(255,255,255,0.2)' : dk.subtleBg2,
                    color: isActive ? 'rgba(255,255,255,0.9)' : dk.textFaint,
                  }}>
                    {t.count}
                  </span>
                </button>
              )
            })}
          </div>
        </Glass>

        {/* Search bar */}
        <Glass dark={isDark} style={{ ...stg(4), padding: '12px 18px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by staff name..."
              style={{
                width: '100%', padding: '11px 14px 11px 40px',
                background: dk.inputBg, border: `1px solid ${dk.inputBorder}`,
                borderRadius: 12, fontSize: 14, color: dk.text, outline: 'none',
                transition: 'border-color .2s',
              }}
              onFocus={e => e.target.style.borderColor = c.primary}
              onBlur={e => e.target.style.borderColor = dk.inputBorder}
            />
          </div>
        </Glass>


        {/* ══════════════════════════════════════════
            SWAP REQUEST CARDS
            ══════════════════════════════════════════ */}
        {filtered.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((swap, i) => {
              const shift = swap.shift
              const pName = shift?.participants ? `${shift.participants.first_name} ${shift.participants.last_name}` : '—'
              const requester = swap.requester ? `${swap.requester.first_name} ${swap.requester.last_name}` : 'Unknown'
              const target = swap.target ? `${swap.target.first_name} ${swap.target.last_name}` : 'Open'
              const sc = statusColorMap[swap.status] || '#94a3b8'
              const sg = statusGradMap[swap.status] || 'linear-gradient(135deg, #94a3b8, #cbd5e1)'

              return (
                <Glass
                  key={swap.id}
                  dark={isDark}
                  hover
                  glow={`${sc}15`}
                  style={{ ...stg(i + 5), padding: '18px 22px', cursor: 'pointer' }}
                  onClick={() => setShowDetail(swap)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                      {/* Color accent bar */}
                      <div style={{
                        width: 4, height: 52, borderRadius: 4, flexShrink: 0,
                        background: `linear-gradient(to bottom, ${sc}, ${sc}60)`,
                      }} />
                      {/* Icon */}
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        background: sg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 4px 16px -4px ${sc}50`,
                      }}>
                        <ArrowLeftRight size={20} color="white" />
                      </div>
                      {/* Content */}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{requester}</p>
                          <ArrowRight size={14} style={{ color: dk.textFaint, flexShrink: 0 }} />
                          <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{target}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: dk.textMuted }}>
                            <User size={11} /> {pName}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: dk.textFaint }}>
                            <Calendar size={11} /> {formatDate(shift?.shift_date)}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: dk.textFaint }}>
                            <Clock size={10} /> {formatTime(shift?.start_time)} – {formatTime(shift?.end_time)}
                          </span>
                          {shift?.location && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: dk.textFaint }}>
                              <MapPin size={10} /> {shift.location}
                            </span>
                          )}
                        </div>
                        {swap.reason && (
                          <p style={{ fontSize: 11, color: dk.textFaint, marginTop: 4, fontStyle: 'italic' }}>
                            "{swap.reason}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <Badge color={{ pending: 'amber', approved: 'green', rejected: 'red' }[swap.status] || 'gray'} dark={isDark}>
                        {swap.status === 'pending' && (
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', display: 'inline-block', marginRight: 3, animation: 'pulse-dot 2s ease-in-out infinite' }} />
                        )}
                        {swap.status.charAt(0).toUpperCase() + swap.status.slice(1)}
                      </Badge>
                      <ChevronRight size={16} style={{ color: dk.textFaint }} />
                    </div>
                  </div>
                </Glass>
              )
            })}
          </div>
        ) : (
          <Glass dark={isDark} style={{ ...stg(5), padding: '56px 24px', textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px',
              background: `linear-gradient(135deg, ${c.primary}15, ${c.primary}05)`,
              border: `1px solid ${c.primary}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ArrowLeftRight size={32} style={{ color: c.primary }} />
            </div>
            <p style={{ color: dk.textMuted, fontWeight: 600, fontSize: 16 }}>
              {search ? 'No swap requests found' : 'No swap requests'}
            </p>
            <p style={{ color: dk.textFaint, fontSize: 13, marginTop: 4 }}>
              {search ? 'Try adjusting your search' : 'Swap requests from staff will appear here'}
            </p>
          </Glass>
        )}


        {/* ══════════════════════════════════════════
            INSIGHTS SECTION
            ══════════════════════════════════════════ */}
        {swaps.length > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16, ...stg(6),
          }}>

            {/* Status Breakdown Pie */}
            <Glass dark={isDark} glow={`${c.primary}10`} style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <BarChart3 size={18} style={{ color: c.primary }} />
                <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Status Breakdown</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie data={statusPie} dataKey="value" cx="50%" cy="50%"
                      innerRadius={35} outerRadius={55} paddingAngle={3} stroke="none">
                      {statusPie.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CT />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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

            {/* Approval Rate */}
            <Glass dark={isDark} glow="rgba(16,185,129,0.1)" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginBottom: 20 }}>
                <TrendingUp size={18} style={{ color: '#10b981' }} />
                <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Approval Rate</h3>
              </div>
              {(() => {
                const resolved = approvedCount + rejectedCount
                const rate = resolved > 0 ? Math.round((approvedCount / resolved) * 100) : 0
                const r = 46, circ = 2 * Math.PI * r, off = circ - (rate / 100) * circ
                const col = rate >= 70 ? '#10b981' : rate >= 40 ? '#f59e0b' : '#ef4444'
                return (
                  <>
                    <div style={{ position: 'relative', width: 110, height: 110 }}>
                      <svg width={110} height={110} style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx={55} cy={55} r={r} fill="none"
                          stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'} strokeWidth="8" />
                        <circle cx={55} cy={55} r={r} fill="none" stroke={col}
                          strokeWidth="8" strokeLinecap="round"
                          strokeDasharray={circ} strokeDashoffset={off}
                          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 4px ${col}40)` }} />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 24, fontWeight: 900, color: col }}>{rate}%</span>
                        <span style={{ fontSize: 9, fontWeight: 600, color: dk.textFaint, textTransform: 'uppercase' }}>approved</span>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, marginTop: 16, color: dk.textMuted, textAlign: 'center' }}>
                      {resolved > 0 ? `${approvedCount} of ${resolved} resolved requests` : 'No resolved requests yet'}
                    </p>
                  </>
                )
              })()}
            </Glass>

            {/* Quick Stats */}
            <Glass dark={isDark} glow="rgba(59,130,246,0.1)" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <Zap size={18} style={{ color: '#3b82f6' }} />
                <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Quick Stats</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Avg. Response Time', value: pendingCount > 0 ? 'Action needed' : 'All reviewed', color: pendingCount > 0 ? '#f59e0b' : '#10b981' },
                  { label: 'Most Active Swapper', value: (() => {
                    const counts = {}
                    swaps.forEach(s => {
                      if (s.requester) {
                        const name = `${s.requester.first_name} ${s.requester.last_name}`
                        counts[name] = (counts[name] || 0) + 1
                      }
                    })
                    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
                    return top ? `${top[0]} (${top[1]})` : '—'
                  })(), color: '#3b82f6' },
                  { label: 'Open Requests', value: `${pendingCount} pending`, color: '#f59e0b' },
                ].map((stat, i) => (
                  <div key={i} style={{
                    padding: '12px 16px', borderRadius: 12,
                    background: dk.subtleBg, border: `1px solid ${dk.subtleBg2}`,
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {stat.label}
                    </p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: stat.color, marginTop: 4 }}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </Glass>
          </div>
        )}

      </div>


      {/* ══════════════════════════════════════════
          SWAP DETAIL MODAL
          ══════════════════════════════════════════ */}
      <Modal isOpen={!!showDetail} onClose={() => { setShowDetail(null); setRejectReason('') }} title="Swap Request Details" wide>
        {showDetail && (() => {
          const sc = statusColorMap[showDetail.status] || '#94a3b8'
          const sg = statusGradMap[showDetail.status] || 'linear-gradient(135deg, #94a3b8, #cbd5e1)'

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Modal hero */}
              <div style={{
                margin: '-24px -24px 0 -24px', padding: '24px 28px 20px',
                background: sg, position: 'relative', overflow: 'hidden',
                borderRadius: '16px 16px 0 0',
              }}>
                <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -40, right: -20 }} />
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }} />
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ArrowLeftRight size={26} color="white" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>Swap Request</h3>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                      {showDetail.status.charAt(0).toUpperCase() + showDetail.status.slice(1)}
                    </p>
                  </div>
                </div>
              </div>

              {/* From / To cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center' }}>
                <div style={{
                  padding: '16px', borderRadius: 14,
                  background: isDark ? 'rgba(249,115,22,0.08)' : '#fff7ed',
                  border: `1px solid ${isDark ? 'rgba(249,115,22,0.2)' : '#fed7aa'}`,
                }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>From</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: dk.text }}>
                    {showDetail.requester ? `${showDetail.requester.first_name} ${showDetail.requester.last_name}` : 'Unknown'}
                  </p>
                </div>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `linear-gradient(135deg, ${c.primary}20, ${c.primary}08)`,
                  border: `1px solid ${c.primary}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ArrowRight size={16} style={{ color: c.primary }} />
                </div>
                <div style={{
                  padding: '16px', borderRadius: 14,
                  background: isDark ? 'rgba(20,184,166,0.08)' : '#f0fdfa',
                  border: `1px solid ${isDark ? 'rgba(20,184,166,0.2)' : '#99f6e4'}`,
                }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>To</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: dk.text }}>
                    {showDetail.target ? `${showDetail.target.first_name} ${showDetail.target.last_name}` : 'Open'}
                  </p>
                </div>
              </div>

              {/* Shift details */}
              {showDetail.shift && (
                <div style={{
                  padding: '16px', borderRadius: 14,
                  background: dk.subtleBg, border: `1px solid ${dk.subtleBg2}`,
                }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Shift Details</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: dk.text }}>
                      <Calendar size={14} style={{ color: dk.textMuted }} /> {formatDate(showDetail.shift.shift_date)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: dk.text }}>
                      <Clock size={14} style={{ color: dk.textMuted }} /> {formatTime(showDetail.shift.start_time)} – {formatTime(showDetail.shift.end_time)}
                    </span>
                    {showDetail.shift.participants && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: dk.text }}>
                        <User size={14} style={{ color: dk.textMuted }} /> {showDetail.shift.participants.first_name} {showDetail.shift.participants.last_name}
                      </span>
                    )}
                    {showDetail.shift.location && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: dk.text }}>
                        <MapPin size={14} style={{ color: dk.textMuted }} /> {showDetail.shift.location}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Reason */}
              {showDetail.reason && (
                <div style={{
                  padding: '16px', borderRadius: 14,
                  background: dk.subtleBg, border: `1px solid ${dk.subtleBg2}`,
                }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Reason</p>
                  <p style={{ fontSize: 14, color: dk.textSoft, lineHeight: 1.5 }}>{showDetail.reason}</p>
                </div>
              )}

              {/* Admin notes */}
              {showDetail.admin_notes && (
                <div style={{
                  padding: '16px', borderRadius: 14,
                  background: isDark ? 'rgba(139,92,246,0.06)' : '#f5f3ff',
                  border: `1px solid ${isDark ? 'rgba(139,92,246,0.2)' : '#ddd6fe'}`,
                }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Admin Notes</p>
                  <p style={{ fontSize: 14, color: dk.textSoft, lineHeight: 1.5 }}>{showDetail.admin_notes}</p>
                </div>
              )}

              {/* Actions for pending */}
              {showDetail.status === 'pending' && (
                <>
                  {/* Reject reason input */}
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Rejection Reason (optional)
                    </p>
                    <input
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Add a reason if rejecting..."
                      style={{
                        width: '100%', padding: '12px 14px', background: dk.inputBg,
                        border: `1.5px solid ${dk.inputBorder}`, borderRadius: 12,
                        fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none',
                        transition: 'all .2s',
                      }}
                      onFocus={e => e.target.style.borderColor = c.primary}
                      onBlur={e => e.target.style.borderColor = dk.inputBorder}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      onClick={() => handleApprove(showDetail.id)}
                      style={{
                        flex: 1, padding: '15px 0', borderRadius: 14, border: 'none',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                        boxShadow: '0 6px 24px -6px rgba(16,185,129,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        transition: 'all .2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(showDetail.id, rejectReason)}
                      style={{
                        flex: 1, padding: '15px 0', borderRadius: 14,
                        background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
                        border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : '#fecaca'}`,
                        color: '#ef4444', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        transition: 'all .2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </>
              )}

              {/* Close */}
              <button
                onClick={() => { setShowDetail(null); setRejectReason('') }}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 14,
                  background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9',
                  border: `1px solid ${dk.inputBorder}`,
                  color: dk.textMuted, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          )
        })()}
      </Modal>

    </div>
  )
}