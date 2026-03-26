import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Shield, Plus, Loader2, Search, AlertTriangle, Clock, User, FileText, Trash2,
  Eye, ChevronRight, ChevronDown, Activity, Zap, Timer, Hash, Calendar,
  CheckCircle, XCircle, Layers, BarChart3, TrendingUp, RefreshCw, Lock,
  AlertCircle, Briefcase, Flag, BookOpen, ClipboardList
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
    purple: dark ? { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa', border: 'rgba(139,92,246,0.3)' } : { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
    blue: dark ? { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' } : { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    orange: dark ? { bg: 'rgba(249,115,22,0.15)', text: '#fb923c', border: 'rgba(249,115,22,0.3)' } : { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
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
   HELPERS & CONSTANTS
   ───────────────────────────────────────────── */

function formatDate(iso) { if (!iso) return '—'; return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) }
function daysUntil(dateStr) { if (!dateStr) return null; return Math.ceil((new Date(dateStr) - new Date()) / 86400000) }

const PRACTICE_TYPES = [
  { value: 'seclusion', label: 'Seclusion', desc: 'Sole confinement in a room or area from which free exit is prevented', icon: Lock, color: '#ef4444' },
  { value: 'chemical_restraint', label: 'Chemical Restraint', desc: 'Use of medication for behaviour control (not prescribed treatment)', icon: AlertCircle, color: '#f97316' },
  { value: 'physical_restraint', label: 'Physical Restraint', desc: 'Use of physical force to restrict movement', icon: Shield, color: '#dc2626' },
  { value: 'mechanical_restraint', label: 'Mechanical Restraint', desc: 'Use of devices to restrict movement', icon: Lock, color: '#be123c' },
  { value: 'environmental_restraint', label: 'Environmental Restraint', desc: 'Restricting access to objects, activities, or areas', icon: Shield, color: '#9333ea' },
]

const AUTHORISATION_STATUS = [
  { value: 'authorised', label: 'Authorised', color: 'green', accent: '#10b981', grad: 'linear-gradient(135deg, #10b981, #34d399)' },
  { value: 'pending_authorisation', label: 'Pending Authorisation', color: 'amber', accent: '#f59e0b', grad: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
  { value: 'unauthorised', label: 'Unauthorised', color: 'red', accent: '#ef4444', grad: 'linear-gradient(135deg, #ef4444, #f87171)' },
  { value: 'ceased', label: 'Ceased', color: 'gray', accent: '#94a3b8', grad: 'linear-gradient(135deg, #94a3b8, #cbd5e1)' },
]

function getAuth(status) { return AUTHORISATION_STATUS.find(x => x.value === status) || AUTHORISATION_STATUS[1] }
function getType(type) { return PRACTICE_TYPES.find(x => x.value === type) || { label: type, desc: '', icon: Shield, color: '#ef4444' } }


/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

export default function RestrictivePractices() {
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [practices, setPractices] = useState([])
  const [participants, setParticipants] = useState([])
  const [staffList, setStaffList] = useState([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterAuth, setFilterAuth] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [showDetail, setShowDetail] = useState(null)
  const [saving, setSaving] = useState(false)
  const [newPractice, setNewPractice] = useState({
    participant_id: '', practice_type: '', description: '', reason: '',
    authorisation_status: 'pending_authorisation', authorised_by: '', authorisation_date: '',
    review_date: '', behaviour_support_plan: '', conditions: '', reported_by: '',
    incident_date: new Date().toISOString().split('T')[0], duration_minutes: '', outcome: '',
  })

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

  useEffect(() => { loadData() }, [])
  useEffect(() => { if (!loading) setTimeout(() => setLoaded(true), 50) }, [loading])

  const loadData = async () => {
    try {
      const [practRes, partRes, staffRes] = await Promise.all([
        supabase.from('restrictive_practices').select('*, participants(id, first_name, last_name), reporter:reported_by(first_name, last_name)').order('incident_date', { ascending: false }),
        supabase.from('participants').select('id, first_name, last_name, status'),
        supabase.from('staff').select('id, first_name, last_name, status'),
      ])
      setPractices(practRes.data || [])
      setParticipants((partRes.data || []).filter(p => p.status === 'active'))
      setStaffList((staffRes.data || []).filter(s => s.status === 'active'))
    } catch (err) { console.error('Restrictive practices load error:', err) }
    finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!newPractice.participant_id || !newPractice.practice_type || !newPractice.description) { alert('Please fill in participant, practice type, and description'); return }
    setSaving(true)
    try {
      const payload = { ...newPractice }
      if (payload.duration_minutes) payload.duration_minutes = parseInt(payload.duration_minutes); else delete payload.duration_minutes
      if (!payload.authorisation_date) delete payload.authorisation_date
      if (!payload.review_date) delete payload.review_date
      if (!payload.reported_by) delete payload.reported_by
      const { data, error } = await supabase.from('restrictive_practices').insert(payload).select('*, participants(id, first_name, last_name), reporter:reported_by(first_name, last_name)').single()
      if (error) throw error
      setPractices([data, ...practices])
      setShowAdd(false)
      setNewPractice({ participant_id: '', practice_type: '', description: '', reason: '', authorisation_status: 'pending_authorisation', authorised_by: '', authorisation_date: '', review_date: '', behaviour_support_plan: '', conditions: '', reported_by: '', incident_date: new Date().toISOString().split('T')[0], duration_minutes: '', outcome: '' })
    } catch (err) { console.error('Create failed:', err); alert('Failed to create: ' + (err.message || 'Unknown error')) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this restrictive practice record?')) return
    try {
      const { error } = await supabase.from('restrictive_practices').delete().eq('id', id)
      if (error) throw error
      setPractices(practices.filter(p => p.id !== id))
      setShowDetail(null)
    } catch (err) { alert('Failed to delete: ' + (err.message || 'Unknown error')) }
  }


  /* ── Filtering ── */
  const filtered = useMemo(() => {
    return practices.filter(p => {
      if (filterType !== 'all' && p.practice_type !== filterType) return false
      if (filterAuth !== 'all' && p.authorisation_status !== filterAuth) return false
      if (search) {
        const q = search.toLowerCase()
        const pName = p.participants ? `${p.participants.first_name} ${p.participants.last_name}`.toLowerCase() : ''
        return pName.includes(q) || (p.description || '').toLowerCase().includes(q) || (p.practice_type || '').toLowerCase().includes(q)
      }
      return true
    })
  }, [practices, filterType, filterAuth, search])

  /* ── Stats ── */
  const unauthorisedCount = practices.filter(p => p.authorisation_status === 'unauthorised').length
  const pendingCount = practices.filter(p => p.authorisation_status === 'pending_authorisation').length
  const authorisedCount = practices.filter(p => p.authorisation_status === 'authorised').length
  const reviewDue = practices.filter(p => { if (!p.review_date) return false; return daysUntil(p.review_date) <= 30 }).length
  const avgDuration = (() => {
    const durations = practices.filter(p => p.duration_minutes).map(p => parseInt(p.duration_minutes))
    return durations.length ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length) : 0
  })()

  /* ── Charts ── */
  const authPie = useMemo(() => AUTHORISATION_STATUS.map(s => ({
    name: s.label, value: practices.filter(p => p.authorisation_status === s.value).length, color: s.accent,
  })).filter(s => s.value > 0), [practices])

  const typePie = useMemo(() => PRACTICE_TYPES.map(t => ({
    name: t.label, value: practices.filter(p => p.practice_type === t.value).length, color: t.color,
  })).filter(s => s.value > 0), [practices])

  const upcomingReviews = useMemo(() => {
    return practices.filter(p => p.review_date && daysUntil(p.review_date) >= 0 && daysUntil(p.review_date) <= 90)
      .sort((a, b) => daysUntil(a.review_date) - daysUntil(b.review_date)).slice(0, 5)
  }, [practices])


  /* ─── Loading ─── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(239,68,68,0.4)' }}>
          <Shield size={32} color="white" />
        </div>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.3 }} />
      </div>
      <p style={{ color: dk.textMuted, fontSize: 14, fontWeight: 600 }}>Loading practices...</p>
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
        @keyframes countUp { from { opacity:0;transform:translateY(8px) scale(0.95) } to { opacity:1;transform:translateY(0) scale(1) } }
        .count-up { animation: countUp .7s cubic-bezier(.16,1,.3,1) forwards }
      `}</style>

      <Orb color="#ef4444" size={380} top="-100px" right="-80px" delay={0} />
      <Orb color="#f59e0b" size={280} bottom="15%" left="-60px" delay={2} />
      <Orb color="#8b5cf6" size={200} top="45%" right="8%" delay={3.5} />
      <Orb color="#dc2626" size={160} bottom="30%" left="40%" delay={5} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>


        {/* ══════════ HERO ══════════ */}
        <div style={stg(0)}>
          <div style={{ borderRadius: 24, padding: '32px 28px', position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 30%, #ef4444 60%, #dc2626 100%)` }}>
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
                  <Shield size={13} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>NDIS Compliance</span>
                </div>
                {unauthorisedCount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)' }}>
                    <AlertTriangle size={13} style={{ color: 'rgba(255,255,255,0.95)' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>{unauthorisedCount} unauthorised</span>
                  </div>
                )}
                {pendingCount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(245,158,11,0.35)', backdropFilter: 'blur(8px)' }}>
                    <Clock size={13} style={{ color: 'rgba(255,255,255,0.9)' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{pendingCount} pending</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h1 style={{ fontSize: 32, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15 }}>Restrictive Practices</h1>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>NDIS reportable register — document, authorise, and review</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={loadData} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderRadius: 16, border: 'none', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}>
                    <RefreshCw size={16} />
                  </button>
                  <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 16, border: 'none', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}>
                    <Plus size={18} /> Record Practice
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
                {[
                  { icon: Layers, text: `${practices.length} total records` },
                  { icon: CheckCircle, text: `${authorisedCount} authorised`, bg: 'rgba(16,185,129,0.3)' },
                  { icon: Clock, text: `${pendingCount} pending`, bg: pendingCount > 0 ? 'rgba(245,158,11,0.35)' : undefined },
                  { icon: XCircle, text: `${unauthorisedCount} unauthorised`, bg: unauthorisedCount > 0 ? 'rgba(255,255,255,0.25)' : undefined },
                  { icon: Calendar, text: `${reviewDue} reviews due` },
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


        {/* ══════════ NDIS COMPLIANCE BANNER ══════════ */}
        <Glass dark={isDark} glow="rgba(239,68,68,0.12)" style={{ ...stg(1), padding: '16px 22px', borderColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px -4px rgba(239,68,68,0.4)' }}>
              <Shield size={22} color="white" />
            </div>
            <div>
              <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>NDIS Restrictive Practices Reporting</p>
              <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>All restrictive practices must be authorised, regularly reviewed, and reported to the NDIS Commission. Unauthorised practices must be reported within 5 business days.</p>
            </div>
          </div>
        </Glass>


        {/* ══════════ STAT CARDS ══════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, ...stg(2) }}>
          {[
            { icon: Layers, label: 'Total Records', value: practices.length, grad: 'linear-gradient(135deg, #ef4444, #f43f5e)', glow: 'rgba(239,68,68,0.2)' },
            { icon: XCircle, label: 'Unauthorised', value: unauthorisedCount, grad: 'linear-gradient(135deg, #dc2626, #ef4444)', glow: 'rgba(220,38,38,0.25)', pulse: unauthorisedCount > 0 },
            { icon: Clock, label: 'Pending Auth', value: pendingCount, grad: 'linear-gradient(135deg, #f59e0b, #fbbf24)', glow: 'rgba(245,158,11,0.2)' },
            { icon: CheckCircle, label: 'Authorised', value: authorisedCount, grad: 'linear-gradient(135deg, #10b981, #34d399)', glow: 'rgba(16,185,129,0.2)' },
            { icon: Calendar, label: 'Reviews Due', value: reviewDue, grad: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', glow: 'rgba(139,92,246,0.2)' },
            { icon: Timer, label: 'Avg Duration', value: avgDuration, suffix: 'm', grad: 'linear-gradient(135deg, #3b82f6, #60a5fa)', glow: 'rgba(59,130,246,0.2)' },
          ].map((card, i) => (
            <Glass key={i} dark={isDark} hover glow={card.glow} style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
              {card.pulse && <div style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse-dot 2s ease-in-out infinite' }} />}
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


        {/* ══════════ SEARCH + FILTERS ══════════ */}
        <Glass dark={isDark} style={{ ...stg(3), padding: '14px 18px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records..."
                style={{ ...inputStyle, paddingLeft: 40 }}
                onFocus={e => e.target.style.borderColor = '#ef4444'}
                onBlur={e => e.target.style.borderColor = dk.inputBorder} />
            </div>
            <div style={{ position: 'relative' }}>
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                style={{ padding: '11px 36px 11px 14px', background: dk.inputBg, border: `1px solid ${dk.inputBorder}`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none', appearance: 'none', cursor: 'pointer', minWidth: 160 }}>
                <option value="all">All Types</option>
                {PRACTICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint, pointerEvents: 'none' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <select value={filterAuth} onChange={e => setFilterAuth(e.target.value)}
                style={{ padding: '11px 36px 11px 14px', background: dk.inputBg, border: `1px solid ${dk.inputBorder}`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none', appearance: 'none', cursor: 'pointer', minWidth: 160 }}>
                <option value="all">All Status</option>
                {AUTHORISATION_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint, pointerEvents: 'none' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: dk.textFaint, padding: '6px 12px', borderRadius: 10, background: dk.subtleBg }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </Glass>


        {/* ══════════ PRACTICE CARDS ══════════ */}
        {filtered.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((p, i) => {
              const pName = p.participants ? `${p.participants.first_name} ${p.participants.last_name}` : 'Unknown'
              const typeInfo = getType(p.practice_type)
              const authInfo = getAuth(p.authorisation_status)
              const reviewDays = daysUntil(p.review_date)
              const TypeIcon = typeInfo.icon

              return (
                <Glass key={p.id} dark={isDark} hover glow={`${authInfo.accent}15`}
                  style={{ ...stg(i + 4), padding: '20px 22px', cursor: 'pointer' }}
                  onClick={() => setShowDetail(p)}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 4, height: 56, borderRadius: 4, flexShrink: 0, background: `linear-gradient(to bottom, ${authInfo.accent}, ${authInfo.accent}60)` }} />
                      <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: authInfo.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px -4px ${authInfo.accent}50` }}>
                        <TypeIcon size={22} color="white" />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{typeInfo.label}</p>
                        <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: dk.textFaint }}>
                            <User size={10} /> {pName}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: dk.textFaint }}>
                            <Calendar size={10} /> {formatDate(p.incident_date)}
                          </span>
                          {p.duration_minutes && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: dk.textFaint }}>
                            <Timer size={10} /> {p.duration_minutes}min
                          </span>}
                          {reviewDays !== null && reviewDays >= 0 && reviewDays <= 30 && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: reviewDays <= 7 ? '#ef4444' : '#f59e0b' }}>Review in {reviewDays}d</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <Badge color={authInfo.color} dark={isDark}>
                        {authInfo.color === 'red' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', display: 'inline-block', marginRight: 3, animation: 'pulse-dot 2s ease-in-out infinite' }} />}
                        {authInfo.label}
                      </Badge>
                      <ChevronRight size={16} style={{ color: dk.textFaint }} />
                    </div>
                  </div>
                </Glass>
              )
            })}
          </div>
        ) : (
          <Glass dark={isDark} style={{ ...stg(4), padding: '56px 24px', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px', background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.04))', border: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={32} style={{ color: '#ef4444' }} />
            </div>
            <p style={{ color: dk.textMuted, fontWeight: 600, fontSize: 16 }}>{search || filterType !== 'all' || filterAuth !== 'all' ? 'No matching records' : 'No restrictive practices recorded'}</p>
            <p style={{ color: dk.textFaint, fontSize: 13, marginTop: 4 }}>{search ? 'Try adjusting your filters' : 'Records will appear here when documented'}</p>
          </Glass>
        )}


        {/* ══════════ INSIGHTS ══════════ */}
        {practices.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, ...stg(6) }}>

            {/* Auth Status Pie */}
            <Glass dark={isDark} glow="rgba(239,68,68,0.1)" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Shield size={18} style={{ color: '#ef4444' }} />
                <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Authorisation Status</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <ResponsiveContainer width={120} height={120}>
                  <PieChart><Pie data={authPie} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} stroke="none">
                    {authPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie><Tooltip content={<CT />} /></PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {authPie.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
                      <span style={{ fontSize: 12, color: dk.textMuted }}>{s.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: dk.text, marginLeft: 'auto' }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Glass>

            {/* Practice Types */}
            <Glass dark={isDark} glow="rgba(139,92,246,0.1)" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <BarChart3 size={18} style={{ color: '#8b5cf6' }} />
                <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Practice Types</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {typePie.length > 0 ? typePie.map((item, i) => {
                  const maxVal = Math.max(...typePie.map(e => e.value))
                  const pct = Math.round((item.value / maxVal) * 100)
                  return (<div key={item.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: dk.textSoft }}>{item.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: item.color }}>{item.value}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, overflow: 'hidden', background: dk.subtleBg2 }}>
                      <div style={{ height: '100%', borderRadius: 999, width: `${pct}%`, background: item.color, transition: 'width 1s cubic-bezier(.16,1,.3,1)' }} />
                    </div>
                  </div>)
                }) : <p style={{ fontSize: 13, color: dk.textFaint }}>No data</p>}
              </div>
            </Glass>

            {/* Upcoming Reviews */}
            <Glass dark={isDark} glow="rgba(245,158,11,0.1)" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <Calendar size={18} style={{ color: '#f59e0b' }} />
                <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Upcoming Reviews</h3>
              </div>
              {upcomingReviews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {upcomingReviews.map(p => {
                    const d = daysUntil(p.review_date)
                    const pN = p.participants ? `${p.participants.first_name} ${p.participants.last_name}` : '—'
                    const tI = getType(p.practice_type)
                    return (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: dk.subtleBg, border: `1px solid ${dk.subtleBg2}` }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${tI.color}15`, border: `1px solid ${tI.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <tI.icon size={14} style={{ color: tI.color }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: dk.textSoft }}>{pN}</p>
                          <p style={{ fontSize: 11, color: dk.textFaint }}>{tI.label}</p>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: d <= 7 ? '#ef4444' : d <= 14 ? '#f59e0b' : '#10b981', flexShrink: 0 }}>{d}d</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: dk.textFaint, textAlign: 'center', padding: '20px 0' }}>No upcoming reviews</p>
              )}
            </Glass>
          </div>
        )}

      </div>


      {/* ══════════ ADD MODAL ══════════ */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Record Restrictive Practice" wide>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Hero */}
          <div style={{ margin: '-24px -24px 0 -24px', padding: '24px 28px 20px', background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 50%, #ef4444 100%)`, position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
            <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -40, right: -20 }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={26} color="white" />
              </div>
              <div><h3 style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>Record Practice</h3><p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Document a restrictive practice for NDIS reporting</p></div>
            </div>
          </div>

          {/* Compliance warning */}
          <div style={{ padding: '12px 16px', borderRadius: 12, background: isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2', border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : '#fecaca'}`, fontSize: 12, fontWeight: 600, color: isDark ? '#f87171' : '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={14} /> All restrictive practices must be documented, authorised, and reported to the NDIS Commission.
          </div>

          {/* Form */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><User size={11} /> Participant *</p>
              <select value={newPractice.participant_id} onChange={e => setNewPractice({...newPractice, participant_id: e.target.value})} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Select participant...</option>
                {participants.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
              </select>
            </div>
            {[
              { label: 'Practice Type *', key: 'practice_type', type: 'select', icon: Shield, options: PRACTICE_TYPES.map(t => ({ value: t.value, label: t.label })) },
              { label: 'Auth Status', key: 'authorisation_status', type: 'select', icon: CheckCircle, options: AUTHORISATION_STATUS.map(s => ({ value: s.value, label: s.label })) },
              { label: 'Incident Date', key: 'incident_date', type: 'date', icon: Calendar },
              { label: 'Duration (min)', key: 'duration_minutes', type: 'number', icon: Timer, placeholder: '15' },
              { label: 'Reported By', key: 'reported_by', type: 'staffSelect', icon: User },
              { label: 'Authorised By', key: 'authorised_by', type: 'text', icon: User, placeholder: 'Name' },
              { label: 'Authorisation Date', key: 'authorisation_date', type: 'date', icon: Calendar },
              { label: 'Review Date', key: 'review_date', type: 'date', icon: Calendar },
            ].map(f => (
              <div key={f.key}>
                <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><f.icon size={11} /> {f.label}</p>
                {f.type === 'select' ? (
                  <select value={newPractice[f.key]} onChange={e => setNewPractice({...newPractice, [f.key]: e.target.value})} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Select...</option>
                    {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.type === 'staffSelect' ? (
                  <select value={newPractice[f.key]} onChange={e => setNewPractice({...newPractice, [f.key]: e.target.value})} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Select staff...</option>
                    {staffList.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                  </select>
                ) : (
                  <input type={f.type} value={newPractice[f.key]} onChange={e => setNewPractice({...newPractice, [f.key]: e.target.value})} placeholder={f.placeholder || ''} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#ef4444'} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
                )}
                {f.key === 'practice_type' && newPractice.practice_type && (
                  <p style={{ fontSize: 10, color: dk.textFaint, marginTop: 4 }}>{PRACTICE_TYPES.find(t => t.value === newPractice.practice_type)?.desc}</p>
                )}
              </div>
            ))}
          </div>

          {/* Textarea fields */}
          {[
            { label: 'Description *', key: 'description', icon: FileText, rows: 3, placeholder: 'Describe the restrictive practice used...' },
            { label: 'Reason / Trigger', key: 'reason', icon: AlertTriangle, rows: 2 },
            { label: 'Outcome', key: 'outcome', icon: Activity, rows: 2 },
            { label: 'BSP Reference', key: 'behaviour_support_plan', icon: BookOpen, type: 'input' },
            { label: 'Conditions / Safeguards', key: 'conditions', icon: Shield, rows: 2 },
          ].map(f => (
            <div key={f.key}>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><f.icon size={11} /> {f.label}</p>
              {f.type === 'input' ? (
                <input value={newPractice[f.key]} onChange={e => setNewPractice({...newPractice, [f.key]: e.target.value})} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#ef4444'} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
              ) : (
                <textarea value={newPractice[f.key]} onChange={e => setNewPractice({...newPractice, [f.key]: e.target.value})} rows={f.rows || 2} placeholder={f.placeholder || ''}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = '#ef4444'} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
              )}
            </div>
          ))}

          <div style={{ display: 'flex', gap: 12, borderTop: `1px solid ${dk.divider}`, paddingTop: 16 }}>
            <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '15px 0', borderRadius: 14, background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9', border: `1px solid ${dk.inputBorder}`, color: dk.textMuted, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleCreate} disabled={saving} style={{ flex: 2, padding: '15px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 28px -6px rgba(239,68,68,0.5)', opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Shield size={16} /> Record Practice</>}
            </button>
          </div>
        </div>
      </Modal>


      {/* ══════════ DETAIL MODAL ══════════ */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Practice Details" wide>
        {showDetail && (() => {
          const authInfo = getAuth(showDetail.authorisation_status)
          const typeInfo = getType(showDetail.practice_type)
          const pName = showDetail.participants ? `${showDetail.participants.first_name} ${showDetail.participants.last_name}` : 'Unknown'
          const TypeIcon = typeInfo.icon

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Hero */}
              <div style={{ margin: '-24px -24px 0 -24px', padding: '24px 28px 20px', background: authInfo.grad, position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
                <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -40, right: -20 }} />
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TypeIcon size={26} color="white" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{typeInfo.label}</h3>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{pName}</p>
                    </div>
                    <Badge color={authInfo.color} dark>{authInfo.label}</Badge>
                  </div>
                </div>
              </div>

              {/* Detail grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                {[
                  { label: 'Incident Date', value: formatDate(showDetail.incident_date), icon: Calendar, color: '#3b82f6' },
                  showDetail.duration_minutes && { label: 'Duration', value: `${showDetail.duration_minutes} min`, icon: Timer, color: '#8b5cf6' },
                  showDetail.authorised_by && { label: 'Authorised By', value: showDetail.authorised_by, icon: CheckCircle, color: '#10b981' },
                  showDetail.review_date && { label: 'Next Review', value: formatDate(showDetail.review_date), icon: Calendar, color: '#f59e0b' },
                  showDetail.reporter && { label: 'Reported By', value: `${showDetail.reporter.first_name} ${showDetail.reporter.last_name}`, icon: User, color: '#06b6d4' },
                ].filter(Boolean).map((item, i) => (
                  <div key={i} style={{ padding: '14px 16px', borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.subtleBg2}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <item.icon size={12} style={{ color: item.color }} />
                      <p style={{ fontSize: 10, fontWeight: 600, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: dk.text }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Content sections */}
              {[
                { key: 'description', label: 'Description', icon: FileText, color: dk.textFaint, bg: dk.subtleBg, border: dk.subtleBg2 },
                { key: 'reason', label: 'Reason / Trigger', icon: AlertTriangle, color: '#d97706', bg: isDark ? 'rgba(245,158,11,0.06)' : '#fffbeb', border: isDark ? 'rgba(245,158,11,0.15)' : '#fde68a' },
                { key: 'outcome', label: 'Outcome', icon: Activity, color: isDark ? '#60a5fa' : '#2563eb', bg: isDark ? 'rgba(59,130,246,0.06)' : '#eff6ff', border: isDark ? 'rgba(59,130,246,0.15)' : '#bfdbfe' },
                { key: 'behaviour_support_plan', label: 'BSP Reference', icon: BookOpen, color: '#8b5cf6', bg: isDark ? 'rgba(139,92,246,0.06)' : '#f5f3ff', border: isDark ? 'rgba(139,92,246,0.15)' : '#ddd6fe' },
                { key: 'conditions', label: 'Conditions / Safeguards', icon: Shield, color: dk.textFaint, bg: dk.subtleBg, border: dk.subtleBg2 },
              ].filter(f => showDetail[f.key]).map((f, i) => (
                <div key={i} style={{ padding: '16px', borderRadius: 14, background: f.bg, border: `1px solid ${f.border}` }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: f.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <f.icon size={10} /> {f.label}
                  </p>
                  <p style={{ fontSize: 14, color: dk.textSoft, lineHeight: 1.5 }}>{showDetail[f.key]}</p>
                </div>
              ))}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, borderTop: `1px solid ${dk.divider}`, paddingTop: 16 }}>
                <button onClick={() => handleDelete(showDetail.id)} style={{
                  padding: '14px 20px', borderRadius: 14,
                  background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
                  border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : '#fecaca'}`,
                  color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Trash2 size={14} /> Delete
                </button>
                <button onClick={() => setShowDetail(null)} style={{
                  flex: 1, padding: '14px 0', borderRadius: 14,
                  background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9',
                  border: `1px solid ${dk.inputBorder}`, color: dk.textMuted,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}>Close</button>
              </div>
            </div>
          )
        })()}
      </Modal>

    </div>
  )
}