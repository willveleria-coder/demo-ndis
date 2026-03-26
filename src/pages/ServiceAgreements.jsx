import { useState, useEffect, useRef, useMemo } from 'react'
import {
  FileSignature, Plus, Loader2, Search, AlertTriangle, CheckCircle, Clock,
  Calendar, Trash2, Download, Eye, RefreshCw, ChevronRight, ChevronDown,
  Activity, Shield, DollarSign, TrendingUp, Users, Zap, Hash, FileText,
  BarChart3, Filter, ArrowRight, XCircle, Briefcase, Star, Timer,
  PieChart as PieIcon, Sparkles, Building2, Award, Target, Layers
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
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

function AnimNum({ value, duration = 900, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef()
  useEffect(() => {
    const num = typeof value === 'number' ? value : parseFloat(value) || 0
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
  }
  const p = palettes[color] || palettes.gray
  return (<span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
    background: p.bg, color: p.text, border: `1px solid ${p.border}`,
    whiteSpace: 'nowrap',
  }}>{children}</span>)
}

function ComplianceRing({ score, size = 56, dark = false, label }) {
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
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 900, color: col }}>{Math.round(score)}%</span>
        {label && <span style={{ fontSize: 7, fontWeight: 600, color: dark ? '#64748b' : '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>}
      </div>
    </div>
  )
}


/* ─────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────── */

function formatDate(iso) { if (!iso) return '—'; return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) }
function formatDateShort(iso) { if (!iso) return '—'; return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) }
function daysUntil(dateStr) { if (!dateStr) return null; return Math.ceil((new Date(dateStr) - new Date()) / 86400000) }

function agreementStatus(a) {
  if (a.status === 'terminated') return { label: 'Terminated', color: 'gray' }
  if (a.status === 'draft') return { label: 'Draft', color: 'blue' }
  const days = daysUntil(a.end_date)
  if (days !== null && days < 0) return { label: 'Expired', color: 'red' }
  if (days !== null && days <= 30) return { label: `Expiring ${days}d`, color: 'amber' }
  if (a.status === 'active' || a.signed_date) return { label: 'Active', color: 'green' }
  return { label: 'Pending', color: 'blue' }
}

const statusGradients = {
  green: 'linear-gradient(135deg, #10b981, #34d399)',
  amber: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
  red: 'linear-gradient(135deg, #ef4444, #f87171)',
  blue: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
  gray: 'linear-gradient(135deg, #94a3b8, #cbd5e1)',
  purple: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
}

const statusColors = { green: '#10b981', amber: '#f59e0b', red: '#ef4444', blue: '#3b82f6', gray: '#94a3b8', purple: '#8b5cf6' }

const SERVICE_TYPES = ['Assistance with Daily Life', 'Community Participation', 'Assistance with Social & Community Participation', 'Improved Living Arrangements', 'Increased Social & Community Participation', 'Finding & Keeping a Job', 'Improved Relationships', 'Improved Health & Wellbeing', 'Improved Learning', 'Improved Life Choices', 'Improved Daily Living Skills', 'Accommodation / Tenancy', 'Behaviour Support', 'Therapeutic Supports', 'Transport', 'Other']


/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

