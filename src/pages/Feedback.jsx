import { useState, useEffect, useRef, useMemo } from 'react'
import {
  MessageSquare, AlertCircle, Check, TrendingUp, Plus, Loader2, Trash2, Pencil,
  ArrowRight, Users, Shield, CheckCircle, XCircle, Clock, Star, ThumbsUp,
  Search, ChevronRight, ChevronDown, Activity, Layers, Zap, Target,
  BarChart3, Eye, Calendar, User, Hash, FileText, RefreshCw, Heart
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
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
    <div style={{ background: base, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${border}`, borderRadius: '1.25rem', boxShadow: glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)', transition: hover ? 'all .3s cubic-bezier(.16,1,.3,1)' : undefined, ...style }}
    onMouseEnter={hover ? e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = glow ? `0 16px 48px -8px ${glow}` : '0 12px 40px -8px rgba(0,0,0,0.12)' } : undefined}
    onMouseLeave={hover ? e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)' } : undefined}
    {...p}>{children}</div>
  )
}

function Orb({ color, size = 200, top, left, right, bottom, delay = 0 }) {
  return (<div style={{ position: 'absolute', width: size, height: size, top, left, right, bottom, background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, opacity: 0.12, borderRadius: '50%', animation: `orbFloat ${6 + delay}s ease-in-out ${delay}s infinite`, pointerEvents: 'none', zIndex: 0 }} />)
}

function AnimNum({ value, suffix = '', duration = 900 }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef()
  useEffect(() => {
    const num = typeof value === 'number' ? value : parseInt(value) || 0
    const start = performance.now()
    function tick(now) { const p = Math.min((now - start) / duration, 1); setDisplay(Math.round(num * (1 - Math.pow(1 - p, 3)))); if (p < 1) ref.current = requestAnimationFrame(tick) }
    ref.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(ref.current)
  }, [value, duration])
  return <>{display}{suffix}</>
}

function Badge({ children, color = 'gray', dark }) {
  const palettes = {
    gray: dark ? { bg: 'rgba(100,116,139,0.2)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)' } : { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
    green: dark ? { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' } : { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
    amber: dark ? { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' } : { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    red: dark ? { bg: 'rgba(239,68,68,0.15)', text: '#f87171', border: 'rgba(239,68,68,0.3)' } : { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    blue: dark ? { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' } : { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    purple: dark ? { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa', border: 'rgba(139,92,246,0.3)' } : { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
    orange: dark ? { bg: 'rgba(249,115,22,0.15)', text: '#fb923c', border: 'rgba(249,115,22,0.3)' } : { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
    teal: dark ? { bg: 'rgba(20,184,166,0.15)', text: '#2dd4bf', border: 'rgba(20,184,166,0.3)' } : { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
  }
  const pl = palettes[color] || palettes.gray
  return (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: pl.bg, color: pl.text, border: `1px solid ${pl.border}`, whiteSpace: 'nowrap' }}>{children}</span>)
}

function Toggle({ checked, onChange, color, dark }) {
  return (<button onClick={onChange} style={{ width: 48, height: 26, borderRadius: 999, position: 'relative', background: checked ? color : (dark ? 'rgba(51,65,85,0.6)' : '#d1d5db'), border: 'none', cursor: 'pointer', transition: 'background .25s ease', flexShrink: 0, boxShadow: checked ? `0 0 12px ${color}30` : 'none' }}>
    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: checked ? 25 : 3, transition: 'left .25s cubic-bezier(.16,1,.3,1)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
  </button>)
}


/* ─────────────────────────────────────────────
   CONFIG (100% PRESERVED)
   ───────────────────────────────────────────── */

const STATUS_CONFIG = {
  action_required: { color: '#ef4444', badge: 'red', label: 'Action Required', icon: AlertCircle, grad: 'linear-gradient(135deg, #ef4444, #f87171)' },
  acknowledged: { color: '#f59e0b', badge: 'amber', label: 'Acknowledged', icon: Clock, grad: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
  in_progress: { color: '#3b82f6', badge: 'blue', label: 'In Progress', icon: TrendingUp, grad: 'linear-gradient(135deg, #3b82f6, #60a5fa)' },
  resolved: { color: '#10b981', badge: 'green', label: 'Resolved', icon: CheckCircle, grad: 'linear-gradient(135deg, #10b981, #34d399)' },
}

const TYPE_CONFIG = {
  complaint: { color: '#ef4444', grad: 'linear-gradient(135deg, #ef4444, #f97316)', glow: 'rgba(239,68,68,0.12)', label: 'Complaint', icon: AlertCircle },
  feedback: { color: '#3b82f6', grad: 'linear-gradient(135deg, #3b82f6, #06b6d4)', glow: 'rgba(59,130,246,0.12)', label: 'Feedback', icon: MessageSquare },
}

function formatDateShort(iso) {
  if (!iso) return '—'
  const d = new Date(iso); const now = new Date()
  const diffMins = Math.floor((now - d) / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

function methodLabel(m) {
  if (m === 'verbally') return 'Verbally'; if (m === 'form') return 'Via Form'
  if (m === 'email') return 'Email'; if (m === 'phone') return 'Phone'
  return m || '—'
}


/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

export default function Feedback() {
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [selFb, setSelFb] = useState(null)
  const [allFeedback, setAllFeedback] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [search, setSearch] = useState('')
  const [newFeedback, setNewFeedback] = useState({
    type: '', from_name: '', method: 'verbally', description: '', action_required: '',
    anonymous: false, follow_up_required: false, follow_up_date: '',
  })

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

  const CT = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    return (<div style={{ background: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.96)', backdropFilter: 'blur(20px)', borderRadius: 16, border: `1px solid ${isDark ? 'rgba(51,65,85,0.6)' : 'rgba(0,0,0,0.08)'}`, padding: '14px 18px', boxShadow: isDark ? '0 16px 40px -8px rgba(0,0,0,0.5)' : '0 16px 40px -8px rgba(0,0,0,0.12)' }}>
      {payload.map((p, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: i > 0 ? 6 : 0 }}><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: 3, background: p.color || p.fill }} /><span style={{ fontSize: 12, color: dk.textMuted }}>{p.name}</span></div><span style={{ fontSize: 13, fontWeight: 800, color: dk.text }}>{p.value}</span></div>))}
    </div>)
  }


  /* ═══ ALL BACKEND — 100% PRESERVED ═══ */
  async function loadFeedback() {
    try {
      const { data, error } = await supabase.from('feedback').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setAllFeedback(data || [])
    } catch (err) { console.error('Failed to load feedback:', err); setAllFeedback([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadFeedback() }, [])
  useEffect(() => { if (!loading) setTimeout(() => setLoaded(true), 50) }, [loading])

  const handleAddFeedback = async () => {
    if (!newFeedback.type || !newFeedback.description) { alert('Please fill in required fields (Type, Description)'); return }
    setSubmitting(true)
    try {
      const payload = { type: newFeedback.type, from_name: newFeedback.anonymous ? 'Anonymous' : (newFeedback.from_name || 'Unknown'), anonymous: newFeedback.anonymous, method: newFeedback.method, description: newFeedback.description, action_required: newFeedback.action_required || null, follow_up_required: newFeedback.follow_up_required, follow_up_date: newFeedback.follow_up_date || null }
      if (editingId) { payload.updated_at = new Date().toISOString(); const { error } = await supabase.from('feedback').update(payload).eq('id', editingId); if (error) throw error }
      else { payload.status = 'action_required'; const { error } = await supabase.from('feedback').insert(payload); if (error) throw error }
      await loadFeedback(); setShowNew(false); setEditingId(null)
      setNewFeedback({ type: '', from_name: '', method: 'verbally', description: '', action_required: '', anonymous: false, follow_up_required: false, follow_up_date: '' })
    } catch (err) { alert('Failed to submit: ' + (err.message || 'Unknown error')) }
    finally { setSubmitting(false) }
  }

  const handleUpdateStatus = async (id, status) => {
    try { const { error } = await supabase.from('feedback').update({ status, updated_at: new Date().toISOString() }).eq('id', id); if (error) throw error; await loadFeedback(); setSelFb(null) }
    catch (err) { alert('Failed to update: ' + (err.message || 'Unknown error')) }
  }

  const handleDeleteFeedback = async (id) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return
    try { const { error } = await supabase.from('feedback').delete().eq('id', id); if (error) throw error; await loadFeedback(); setSelFb(null) }
    catch (err) { alert('Failed to delete: ' + (err.message || 'Unknown error')) }
  }

  const handleEditFeedback = (fb) => {
    setNewFeedback({ type: fb.type || '', from_name: fb.from_name || '', anonymous: fb.anonymous || false, description: fb.description || '', method: fb.method || 'verbally', action_required: fb.action_required || '', follow_up_required: fb.follow_up_required || false, follow_up_date: fb.follow_up_date || '' })
    setSelFb(null); setEditingId(fb.id); setShowNew(true)
  }


  /* ── Stats ── */
  const openComplaints = allFeedback.filter(f => f.type === 'complaint' && f.status !== 'resolved').length
  const resolved = allFeedback.filter(f => f.status === 'resolved').length
  const total = allFeedback.length
  const satisfaction = total > 0 ? Math.round(((total - openComplaints) / total) * 100) : 100
  const feedbackCount = allFeedback.filter(f => f.type === 'feedback').length
  const complaintCount = allFeedback.filter(f => f.type === 'complaint').length
  const followUpCount = allFeedback.filter(f => f.follow_up_required && f.status !== 'resolved').length

  /* ── Filtered ── */
  const filtered = useMemo(() => {
    return allFeedback.filter(f => {
      if (filterStatus !== 'all' && f.status !== filterStatus) return false
      if (filterType !== 'all' && f.type !== filterType) return false
      if (search) { const q = search.toLowerCase(); return (f.description || '').toLowerCase().includes(q) || (f.from_name || '').toLowerCase().includes(q) || (f.type || '').toLowerCase().includes(q) }
      return true
    })
  }, [allFeedback, filterStatus, filterType, search])

  /* ── Charts ── */
  const statusPie = useMemo(() => Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
    name: cfg.label, value: allFeedback.filter(f => f.status === key).length, color: cfg.color,
  })).filter(s => s.value > 0), [allFeedback])

  const typePie = useMemo(() => [
    { name: 'Feedback', value: feedbackCount, color: '#3b82f6' },
    { name: 'Complaints', value: complaintCount, color: '#ef4444' },
  ].filter(s => s.value > 0), [feedbackCount, complaintCount])


  /* ─── Loading ─── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${c.primary}40` }}><MessageSquare size={32} color="white" /></div>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.3 }} />
      </div>
      <p style={{ color: dk.textMuted, fontSize: 14, fontWeight: 600 }}>Loading feedback...</p>
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
      <Orb color="#ef4444" size={200} top="45%" right="8%" delay={3.5} />
      <Orb color="#10b981" size={160} bottom="30%" left="40%" delay={5} />

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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}><Shield size={13} style={{ color: 'rgba(255,255,255,0.7)' }} /><span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Quality & Safeguards</span></div>
                {openComplaints > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(239,68,68,0.3)', backdropFilter: 'blur(8px)' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fca5a5', animation: 'pulse-dot 2s ease-in-out infinite' }} /><span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>{openComplaints} open complaints</span></div>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15 }}>Feedback & Complaints</h1>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>Manage feedback, complaints, and follow-ups</p>
                </div>
                <button onClick={() => setShowNew(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 16, border: 'none', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}>
                  <Plus size={18} /> New Entry
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
                {[
                  { icon: Layers, text: `${total} total entries` },
                  { icon: CheckCircle, text: `${resolved} resolved`, bg: 'rgba(16,185,129,0.25)' },
                  { icon: ThumbsUp, text: `${satisfaction}% satisfaction` },
                  { icon: AlertCircle, text: `${openComplaints} open complaints`, bg: openComplaints > 0 ? 'rgba(239,68,68,0.3)' : undefined },
                  followUpCount > 0 && { icon: Clock, text: `${followUpCount} follow-ups pending`, bg: 'rgba(245,158,11,0.35)' },
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
            { icon: Layers, label: 'Total', value: total, grad: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, glow: `${c.primary}35` },
            { icon: AlertCircle, label: 'Open Complaints', value: openComplaints, grad: 'linear-gradient(135deg, #ef4444, #f87171)', glow: 'rgba(239,68,68,0.2)', pulse: openComplaints > 0 },
            { icon: CheckCircle, label: 'Resolved', value: resolved, grad: 'linear-gradient(135deg, #10b981, #34d399)', glow: 'rgba(16,185,129,0.2)' },
            { icon: ThumbsUp, label: 'Satisfaction', value: satisfaction, suffix: '%', grad: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, glow: `${c.staff}25` },
            { icon: MessageSquare, label: 'Feedback', value: feedbackCount, grad: 'linear-gradient(135deg, #3b82f6, #60a5fa)', glow: 'rgba(59,130,246,0.2)' },
            { icon: Clock, label: 'Follow-ups', value: followUpCount, grad: 'linear-gradient(135deg, #f59e0b, #fbbf24)', glow: 'rgba(245,158,11,0.2)', pulse: followUpCount > 0 },
          ].map((card, i) => (
            <Glass key={i} dark={isDark} hover glow={card.glow} style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
              {card.pulse && <div style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: '50%', background: card.label.includes('Complaint') ? '#ef4444' : '#f59e0b', animation: 'pulse-dot 2s ease-in-out infinite' }} />}
              <div style={{ width: 42, height: 42, borderRadius: 12, background: card.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 20px -4px ${card.glow}`, marginBottom: 12 }}><card.icon size={20} color="white" /></div>
              <p style={{ fontSize: 22, fontWeight: 800, color: dk.text, lineHeight: 1 }} className="count-up"><AnimNum value={card.value} suffix={card.suffix || ''} /></p>
              <p style={{ fontSize: 11, fontWeight: 600, color: dk.textFaint, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</p>
            </Glass>
          ))}
        </div>

        {/* ══════════ FILTERS ══════════ */}
        <Glass dark={isDark} style={{ padding: 6, ...stg(2) }}>
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
            {[
              { key: 'all', icon: Layers, label: 'All', count: total },
              { key: 'action_required', icon: AlertCircle, label: 'Action Req.', count: allFeedback.filter(f => f.status === 'action_required').length },
              { key: 'acknowledged', icon: Clock, label: 'Acknowledged', count: allFeedback.filter(f => f.status === 'acknowledged').length },
              { key: 'in_progress', icon: TrendingUp, label: 'In Progress', count: allFeedback.filter(f => f.status === 'in_progress').length },
              { key: 'resolved', icon: CheckCircle, label: 'Resolved', count: resolved },
            ].map(t => {
              const isActive = filterStatus === t.key
              return (
                <button key={t.key} onClick={() => setFilterStatus(t.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '12px 14px', borderRadius: 14, border: 'none',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', flex: '1 1 auto', justifyContent: 'center', whiteSpace: 'nowrap',
                  transition: 'all .25s cubic-bezier(.16,1,.3,1)',
                  background: isActive ? `linear-gradient(135deg, ${c.primary}, ${c.adminHover})` : 'transparent',
                  color: isActive ? 'white' : dk.textMuted,
                  boxShadow: isActive ? `0 4px 16px -4px ${c.primary}60` : 'none',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = isDark ? 'rgba(51,65,85,0.4)' : 'rgba(0,0,0,0.04)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
                  <t.icon size={14} /> {t.label}
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 8, background: isActive ? 'rgba(255,255,255,0.2)' : dk.subtleBg2, color: isActive ? 'rgba(255,255,255,0.9)' : dk.textFaint }}>{t.count}</span>
                </button>
              )
            })}
          </div>
        </Glass>

        <Glass dark={isDark} style={{ ...stg(3), padding: '12px 18px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search feedback..." style={{ ...inputStyle, paddingLeft: 40 }} onFocus={e => e.target.style.borderColor = c.primary} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
            </div>
            <div style={{ position: 'relative' }}>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '11px 36px 11px 14px', background: dk.inputBg, border: `1px solid ${dk.inputBorder}`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none', appearance: 'none', cursor: 'pointer', minWidth: 130 }}>
                <option value="all">All Types</option>
                <option value="feedback">Feedback</option>
                <option value="complaint">Complaints</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint, pointerEvents: 'none' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: dk.textFaint, padding: '6px 12px', borderRadius: 10, background: dk.subtleBg }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </Glass>

        {/* ══════════ FEEDBACK LIST ══════════ */}
        {filtered.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((f, i) => {
              const typeCfg = TYPE_CONFIG[f.type] || TYPE_CONFIG.feedback
              const statusCfg = STATUS_CONFIG[f.status] || STATUS_CONFIG.action_required
              const isOpenComplaint = f.type === 'complaint' && f.status !== 'resolved'
              return (
                <Glass key={f.id} dark={isDark} hover glow={typeCfg.glow}
                  style={{ ...stg(i + 4), padding: '20px 22px', cursor: 'pointer', position: 'relative', overflow: 'hidden', borderColor: isOpenComplaint ? (isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.25)') : undefined }}
                  onClick={() => setSelFb(f)}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderRadius: '0 4px 4px 0', background: `linear-gradient(to bottom, ${typeCfg.color}, ${typeCfg.color}60)` }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, paddingLeft: 8 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: typeCfg.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px -4px ${typeCfg.color}50` }}>
                      {typeCfg.icon ? <typeCfg.icon size={22} color="white" /> : <MessageSquare size={22} color="white" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{typeCfg.label}</p>
                          <Badge color="gray" dark={isDark}>{methodLabel(f.method)}</Badge>
                          {f.anonymous && <Badge color="orange" dark={isDark}>Anon</Badge>}
                        </div>
                        <Badge color={statusCfg.badge} dark={isDark}>
                          {isOpenComplaint && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', display: 'inline-block', marginRight: 3, animation: 'pulse-dot 2s ease-in-out infinite' }} />}
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 3 }}>From: {f.from_name || 'Unknown'}</p>
                      <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.5 }}>{f.description}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: dk.textFaint, display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={10} /> {formatDateShort(f.created_at)}</span>
                        {f.follow_up_required && f.follow_up_date && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: c.primary, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} /> Follow-up: {new Date(f.follow_up_date).toLocaleDateString('en-AU')}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: dk.textFaint, flexShrink: 0, marginTop: 4 }} />
                  </div>
                </Glass>
              )
            })}
          </div>
        ) : (
          <Glass dark={isDark} style={{ ...stg(4), padding: '56px 24px', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: 22, margin: '0 auto 20px', background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 32px -8px ${c.primary}40` }}><MessageSquare size={36} color="white" /></div>
            <p style={{ fontWeight: 700, color: dk.text, fontSize: 18 }}>{search || filterStatus !== 'all' || filterType !== 'all' ? 'No matching entries' : 'No feedback or complaints yet'}</p>
            <p style={{ fontSize: 14, color: dk.textFaint, marginTop: 6, marginBottom: 20 }}>{search ? 'Try adjusting your filters' : 'Record feedback and complaints to track quality & safeguards'}</p>
            {!search && filterStatus === 'all' && filterType === 'all' && (
              <button onClick={() => setShowNew(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 24px', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 6px 24px -6px ${c.primary}50` }}><Plus size={16} /> Record First Entry</button>
            )}
          </Glass>
        )}

        {/* ══════════ INSIGHTS ══════════ */}
        {allFeedback.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, ...stg(6) }}>
            <Glass dark={isDark} glow={`${c.primary}10`} style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><BarChart3 size={18} style={{ color: c.primary }} /><h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>By Status</h3></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <ResponsiveContainer width={120} height={120}><PieChart><Pie data={statusPie} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} stroke="none">{statusPie.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip content={<CT />} /></PieChart></ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{statusPie.map((s, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} /><span style={{ fontSize: 12, color: dk.textMuted }}>{s.name}</span><span style={{ fontSize: 13, fontWeight: 800, color: dk.text, marginLeft: 'auto' }}>{s.value}</span></div>))}</div>
              </div>
            </Glass>

            <Glass dark={isDark} glow="rgba(59,130,246,0.1)" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><MessageSquare size={18} style={{ color: '#3b82f6' }} /><h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>By Type</h3></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <ResponsiveContainer width={120} height={120}><PieChart><Pie data={typePie} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} stroke="none">{typePie.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip content={<CT />} /></PieChart></ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{typePie.map((s, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} /><span style={{ fontSize: 12, color: dk.textMuted }}>{s.name}</span><span style={{ fontSize: 13, fontWeight: 800, color: dk.text, marginLeft: 'auto' }}>{s.value}</span></div>))}</div>
              </div>
            </Glass>

            {/* Satisfaction ring */}
            <Glass dark={isDark} glow="rgba(16,185,129,0.1)" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginBottom: 20 }}><ThumbsUp size={18} style={{ color: '#10b981' }} /><h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Satisfaction</h3></div>
              {(() => {
                const r = 46, circ = 2 * Math.PI * r, off = circ - (satisfaction / 100) * circ
                const col = satisfaction >= 80 ? '#10b981' : satisfaction >= 50 ? '#f59e0b' : '#ef4444'
                return (<>
                  <div style={{ position: 'relative', width: 110, height: 110 }}>
                    <svg width={110} height={110} style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx={55} cy={55} r={r} fill="none" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'} strokeWidth="8" />
                      <circle cx={55} cy={55} r={r} fill="none" stroke={col} strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={circ} strokeDashoffset={off}
                        style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 4px ${col}40)` }} />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 24, fontWeight: 900, color: col }}>{satisfaction}%</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, marginTop: 16, color: col, textAlign: 'center' }}>
                    {satisfaction >= 90 ? 'Excellent' : satisfaction >= 70 ? 'Good' : 'Needs attention'}
                  </p>
                </>)
              })()}
            </Glass>
          </div>
        )}
      </div>


      {/* ══════════ DETAIL MODAL ══════════ */}
      <Modal isOpen={!!selFb} onClose={() => setSelFb(null)} title="Feedback Details" wide>
        {selFb && (() => {
          const typeCfg = TYPE_CONFIG[selFb.type] || TYPE_CONFIG.feedback
          const statusCfg = STATUS_CONFIG[selFb.status] || STATUS_CONFIG.action_required
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Hero */}
              <div style={{ margin: '-24px -24px 0 -24px', padding: '24px 28px 20px', background: typeCfg.grad, position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
                <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -40, right: -20 }} />
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }} />
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MessageSquare size={26} color="white" /></div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{typeCfg.label}</h3>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>From: {selFb.anonymous ? 'Anonymous' : selFb.from_name}</p>
                  </div>
                  <Badge color={statusCfg.badge} dark>{statusCfg.label}</Badge>
                </div>
              </div>

              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                {[
                  { label: 'Type', value: typeCfg.label, icon: MessageSquare, color: typeCfg.color },
                  { label: 'Submitted By', value: selFb.anonymous ? 'Anonymous' : selFb.from_name, icon: User, color: c.primary },
                  { label: 'Method', value: methodLabel(selFb.method), icon: FileText, color: '#3b82f6' },
                  { label: 'Date', value: new Date(selFb.created_at).toLocaleDateString('en-AU'), icon: Calendar, color: '#8b5cf6' },
                  { label: 'Status', value: statusCfg.label, icon: Activity, color: statusCfg.color },
                  { label: 'Follow-Up', value: selFb.follow_up_required ? `Yes — ${selFb.follow_up_date ? new Date(selFb.follow_up_date).toLocaleDateString('en-AU') : 'No date'}` : 'Not required', icon: Clock, color: '#f59e0b' },
                ].map((item, idx) => (
                  <div key={idx} style={{ padding: '14px 16px', borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.subtleBg2}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><item.icon size={12} style={{ color: item.color }} /><p style={{ fontSize: 10, fontWeight: 600, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p></div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: dk.text }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              <Glass dark={isDark} style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}><FileText size={14} style={{ color: dk.textMuted }} /><p style={{ fontSize: 12, fontWeight: 700, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Description</p></div>
                <p style={{ fontSize: 14, color: dk.textSoft, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selFb.description}</p>
              </Glass>

              {selFb.action_required && (
                <Glass dark={isDark} glow={`${c.primary}08`} style={{ padding: '18px 20px', borderColor: `${c.primary}20` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}><Target size={14} style={{ color: c.primary }} /><p style={{ fontSize: 12, fontWeight: 700, color: c.primary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Action Required</p></div>
                  <p style={{ fontSize: 14, color: dk.textSoft, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selFb.action_required}</p>
                </Glass>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, borderTop: `1px solid ${dk.divider}`, paddingTop: 16 }}>
                <button onClick={() => handleEditFeedback(selFb)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 18px', borderRadius: 12, background: dk.subtleBg2, border: `1px solid ${dk.inputBorder}`, color: dk.textMuted, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}><Pencil size={14} /> Edit</button>
                <button onClick={() => handleDeleteFeedback(selFb.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 18px', borderRadius: 12, background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : '#fecaca'}`, color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}><Trash2 size={14} /> Delete</button>
                {selFb.status !== 'acknowledged' && selFb.status !== 'resolved' && (
                  <button onClick={() => handleUpdateStatus(selFb.id, 'acknowledged')} style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 16px -4px ${c.primary}50` }}>Acknowledge</button>
                )}
                {selFb.status !== 'in_progress' && selFb.status !== 'resolved' && (
                  <button onClick={() => handleUpdateStatus(selFb.id, 'in_progress')} style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 16px -4px ${c.staff}50` }}>In Progress</button>
                )}
                {selFb.status !== 'resolved' && (
                  <button onClick={() => handleUpdateStatus(selFb.id, 'resolved')} style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #10b981, #14b8a6)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px -4px rgba(16,185,129,0.5)' }}>Resolve</button>
                )}
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* ══════════ NEW / EDIT MODAL ══════════ */}
      <Modal isOpen={showNew} onClose={() => { setShowNew(false); setEditingId(null) }} title={editingId ? 'Edit Feedback' : 'New Feedback'} wide>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ margin: '-24px -24px 0 -24px', padding: '24px 28px 20px', background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 50%, #3b82f6 100%)`, position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
            <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -40, right: -20 }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{editingId ? <Pencil size={26} color="white" /> : <Plus size={26} color="white" />}</div>
              <div><h3 style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{editingId ? 'Edit Entry' : 'New Entry'}</h3><p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Record feedback or a complaint</p></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><MessageSquare size={11} /> Type *</p>
              <select value={newFeedback.type} onChange={e => setNewFeedback({ ...newFeedback, type: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Select type</option><option value="feedback">Feedback</option><option value="complaint">Complaint</option>
              </select>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><User size={11} /> Submitted By</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input placeholder="Name" value={newFeedback.from_name} onChange={e => setNewFeedback({ ...newFeedback, from_name: e.target.value })} disabled={newFeedback.anonymous} style={{ ...inputStyle, opacity: newFeedback.anonymous ? 0.5 : 1 }} onFocus={e => e.target.style.borderColor = c.primary} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', background: dk.inputBg, border: `1.5px solid ${dk.inputBorder}`, borderRadius: 12, flexShrink: 0 }}>
                  <Toggle checked={newFeedback.anonymous} onChange={() => setNewFeedback({ ...newFeedback, anonymous: !newFeedback.anonymous })} color={c.primary} dark={isDark} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: dk.textMuted }}>Anon</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Submission Method</p>
            <select value={newFeedback.method} onChange={e => setNewFeedback({ ...newFeedback, method: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="verbally">Verbally</option><option value="form">Via Form</option><option value="email">Email</option><option value="phone">Phone</option>
            </select>
          </div>

          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><FileText size={11} /> Description *</p>
            <textarea placeholder="Describe the feedback or complaint" value={newFeedback.description} onChange={e => setNewFeedback({ ...newFeedback, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = c.primary} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
          </div>

          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><Target size={11} /> Action Required</p>
            <textarea placeholder="What action needs to be taken?" value={newFeedback.action_required} onChange={e => setNewFeedback({ ...newFeedback, action_required: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = c.primary} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
          </div>

          <div style={{ padding: '14px 18px', borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.subtleBg2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Toggle checked={newFeedback.follow_up_required} onChange={() => setNewFeedback({ ...newFeedback, follow_up_required: !newFeedback.follow_up_required })} color={c.primary} dark={isDark} />
              <span style={{ fontSize: 13, fontWeight: 700, color: dk.text }}>Follow-up Required</span>
            </div>
            {newFeedback.follow_up_required && (
              <input type="date" value={newFeedback.follow_up_date} onChange={e => setNewFeedback({ ...newFeedback, follow_up_date: e.target.value })} style={{ ...inputStyle, width: 'auto', minWidth: 160 }} onFocus={e => e.target.style.borderColor = c.primary} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, borderTop: `1px solid ${dk.divider}`, paddingTop: 16 }}>
            <button onClick={() => { setShowNew(false); setEditingId(null) }} style={{ flex: 1, padding: '15px 0', borderRadius: 14, background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9', border: `1px solid ${dk.inputBorder}`, color: dk.textMuted, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleAddFeedback} disabled={submitting} style={{ flex: 2, padding: '15px 0', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 8px 28px -6px ${c.primary}50`, opacity: submitting ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : editingId ? 'Save Changes' : <><Plus size={16} /> Submit</>}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}