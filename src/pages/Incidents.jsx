import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, Plus, Loader2, Search, Filter, X, Shield, Camera, ChevronRight,
  ChevronDown, Activity, Users, Zap, TrendingUp, BarChart3, Clock, CheckCircle,
  XCircle, Layers, Eye, Calendar, MapPin, User, RefreshCw, Hash, Target, FileText
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { supabase } from '../lib/supabase'
import { useBrandColors } from '../hooks/useBrandColors'
import { useTheme } from '../context/ThemeContext'
import Modal from '../components/ui/Modal'
import PhotoUploader from '../components/PhotoUploader'


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
    purple: dark ? { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa', border: 'rgba(139,92,246,0.3)' } : { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
    orange: dark ? { bg: 'rgba(249,115,22,0.15)', text: '#fb923c', border: 'rgba(249,115,22,0.3)' } : { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
    teal: dark ? { bg: 'rgba(20,184,166,0.15)', text: '#2dd4bf', border: 'rgba(20,184,166,0.3)' } : { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
  }
  const p = palettes[color] || palettes.gray
  return (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: p.bg, color: p.text, border: `1px solid ${p.border}`, whiteSpace: 'nowrap' }}>{children}</span>)
}


/* ─────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────── */

function formatType(str) { if (!str) return '—'; return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }
function severityColor(s) { if (s === 'critical' || s === 'high') return 'red'; if (s === 'medium') return 'amber'; return 'teal' }
function statusColor(s) { if (s === 'resolved' || s === 'closed') return 'green'; if (s === 'under_review' || s === 'investigating') return 'amber'; return 'red' }

const severityConfig = {
  critical: { accent: '#dc2626', grad: 'linear-gradient(135deg, #dc2626, #ef4444)', label: 'Critical' },
  high:     { accent: '#ef4444', grad: 'linear-gradient(135deg, #ef4444, #f87171)', label: 'High' },
  medium:   { accent: '#f59e0b', grad: 'linear-gradient(135deg, #f59e0b, #fbbf24)', label: 'Medium' },
  low:      { accent: '#06b6d4', grad: 'linear-gradient(135deg, #06b6d4, #22d3ee)', label: 'Low' },
}
function getSev(s) { return severityConfig[s] || severityConfig.medium }

const INCIDENT_TYPES = ['incident', 'hazard', 'near_miss', 'concern', 'property_damage', 'medication_error', 'injury', 'behavioural', 'abuse_neglect', 'unauthorized_restrictive_practice']


/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