export default function ServiceAgreements() {
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [agreements, setAgreements] = useState([])
  const [participants, setParticipants] = useState([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [showDetail, setShowDetail] = useState(null)
  const [saving, setSaving] = useState(false)
  const [newAgreement, setNewAgreement] = useState({ participant_id: '', service_type: '', start_date: '', end_date: '', hourly_rate: '', weekly_hours: '', total_budget: '', notes: '', status: 'draft' })

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
          <span style={{ fontSize: 13, fontWeight: 800, color: dk.text }}>{typeof p.value === 'number' && p.value > 100 ? '$' + p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>)
  }


  /* ═══════════════════════════════════════════════
     ALL BACKEND — 100% PRESERVED
     ═══════════════════════════════════════════════ */

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [agreeRes, partRes] = await Promise.all([
        supabase.from('service_agreements').select('*, participants(id, first_name, last_name)').order('created_at', { ascending: false }),
        supabase.from('participants').select('id, first_name, last_name, status'),
      ])
      setAgreements(agreeRes.data || [])
      setParticipants((partRes.data || []).filter(p => p.status === 'active'))
    } catch (err) { console.error('Service agreements load error:', err) }
    finally { setLoading(false); setTimeout(() => setLoaded(true), 50) }
  }

  const handleCreate = async () => {
    if (!newAgreement.participant_id || !newAgreement.service_type || !newAgreement.start_date) { alert('Please fill in participant, service type, and start date'); return }
    setSaving(true)
    try {
      const payload = { ...newAgreement }
      if (payload.hourly_rate) payload.hourly_rate = parseFloat(payload.hourly_rate); else delete payload.hourly_rate
      if (payload.weekly_hours) payload.weekly_hours = parseFloat(payload.weekly_hours); else delete payload.weekly_hours
      if (payload.total_budget) payload.total_budget = parseFloat(payload.total_budget); else delete payload.total_budget
      if (!payload.end_date) delete payload.end_date
      const { data, error } = await supabase.from('service_agreements').insert(payload).select('*, participants(id, first_name, last_name)').single()
      if (error) throw error
      setAgreements([data, ...agreements])
      setShowAdd(false)
      setNewAgreement({ participant_id: '', service_type: '', start_date: '', end_date: '', hourly_rate: '', weekly_hours: '', total_budget: '', notes: '', status: 'draft' })
    } catch (err) { alert('Failed to create: ' + (err.message || 'Unknown error')) }
    finally { setSaving(false) }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      const updates = { status: newStatus }
      if (newStatus === 'active') updates.signed_date = new Date().toISOString().split('T')[0]
      const { error } = await supabase.from('service_agreements').update(updates).eq('id', id)
      if (error) throw error
      setAgreements(agreements.map(a => a.id === id ? { ...a, ...updates } : a))
      if (showDetail?.id === id) setShowDetail(prev => ({ ...prev, ...updates }))
    } catch (err) { alert('Failed to update: ' + (err.message || 'Unknown error')) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this service agreement?')) return
    try {
      const { error } = await supabase.from('service_agreements').delete().eq('id', id)
      if (error) throw error
      setAgreements(agreements.filter(a => a.id !== id))
      setShowDetail(null)
    } catch (err) { alert('Failed to delete: ' + (err.message || 'Unknown error')) }
  }


  /* ── Filtering ── */
  const filtered = useMemo(() => {
    return agreements.filter(a => {
      if (filterStatus !== 'all') {
        const st = agreementStatus(a)
        if (filterStatus === 'expiring' && st.color !== 'amber' && st.color !== 'red') return false
        if (filterStatus === 'active' && st.color !== 'green') return false
        if (filterStatus === 'draft' && a.status !== 'draft') return false
        if (filterStatus === 'terminated' && a.status !== 'terminated') return false
      }
      if (search) {
        const q = search.toLowerCase()
        const pName = a.participants ? `${a.participants.first_name} ${a.participants.last_name}`.toLowerCase() : ''
        return pName.includes(q) || (a.service_type || '').toLowerCase().includes(q)
      }
      return true
    })
  }, [agreements, filterStatus, search])

  /* ── Stats ── */
  const activeCount = agreements.filter(a => agreementStatus(a).color === 'green').length
  const expiringCount = agreements.filter(a => { const s = agreementStatus(a); return s.color === 'amber' || s.color === 'red' }).length
  const draftCount = agreements.filter(a => a.status === 'draft').length
  const terminatedCount = agreements.filter(a => a.status === 'terminated').length
  const totalBudget = agreements.filter(a => agreementStatus(a).color === 'green').reduce((sum, a) => sum + (parseFloat(a.total_budget) || 0), 0)
  const avgRate = (() => {
    const rates = agreements.filter(a => a.hourly_rate && agreementStatus(a).color === 'green').map(a => parseFloat(a.hourly_rate))
    return rates.length ? Math.round(rates.reduce((s, r) => s + r, 0) / rates.length) : 0
  })()
  const coverageRate = agreements.length > 0 ? Math.round((activeCount / agreements.length) * 100) : 0

  /* ── Chart data ── */
  const statusPie = useMemo(() => [
    { name: 'Active', value: activeCount, color: '#10b981' },
    { name: 'Expiring', value: expiringCount, color: '#f59e0b' },
    { name: 'Draft', value: draftCount, color: '#3b82f6' },
    { name: 'Terminated', value: terminatedCount, color: '#94a3b8' },
  ].filter(s => s.value > 0), [activeCount, expiringCount, draftCount, terminatedCount])

  const serviceTypeBreakdown = useMemo(() => {
    const map = {}
    agreements.filter(a => agreementStatus(a).color === 'green').forEach(a => {
      const t = (a.service_type || 'Other').length > 20 ? (a.service_type || 'Other').slice(0, 20) + '...' : (a.service_type || 'Other')
      map[t] = (map[t] || 0) + 1
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }))
  }, [agreements])

  const budgetByService = useMemo(() => {
    const map = {}
    agreements.filter(a => agreementStatus(a).color === 'green' && a.total_budget).forEach(a => {
      const t = (a.service_type || 'Other').length > 18 ? (a.service_type || 'Other').slice(0, 18) + '...' : (a.service_type || 'Other')
      map[t] = (map[t] || 0) + parseFloat(a.total_budget)
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value: Math.round(value) }))
  }, [agreements])

  /* ── Upcoming expirations ── */
  const upcomingExpirations = useMemo(() => {
    return agreements
      .filter(a => { const d = daysUntil(a.end_date); return d !== null && d >= 0 && d <= 90 && agreementStatus(a).color !== 'gray' })
      .sort((a, b) => daysUntil(a.end_date) - daysUntil(b.end_date))
      .slice(0, 5)
  }, [agreements])


  /* ─── Loading ─── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${c.primary}40` }}>
          <FileSignature size={32} color="white" />
        </div>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.3 }} />
      </div>
      <p style={{ color: dk.textMuted, fontSize: 14, fontWeight: 600 }}>Loading agreements...</p>
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

      <Orb color={c.primary} size={380} top="-100px" right="-80px" delay={0} />
      <Orb color="#10b981" size={280} bottom="15%" left="-60px" delay={2} />
      <Orb color="#f59e0b" size={200} top="45%" right="8%" delay={3.5} />
      <Orb color="#3b82f6" size={160} bottom="30%" left="40%" delay={5} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>


        {/* ══════════ HERO BANNER ══════════ */}
        <div style={stg(0)}>
          <div style={{ borderRadius: 24, padding: '32px 28px', position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 40%, #3b82f6 70%, #06b6d4 100%)` }}>
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
                  <FileSignature size={13} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>NDIS Agreements</span>
                </div>
                {expiringCount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(239,68,68,0.3)', backdropFilter: 'blur(8px)' }}>
                    <AlertTriangle size={13} style={{ color: 'rgba(255,255,255,0.9)' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{expiringCount} need attention</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h1 style={{ fontSize: 32, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15 }}>Service Agreements</h1>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>Manage participant agreements, budgets, and service allocations</p>
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
                    <Plus size={18} /> New Agreement
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
                {[
                  { icon: Layers, text: `${agreements.length} total` },
                  { icon: CheckCircle, text: `${activeCount} active`, bg: 'rgba(16,185,129,0.25)' },
                  { icon: AlertTriangle, text: `${expiringCount} expiring`, bg: expiringCount > 0 ? 'rgba(245,158,11,0.35)' : undefined },
                  { icon: FileText, text: `${draftCount} drafts` },
                  { icon: DollarSign, text: `$${totalBudget.toLocaleString()} budgeted`, bg: 'rgba(16,185,129,0.2)' },
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


        {/* ══════════ EXPIRING ALERT ══════════ */}
        {expiringCount > 0 && (
          <Glass dark={isDark} glow="rgba(245,158,11,0.15)" style={{ ...stg(1), padding: '16px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px -4px rgba(245,158,11,0.4)' }}>
                <AlertTriangle size={22} color="white" />
              </div>
              <div>
                <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>Agreements Need Attention</p>
                <p style={{ fontSize: 13, color: dk.textMuted, marginTop: 2 }}>{expiringCount} agreement{expiringCount > 1 ? 's' : ''} expiring or expired. Review and renew to maintain continuity of care.</p>
              </div>
            </div>
          </Glass>
        )}


        {/* ══════════ STAT CARDS ══════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, ...stg(2) }}>
          {[
            { icon: CheckCircle, label: 'Active', value: activeCount, grad: 'linear-gradient(135deg, #10b981, #34d399)', glow: 'rgba(16,185,129,0.2)' },
            { icon: AlertTriangle, label: 'Expiring', value: expiringCount, grad: 'linear-gradient(135deg, #f59e0b, #fbbf24)', glow: 'rgba(245,158,11,0.2)' },
            { icon: FileText, label: 'Drafts', value: draftCount, grad: 'linear-gradient(135deg, #3b82f6, #60a5fa)', glow: 'rgba(59,130,246,0.2)' },
            { icon: DollarSign, label: 'Active Budget', value: totalBudget, prefix: '$', grad: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, glow: `${c.primary}35` },
            { icon: TrendingUp, label: 'Avg Rate', value: avgRate, prefix: '$', suffix: '/hr', grad: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', glow: 'rgba(139,92,246,0.2)' },
            { icon: Target, label: 'Coverage', value: coverageRate, suffix: '%', grad: 'linear-gradient(135deg, #06b6d4, #22d3ee)', glow: 'rgba(6,182,212,0.2)' },
          ].map((card, i) => (
            <Glass key={i} dark={isDark} hover glow={card.glow} style={{ padding: '18px 20px' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: card.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 20px -4px ${card.glow}`, marginBottom: 12 }}>
                <card.icon size={20} color="white" />
              </div>
              <p style={{ fontSize: 22, fontWeight: 800, color: dk.text, lineHeight: 1 }} className="count-up">
                <AnimNum value={card.value} prefix={card.prefix || ''} suffix={card.suffix || ''} />
              </p>
              <p style={{ fontSize: 11, fontWeight: 600, color: dk.textFaint, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</p>
            </Glass>
          ))}
        </div>


        {/* ══════════ TAB FILTER + SEARCH ══════════ */}
        <Glass dark={isDark} style={{ padding: 6, ...stg(3) }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { key: 'all', icon: Layers, label: 'All', count: agreements.length },
              { key: 'active', icon: CheckCircle, label: 'Active', count: activeCount },
              { key: 'expiring', icon: AlertTriangle, label: 'Expiring', count: expiringCount },
              { key: 'draft', icon: FileText, label: 'Drafts', count: draftCount },
              { key: 'terminated', icon: XCircle, label: 'Ended', count: terminatedCount },
            ].map(t => {
              const isActive = filterStatus === t.key
              return (
                <button key={t.key} onClick={() => setFilterStatus(t.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderRadius: 14, border: 'none',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', flex: '1 1 auto', justifyContent: 'center',
                  transition: 'all .25s cubic-bezier(.16,1,.3,1)',
                  background: isActive ? `linear-gradient(135deg, ${c.primary}, ${c.adminHover})` : 'transparent',
                  color: isActive ? 'white' : dk.textMuted,
                  boxShadow: isActive ? `0 4px 16px -4px ${c.primary}60` : 'none',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = isDark ? 'rgba(51,65,85,0.4)' : 'rgba(0,0,0,0.04)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
                  <t.icon size={15} />
                  <span className="hidden sm:inline">{t.label}</span>
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
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by participant or service type..."
                style={{ ...inputStyle, paddingLeft: 40 }}
                onFocus={e => e.target.style.borderColor = c.primary}
                onBlur={e => e.target.style.borderColor = dk.inputBorder} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: dk.textFaint, padding: '6px 12px', borderRadius: 10, background: dk.subtleBg }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </Glass>


        {/* ══════════ AGREEMENT CARDS ══════════ */}
        {filtered.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((a, i) => {
              const pName = a.participants ? `${a.participants.first_name} ${a.participants.last_name}` : 'Unknown'
              const st = agreementStatus(a)
              const sc = statusColors[st.color] || '#94a3b8'
              const sg = statusGradients[st.color] || statusGradients.gray
              const days = daysUntil(a.end_date)

              return (
                <Glass key={a.id} dark={isDark} hover glow={`${sc}15`}
                  style={{ ...stg(i + 5), padding: '20px 22px', cursor: 'pointer' }}
                  onClick={() => setShowDetail(a)}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                      {/* Accent bar */}
                      <div style={{ width: 4, height: 56, borderRadius: 4, flexShrink: 0, background: `linear-gradient(to bottom, ${sc}, ${sc}60)` }} />
                      {/* Icon */}
                      <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: sg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px -4px ${sc}50` }}>
                        <FileSignature size={22} color="white" />
                      </div>
                      {/* Content */}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{pName}</p>
                          {a.total_budget && <span style={{ fontSize: 12, fontWeight: 800, color: sc }}>${parseFloat(a.total_budget).toLocaleString()}</span>}
                        </div>
                        <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 3 }}>{a.service_type}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: dk.textFaint }}>
                            <Calendar size={11} /> {formatDateShort(a.start_date)} – {a.end_date ? formatDateShort(a.end_date) : 'Ongoing'}
                          </span>
                          {a.hourly_rate && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: dk.textFaint }}>
                            <DollarSign size={10} /> ${a.hourly_rate}/hr
                          </span>}
                          {a.weekly_hours && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: dk.textFaint }}>
                            <Clock size={10} /> {a.weekly_hours}hrs/wk
                          </span>}
                          {days !== null && days >= 0 && days <= 30 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>
                              <Timer size={10} /> {days}d left
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <Badge color={st.color} dark={isDark}>
                        {st.color === 'green' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block', marginRight: 3, animation: 'pulse-dot 2s ease-in-out infinite' }} />}
                        {st.label}
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
            <div style={{ width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px', background: `linear-gradient(135deg, ${c.primary}15, ${c.primary}05)`, border: `1px solid ${c.primary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileSignature size={32} style={{ color: c.primary }} />
            </div>
            <p style={{ color: dk.textMuted, fontWeight: 600, fontSize: 16 }}>{search || filterStatus !== 'all' ? 'No matching agreements' : 'No service agreements yet'}</p>
            <p style={{ color: dk.textFaint, fontSize: 13, marginTop: 4 }}>{search ? 'Try adjusting your search' : 'Click "New Agreement" to get started'}</p>
          </Glass>
        )}


        {/* ══════════ INSIGHTS ══════════ */}
        {agreements.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, ...stg(6) }}>

            {/* Status Pie */}
            <Glass dark={isDark} glow={`${c.primary}10`} style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <PieIcon size={18} style={{ color: c.primary }} />
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

            {/* Service Types */}
            <Glass dark={isDark} glow="rgba(59,130,246,0.1)" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Briefcase size={18} style={{ color: '#3b82f6' }} />
                <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Top Service Types</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {serviceTypeBreakdown.length > 0 ? serviceTypeBreakdown.map((item, i) => {
                  const maxVal = Math.max(...serviceTypeBreakdown.map(e => e.value))
                  const pct = Math.round((item.value / maxVal) * 100)
                  const colors = [c.primary, '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']
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
                }) : <p style={{ fontSize: 13, color: dk.textFaint }}>No active agreements</p>}
              </div>
            </Glass>

            {/* Coverage + Upcoming Expirations */}
            <Glass dark={isDark} glow="rgba(16,185,129,0.1)" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <Target size={18} style={{ color: '#10b981' }} />
                <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Coverage & Renewals</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
                <ComplianceRing score={coverageRate} size={80} dark={isDark} label="active" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: '#10b981' }} />
                    <span style={{ fontSize: 12, color: dk.textMuted }}>Active</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: dk.text, marginLeft: 'auto' }}>{activeCount}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: '#f59e0b' }} />
                    <span style={{ fontSize: 12, color: dk.textMuted }}>Expiring</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: dk.text, marginLeft: 'auto' }}>{expiringCount}</span>
                  </div>
                </div>
              </div>
              {upcomingExpirations.length > 0 && (
                <>
                  <div style={{ borderTop: `1px solid ${dk.divider}`, paddingTop: 14 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Upcoming Renewals</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {upcomingExpirations.map(a => {
                        const d = daysUntil(a.end_date)
                        const pN = a.participants ? `${a.participants.first_name} ${a.participants.last_name}` : '—'
                        return (
                          <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 12px', borderRadius: 10, background: dk.subtleBg }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: dk.textSoft }}>{pN}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: d <= 14 ? '#ef4444' : '#f59e0b' }}>{d}d</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </Glass>
          </div>
        )}

        {/* Budget by service bar chart */}
        {budgetByService.length > 0 && (
          <Glass dark={isDark} glow={`${c.primary}10`} style={{ ...stg(7), padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <BarChart3 size={18} style={{ color: c.primary }} />
              <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Budget by Service Type</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={budgetByService} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={dk.divider} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: dk.textFaint }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: dk.textFaint }} axisLine={false} tickLine={false} tickFormatter={v => '$' + (v/1000).toFixed(0) + 'k'} />
                <Tooltip content={<CT />} />
                <Bar dataKey="value" name="Budget" radius={[8, 8, 0, 0]} fill={c.primary} />
              </BarChart>
            </ResponsiveContainer>
          </Glass>
        )}

      </div>


      {/* ══════════ ADD MODAL ══════════ */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="New Service Agreement" wide>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ margin: '-24px -24px 0 -24px', padding: '28px 28px 22px', background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 50%, #3b82f6 100%)`, position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
            <div style={{ position: 'absolute', width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -40, right: -20 }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileSignature size={26} color="white" />
              </div>
              <div><h3 style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>New Agreement</h3><p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Create a service agreement for a participant</p></div>
            </div>
          </div>

          <div style={{ padding: '0 4px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Participant + Service Type (full width) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${c.primary}20, ${c.primary}08)`, border: `1px solid ${c.primary}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={14} style={{ color: c.primary }} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: dk.text }}>Agreement Details</p>
            </div>

            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><Users size={11} /> Participant *</p>
              <select value={newAgreement.participant_id} onChange={e => setNewAgreement({...newAgreement, participant_id: e.target.value})} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Select participant...</option>
                {participants.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
              </select>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><Briefcase size={11} /> Service Type *</p>
              <select value={newAgreement.service_type} onChange={e => setNewAgreement({...newAgreement, service_type: e.target.value})} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Select service type...</option>
                {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {[
                { label: 'Start Date *', key: 'start_date', type: 'date', icon: Calendar },
                { label: 'End Date', key: 'end_date', type: 'date', icon: Calendar },
                { label: 'Hourly Rate ($)', key: 'hourly_rate', type: 'number', icon: DollarSign, placeholder: '55.00', step: '0.01' },
                { label: 'Weekly Hours', key: 'weekly_hours', type: 'number', icon: Clock, placeholder: '10', step: '0.5' },
                { label: 'Total Budget ($)', key: 'total_budget', type: 'number', icon: DollarSign, placeholder: '25000', step: '0.01' },
                { label: 'Status', key: 'status', type: 'select', icon: Activity },
              ].map(f => (
                <div key={f.key}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><f.icon size={11} /> {f.label}</p>
                  {f.type === 'select' ? (
                    <select value={newAgreement[f.key]} onChange={e => setNewAgreement({...newAgreement, [f.key]: e.target.value})} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="draft">Draft</option><option value="active">Active</option>
                    </select>
                  ) : (
                    <input type={f.type} step={f.step} value={newAgreement[f.key]} onChange={e => setNewAgreement({...newAgreement, [f.key]: e.target.value})} placeholder={f.placeholder || ''} style={inputStyle}
                      onFocus={e => e.target.style.borderColor = c.primary} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
                  )}
                </div>
              ))}
            </div>

            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><FileText size={11} /> Notes</p>
              <textarea value={newAgreement.notes} onChange={e => setNewAgreement({...newAgreement, notes: e.target.value})} rows={3}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = c.primary} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
            </div>

            <div style={{ display: 'flex', gap: 12, borderTop: `1px solid ${dk.divider}`, paddingTop: 16 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '15px 0', borderRadius: 14, background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9', border: `1px solid ${dk.inputBorder}`, color: dk.textMuted, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreate} disabled={saving} style={{ flex: 2, padding: '15px 0', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 8px 28px -6px ${c.primary}50`, opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {saving ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><Plus size={16} /> Create Agreement</>}
              </button>
            </div>
          </div>
        </div>
      </Modal>


      {/* ══════════ DETAIL MODAL ══════════ */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Agreement Details" wide>
        {showDetail && (() => {
          const st = agreementStatus(showDetail)
          const sc = statusColors[st.color] || '#94a3b8'
          const sg = statusGradients[st.color] || statusGradients.gray
          const pName = showDetail.participants ? `${showDetail.participants.first_name} ${showDetail.participants.last_name}` : 'Unknown'
          const days = daysUntil(showDetail.end_date)

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Hero header */}
              <div style={{ margin: '-24px -24px 0 -24px', padding: '24px 28px 20px', background: sg, position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
                <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -40, right: -20 }} />
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileSignature size={26} color="white" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{pName}</h3>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{showDetail.service_type}</p>
                    </div>
                    <Badge color={st.color} dark>{st.label}</Badge>
                  </div>
                </div>
              </div>

              {/* Detail grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                {[
                  { label: 'Start Date', value: formatDate(showDetail.start_date), icon: Calendar, color: '#3b82f6' },
                  { label: 'End Date', value: showDetail.end_date ? formatDate(showDetail.end_date) : 'Ongoing', icon: Calendar, color: '#8b5cf6' },
                  showDetail.signed_date && { label: 'Signed', value: formatDate(showDetail.signed_date), icon: CheckCircle, color: '#10b981' },
                  showDetail.hourly_rate && { label: 'Hourly Rate', value: `$${showDetail.hourly_rate}`, icon: DollarSign, color: c.primary },
                  showDetail.weekly_hours && { label: 'Weekly Hours', value: `${showDetail.weekly_hours}hrs`, icon: Clock, color: '#f59e0b' },
                  showDetail.total_budget && { label: 'Total Budget', value: `$${parseFloat(showDetail.total_budget).toLocaleString()}`, icon: DollarSign, color: '#10b981' },
                  days !== null && days >= 0 && { label: 'Days Left', value: `${days} days`, icon: Timer, color: days <= 14 ? '#ef4444' : '#f59e0b' },
                ].filter(Boolean).map((item, i) => (
                  <div key={i} style={{
                    padding: '14px 16px', borderRadius: 14,
                    background: dk.subtleBg, border: `1px solid ${dk.subtleBg2}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <item.icon size={12} style={{ color: item.color }} />
                      <p style={{ fontSize: 10, fontWeight: 600, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: dk.text }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Notes */}
              {showDetail.notes && (
                <div style={{ padding: '16px', borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.subtleBg2}` }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Notes</p>
                  <p style={{ fontSize: 14, color: dk.textSoft, lineHeight: 1.5 }}>{showDetail.notes}</p>
                </div>
              )}

              {/* Budget utilization bar (visual only) */}
              {showDetail.total_budget && showDetail.weekly_hours && showDetail.hourly_rate && (
                <div style={{ padding: '16px', borderRadius: 14, background: isDark ? `rgba(124,58,237,0.06)` : '#f5f3ff', border: `1px solid ${isDark ? 'rgba(124,58,237,0.15)' : '#ddd6fe'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Estimated Duration</p>
                    <p style={{ fontSize: 13, fontWeight: 800, color: c.primary }}>
                      {Math.round(parseFloat(showDetail.total_budget) / (parseFloat(showDetail.hourly_rate) * parseFloat(showDetail.weekly_hours)))} weeks
                    </p>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, overflow: 'hidden', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                    <div style={{ height: '100%', borderRadius: 999, width: '100%', background: `linear-gradient(90deg, ${c.primary}, ${c.adminHover})`, transition: 'width 1s cubic-bezier(.16,1,.3,1)' }} />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, borderTop: `1px solid ${dk.divider}`, paddingTop: 16, flexWrap: 'wrap' }}>
                {showDetail.status === 'draft' && (
                  <button onClick={() => handleStatusChange(showDetail.id, 'active')} style={{
                    flex: '1 1 auto', padding: '14px 0', borderRadius: 14, border: 'none',
                    background: 'linear-gradient(135deg, #10b981, #14b8a6)',
                    color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 6px 24px -6px rgba(16,185,129,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                    <CheckCircle size={16} /> Mark Active / Signed
                  </button>
                )}
                {showDetail.status === 'active' && (
                  <button onClick={() => handleStatusChange(showDetail.id, 'terminated')} style={{
                    flex: '1 1 auto', padding: '14px 0', borderRadius: 14,
                    background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9',
                    border: `1px solid ${dk.inputBorder}`, color: dk.textMuted,
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                    <XCircle size={16} /> Terminate
                  </button>
                )}
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
                  padding: '14px 24px', borderRadius: 14,
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