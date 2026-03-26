import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Plus, Users, Loader2, ChevronRight, ChevronDown, User, Mail, Phone,
  MapPin, Hash, Calendar, Shield, DollarSign, Heart, Activity, AlertTriangle,
  CheckCircle, XCircle, Clock, Eye, Download, LayoutGrid, List, Filter,
  Layers, TrendingUp, Zap, FileText, Briefcase, Star, BarChart3, RefreshCw,
  UserPlus, ShieldCheck
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { getParticipants, createParticipant } from '../services/participantService'
import { useAuth } from '../context/AuthContext'
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
    orange: dark ? { bg: 'rgba(249,115,22,0.15)', text: '#fb923c', border: 'rgba(249,115,22,0.3)' } : { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
    pink: dark ? { bg: 'rgba(236,72,153,0.15)', text: '#f472b6', border: 'rgba(236,72,153,0.3)' } : { bg: '#fdf2f8', text: '#db2777', border: '#fbcfe8' },
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

function ComplianceRing({ score, size = 56, dark = false }) {
  const r = (size - 8) / 2, circ = 2 * Math.PI * r, off = circ - (Math.min(score, 100) / 100) * circ
  const col = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'} strokeWidth="6" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col}
          strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off}
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 4px ${col}40)` }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 900, color: col }}>{Math.round(score)}%</span>
      </div>
    </div>
  )
}


/* ─────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────── */

function formatType(t) { if (!t) return '—'; return t.replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase()) }
function daysUntil(d) { if (!d) return null; return Math.ceil((new Date(d) - new Date()) / 86400000) }


/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

export default function Participants() {
  const c = useBrandColors()
  const { isDark } = useTheme()
  const { user } = useAuth()
  const [loaded, setLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [allParticipants, setAllParticipants] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [fundingFilter, setFundingFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [newParticipant, setNewParticipant] = useState({
    first_name: '', last_name: '', ndis_number: '', phone: '', email: '', address: '',
    funding_type: '', date_of_birth: '', gender: '', emergency_contact_name: '',
    emergency_contact_phone: '', emergency_contact_relationship: '',
    plan_start_date: '', plan_end_date: '', plan_budget: '', notes: '',
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

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 200); return () => clearTimeout(t) }, [search])


  /* ═══════════════════════════════════════════════
     ALL BACKEND — 100% PRESERVED
     ═══════════════════════════════════════════════ */

  useEffect(() => { loadParticipants() }, [])
  useEffect(() => { if (!loading) requestAnimationFrame(() => setLoaded(true)) }, [loading])

  async function loadParticipants() {
    try { const data = await getParticipants(); setAllParticipants(data) }
    catch (err) { console.error('Failed to load participants:', err) }
    finally { setLoading(false) }
  }

  const filtered = useMemo(() => {
    return allParticipants.filter(p => {
      const name = `${p.first_name} ${p.last_name}`.toLowerCase()
      const q = debouncedSearch.toLowerCase()
      if (!name.includes(q) && !(p.ndis_number && p.ndis_number.includes(debouncedSearch))) return false
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (fundingFilter !== 'all' && p.funding_type !== fundingFilter) return false
      return true
    })
  }, [allParticipants, debouncedSearch, statusFilter, fundingFilter])

  const handleAddParticipant = async () => {
    if (!newParticipant.first_name || !newParticipant.last_name) { alert('Please fill in first and last name'); return }
    setSaving(true)
    try {
      const created = await createParticipant({
        org_id: user.org_id, first_name: newParticipant.first_name, last_name: newParticipant.last_name,
        ndis_number: newParticipant.ndis_number || null, phone: newParticipant.phone || null,
        email: newParticipant.email || null, address: newParticipant.address || null,
        funding_type: newParticipant.funding_type || null, date_of_birth: newParticipant.date_of_birth || null,
        gender: newParticipant.gender || null, emergency_contact_name: newParticipant.emergency_contact_name || null,
        emergency_contact_phone: newParticipant.emergency_contact_phone || null,
        emergency_contact_relationship: newParticipant.emergency_contact_relationship || null,
        plan_start_date: newParticipant.plan_start_date || null, plan_end_date: newParticipant.plan_end_date || null,
        plan_budget: newParticipant.plan_budget ? parseFloat(newParticipant.plan_budget) : null,
        notes: newParticipant.notes || null, status: 'active',
      })
      setAllParticipants([created, ...allParticipants]); setShowAdd(false)
      setNewParticipant({ first_name: '', last_name: '', ndis_number: '', phone: '', email: '', address: '', funding_type: '', date_of_birth: '', gender: '', emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relationship: '', plan_start_date: '', plan_end_date: '', plan_budget: '', notes: '' })
    } catch (err) { console.error('Failed to create participant:', err); alert('Failed to add participant: ' + err.message) }
    finally { setSaving(false) }
  }

  const handleChange = (e) => { setNewParticipant({ ...newParticipant, [e.target.name]: e.target.value }) }


  /* ── Stats ── */
  const activeCount = allParticipants.filter(p => p.status === 'active').length
  const inactiveCount = allParticipants.filter(p => p.status === 'inactive').length
  const pendingCount = allParticipants.filter(p => p.status === 'pending').length
  const totalBudget = allParticipants.filter(p => p.plan_budget && p.status === 'active').reduce((s, p) => s + parseFloat(p.plan_budget), 0)
  const expiringPlans = allParticipants.filter(p => { const d = daysUntil(p.plan_end_date); return d !== null && d >= 0 && d <= 30 }).length
  const withNDIS = allParticipants.filter(p => p.ndis_number).length
  const ndisRate = allParticipants.length > 0 ? Math.round((withNDIS / allParticipants.length) * 100) : 0

  /* ── Charts ── */
  const statusPie = useMemo(() => [
    { name: 'Active', value: activeCount, color: '#10b981' },
    { name: 'Inactive', value: inactiveCount, color: '#ef4444' },
    { name: 'Pending', value: pendingCount, color: '#f59e0b' },
  ].filter(s => s.value > 0), [activeCount, inactiveCount, pendingCount])

  const fundingBreakdown = useMemo(() => {
    const map = {}
    allParticipants.forEach(p => { const t = p.funding_type || 'Not Set'; map[t] = (map[t] || 0) + 1 })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [allParticipants])

  const uniqueFundingTypes = useMemo(() => {
    return [...new Set(allParticipants.map(p => p.funding_type).filter(Boolean))]
  }, [allParticipants])


  /* ─── Loading ─── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${c.primary}40` }}>
          <Users size={32} color="white" />
        </div>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.3 }} />
      </div>
      <p style={{ color: dk.textMuted, fontSize: 14, fontWeight: 600 }}>Loading participants...</p>
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
      <Orb color="#ec4899" size={280} bottom="15%" left="-60px" delay={2} />
      <Orb color="#3b82f6" size={200} top="45%" right="8%" delay={3.5} />
      <Orb color="#f59e0b" size={160} bottom="30%" left="40%" delay={5} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>


        {/* ══════════ HERO ══════════ */}
        <div style={stg(0)}>
          <div style={{ borderRadius: 24, padding: '32px 28px', position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 35%, #ec4899 65%, #f59e0b 100%)` }}>
            <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: -80, right: -40 }} />
            <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -50, left: '25%' }} />
            <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent)', top: 30, left: '55%', animation: 'orbFloat 8s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.5 }} />
            {[{ top: '15%', right: '20%', s: 4, d: 0 }, { top: '60%', right: '10%', s: 3, d: 1.5 }, { bottom: '25%', left: '35%', s: 5, d: 3 }, { top: '35%', left: '12%', s: 2, d: 2 }].map((dot, i) => (
              <div key={i} style={{ position: 'absolute', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', width: dot.s * 2, height: dot.s * 2, top: dot.top, right: dot.right, bottom: dot.bottom, left: dot.left, animation: `orbFloat ${4 + dot.d}s ease-in-out infinite ${dot.d}s` }} />
            ))}

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                  <Heart size={13} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Care Management</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', animation: 'pulse-dot 2s ease-in-out infinite' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{activeCount} Active</span>
                </div>
                {expiringPlans > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(245,158,11,0.35)', backdropFilter: 'blur(8px)' }}>
                    <AlertTriangle size={13} style={{ color: 'rgba(255,255,255,0.9)' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{expiringPlans} plans expiring</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h1 style={{ fontSize: 32, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15 }}>Participants</h1>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>Manage NDIS participants, plans, and funding</p>
                </div>
                <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 16, border: 'none', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}>
                  <UserPlus size={18} /> Add Participant
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
                {[
                  { icon: Users, text: `${allParticipants.length} total` },
                  { icon: CheckCircle, text: `${activeCount} active`, bg: 'rgba(16,185,129,0.25)' },
                  { icon: Shield, text: `${withNDIS} with NDIS#` },
                  { icon: DollarSign, text: `$${Math.round(totalBudget).toLocaleString()} budgeted`, bg: 'rgba(16,185,129,0.2)' },
                  { icon: AlertTriangle, text: `${expiringPlans} plans expiring`, bg: expiringPlans > 0 ? 'rgba(245,158,11,0.35)' : undefined },
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


        {/* ══════════ STAT CARDS ══════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, ...stg(1) }}>
          {[
            { icon: Users, label: 'Total', value: allParticipants.length, grad: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, glow: `${c.primary}35` },
            { icon: CheckCircle, label: 'Active', value: activeCount, grad: 'linear-gradient(135deg, #10b981, #34d399)', glow: 'rgba(16,185,129,0.2)' },
            { icon: Clock, label: 'Pending', value: pendingCount, grad: 'linear-gradient(135deg, #f59e0b, #fbbf24)', glow: 'rgba(245,158,11,0.2)' },
            { icon: DollarSign, label: 'Total Budget', value: Math.round(totalBudget), prefix: '$', grad: 'linear-gradient(135deg, #ec4899, #f472b6)', glow: 'rgba(236,72,153,0.2)' },
            { icon: Shield, label: 'NDIS Linked', value: withNDIS, grad: 'linear-gradient(135deg, #3b82f6, #60a5fa)', glow: 'rgba(59,130,246,0.2)' },
            { icon: AlertTriangle, label: 'Plans Expiring', value: expiringPlans, grad: 'linear-gradient(135deg, #f97316, #fb923c)', glow: 'rgba(249,115,22,0.2)', pulse: expiringPlans > 0 },
          ].map((card, i) => (
            <Glass key={i} dark={isDark} hover glow={card.glow} style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
              {card.pulse && <div style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: '50%', background: '#f97316', animation: 'pulse-dot 2s ease-in-out infinite' }} />}
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


        {/* ══════════ SEARCH + FILTERS ══════════ */}
        <Glass dark={isDark} style={{ ...stg(2), padding: '14px 18px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or NDIS number..."
                style={{ ...inputStyle, paddingLeft: 40 }}
                onFocus={e => e.target.style.borderColor = c.primary}
                onBlur={e => e.target.style.borderColor = dk.inputBorder} />
            </div>
            <div style={{ position: 'relative' }}>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: '11px 36px 11px 14px', background: dk.inputBg, border: `1px solid ${dk.inputBorder}`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none', appearance: 'none', cursor: 'pointer', minWidth: 120 }}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint, pointerEvents: 'none' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <select value={fundingFilter} onChange={e => setFundingFilter(e.target.value)}
                style={{ padding: '11px 36px 11px 14px', background: dk.inputBg, border: `1px solid ${dk.inputBorder}`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none', appearance: 'none', cursor: 'pointer', minWidth: 140 }}>
                <option value="all">All Funding</option>
                {uniqueFundingTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint, pointerEvents: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 4, background: dk.subtleBg, borderRadius: 10, padding: 3 }}>
              {[{ key: 'grid', icon: LayoutGrid }, { key: 'list', icon: List }].map(v => (
                <button key={v.key} onClick={() => setViewMode(v.key)} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: viewMode === v.key ? `linear-gradient(135deg, ${c.primary}, ${c.adminHover})` : 'transparent', color: viewMode === v.key ? 'white' : dk.textFaint, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .2s' }}>
                  <v.icon size={16} />
                </button>
              ))}
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: dk.textFaint, padding: '6px 12px', borderRadius: 10, background: dk.subtleBg }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </Glass>


        {/* ══════════ PARTICIPANT GRID ══════════ */}
        {filtered.length > 0 ? (
          <div style={{
            display: viewMode === 'grid' ? 'grid' : 'flex',
            gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : undefined,
            flexDirection: viewMode === 'list' ? 'column' : undefined,
            gap: viewMode === 'grid' ? 14 : 10,
            ...stg(3),
          }}>
            {filtered.map((p, i) => {
              const planDays = daysUntil(p.plan_end_date)
              const planExpiring = planDays !== null && planDays >= 0 && planDays <= 30
              const statusColor = p.status === 'active' ? '#10b981' : p.status === 'inactive' ? '#ef4444' : '#f59e0b'

              return (
                <Link key={p.id} to={`/admin/participants/${p.id}`} style={{ textDecoration: 'none' }}>
                  <Glass dark={isDark} hover
                    glow={planExpiring ? 'rgba(245,158,11,0.12)' : `${c.primary}10`}
                    style={{ padding: viewMode === 'grid' ? '20px' : '16px 20px', position: 'relative', overflow: 'hidden' }}>
                    {/* Accent bar */}
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderRadius: '0 4px 4px 0', background: `linear-gradient(to bottom, ${statusColor}, ${statusColor}60)` }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingLeft: 8 }}>
                      {/* Avatar */}
                      <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: 15, fontWeight: 800,
                        boxShadow: `0 4px 16px -4px ${c.primary}40`, flexShrink: 0,
                      }}>
                        {p.first_name?.[0]}{p.last_name?.[0]}
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{p.first_name} {p.last_name}</p>
                        <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Shield size={11} /> NDIS: {p.ndis_number || 'Not set'}
                        </p>
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                          <Badge color={p.status === 'active' ? 'green' : p.status === 'inactive' ? 'red' : 'amber'} dark={isDark}>
                            {p.status === 'active' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block', marginRight: 3, animation: 'pulse-dot 2s ease-in-out infinite' }} />}
                            {formatType(p.status)}
                          </Badge>
                          {p.funding_type && <Badge color="orange" dark={isDark}>{p.funding_type}</Badge>}
                          {planExpiring && <Badge color="amber" dark={isDark}>{planDays}d left</Badge>}
                          {p.plan_budget && <Badge color="pink" dark={isDark}>${parseFloat(p.plan_budget).toLocaleString()}</Badge>}
                        </div>
                      </div>
                      <ChevronRight size={18} style={{ color: dk.textFaint, flexShrink: 0 }} />
                    </div>
                  </Glass>
                </Link>
              )
            })}
          </div>
        ) : (
          <Glass dark={isDark} style={{ ...stg(3), padding: '56px 24px', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px', background: `linear-gradient(135deg, ${c.primary}15, ${c.primary}05)`, border: `1px solid ${c.primary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={32} style={{ color: c.primary }} />
            </div>
            <p style={{ color: dk.textMuted, fontWeight: 600, fontSize: 16 }}>{search || statusFilter !== 'all' || fundingFilter !== 'all' ? 'No participants found' : 'No participants yet. Add your first one!'}</p>
            <p style={{ color: dk.textFaint, fontSize: 13, marginTop: 4 }}>{search ? 'Try adjusting your filters' : 'Click "Add Participant" to get started'}</p>
          </Glass>
        )}


        {/* ══════════ INSIGHTS ══════════ */}
        {allParticipants.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, ...stg(4) }}>

            {/* Status Pie */}
            <Glass dark={isDark} glow={`${c.primary}10`} style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Activity size={18} style={{ color: c.primary }} />
                <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Status Breakdown</h3>
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

            {/* Funding Types */}
            <Glass dark={isDark} glow="rgba(236,72,153,0.1)" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <DollarSign size={18} style={{ color: '#ec4899' }} />
                <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Funding Types</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {fundingBreakdown.map((item, i) => {
                  const maxVal = Math.max(...fundingBreakdown.map(e => e.value))
                  const pct = Math.round((item.value / maxVal) * 100)
                  const colors = [c.primary, '#ec4899', '#3b82f6', '#10b981', '#f59e0b']
                  const col = colors[i % colors.length]
                  return (<div key={item.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: dk.textSoft }}>{item.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: col }}>{item.value}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, overflow: 'hidden', background: dk.subtleBg2 }}>
                      <div style={{ height: '100%', borderRadius: 999, width: `${pct}%`, background: col, transition: 'width 1s cubic-bezier(.16,1,.3,1)' }} />
                    </div>
                  </div>)
                })}
              </div>
            </Glass>

            {/* NDIS Coverage */}
            <Glass dark={isDark} glow="rgba(59,130,246,0.1)" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginBottom: 20 }}>
                <ShieldCheck size={18} style={{ color: '#3b82f6' }} />
                <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>NDIS Coverage</h3>
              </div>
              <ComplianceRing score={ndisRate} size={110} dark={isDark} />
              <p style={{ fontSize: 13, fontWeight: 600, marginTop: 16, textAlign: 'center', color: ndisRate >= 90 ? '#10b981' : ndisRate >= 70 ? '#f59e0b' : '#ef4444' }}>
                {ndisRate >= 90 ? 'Excellent coverage' : ndisRate >= 70 ? 'Good coverage' : 'Needs attention'}
              </p>
              <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                {[
                  { label: 'Linked', value: withNDIS, color: '#3b82f6' },
                  { label: 'Missing', value: allParticipants.length - withNDIS, color: '#ef4444' },
                ].map((m, i) => (
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


      {/* ══════════ ADD MODAL ══════════ */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New Participant" wide>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Hero */}
          <div style={{ margin: '-24px -24px 0 -24px', padding: '28px 28px 22px', background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 40%, #ec4899 100%)`, position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
            <div style={{ position: 'absolute', width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -40, right: -20 }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserPlus size={26} color="white" />
              </div>
              <div><h3 style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>New Participant</h3><p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Add a new NDIS participant to your system</p></div>
            </div>
          </div>

          {/* Personal Details */}
          <div style={{ padding: '0 4px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${c.primary}20, ${c.primary}08)`, border: `1px solid ${c.primary}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={14} style={{ color: c.primary }} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: dk.text }}>Personal Details</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {[
                { label: 'First Name *', name: 'first_name', icon: User },
                { label: 'Last Name *', name: 'last_name', icon: User },
                { label: 'NDIS Number', name: 'ndis_number', icon: Hash },
                { label: 'Date of Birth', name: 'date_of_birth', type: 'date', icon: Calendar },
                { label: 'Phone', name: 'phone', type: 'tel', icon: Phone },
                { label: 'Email', name: 'email', type: 'email', icon: Mail },
              ].map(f => (
                <div key={f.name}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><f.icon size={11} /> {f.label}</p>
                  <input name={f.name} type={f.type || 'text'} value={newParticipant[f.name]} onChange={handleChange} placeholder={f.label.replace(' *', '')}
                    style={inputStyle} onFocus={e => e.target.style.borderColor = c.primary} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
                </div>
              ))}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><User size={11} /> Gender</p>
                <select name="gender" value={newParticipant.gender} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option><option value="Non-binary">Non-binary</option><option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={11} /> Address</p>
                <input name="address" value={newParticipant.address} onChange={handleChange} placeholder="Full address"
                  style={inputStyle} onFocus={e => e.target.style.borderColor = c.primary} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
              </div>
            </div>

            {/* Emergency Contact */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={14} style={{ color: '#ef4444' }} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: dk.text }}>Emergency Contact</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {[
                { label: 'Contact Name', name: 'emergency_contact_name', icon: User },
                { label: 'Contact Phone', name: 'emergency_contact_phone', type: 'tel', icon: Phone },
                { label: 'Relationship', name: 'emergency_contact_relationship', icon: Heart },
              ].map(f => (
                <div key={f.name}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><f.icon size={11} /> {f.label}</p>
                  <input name={f.name} type={f.type || 'text'} value={newParticipant[f.name]} onChange={handleChange} placeholder={f.label}
                    style={inputStyle} onFocus={e => e.target.style.borderColor = '#ef4444'} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
                </div>
              ))}
            </div>

            {/* NDIS Plan */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(236,72,153,0.05))', border: '1px solid rgba(236,72,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={14} style={{ color: '#ec4899' }} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: dk.text }}>NDIS Plan</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><Briefcase size={11} /> Funding Type</p>
                <select name="funding_type" value={newParticipant.funding_type} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Select...</option><option value="Self Managed">Self Managed</option><option value="Plan Managed">Plan Managed</option><option value="NDIA Managed">NDIA Managed</option>
                </select>
              </div>
              {[
                { label: 'Plan Start', name: 'plan_start_date', type: 'date', icon: Calendar },
                { label: 'Plan End', name: 'plan_end_date', type: 'date', icon: Calendar },
                { label: 'Budget ($)', name: 'plan_budget', type: 'number', icon: DollarSign },
              ].map(f => (
                <div key={f.name}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><f.icon size={11} /> {f.label}</p>
                  <input name={f.name} type={f.type} value={newParticipant[f.name]} onChange={handleChange} placeholder={f.label}
                    style={inputStyle} onFocus={e => e.target.style.borderColor = '#ec4899'} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
                </div>
              ))}
            </div>

            {/* Notes */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><FileText size={11} /> Notes</p>
              <textarea name="notes" value={newParticipant.notes} onChange={handleChange} rows={3} placeholder="Additional notes..."
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = c.primary} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12, borderTop: `1px solid ${dk.divider}`, paddingTop: 16 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '15px 0', borderRadius: 14, background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9', border: `1px solid ${dk.inputBorder}`, color: dk.textMuted, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAddParticipant} disabled={saving} style={{ flex: 2, padding: '15px 0', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 8px 28px -6px ${c.primary}50`, opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {saving ? <><Loader2 size={16} className="animate-spin" /> Adding...</> : <><UserPlus size={16} /> Add Participant</>}
              </button>
            </div>
          </div>
        </div>
      </Modal>

    </div>
  )
}