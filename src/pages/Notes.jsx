import { useState, useEffect, useRef, useMemo } from 'react'
import {
  FileText, Clock, Check, AlertTriangle, ChevronRight, Loader2, Trash2, Pencil,
  Search, ChevronDown, Activity, Shield, Users, Zap, TrendingUp, BarChart3,
  Star, Heart, Target, Calendar, User, RefreshCw, Layers, CheckCircle,
  XCircle, Eye, ClipboardList, Save, X, MessageSquare
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { supabase } from '../lib/supabase'
import { useBrandColors } from '../hooks/useBrandColors'
import { useTheme } from '../context/ThemeContext'
import Modal from '../components/ui/Modal'


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

function AnimNum({ value, duration = 900 }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef()
  useEffect(() => {
    const num = typeof value === 'number' ? value : parseInt(value) || 0
    const start = performance.now()
    function tick(now) {
      const p = Math.min((now - start) / duration, 1)
      setDisplay(Math.round(num * (1 - Math.pow(1 - p, 3))))
      if (p < 1) ref.current = requestAnimationFrame(tick)
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

function noteStatus(shift) {
  if (!shift) return 'pending'
  if (shift.shift_notes && shift.shift_notes.length > 0) return 'completed'
  if (shift.status === 'completed') {
    const completedAt = new Date(shift.clock_out || shift.end_time)
    if ((new Date() - completedAt) / 3600000 > 24) return 'overdue'
    return 'pending'
  }
  return 'pending'
}

const statusConfig = {
  completed: { accent: '#10b981', grad: 'linear-gradient(135deg, #10b981, #34d399)', icon: Check, badge: 'green', label: 'Completed' },
  pending:   { accent: '#f59e0b', grad: 'linear-gradient(135deg, #f59e0b, #fbbf24)', icon: Clock, badge: 'amber', label: 'Pending' },
  overdue:   { accent: '#ef4444', grad: 'linear-gradient(135deg, #ef4444, #f87171)', icon: AlertTriangle, badge: 'red', label: 'Overdue' },
}

const noteFieldConfig = [
  { key: 'mood', label: 'Mood & Wellbeing', icon: Heart, color: '#ec4899' },
  { key: 'activities', label: 'Activities Completed', icon: Activity, color: '#3b82f6' },
  { key: 'goals_progress', label: 'Progress Toward Goals', icon: TrendingUp, color: '#10b981' },
  { key: 'concerns', label: 'Concerns or Incidents', icon: AlertTriangle, color: '#f59e0b' },
  { key: 'recommendations', label: 'Recommendations', icon: Star, color: '#8b5cf6' },
]


/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

export default function Notes() {
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loaded, setLoaded] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [shifts, setShifts] = useState([])
  const [selNote, setSelNote] = useState(null)
  const [editingNote, setEditingNote] = useState(null)
  const [editNoteForm, setEditNoteForm] = useState({})
  const [savingNote, setSavingNote] = useState(false)

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
      padding: '14px 18px', boxShadow: isDark ? '0 16px 40px -8px rgba(0,0,0,0.5)' : '0 16px 40px -8px rgba(0,0,0,0.12)',
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

  const handleDeleteNote = async (shiftId) => {
    if (!confirm('Delete this shift and its notes?')) return
    try {
      await supabase.from('shift_notes').delete().eq('shift_id', shiftId)
      const { error } = await supabase.from('shifts').delete().eq('id', shiftId)
      if (error) throw error
      setShifts(prev => prev.filter(s => s.id !== shiftId)); setSelNote(null)
    } catch (err) { alert('Failed to delete: ' + (err.message || 'Unknown error')) }
  }

  const startEditNote = (note) => {
    setEditNoteForm({ mood: note.mood || '', activities: note.activities || '', goals_progress: note.goals_progress || '', concerns: note.concerns || '', recommendations: note.recommendations || '', content: note.content || '' })
    setEditingNote(note.id)
  }

  const handleSaveNote = async (noteId) => {
    setSavingNote(true)
    try {
      const { error } = await supabase.from('shift_notes').update(editNoteForm).eq('id', noteId)
      if (error) throw error
      const { data } = await supabase.from('shifts').select('*, staff(id, first_name, last_name), participants(id, first_name, last_name), shift_notes(*)').in('status', ['completed', 'in_progress']).order('shift_date', { ascending: false })
      setShifts(data || [])
      const updated = (data || []).find(s => s.id === selNote.id)
      if (updated) setSelNote(updated)
      setEditingNote(null)
    } catch (err) { alert('Failed to save: ' + (err.message || 'Unknown error')) }
    finally { setSavingNote(false) }
  }

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase.from('shifts').select('*, staff(id, first_name, last_name), participants(id, first_name, last_name), shift_notes(*)').in('status', ['completed', 'in_progress']).order('shift_date', { ascending: false })
        if (error) throw error; setShifts(data || [])
      } catch (err) {
        console.error('Failed to load notes:', err)
        try { const { data, error } = await supabase.from('shifts').select('*, staff(id, first_name, last_name), participants(id, first_name, last_name)').in('status', ['completed', 'in_progress']).order('shift_date', { ascending: false }); if (!error) setShifts(data || []) } catch (e) { console.error('Fallback also failed:', e) }
      } finally { setLoading(false) }
    }
    load()
  }, [])
  useEffect(() => { if (!loading) setTimeout(() => setLoaded(true), 50) }, [loading])


  /* ── Stats ── */
  const pending = shifts.filter(s => noteStatus(s) === 'pending').length
  const completed = shifts.filter(s => noteStatus(s) === 'completed').length
  const overdue = shifts.filter(s => noteStatus(s) === 'overdue').length
  const complianceRate = shifts.length > 0 ? Math.round((completed / shifts.length) * 100) : 0

  /* ── Filtered ── */
  const filtered = useMemo(() => {
    return shifts.filter(s => {
      if (filter !== 'all' && noteStatus(s) !== filter) return false
      if (search) {
        const q = search.toLowerCase()
        const pN = s.participants ? `${s.participants.first_name} ${s.participants.last_name}`.toLowerCase() : ''
        const sN = s.staff ? `${s.staff.first_name} ${s.staff.last_name}`.toLowerCase() : ''
        return pN.includes(q) || sN.includes(q)
      }
      return true
    })
  }, [shifts, filter, search])

  /* ── Charts ── */
  const statusPie = useMemo(() => [
    { name: 'Completed', value: completed, color: '#10b981' },
    { name: 'Pending', value: pending, color: '#f59e0b' },
    { name: 'Overdue', value: overdue, color: '#ef4444' },
  ].filter(s => s.value > 0), [completed, pending, overdue])

  /* ── Top staff by notes ── */
  const topStaffNotes = useMemo(() => {
    const map = {}
    shifts.filter(s => noteStatus(s) === 'completed').forEach(s => {
      if (s.staff) { const n = `${s.staff.first_name} ${s.staff.last_name}`; map[n] = (map[n] || 0) + 1 }
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }))
  }, [shifts])


  /* ─── Loading ─── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${c.staff}40` }}>
          <FileText size={32} color="white" />
        </div>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.3 }} />
      </div>
      <p style={{ color: dk.textMuted, fontSize: 14, fontWeight: 600 }}>Loading notes...</p>
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
      <Orb color="#f59e0b" size={280} bottom="15%" left="-60px" delay={2} />
      <Orb color="#10b981" size={200} top="45%" right="8%" delay={3.5} />
      <Orb color="#ef4444" size={160} bottom="30%" left="40%" delay={5} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>


        {/* ══════════ HERO ══════════ */}
        <div style={stg(0)}>
          <div style={{ borderRadius: 24, padding: '32px 28px', position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${c.staff} 0%, ${c.staffHover} 40%, #14b8a6 70%, #06b6d4 100%)` }}>
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
                  <ClipboardList size={13} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Compliance</span>
                </div>
                {(pending > 0 || overdue > 0) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: overdue > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.35)', backdropFilter: 'blur(8px)' }}>
                    <AlertTriangle size={13} style={{ color: 'rgba(255,255,255,0.9)' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{pending + overdue} need attention</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h1 style={{ fontSize: 32, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15 }}>Notes & Compliance</h1>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>Shift notes tracking and NDIS compliance audit</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
                {[
                  { icon: Layers, text: `${shifts.length} total shifts` },
                  { icon: Check, text: `${completed} notes completed`, bg: 'rgba(16,185,129,0.25)' },
                  { icon: Clock, text: `${pending} pending`, bg: pending > 0 ? 'rgba(245,158,11,0.35)' : undefined },
                  { icon: AlertTriangle, text: `${overdue} overdue`, bg: overdue > 0 ? 'rgba(239,68,68,0.3)' : undefined },
                  { icon: Shield, text: `${complianceRate}% compliant` },
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


        {/* ══════════ ALERT BANNER ══════════ */}
        {(pending > 0 || overdue > 0) && (
          <Glass dark={isDark} glow={overdue > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)'} style={{ ...stg(1), padding: '16px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: overdue > 0 ? 'linear-gradient(135deg, #ef4444, #f87171)' : 'linear-gradient(135deg, #f59e0b, #fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: overdue > 0 ? '0 6px 20px -4px rgba(239,68,68,0.4)' : '0 6px 20px -4px rgba(245,158,11,0.4)' }}>
                <AlertTriangle size={22} color="white" />
              </div>
              <div>
                <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>Notes Require Attention</p>
                <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>{pending} pending · {overdue} overdue — Complete within 24hrs of shift completion</p>
              </div>
            </div>
          </Glass>
        )}


        {/* ══════════ STAT CARDS ══════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 14, ...stg(2) }}>
          {[
            { icon: Layers, label: 'Total Shifts', value: shifts.length, grad: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, glow: `${c.staff}25` },
            { icon: Check, label: 'Completed', value: completed, grad: 'linear-gradient(135deg, #10b981, #34d399)', glow: 'rgba(16,185,129,0.2)' },
            { icon: Clock, label: 'Pending', value: pending, grad: 'linear-gradient(135deg, #f59e0b, #fbbf24)', glow: 'rgba(245,158,11,0.2)', pulse: pending > 0 },
            { icon: AlertTriangle, label: 'Overdue', value: overdue, grad: 'linear-gradient(135deg, #ef4444, #f87171)', glow: 'rgba(239,68,68,0.2)', pulse: overdue > 0 },
            { icon: Shield, label: 'Compliance', value: complianceRate, suffix: '%', grad: 'linear-gradient(135deg, #3b82f6, #60a5fa)', glow: 'rgba(59,130,246,0.2)' },
          ].map((card, i) => (
            <Glass key={i} dark={isDark} hover glow={card.glow} style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
              {card.pulse && <div style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: '50%', background: card.label === 'Overdue' ? '#ef4444' : '#f59e0b', animation: 'pulse-dot 2s ease-in-out infinite' }} />}
              <div style={{ width: 42, height: 42, borderRadius: 12, background: card.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 20px -4px ${card.glow}`, marginBottom: 12 }}>
                <card.icon size={20} color="white" />
              </div>
              <p style={{ fontSize: 22, fontWeight: 800, color: dk.text, lineHeight: 1 }} className="count-up">
                <AnimNum value={card.value} />{card.suffix || ''}
              </p>
              <p style={{ fontSize: 11, fontWeight: 600, color: dk.textFaint, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</p>
            </Glass>
          ))}
        </div>


        {/* ══════════ FILTER TABS + SEARCH ══════════ */}
        <Glass dark={isDark} style={{ padding: 6, ...stg(3) }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { key: 'all', icon: Layers, label: 'All', count: shifts.length },
              { key: 'pending', icon: Clock, label: 'Pending', count: pending },
              { key: 'completed', icon: Check, label: 'Completed', count: completed },
              { key: 'overdue', icon: AlertTriangle, label: 'Overdue', count: overdue },
            ].map(t => {
              const isActive = filter === t.key
              return (
                <button key={t.key} onClick={() => setFilter(t.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderRadius: 14, border: 'none',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', flex: '1 1 auto', justifyContent: 'center',
                  transition: 'all .25s cubic-bezier(.16,1,.3,1)',
                  background: isActive ? `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` : 'transparent',
                  color: isActive ? 'white' : dk.textMuted,
                  boxShadow: isActive ? `0 4px 16px -4px ${c.staff}60` : 'none',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = isDark ? 'rgba(51,65,85,0.4)' : 'rgba(0,0,0,0.04)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
                  <t.icon size={15} /> {t.label}
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
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by staff or participant..."
                style={{ ...inputStyle, paddingLeft: 40 }}
                onFocus={e => e.target.style.borderColor = c.staff}
                onBlur={e => e.target.style.borderColor = dk.inputBorder} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: dk.textFaint, padding: '6px 12px', borderRadius: 10, background: dk.subtleBg }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </Glass>


        {/* ══════════ NOTE CARDS ══════════ */}
        {filtered.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((s, i) => {
              const status = noteStatus(s)
              const sc = statusConfig[status]
              const staffName = s.staff ? `${s.staff.first_name} ${s.staff.last_name}` : 'Unassigned'
              const participantName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Unassigned'
              const shiftDate = s.shift_date ? new Date(s.shift_date).toLocaleDateString('en-AU') : '—'
              const startTime = s.start_time ? new Date(s.start_time).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''
              const endTime = s.end_time ? new Date(s.end_time).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''
              const StatusIcon = sc.icon

              return (
                <Glass key={s.id} dark={isDark} hover glow={`${sc.accent}15`}
                  style={{ ...stg(i + 5), padding: '18px 22px', cursor: 'pointer' }}
                  onClick={() => setSelNote(s)}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 4, height: 52, borderRadius: 4, flexShrink: 0, background: `linear-gradient(to bottom, ${sc.accent}, ${sc.accent}60)` }} />
                      <div style={{ width: 46, height: 46, borderRadius: 13, flexShrink: 0, background: sc.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px -4px ${sc.accent}50` }}>
                        <StatusIcon size={20} color="white" />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{participantName}</p>
                        <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>{staffName} · {s.service_type || s.title || 'Shift'}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: dk.textFaint }}>
                            <Calendar size={10} /> {shiftDate}
                          </span>
                          <span style={{ fontSize: 11, color: dk.textFaint }}>{startTime}{endTime ? ` – ${endTime}` : ''}</span>
                          {s.shift_notes?.length > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>{s.shift_notes.length} note{s.shift_notes.length > 1 ? 's' : ''}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <Badge color={sc.badge} dark={isDark}>
                        {status === 'overdue' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', display: 'inline-block', marginRight: 3, animation: 'pulse-dot 2s ease-in-out infinite' }} />}
                        {sc.label}
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
            <div style={{ width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px', background: `linear-gradient(135deg, ${c.staff}15, ${c.staff}05)`, border: `1px solid ${c.staff}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={32} style={{ color: c.staff }} />
            </div>
            <p style={{ color: dk.textMuted, fontWeight: 600, fontSize: 16 }}>{search || filter !== 'all' ? 'No matching notes' : 'No shift notes found'}</p>
            <p style={{ color: dk.textFaint, fontSize: 13, marginTop: 4 }}>{search ? 'Try adjusting your search' : 'Notes will appear when shifts are completed'}</p>
          </Glass>
        )}


        {/* ══════════ INSIGHTS ══════════ */}
        {shifts.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, ...stg(7) }}>

            {/* Status Pie */}
            <Glass dark={isDark} glow={`${c.staff}10`} style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <BarChart3 size={18} style={{ color: c.staff }} />
                <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Note Status</h3>
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
                <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Top Note Submitters</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {topStaffNotes.length > 0 ? topStaffNotes.map((item, i) => {
                  const maxVal = Math.max(...topStaffNotes.map(e => e.count))
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

            {/* Compliance Ring */}
            <Glass dark={isDark} glow="rgba(16,185,129,0.1)" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginBottom: 20 }}>
                <Shield size={18} style={{ color: '#10b981' }} />
                <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Compliance Rate</h3>
              </div>
              {(() => {
                const r = 46, circ = 2 * Math.PI * r, off = circ - (complianceRate / 100) * circ
                const col = complianceRate >= 80 ? '#10b981' : complianceRate >= 50 ? '#f59e0b' : '#ef4444'
                return (<>
                  <div style={{ position: 'relative', width: 110, height: 110 }}>
                    <svg width={110} height={110} style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx={55} cy={55} r={r} fill="none" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'} strokeWidth="8" />
                      <circle cx={55} cy={55} r={r} fill="none" stroke={col} strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={circ} strokeDashoffset={off}
                        style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 4px ${col}40)` }} />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 24, fontWeight: 900, color: col }}>{complianceRate}%</span>
                      <span style={{ fontSize: 9, fontWeight: 600, color: dk.textFaint, textTransform: 'uppercase' }}>compliant</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, marginTop: 16, color: col, textAlign: 'center' }}>
                    {complianceRate >= 90 ? 'Excellent' : complianceRate >= 70 ? 'Needs improvement' : 'Action required'}
                  </p>
                </>)
              })()}
              <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                {[{ label: 'Done', value: completed, color: '#10b981' }, { label: 'Missing', value: pending + overdue, color: '#ef4444' }].map((m, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: m.color }}>{m.value}</p>
                    <p style={{ fontSize: 10, fontWeight: 600, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</p>
                  </div>
                ))}
              </div>
            </Glass>
          </div>
        )}

      </div>


      {/* ══════════ DETAIL MODAL ══════════ */}
      <Modal isOpen={!!selNote} onClose={() => { setSelNote(null); setEditingNote(null) }} title="Shift Note Details" wide>
        {selNote && (() => {
          const status = noteStatus(selNote)
          const sc = statusConfig[status]
          const pName = selNote.participants ? `${selNote.participants.first_name} ${selNote.participants.last_name}` : '—'
          const sName = selNote.staff ? `${selNote.staff.first_name} ${selNote.staff.last_name}` : '—'

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Hero */}
              <div style={{ margin: '-24px -24px 0 -24px', padding: '24px 28px 20px', background: sc.grad, position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
                <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -40, right: -20 }} />
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }} />
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <sc.icon size={26} color="white" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>Shift Note</h3>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{pName} · {sc.label}</p>
                  </div>
                  <Badge color={sc.badge} dark>{sc.label}</Badge>
                </div>
              </div>

              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                {[
                  { label: 'Participant', value: pName, icon: User, color: c.primary },
                  { label: 'Worker', value: sName, icon: Users, color: c.staff },
                  { label: 'Date', value: selNote.shift_date ? new Date(selNote.shift_date).toLocaleDateString('en-AU') : '—', icon: Calendar, color: '#3b82f6' },
                  { label: 'Status', value: selNote.status?.replace('_', ' ') || '—', icon: Activity, color: '#8b5cf6' },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '14px 16px', borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.subtleBg2}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <item.icon size={12} style={{ color: item.color }} />
                      <p style={{ fontSize: 10, fontWeight: 600, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: dk.text }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Notes content */}
              {selNote.shift_notes && selNote.shift_notes.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {selNote.shift_notes.map(note => (
                    <Glass key={note.id} dark={isDark} glow="rgba(20,184,166,0.1)" style={{ padding: '20px 22px', borderColor: isDark ? 'rgba(20,184,166,0.15)' : 'rgba(20,184,166,0.2)' }}>
                      {editingNote === note.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {noteFieldConfig.map(f => (
                            <div key={f.key}>
                              <p style={{ fontSize: 10, fontWeight: 700, color: f.color, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                                <f.icon size={10} /> {f.label}
                              </p>
                              <textarea value={editNoteForm[f.key]} onChange={e => setEditNoteForm({...editNoteForm, [f.key]: e.target.value})} rows={2}
                                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                                onFocus={e => e.target.style.borderColor = f.color}
                                onBlur={e => e.target.style.borderColor = dk.inputBorder} />
                            </div>
                          ))}
                          <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
                            <button onClick={() => setEditingNote(null)} style={{ flex: 1, padding: '12px 0', borderRadius: 12, background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9', border: `1px solid ${dk.inputBorder}`, color: dk.textMuted, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={() => handleSaveNote(note.id)} disabled={savingNote} style={{ flex: 2, padding: '12px 0', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: savingNote ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                              {savingNote ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {savingNote ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </div>
                      ) : (<>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                          <button onClick={() => startEditNote(note)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: c.staff, background: 'none', border: 'none', cursor: 'pointer' }}>
                            <Pencil size={12} /> Edit
                          </button>
                        </div>
                        {noteFieldConfig.filter(f => note[f.key]).map(f => (
                          <div key={f.key} style={{ marginBottom: 12 }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: f.color, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                              <f.icon size={10} /> {f.label}
                            </p>
                            <p style={{ fontSize: 13, color: dk.textSoft, lineHeight: 1.5 }}>{note[f.key]}</p>
                          </div>
                        ))}
                        {note.content && !note.mood && <p style={{ fontSize: 13, color: dk.textSoft, lineHeight: 1.5 }}>{note.content}</p>}
                      </>)}
                    </Glass>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '24px', borderRadius: 16, textAlign: 'center', background: isDark ? 'rgba(245,158,11,0.08)' : '#fffbeb', border: `1px solid ${isDark ? 'rgba(245,158,11,0.2)' : '#fde68a'}` }}>
                  <AlertTriangle size={28} style={{ color: '#f59e0b', margin: '0 auto 8px' }} />
                  <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>Note Not Submitted</p>
                  <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 4 }}>This shift note is {status}</p>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, borderTop: `1px solid ${dk.divider}`, paddingTop: 16 }}>
                <button onClick={() => { setSelNote(null); setEditingNote(null) }} style={{ flex: 1, padding: '14px 0', borderRadius: 14, background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9', border: `1px solid ${dk.inputBorder}`, color: dk.textMuted, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Close</button>
                <button onClick={() => handleDeleteNote(selNote.id)} style={{ padding: '14px 20px', borderRadius: 14, background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : '#fecaca'}`, color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          )
        })()}
      </Modal>

    </div>
  )
}