export default function Incidents() {
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [incidents, setIncidents] = useState([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newIncident, setNewIncident] = useState({ incident_type: '', severity: 'medium', description: '', participant_id: '', location: '', ndis_reportable: false, incident_time: '', photos: [] })
  const [participants, setParticipants] = useState([])

  const dk = {
    text: isDark ? '#e2e8f0' : '#1f2937', textSoft: isDark ? '#cbd5e1' : '#374151',
    textMuted: isDark ? '#94a3b8' : '#6b7280', textFaint: isDark ? '#64748b' : '#9ca3af',
    inputBg: isDark ? 'rgba(30,41,59,0.8)' : 'white', inputBorder: isDark ? 'rgba(51,65,85,0.5)' : '#e5e7eb',
    divider: isDark ? 'rgba(51,65,85,0.3)' : 'rgba(0,0,0,0.05)',
    subtleBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    subtleBg2: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
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
  useEffect(() => {
    async function load() {
      try {
        const [incRes, partRes] = await Promise.all([
          supabase.from('incidents').select('*, participants(id, first_name, last_name), staff:reported_by(id, first_name, last_name)').order('created_at', { ascending: false }),
          supabase.from('participants').select('id, first_name, last_name'),
        ])
        setIncidents(incRes.data || []); setParticipants(partRes.data || [])
      } catch (err) { console.error('Failed to load incidents:', err) }
      finally { setLoading(false); setTimeout(() => setLoaded(true), 50) }
    }
    load()
  }, [])

  const handleCreate = async () => {
    if (!newIncident.incident_type || !newIncident.description) { alert('Please fill in incident type and description'); return }
    setSaving(true)
    try {
      const payload = { incident_type: newIncident.incident_type, severity: newIncident.severity, priority: newIncident.severity, description: newIncident.description, location: newIncident.location || null, ndis_reportable: newIncident.ndis_reportable, status: 'open', incident_date: new Date().toISOString(), incident_time: newIncident.incident_time || new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false }), photos: newIncident.photos || [] }
      if (newIncident.participant_id) payload.participant_id = newIncident.participant_id
      const { data, error } = await supabase.from('incidents').insert(payload).select('*, participants(id, first_name, last_name)').maybeSingle()
      if (error) throw error
      setIncidents([data || payload, ...incidents]); setShowNew(false)
      setNewIncident({ incident_type: '', severity: 'medium', description: '', participant_id: '', location: '', ndis_reportable: false, incident_time: '', photos: [] })
    } catch (err) { alert('Failed to create incident: ' + (err.message || 'Unknown error')) }
    finally { setSaving(false) }
  }


  /* ── Filtering ── */
  const filtered = useMemo(() => {
    return incidents.filter(i => {
      if (filterStatus !== 'all' && i.status !== filterStatus) return false
      if (filterSeverity !== 'all' && i.severity !== filterSeverity) return false
      if (search) { const q = search.toLowerCase(); const pN = i.participants ? `${i.participants.first_name} ${i.participants.last_name}`.toLowerCase() : ''; return (i.incident_type || '').toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q) || pN.includes(q) }
      return true
    })
  }, [incidents, filterStatus, filterSeverity, search])

  /* ── Stats ── */
  const openCount = incidents.filter(i => i.status === 'open' || !i.status).length
  const reportableCount = incidents.filter(i => i.ndis_reportable).length
  const reviewCount = incidents.filter(i => i.status === 'under_review').length
  const resolvedCount = incidents.filter(i => i.status === 'resolved').length
  const criticalCount = incidents.filter(i => i.severity === 'critical' || i.severity === 'high').length

  /* ── Charts ── */
  const severityPie = useMemo(() => [
    { name: 'Critical', value: incidents.filter(i => i.severity === 'critical').length, color: '#dc2626' },
    { name: 'High', value: incidents.filter(i => i.severity === 'high').length, color: '#ef4444' },
    { name: 'Medium', value: incidents.filter(i => i.severity === 'medium').length, color: '#f59e0b' },
    { name: 'Low', value: incidents.filter(i => i.severity === 'low').length, color: '#06b6d4' },
  ].filter(s => s.value > 0), [incidents])

  const statusPie = useMemo(() => [
    { name: 'Open', value: openCount, color: '#ef4444' },
    { name: 'Reviewing', value: reviewCount, color: '#f59e0b' },
    { name: 'Resolved', value: resolvedCount, color: '#10b981' },
  ].filter(s => s.value > 0), [openCount, reviewCount, resolvedCount])

  const typeBreakdown = useMemo(() => {
    const map = {}; incidents.forEach(i => { const t = formatType(i.incident_type) || 'Other'; map[t] = (map[t] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }))
  }, [incidents])


  /* ─── Loading ─── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${c.primary}40` }}><AlertTriangle size={32} color="white" /></div>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.3 }} />
      </div>
      <p style={{ color: dk.textMuted, fontSize: 14, fontWeight: 600 }}>Loading incidents...</p>
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
      <Orb color="#f59e0b" size={280} bottom="15%" left="-60px" delay={2} />
      <Orb color="#ef4444" size={200} top="45%" right="8%" delay={3.5} />
      <Orb color="#10b981" size={160} bottom="30%" left="40%" delay={5} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ══════════ HERO ══════════ */}
        <div style={stg(0)}>
          <div style={{ borderRadius: 24, padding: '28px 24px', position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 35%, #ef4444 65%, #f59e0b 100%)` }}>
            <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: -80, right: -40 }} />
            <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -50, left: '25%' }} />
            <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent)', top: 30, left: '55%', animation: 'orbFloat 8s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.5 }} />
            {[{ top: '15%', right: '20%', s: 4, d: 0 }, { top: '60%', right: '10%', s: 3, d: 1.5 }, { bottom: '25%', left: '35%', s: 5, d: 3 }].map((dot, i) => (
              <div key={i} style={{ position: 'absolute', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', width: dot.s * 2, height: dot.s * 2, top: dot.top, right: dot.right, bottom: dot.bottom, left: dot.left, animation: `orbFloat ${4 + dot.d}s ease-in-out infinite ${dot.d}s` }} />
            ))}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}><Shield size={13} style={{ color: 'rgba(255,255,255,0.7)' }} /><span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>NDIS Compliance</span></div>
                {reportableCount > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(239,68,68,0.35)', backdropFilter: 'blur(8px)' }}><AlertTriangle size={13} style={{ color: 'rgba(255,255,255,0.95)' }} /><span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>{reportableCount} reportable</span></div>}
                {criticalCount > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(220,38,38,0.4)', backdropFilter: 'blur(8px)' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fca5a5', animation: 'pulse-dot 2s ease-in-out infinite' }} /><span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>{criticalCount} critical/high</span></div>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15 }}>Incidents</h1>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>Log, track, and report incidents for NDIS compliance</p>
                </div>
                <button onClick={() => setShowNew(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 16, border: 'none', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}>
                  <Plus size={18} /> Log Incident
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
                {[
                  { icon: Layers, text: `${incidents.length} total` },
                  { icon: XCircle, text: `${openCount} open`, bg: openCount > 0 ? 'rgba(239,68,68,0.3)' : undefined },
                  { icon: Clock, text: `${reviewCount} reviewing` },
                  { icon: CheckCircle, text: `${resolvedCount} resolved`, bg: 'rgba(16,185,129,0.25)' },
                  { icon: Shield, text: `${reportableCount} NDIS reportable`, bg: reportableCount > 0 ? 'rgba(220,38,38,0.35)' : undefined },
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

        {/* ══════════ NDIS ALERT ══════════ */}
        {reportableCount > 0 && (
          <Glass dark={isDark} glow="rgba(239,68,68,0.15)" style={{ ...stg(1), padding: '16px 20px', borderColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px -4px rgba(239,68,68,0.4)' }}><Shield size={22} color="white" /></div>
              <div>
                <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{reportableCount} NDIS Reportable Incident{reportableCount > 1 ? 's' : ''}</p>
                <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>Must be reported to NDIS Commission within required timeframes</p>
              </div>
            </div>
          </Glass>
        )}

        {/* ══════════ STAT CARDS ══════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, ...stg(2) }}>
          {[
            { icon: Layers, label: 'Total', value: incidents.length, grad: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, glow: `${c.primary}35` },
            { icon: XCircle, label: 'Open', value: openCount, grad: 'linear-gradient(135deg, #ef4444, #f87171)', glow: 'rgba(239,68,68,0.2)', pulse: openCount > 0 },
            { icon: Clock, label: 'Reviewing', value: reviewCount, grad: 'linear-gradient(135deg, #f59e0b, #fbbf24)', glow: 'rgba(245,158,11,0.2)' },
            { icon: CheckCircle, label: 'Resolved', value: resolvedCount, grad: 'linear-gradient(135deg, #10b981, #34d399)', glow: 'rgba(16,185,129,0.2)' },
            { icon: Shield, label: 'NDIS Reportable', value: reportableCount, grad: 'linear-gradient(135deg, #dc2626, #ef4444)', glow: 'rgba(220,38,38,0.2)', pulse: reportableCount > 0 },
            { icon: AlertTriangle, label: 'Critical/High', value: criticalCount, grad: 'linear-gradient(135deg, #be123c, #e11d48)', glow: 'rgba(190,18,60,0.2)', pulse: criticalCount > 0 },
          ].map((card, i) => (
            <Glass key={i} dark={isDark} hover glow={card.glow} style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
              {card.pulse && <div style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse-dot 2s ease-in-out infinite' }} />}
              <div style={{ width: 42, height: 42, borderRadius: 12, background: card.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 20px -4px ${card.glow}`, marginBottom: 12 }}><card.icon size={20} color="white" /></div>
              <p style={{ fontSize: 22, fontWeight: 800, color: dk.text, lineHeight: 1 }} className="count-up"><AnimNum value={card.value} /></p>
              <p style={{ fontSize: 11, fontWeight: 600, color: dk.textFaint, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</p>
            </Glass>
          ))}
        </div>

        {/* ══════════ FILTERS ══════════ */}
        <Glass dark={isDark} style={{ padding: 6, ...stg(3) }}>
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
            {[
              { key: 'all', icon: Layers, label: 'All', count: incidents.length },
              { key: 'open', icon: XCircle, label: 'Open', count: openCount },
              { key: 'under_review', icon: Clock, label: 'Reviewing', count: reviewCount },
              { key: 'resolved', icon: CheckCircle, label: 'Resolved', count: resolvedCount },
            ].map(t => {
              const isActive = filterStatus === t.key
              return (
                <button key={t.key} onClick={() => setFilterStatus(t.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderRadius: 14, border: 'none',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', flex: '1 1 auto', justifyContent: 'center', whiteSpace: 'nowrap',
                  transition: 'all .25s cubic-bezier(.16,1,.3,1)',
                  background: isActive ? `linear-gradient(135deg, ${c.primary}, ${c.adminHover})` : 'transparent',
                  color: isActive ? 'white' : dk.textMuted,
                  boxShadow: isActive ? `0 4px 16px -4px ${c.primary}60` : 'none',
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
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search incidents..." style={{ ...inputStyle, paddingLeft: 40 }} onFocus={e => e.target.style.borderColor = c.primary} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
            </div>
            <div style={{ position: 'relative' }}>
              <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} style={{ padding: '11px 36px 11px 14px', background: dk.inputBg, border: `1px solid ${dk.inputBorder}`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none', appearance: 'none', cursor: 'pointer', minWidth: 130 }}>
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint, pointerEvents: 'none' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: dk.textFaint, padding: '6px 12px', borderRadius: 10, background: dk.subtleBg }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </Glass>

        {/* ══════════ INCIDENT CARDS ══════════ */}
        {filtered.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((inc, i) => {
              const pName = inc.participants ? `${inc.participants.first_name} ${inc.participants.last_name}` : null
              const reporter = inc.staff ? `${inc.staff.first_name} ${inc.staff.last_name}` : null
              const photoCount = Array.isArray(inc.photos) ? inc.photos.length : 0
              const sev = getSev(inc.severity)

              return (
                <Link key={inc.id} to={`/admin/incidents/${inc.id}`} style={{ textDecoration: 'none' }}>
                  <Glass dark={isDark} hover glow={`${sev.accent}15`} style={{ ...stg(i + 5), padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderRadius: '0 4px 4px 0', background: `linear-gradient(to bottom, ${sev.accent}, ${sev.accent}60)` }} />
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, paddingLeft: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, minWidth: 0 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: inc.ndis_reportable ? 'linear-gradient(135deg, #dc2626, #ef4444)' : sev.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px -4px ${sev.accent}50` }}>
                          <AlertTriangle size={22} color="white" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{formatType(inc.incident_type)}</p>
                          <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{inc.description}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                            {pName && <span style={{ fontSize: 11, color: dk.textFaint, display: 'flex', alignItems: 'center', gap: 4 }}><User size={10} /> {pName}</span>}
                            {reporter && <span style={{ fontSize: 11, color: dk.textFaint }}>· {reporter}</span>}
                            {inc.location && <span style={{ fontSize: 11, color: dk.textFaint, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={10} /> {inc.location}</span>}
                            {photoCount > 0 && <span style={{ fontSize: 11, color: dk.textFaint, display: 'flex', alignItems: 'center', gap: 4 }}><Camera size={10} /> {photoCount}</span>}
                            <span style={{ fontSize: 11, color: dk.textFaint, display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={10} /> {new Date(inc.incident_date || inc.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                        <Badge color={statusColor(inc.status)} dark={isDark}>{formatType(inc.status || 'open')}</Badge>
                        <Badge color={severityColor(inc.severity)} dark={isDark}>{formatType(inc.severity)}</Badge>
                        {inc.ndis_reportable && <Badge color="red" dark={isDark}><Shield size={9} /> NDIS</Badge>}
                      </div>
                    </div>
                    {photoCount > 0 && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 12, marginLeft: 70 }}>
                        {inc.photos.slice(0, 4).map((photo, idx) => (
                          <div key={idx} style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', border: `1px solid ${dk.divider}`, background: dk.subtleBg }}>
                            <img src={photo.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                          </div>
                        ))}
                        {photoCount > 4 && <div style={{ width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${dk.divider}`, background: dk.subtleBg }}><span style={{ fontSize: 11, fontWeight: 700, color: dk.textFaint }}>+{photoCount - 4}</span></div>}
                      </div>
                    )}
                  </Glass>
                </Link>
              )
            })}
          </div>
        ) : (
          <Glass dark={isDark} style={{ ...stg(5), padding: '56px 24px', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px', background: `linear-gradient(135deg, ${c.primary}15, ${c.primary}05)`, border: `1px solid ${c.primary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={32} style={{ color: c.primary }} /></div>
            <p style={{ color: dk.textMuted, fontWeight: 600, fontSize: 16 }}>{search || filterStatus !== 'all' || filterSeverity !== 'all' ? 'No matching incidents' : 'No incidents recorded'}</p>
            <p style={{ color: dk.textFaint, fontSize: 13, marginTop: 4 }}>Click "Log Incident" to report one</p>
          </Glass>
        )}

        {/* ══════════ INSIGHTS ══════════ */}
        {incidents.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, ...stg(7) }}>
            <Glass dark={isDark} glow="rgba(239,68,68,0.1)" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><AlertTriangle size={18} style={{ color: '#ef4444' }} /><h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>By Severity</h3></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <ResponsiveContainer width={120} height={120}><PieChart><Pie data={severityPie} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} stroke="none">{severityPie.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip content={<CT />} /></PieChart></ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{severityPie.map((s, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} /><span style={{ fontSize: 12, color: dk.textMuted }}>{s.name}</span><span style={{ fontSize: 13, fontWeight: 800, color: dk.text, marginLeft: 'auto' }}>{s.value}</span></div>))}</div>
              </div>
            </Glass>

            <Glass dark={isDark} glow={`${c.primary}10`} style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><Activity size={18} style={{ color: c.primary }} /><h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>By Status</h3></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <ResponsiveContainer width={120} height={120}><PieChart><Pie data={statusPie} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} stroke="none">{statusPie.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip content={<CT />} /></PieChart></ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{statusPie.map((s, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} /><span style={{ fontSize: 12, color: dk.textMuted }}>{s.name}</span><span style={{ fontSize: 13, fontWeight: 800, color: dk.text, marginLeft: 'auto' }}>{s.value}</span></div>))}</div>
              </div>
            </Glass>

            <Glass dark={isDark} glow="rgba(59,130,246,0.1)" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><BarChart3 size={18} style={{ color: '#3b82f6' }} /><h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Incident Types</h3></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {typeBreakdown.length > 0 ? typeBreakdown.map((item, i) => {
                  const maxVal = Math.max(...typeBreakdown.map(e => e.value)); const pct = Math.round((item.value / maxVal) * 100)
                  const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899']; const col = colors[i % colors.length]
                  return (<div key={item.name}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontSize: 12, fontWeight: 600, color: dk.textSoft }}>{item.name}</span><span style={{ fontSize: 13, fontWeight: 800, color: col }}>{item.value}</span></div><div style={{ height: 6, borderRadius: 999, overflow: 'hidden', background: dk.subtleBg2 }}><div style={{ height: '100%', borderRadius: 999, width: `${pct}%`, background: col, transition: 'width 1s cubic-bezier(.16,1,.3,1)' }} /></div></div>)
                }) : <p style={{ fontSize: 13, color: dk.textFaint }}>No data</p>}
              </div>
            </Glass>
          </div>
        )}
      </div>

      {/* ══════════ NEW INCIDENT MODAL ══════════ */}
      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="Log Incident" wide>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ margin: '-24px -24px 0 -24px', padding: '24px 28px 20px', background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 50%, #ef4444 100%)`, position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
            <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -40, right: -20 }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={26} color="white" /></div>
              <div><h3 style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>Log Incident</h3><p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Document an incident for NDIS compliance</p></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><AlertTriangle size={11} /> Type *</p>
              <select value={newIncident.incident_type} onChange={e => setNewIncident({...newIncident, incident_type: e.target.value})} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Select type...</option>
                {INCIDENT_TYPES.map(t => <option key={t} value={t}>{formatType(t)}</option>)}
              </select>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><Target size={11} /> Severity</p>
              <select value={newIncident.severity} onChange={e => setNewIncident({...newIncident, severity: e.target.value})} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><User size={11} /> Participant</p>
              <select value={newIncident.participant_id} onChange={e => setNewIncident({...newIncident, participant_id: e.target.value})} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Optional...</option>
                {participants.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
              </select>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={11} /> Location</p>
              <input value={newIncident.location} onChange={e => setNewIncident({...newIncident, location: e.target.value})} placeholder="Location" style={inputStyle} onFocus={e => e.target.style.borderColor = c.primary} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={11} /> Time</p>
              <input type="time" value={newIncident.incident_time} onChange={e => setNewIncident({...newIncident, incident_time: e.target.value})} style={inputStyle} onFocus={e => e.target.style.borderColor = c.primary} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
            </div>
          </div>

          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><FileText size={11} /> Description *</p>
            <textarea value={newIncident.description} onChange={e => setNewIncident({...newIncident, description: e.target.value})} rows={4} placeholder="Describe what happened..." style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = c.primary} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
          </div>

          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><Camera size={11} /> Evidence Photos</p>
            <PhotoUploader photos={newIncident.photos} onPhotosChange={(photos) => setNewIncident({...newIncident, photos})} bucket="incident-photos" folder="incidents" maxPhotos={10} accentColor={c.primary} />
          </div>

          {/* NDIS toggle */}
          <div style={{ padding: '14px 18px', borderRadius: 14, background: newIncident.ndis_reportable ? (isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2') : dk.subtleBg, border: `1px solid ${newIncident.ndis_reportable ? (isDark ? 'rgba(239,68,68,0.2)' : '#fecaca') : dk.subtleBg2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            onClick={() => setNewIncident({...newIncident, ndis_reportable: !newIncident.ndis_reportable})}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: newIncident.ndis_reportable ? '#ef4444' : dk.text }}>NDIS Reportable Incident</p>
              <p style={{ fontSize: 11, color: dk.textFaint, marginTop: 2 }}>Must be reported within 24 hours or 5 business days</p>
            </div>
            <div style={{ width: 48, height: 26, borderRadius: 999, position: 'relative', background: newIncident.ndis_reportable ? '#ef4444' : (isDark ? 'rgba(51,65,85,0.6)' : '#d1d5db'), transition: 'background .25s', flexShrink: 0, boxShadow: newIncident.ndis_reportable ? '0 0 12px rgba(239,68,68,0.3)' : 'none' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: newIncident.ndis_reportable ? 25 : 3, transition: 'left .25s cubic-bezier(.16,1,.3,1)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, borderTop: `1px solid ${dk.divider}`, paddingTop: 16 }}>
            <button onClick={() => setShowNew(false)} style={{ flex: 1, padding: '15px 0', borderRadius: 14, background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9', border: `1px solid ${dk.inputBorder}`, color: dk.textMuted, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleCreate} disabled={saving} style={{ flex: 2, padding: '15px 0', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${c.primary}, #ef4444)`, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 8px 28px -6px ${c.primary}50`, opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><AlertTriangle size={16} /> Log Incident</>}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}