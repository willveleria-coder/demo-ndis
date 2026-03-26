import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Activity, Loader2, Search, Clock, User, RefreshCw, Shield,
  ArrowRight, Eye, Plus, Pencil, Trash2, LogIn, LogOut,
  Upload, Download, CheckCircle, XCircle, AlertTriangle, ChevronLeft, ChevronRight,
  Layers, BarChart3, Calendar, Hash, Target, Zap, ChevronDown
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
    <div
      style={{
        background: base,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${border}`,
        borderRadius: '1.25rem',
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
      {...p}
    >
      {children}
    </div>
  )
}

function Orb({ color, size = 200, top, left, right, bottom, delay = 0 }) {
  return (
    <div style={{
      position: 'absolute', width: size, height: size, top, left, right, bottom,
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
  const pl = palettes[color] || palettes.gray
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
      background: pl.bg, color: pl.text, border: `1px solid ${pl.border}`, whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}


/* ─── Config (100% preserved) ─── */

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatDateShort(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now - d
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

const ACTION_CONFIG = {
  create: { icon: Plus, color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Created' },
  insert: { icon: Plus, color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Inserted' },
  add: { icon: Plus, color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Added' },
  update: { icon: Pencil, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', label: 'Updated' },
  edit: { icon: Pencil, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', label: 'Edited' },
  modify: { icon: Pencil, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', label: 'Modified' },
  delete: { icon: Trash2, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Deleted' },
  remove: { icon: Trash2, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Removed' },
  login: { icon: LogIn, color: '#14b8a6', bg: 'rgba(20,184,166,0.1)', label: 'Login' },
  logout: { icon: LogOut, color: '#64748b', bg: 'rgba(100,116,139,0.1)', label: 'Logout' },
  clock_in: { icon: Clock, color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Clocked In' },
  clock_out: { icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Clocked Out' },
  approve: { icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Approved' },
  reject: { icon: XCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Rejected' },
  upload: { icon: Upload, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', label: 'Uploaded' },
  export: { icon: Download, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', label: 'Exported' },
  view: { icon: Eye, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', label: 'Viewed' },
}

const DEFAULT_ACTION = { icon: Activity, color: '#64748b', bg: 'rgba(100,116,139,0.1)', label: 'Action' }


/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

export default function AuditLog() {
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState([])
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('all')
  const [page, setPage] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const PAGE_SIZE = 50

  const dk = {
    text: isDark ? '#e2e8f0' : '#1f2937',
    textSoft: isDark ? '#cbd5e1' : '#374151',
    textMuted: isDark ? '#94a3b8' : '#6b7280',
    textFaint: isDark ? '#64748b' : '#9ca3af',
    subtleBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    subtleBg2: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    inputBg: isDark ? 'rgba(30,41,59,0.8)' : 'white',
    inputBorder: isDark ? 'rgba(51,65,85,0.5)' : '#e5e7eb',
    divider: isDark ? 'rgba(51,65,85,0.3)' : 'rgba(0,0,0,0.05)',
  }

  const stg = (i) => ({
    transitionDelay: `${i * 50}ms`,
    opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(14px)',
    transition: 'all .6s cubic-bezier(.16,1,.3,1)',
  })

  const inputStyle = {
    width: '100%', padding: '12px 14px', background: dk.inputBg,
    border: `1.5px solid ${dk.inputBorder}`, borderRadius: 12,
    fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none', transition: 'all .2s',
  }


  /* ═══ ALL BACKEND — 100% PRESERVED ═══ */

  useEffect(() => { loadLogs() }, [page])
  useEffect(() => { if (!loading) setTimeout(() => setLoaded(true), 50) }, [loading])

  const loadLogs = async () => {
    setLoading(true)
    try {
      // Try with staff join first, fall back to plain query if FK doesn't exist
      let data = null
      let error = null
      const res = await supabase
        .from('audit_logs')
        .select('*, staff:user_id(first_name, last_name)')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      data = res.data
      error = res.error

      if (error) {
        console.warn('Audit log join failed, trying plain query:', error.message)
        const res2 = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
        if (res2.error) throw res2.error
        data = (res2.data || []).map(log => ({ ...log, staff: null }))
      }
      setLogs(data || [])
    } catch (err) {
      console.error('Audit log load error:', err)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return logs.filter(log => {
      if (filterAction !== 'all' && log.action !== filterAction) return false
      if (search) {
        const q = search.toLowerCase()
        const userName = log.staff ? `${log.staff.first_name} ${log.staff.last_name}`.toLowerCase() : ''
        return (
          (log.action || '').toLowerCase().includes(q) ||
          (log.entity_type || '').toLowerCase().includes(q) ||
          (log.description || '').toLowerCase().includes(q) ||
          userName.includes(q)
        )
      }
      return true
    })
  }, [logs, filterAction, search])

  const actionTypes = useMemo(() => [...new Set(logs.map(l => l.action).filter(Boolean))], [logs])

  // Compute action stats
  const actionCounts = useMemo(() => {
    const counts = {}
    logs.forEach(l => { if (l.action) counts[l.action] = (counts[l.action] || 0) + 1 })
    return counts
  }, [logs])

  const topActions = useMemo(() => {
    return Object.entries(actionCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [actionCounts])


  /* ─── Loading ─── */
  if (loading && logs.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: 72, height: 72, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${c.primary}40` }}>
            <Activity size={32} color="white" />
          </div>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.3 }} />
        </div>
        <p style={{ color: dk.textMuted, fontSize: 14, fontWeight: 600 }}>Loading audit log...</p>
      </div>
    )
  }


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
      <Orb color="#10b981" size={200} top="45%" right="8%" delay={3.5} />
      <Orb color="#8b5cf6" size={160} bottom="30%" left="40%" delay={5} />

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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                  <Shield size={13} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>NDIS Compliance</span>
                </div>
                {logs.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                    <Activity size={13} style={{ color: 'rgba(255,255,255,0.7)' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Page {page + 1}</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15 }}>Audit Log</h1>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>Activity tracking for compliance and security</p>
                </div>
                <button
                  onClick={loadLogs}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 16, border: 'none', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                >
                  <RefreshCw size={18} /> Refresh
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
                {[
                  { icon: Activity, text: `${logs.length} activities loaded` },
                  { icon: Eye, text: `${actionTypes.length} action types` },
                  { icon: Shield, text: '7 year retention' },
                ].map((pill, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <pill.icon size={14} style={{ color: 'rgba(255,255,255,0.8)' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{pill.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════ COMPLIANCE BANNER ══════════ */}
        <Glass dark={isDark} glow="rgba(59,130,246,0.08)" style={{ ...stg(1), padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(59,130,246,0.12)' : '#eff6ff' }}>
              <Shield size={18} style={{ color: '#3b82f6' }} />
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: isDark ? '#93c5fd' : '#1e40af' }}>NDIS Compliance Requirement</p>
              <p style={{ fontSize: 11, marginTop: 3, color: isDark ? 'rgba(147,197,253,0.5)' : '#3b82f6', lineHeight: 1.5 }}>
                All significant actions are recorded for auditing. Records retained for 7 years as per NDIS Practice Standards.
              </p>
            </div>
          </div>
        </Glass>

        {/* ══════════ ACTION TYPE BREAKDOWN ══════════ */}
        {topActions.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10, ...stg(2) }}>
            {topActions.map(([action, count], i) => {
              const cfg = ACTION_CONFIG[action] || DEFAULT_ACTION
              const isActive = filterAction === action
              return (
                <Glass
                  key={action}
                  dark={isDark}
                  hover
                  glow={isActive ? `${cfg.color}30` : undefined}
                  style={{
                    padding: '16px 14px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderColor: isActive ? `${cfg.color}50` : undefined,
                  }}
                  onClick={() => setFilterAction(filterAction === action ? 'all' : action)}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', background: isDark ? `${cfg.color}15` : cfg.bg }}>
                    <cfg.icon size={16} style={{ color: cfg.color }} />
                  </div>
                  <p style={{ fontSize: 20, fontWeight: 800, color: dk.text }} className="count-up">{count}</p>
                  <p style={{ fontSize: 10, fontWeight: 600, color: dk.textFaint, textTransform: 'capitalize', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{action}</p>
                  {isActive && <div style={{ height: 3, borderRadius: 999, width: 28, margin: '8px auto 0', background: cfg.color }} />}
                </Glass>
              )
            })}
          </div>
        )}

        {/* ══════════ SEARCH & FILTERS ══════════ */}
        <Glass dark={isDark} style={{ ...stg(3), padding: '12px 18px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by user, action, entity, or description..."
                style={{ ...inputStyle, paddingLeft: 40 }}
                onFocus={e => e.target.style.borderColor = c.primary}
                onBlur={e => e.target.style.borderColor = dk.inputBorder}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <select
                value={filterAction}
                onChange={e => setFilterAction(e.target.value)}
                style={{ padding: '11px 36px 11px 14px', background: dk.inputBg, border: `1px solid ${dk.inputBorder}`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none', appearance: 'none', cursor: 'pointer', minWidth: 140 }}
              >
                <option value="all">All Actions</option>
                {actionTypes.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint, pointerEvents: 'none' }} />
            </div>
            {(filterAction !== 'all' || search) && (
              <button
                onClick={() => { setFilterAction('all'); setSearch('') }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 16px', borderRadius: 12, background: dk.subtleBg2, border: `1px solid ${dk.inputBorder}`, color: dk.textMuted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                <XCircle size={14} /> Clear
              </button>
            )}
            <span style={{ fontSize: 12, fontWeight: 600, color: dk.textFaint, padding: '6px 12px', borderRadius: 10, background: dk.subtleBg }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </Glass>

        {/* ══════════ LOG ENTRIES ══════════ */}
        <Glass dark={isDark} glow={`${c.primary}06`} style={{ ...stg(4), padding: 0, overflow: 'hidden' }}>
          {filtered.length > 0 ? (
            <div>
              {filtered.map((log, i) => {
                const cfg = ACTION_CONFIG[log.action] || DEFAULT_ACTION
                const ActionIcon = cfg.icon
                const userName = log.staff ? `${log.staff.first_name} ${log.staff.last_name}` : 'System'
                const initials = log.staff
                  ? `${log.staff.first_name?.[0] || ''}${log.staff.last_name?.[0] || ''}`
                  : 'SY'

                return (
                  <div
                    key={log.id}
                    style={{
                      padding: '18px 22px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 14,
                      position: 'relative',
                      borderBottom: i < filtered.length - 1 ? `1px solid ${dk.divider}` : undefined,
                      transition: 'background .2s',
                      cursor: 'default',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.02)' : `${c.primary}02` }}
                    onMouseLeave={e => { e.currentTarget.style.background = '' }}
                  >
                    {/* Left accent bar */}
                    <div style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3, borderRadius: '0 4px 4px 0', background: cfg.color, opacity: 0.5 }} />

                    {/* User avatar */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: 12, fontWeight: 800,
                      background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)`,
                      boxShadow: `0 4px 14px -4px ${cfg.color}40`,
                    }}>
                      {initials}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: dk.text }}>{userName}</span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                          background: isDark ? `${cfg.color}15` : cfg.bg, color: cfg.color,
                        }}>
                          <ActionIcon size={11} /> {cfg.label}
                        </span>
                        {log.entity_type && (
                          <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 8, background: dk.subtleBg2, color: dk.textFaint, fontWeight: 600 }}>
                            {log.entity_type}
                          </span>
                        )}
                      </div>

                      {log.description && (
                        <p style={{ fontSize: 12, marginTop: 4, lineHeight: 1.5, color: dk.textMuted }}>{log.description}</p>
                      )}

                      {log.metadata && typeof log.metadata === 'object' && Object.keys(log.metadata).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                          {Object.entries(log.metadata).slice(0, 4).map(([k, v]) => (
                            <span key={k} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 8, background: dk.subtleBg2, color: dk.textFaint }}>
                              <span style={{ color: dk.textMuted, fontWeight: 600 }}>{k}:</span>{' '}
                              {typeof v === 'string' ? v : JSON.stringify(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Time */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: dk.textFaint }}>{formatDateShort(log.created_at)}</p>
                      <p style={{ fontSize: 10, marginTop: 2, color: isDark ? '#475569' : '#d1d5db' }}>
                        {log.created_at ? new Date(log.created_at).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''}
                      </p>
                      {log.ip_address && (
                        <p style={{ fontSize: 9, marginTop: 2, color: isDark ? '#334155' : '#e5e7eb' }}>{log.ip_address}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ padding: '56px 24px', textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: 22, margin: '0 auto 20px', background: dk.subtleBg2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={36} style={{ color: isDark ? '#334155' : '#d1d5db' }} />
              </div>
              <p style={{ fontWeight: 700, color: dk.text, fontSize: 18 }}>
                {search || filterAction !== 'all' ? 'No matching activity' : 'No audit logs recorded yet'}
              </p>
              <p style={{ fontSize: 14, color: dk.textFaint, marginTop: 6 }}>
                {search || filterAction !== 'all' ? 'Try broadening your search or clearing filters' : 'Activity will be recorded as staff and admin use the system'}
              </p>
            </div>
          )}
        </Glass>

        {/* ══════════ PAGINATION ══════════ */}
        {logs.length >= PAGE_SIZE && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, ...stg(5) }}>
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '12px 18px', borderRadius: 14,
                fontSize: 13, fontWeight: 700, cursor: page === 0 ? 'not-allowed' : 'pointer',
                background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9',
                border: `1px solid ${dk.inputBorder}`, color: dk.textSoft,
                opacity: page === 0 ? 0.4 : 1,
                transition: 'all .2s',
              }}
            >
              <ChevronLeft size={16} /> Previous
            </button>

            <Glass dark={isDark} style={{ padding: '10px 18px' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: dk.text }}>Page {page + 1}</p>
            </Glass>

            <button
              onClick={() => setPage(page + 1)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '12px 18px', borderRadius: 14,
                border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: 'white',
                background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`,
                boxShadow: `0 4px 16px -4px ${c.primary}50`,
                transition: 'all .2s',
              }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}

      </div>
    </div>
  )
}