import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeftRight, Loader2, Plus, Clock, CheckCircle, XCircle, Calendar,
  MapPin, Search, X, Filter, AlertTriangle, Eye, ChevronRight, Shield,
  ArrowRight, MessageSquare
} from 'lucide-react'
import { useStaff } from '../../context/StaffContext'
import { useBrandColors } from '../../hooks/useBrandColors'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'
import Modal from '../../components/ui/Modal'

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */
function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso), today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}
function formatTime(t) {
  if (!t) return ''
  try { return t.includes('T') ? new Date(t).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }) : t.slice(0, 5) } catch { return t }
}
function timeAgo(iso) {
  if (!iso) return ''
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

/* ═══════════════════════════════════════════════
   DESIGN SYSTEM
   ═══════════════════════════════════════════════ */
function Glass({ children, className = '', glow, style = {}, hover = false, isDark = false, onClick, ...p }) {
  const base = isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.55)'
  const border = isDark ? 'rgba(51,65,85,0.4)' : 'rgba(255,255,255,0.7)'
  return (
    <div className={className} onClick={onClick}
      style={{ background: base, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${border}`, borderRadius: '1.25rem', boxShadow: glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)', transition: hover ? 'all .3s cubic-bezier(.16,1,.3,1)' : undefined, cursor: hover || onClick ? 'pointer' : undefined, ...style }}
      onMouseEnter={hover ? e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = glow ? `0 16px 48px -8px ${glow}` : '0 12px 40px -8px rgba(0,0,0,0.12)' } : undefined}
      onMouseLeave={hover ? e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)' } : undefined}
      {...p}>{children}</div>
  )
}
function Orb({ color, size = 200, top, left, right, bottom, delay = 0 }) {
  return <div style={{ position: 'absolute', width: size, height: size, top, left, right, bottom, background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, opacity: 0.12, borderRadius: '50%', animation: `orbFloat ${6 + delay}s ease-in-out ${delay}s infinite`, pointerEvents: 'none', zIndex: 0 }} />
}
function AnimNum({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0); const frameRef = useRef()
  useEffect(() => { const num = typeof value === 'number' ? value : parseInt(value) || 0; const start = performance.now(); function tick(now) { const p = Math.min((now - start) / duration, 1); setDisplay(Math.round(num * (1 - Math.pow(1 - p, 3)))); if (p < 1) frameRef.current = requestAnimationFrame(tick) } frameRef.current = requestAnimationFrame(tick); return () => cancelAnimationFrame(frameRef.current) }, [value, duration])
  return <>{display}</>
}
function Badge({ children, color = 'gray', isDark }) {
  const palettes = {
    gray: isDark ? { bg: 'rgba(100,116,139,0.2)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)' } : { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
    green: isDark ? { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' } : { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
    amber: isDark ? { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' } : { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    red: isDark ? { bg: 'rgba(239,68,68,0.15)', text: '#f87171', border: 'rgba(239,68,68,0.3)' } : { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    blue: isDark ? { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' } : { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    purple: isDark ? { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa', border: 'rgba(139,92,246,0.3)' } : { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
    orange: isDark ? { bg: 'rgba(249,115,22,0.15)', text: '#fb923c', border: 'rgba(249,115,22,0.3)' } : { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
    teal: isDark ? { bg: 'rgba(20,184,166,0.15)', text: '#2dd4bf', border: 'rgba(20,184,166,0.3)' } : { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
  }
  const pl = palettes[color] || palettes.gray
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '0.02em', borderRadius: 999, background: pl.bg, color: pl.text, border: `1px solid ${pl.border}`, whiteSpace: 'nowrap' }}>{children}</span>
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function StaffShiftSwaps() {
  const navigate = useNavigate()
  const { myShifts, staffProfile } = useStaff()
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [swaps, setSwaps] = useState([])
  const [otherStaff, setOtherStaff] = useState([])
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newSwap, setNewSwap] = useState({ shift_id: '', target_staff_id: '', reason: '' })
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewSwap, setViewSwap] = useState(null)

  useEffect(() => { const t = setTimeout(() => setLoaded(true), 80); return () => clearTimeout(t) }, [])

  const dk = {
    text: isDark ? '#e2e8f0' : '#1f2937', textSoft: isDark ? '#cbd5e1' : '#374151',
    textMuted: isDark ? '#94a3b8' : '#6b7280', textFaint: isDark ? '#64748b' : '#9ca3af',
    subtleBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    subtleBg2: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    inputBg: isDark ? 'rgba(30,41,59,0.8)' : 'white',
    inputBorder: isDark ? 'rgba(51,65,85,0.5)' : '#e5e7eb',
    divider: isDark ? 'rgba(51,65,85,0.3)' : 'rgba(0,0,0,0.05)',
  }
  const stg = (i) => ({ transitionDelay: `${i * 50}ms`, opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(14px)', transition: 'all .6s cubic-bezier(.16,1,.3,1)' })
  const inputStyle = { width: '100%', padding: '12px 14px', background: dk.inputBg, border: `1.5px solid ${dk.inputBorder}`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none', transition: 'all .2s' }

  /* ─── data fetch (100% preserved) ─── */
  useEffect(() => { loadData() }, [staffProfile?.id])

  const loadData = async () => {
    if (!staffProfile?.id) return
    try {
      const [swapRes, staffRes] = await Promise.all([
        supabase.from('shift_swaps').select('*, shift:shift_id(shift_date, start_time, end_time, participants(first_name, last_name)), target:target_staff_id(first_name, last_name)').eq('requester_id', staffProfile.id).order('created_at', { ascending: false }),
        supabase.from('staff').select('id, first_name, last_name').neq('id', staffProfile.id).eq('status', 'active'),
      ])
      setSwaps(swapRes.data || [])
      setOtherStaff(staffRes.data || [])
    } catch (err) { console.error('Swap load error:', err) }
    finally { setLoading(false) }
  }

  /* ─── create handler (100% preserved) ─── */
  const handleCreate = async () => {
    if (!newSwap.shift_id || !newSwap.reason) { alert('Please select a shift and provide a reason'); return }
    setSaving(true)
    try {
      const payload = { shift_id: newSwap.shift_id, requester_id: staffProfile.id, target_staff_id: newSwap.target_staff_id || null, reason: newSwap.reason, status: 'pending' }
      const { data, error } = await supabase.from('shift_swaps').insert(payload).select('*, shift:shift_id(shift_date, start_time, end_time, participants(first_name, last_name)), target:target_staff_id(first_name, last_name)').single()
      if (error) throw error
      setSwaps([data, ...swaps])
      setShowNew(false); setNewSwap({ shift_id: '', target_staff_id: '', reason: '' })
    } catch (err) { alert('Failed: ' + (err.message || 'Unknown error')) }
    finally { setSaving(false) }
  }

  /* ─── computed ─── */
  const upcomingShifts = myShifts.filter(s => s.status === 'scheduled' || s.status === 'upcoming')
  const pendingCount = swaps.filter(s => s.status === 'pending').length
  const approvedCount = swaps.filter(s => s.status === 'approved').length
  const rejectedCount = swaps.filter(s => s.status === 'rejected').length

  const filteredSwaps = swaps.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const pName = s.shift?.participants ? `${s.shift.participants.first_name} ${s.shift.participants.last_name}`.toLowerCase() : ''
      const tName = s.target ? `${s.target.first_name} ${s.target.last_name}`.toLowerCase() : ''
      return pName.includes(q) || tName.includes(q) || (s.reason || '').toLowerCase().includes(q)
    }
    return true
  })

  /* ─── loading ─── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` }}>
          <ArrowLeftRight size={22} style={{ color: 'white' }} />
        </div>
        <div style={{ position: 'absolute', inset: -4, borderRadius: 18, border: `2px solid ${c.staff}`, opacity: 0.3, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: dk.textMuted }}>Loading shift swaps...</p>
    </div>
  )

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <style>{`
        @keyframes orbFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-15px) scale(1.03)}}
        @keyframes ping{75%,100%{transform:scale(1.8);opacity:0}}
        @keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes countUp{from{opacity:0;transform:translateY(8px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        .count-up{animation:countUp .7s cubic-bezier(.16,1,.3,1) forwards}
      `}</style>

      <Orb color={c.staff} size={280} top="-80px" right="-60px" delay={0} />
      <Orb color={c.staffHover} size={200} bottom="10%" left="-40px" delay={2} />
      <Orb color="#8b5cf6" size={160} top="40%" right="15%" delay={4} />
      <Orb color="#f59e0b" size={200} bottom="-50px" right="25%" delay={1} />
      <Orb color="#06b6d4" size={140} top="20%" left="20%" delay={3} />

      <div style={{ position: 'relative', zIndex: 1, padding: '0 0 40px' }}>

        {/* ═══════ HERO ═══════ */}
        <div style={{ ...stg(0), background: `linear-gradient(135deg, ${c.staff} 0%, ${c.staffHover} 40%, #3b82f6 70%, #06b6d4 100%)`, borderRadius: 20, padding: '28px 24px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
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
                <ArrowLeftRight size={12} /> SHIFT SWAPS
              </span>
              {pendingCount > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'rgba(245,158,11,0.3)', backdropFilter: 'blur(8px)', fontSize: 10, fontWeight: 700, color: '#fde68a' }}>
                  <Clock size={10} /> {pendingCount} PENDING
                </span>
              )}
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', lineHeight: 1.2, marginBottom: 4 }}>Shift Swaps</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 16 }}>Request to swap shifts with other team members</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {[
                { label: 'Total', value: swaps.length, icon: ArrowLeftRight },
                { label: 'Pending', value: pendingCount, icon: Clock },
                { label: 'Approved', value: approvedCount, icon: CheckCircle },
                { label: 'Rejected', value: rejectedCount, icon: XCircle },
              ].map((pill, i) => (
                <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <pill.icon size={12} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>{pill.value}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{pill.label}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowNew(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
              <Plus size={16} /> Request Swap
            </button>
          </div>
        </div>

        {/* ═══════ STAT CARDS ═══════ */}
        <div style={{ ...stg(1), display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { icon: ArrowLeftRight, label: 'Total Requests', value: swaps.length, gradient: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, glow: `${c.staff}40` },
            { icon: Clock, label: 'Pending', value: pendingCount, gradient: 'linear-gradient(135deg, #f59e0b, #f97316)', glow: 'rgba(245,158,11,0.3)', alert: pendingCount > 0 },
            { icon: CheckCircle, label: 'Approved', value: approvedCount, gradient: 'linear-gradient(135deg, #10b981, #059669)', glow: 'rgba(16,185,129,0.3)' },
            { icon: XCircle, label: 'Rejected', value: rejectedCount, gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', glow: 'rgba(239,68,68,0.3)' },
          ].map((stat, i) => (
            <Glass key={i} isDark={isDark} hover glow={stat.glow} style={{ padding: '18px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: stat.gradient, boxShadow: `0 4px 12px -2px ${stat.glow}` }}>
                  <stat.icon size={18} style={{ color: 'white' }} />
                </div>
                {stat.alert && <span style={{ width: 8, height: 8, borderRadius: 4, background: '#ef4444', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />}
              </div>
              <p style={{ fontSize: 26, fontWeight: 900, color: dk.text, lineHeight: 1 }}><AnimNum value={stat.value} /></p>
              <p style={{ fontSize: 11, fontWeight: 600, color: dk.textFaint, marginTop: 4 }}>{stat.label}</p>
            </Glass>
          ))}
        </div>

        {/* ═══════ FILTER + SEARCH ═══════ */}
        <div style={{ ...stg(2), display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <Glass isDark={isDark} style={{ padding: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All', count: swaps.length },
              { id: 'pending', label: 'Pending', count: pendingCount },
              { id: 'approved', label: 'Approved', count: approvedCount },
              { id: 'rejected', label: 'Rejected', count: rejectedCount },
            ].map(f => (
              <button key={f.id} onClick={() => setStatusFilter(f.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700, transition: 'all .25s cubic-bezier(.16,1,.3,1)',
                  background: statusFilter === f.id ? `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` : 'transparent',
                  color: statusFilter === f.id ? 'white' : dk.textMuted,
                  boxShadow: statusFilter === f.id ? `0 4px 16px -4px ${c.staff}50` : 'none',
                }}>
                {f.label}
                {f.count > 0 && <span style={{ padding: '1px 7px', borderRadius: 999, fontSize: 10, fontWeight: 800, background: statusFilter === f.id ? 'rgba(255,255,255,0.25)' : dk.subtleBg2, color: statusFilter === f.id ? 'white' : dk.textFaint }}>{f.count}</span>}
              </button>
            ))}
          </Glass>
          <Glass isDark={isDark} style={{ padding: '4px 14px', display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 200px', minWidth: 0 }}>
            <Search size={16} style={{ color: dk.textFaint, flexShrink: 0 }} />
            <input type="text" placeholder="Search swaps..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ flex: 1, padding: '8px 0', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, fontWeight: 600, color: dk.text, minWidth: 0 }} />
            {searchQuery && <button onClick={() => setSearchQuery('')} style={{ padding: 4, borderRadius: 6, border: 'none', cursor: 'pointer', background: dk.subtleBg2, color: dk.textFaint }}><X size={12} /></button>}
          </Glass>
        </div>

        {/* ═══════ SWAP LIST ═══════ */}
        <div style={stg(3)}>
          <p style={{ fontSize: 12, color: dk.textFaint, marginBottom: 10 }}>{filteredSwaps.length} request{filteredSwaps.length !== 1 ? 's' : ''}{statusFilter !== 'all' ? ` · ${statusFilter}` : ''}</p>

          {filteredSwaps.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredSwaps.map(swap => {
                const shift = swap.shift
                const pName = shift?.participants ? `${shift.participants.first_name} ${shift.participants.last_name}` : '—'
                const target = swap.target ? `${swap.target.first_name} ${swap.target.last_name}` : 'Anyone available'
                const statusColor = swap.status === 'approved' ? 'green' : swap.status === 'rejected' ? 'red' : 'amber'
                const statusGrad = swap.status === 'approved' ? 'linear-gradient(135deg, #10b981, #059669)' : swap.status === 'rejected' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #f59e0b, #f97316)'

                return (
                  <Glass key={swap.id} isDark={isDark} hover onClick={() => setViewSwap(swap)}
                    style={{
                      padding: 16, display: 'flex', alignItems: 'flex-start', gap: 14,
                      borderLeft: `4px solid ${swap.status === 'approved' ? '#10b981' : swap.status === 'rejected' ? '#ef4444' : '#f59e0b'}`,
                    }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: statusGrad, boxShadow: '0 4px 12px -2px rgba(0,0,0,0.15)', flexShrink: 0 }}>
                      <ArrowLeftRight size={18} style={{ color: 'white' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: dk.text }}>{pName}</p>
                        <Badge color={statusColor} isDark={isDark}>{(swap.status || 'pending').replace(/\b\w/g, ch => ch.toUpperCase())}</Badge>
                      </div>
                      <p style={{ fontSize: 12, color: dk.textMuted }}>{formatDate(shift?.shift_date)} · {formatTime(shift?.start_time)} – {formatTime(shift?.end_time)}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: dk.textFaint }}>Swap with:</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: dk.text }}>{target}</span>
                      </div>
                      {swap.reason && <p style={{ fontSize: 11, color: dk.textFaint, marginTop: 4, fontStyle: 'italic' }}>"{swap.reason}"</p>}
                      {swap.admin_notes && (
                        <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 10, background: dk.subtleBg, border: `1px solid ${dk.divider}` }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: dk.textFaint, marginBottom: 2 }}>Admin Response</p>
                          <p style={{ fontSize: 11, color: dk.textMuted }}>{swap.admin_notes}</p>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: dk.textFaint }}>{timeAgo(swap.created_at)}</span>
                      <ChevronRight size={14} style={{ color: dk.textFaint }} />
                    </div>
                  </Glass>
                )
              })}
            </div>
          ) : (
            <Glass isDark={isDark} style={{ padding: '50px 24px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 18, margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${c.staff}20, ${c.staffHover}15)` }}>
                <ArrowLeftRight size={24} style={{ color: c.staff }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 800, color: dk.text }}>{searchQuery || statusFilter !== 'all' ? 'No matching requests' : 'No swap requests'}</p>
              <p style={{ fontSize: 12, color: dk.textFaint, marginTop: 4 }}>{searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : "Request a shift swap if you can't make a scheduled shift"}</p>
              {!searchQuery && statusFilter === 'all' && (
                <button onClick={() => setShowNew(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14, padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, color: 'white', fontSize: 13, fontWeight: 700 }}>
                  <Plus size={14} /> Request Swap
                </button>
              )}
            </Glass>
          )}
        </div>
      </div>

      {/* ═══════ NEW SWAP MODAL ═══════ */}
      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="" wide>
        <div>
          <div style={{ margin: '-24px -24px 0', marginBottom: 0 }}>
            <div style={{ background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover}, #3b82f6)`, padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                  <ArrowLeftRight size={20} style={{ color: 'white' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>Request Shift Swap</h3>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Your admin will review and approve the request</p>
                </div>
              </div>
            </div>
          </div>
          <div style={{ padding: '20px 0 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6 }}>Select Shift *</p>
              <select value={newSwap.shift_id} onChange={e => setNewSwap({ ...newSwap, shift_id: e.target.value })} style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = c.staff; e.currentTarget.style.boxShadow = `0 0 0 3px ${c.staff}15` }}
                onBlur={e => { e.currentTarget.style.borderColor = dk.inputBorder; e.currentTarget.style.boxShadow = 'none' }}>
                <option value="">Choose an upcoming shift...</option>
                {upcomingShifts.map(s => {
                  const pName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Shift'
                  return <option key={s.id} value={s.id}>{formatDate(s.shift_date)} · {formatTime(s.start_time)} – {formatTime(s.end_time)} · {pName}</option>
                })}
              </select>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6 }}>Swap With <span style={{ fontWeight: 500, color: dk.textFaint }}>(optional)</span></p>
              <select value={newSwap.target_staff_id} onChange={e => setNewSwap({ ...newSwap, target_staff_id: e.target.value })} style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = c.staff; e.currentTarget.style.boxShadow = `0 0 0 3px ${c.staff}15` }}
                onBlur={e => { e.currentTarget.style.borderColor = dk.inputBorder; e.currentTarget.style.boxShadow = 'none' }}>
                <option value="">Anyone available</option>
                {otherStaff.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
              </select>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6 }}>Reason *</p>
              <textarea value={newSwap.reason} onChange={e => setNewSwap({ ...newSwap, reason: e.target.value })}
                rows={3} placeholder="Why do you need to swap this shift?"
                style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                onFocus={e => { e.currentTarget.style.borderColor = c.staff; e.currentTarget.style.boxShadow = `0 0 0 3px ${c.staff}15` }}
                onBlur={e => { e.currentTarget.style.borderColor = dk.inputBorder; e.currentTarget.style.boxShadow = 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 4 }}>
              <button onClick={() => setShowNew(false)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '14px 20px', borderRadius: 14, border: `1.5px solid ${dk.divider}`, background: 'transparent', color: dk.text, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleCreate} disabled={saving}
                style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 20px', borderRadius: 14, border: 'none', cursor: saving ? 'default' : 'pointer', background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, color: 'white', fontSize: 13, fontWeight: 800, opacity: saving ? 0.6 : 1, boxShadow: `0 4px 16px -4px ${c.staff}50`, transition: 'all .2s' }}>
                {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</> : <><ArrowLeftRight size={16} /> Submit Request</>}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ═══════ SWAP DETAIL MODAL ═══════ */}
      <Modal isOpen={!!viewSwap} onClose={() => setViewSwap(null)} title="" wide>
        {viewSwap && (() => {
          const shift = viewSwap.shift
          const pName = shift?.participants ? `${shift.participants.first_name} ${shift.participants.last_name}` : '—'
          const target = viewSwap.target ? `${viewSwap.target.first_name} ${viewSwap.target.last_name}` : 'Anyone available'
          const statusGrad = viewSwap.status === 'approved' ? 'linear-gradient(135deg, #10b981, #059669, #06b6d4)' : viewSwap.status === 'rejected' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : `linear-gradient(135deg, ${c.staff}, ${c.staffHover}, #3b82f6)`
          const statusColor = viewSwap.status === 'approved' ? 'green' : viewSwap.status === 'rejected' ? 'red' : 'amber'
          return (
            <div>
              <div style={{ margin: '-24px -24px 0', marginBottom: 0 }}>
                <div style={{ background: statusGrad, padding: '24px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                      <ArrowLeftRight size={22} style={{ color: 'white' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>Swap Request</h3>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{pName} · {formatDate(shift?.shift_date)}</p>
                    </div>
                    <span style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.2)', color: 'white' }}>{(viewSwap.status || 'pending').replace(/\b\w/g, ch => ch.toUpperCase())}</span>
                  </div>
                </div>
              </div>
              <div style={{ padding: '20px 0 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                  <div style={{ padding: 14, borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.divider}` }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: dk.textFaint }}>Shift Date</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: dk.text, marginTop: 4 }}>{formatDate(shift?.shift_date)}</p>
                  </div>
                  <div style={{ padding: 14, borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.divider}` }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: dk.textFaint }}>Time</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: dk.text, marginTop: 4 }}>{formatTime(shift?.start_time)} – {formatTime(shift?.end_time)}</p>
                  </div>
                  <div style={{ padding: 14, borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.divider}` }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: dk.textFaint }}>Participant</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: dk.text, marginTop: 4 }}>{pName}</p>
                  </div>
                  <div style={{ padding: 14, borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.divider}` }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: dk.textFaint }}>Swap With</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: dk.text, marginTop: 4 }}>{target}</p>
                  </div>
                </div>
                <div style={{ padding: 14, borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.divider}` }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: dk.textFaint, marginBottom: 6 }}>Reason</p>
                  <p style={{ fontSize: 13, color: dk.text, lineHeight: 1.6 }}>{viewSwap.reason}</p>
                </div>
                <div style={{ padding: 14, borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.divider}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: dk.textFaint }}>Status</p>
                  <Badge color={statusColor} isDark={isDark}>{(viewSwap.status || 'pending').replace(/\b\w/g, ch => ch.toUpperCase())}</Badge>
                  {viewSwap.created_at && <span style={{ fontSize: 10, color: dk.textFaint, marginLeft: 'auto' }}>Requested {timeAgo(viewSwap.created_at)}</span>}
                </div>
                {viewSwap.admin_notes && (
                  <div style={{ padding: 14, borderRadius: 14, background: isDark ? 'rgba(59,130,246,0.08)' : '#eff6ff', border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe'}` }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#60a5fa' : '#2563eb', marginBottom: 6 }}>Admin Response</p>
                    <p style={{ fontSize: 13, color: dk.text, lineHeight: 1.6 }}>{viewSwap.admin_notes}</p>
                  </div>
                )}
                <button onClick={() => setViewSwap(null)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '14px 20px', borderRadius: 14, border: `1.5px solid ${dk.divider}`, background: 'transparent', color: dk.textMuted, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = dk.subtleBg2}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  Close
                </button>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}