import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Send, Plus, Loader2, Users, Clock, CheckCircle, Megaphone, Trash2,
  Eye, AlertTriangle, ArrowRight, Bell, MessageSquare, Sparkles, Radio,
  Search, ChevronRight, ChevronDown, Activity, Layers, Shield, Zap,
  BarChart3, Calendar, User, Hash, Target, RefreshCw
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
  }
  const pl = palettes[color] || palettes.gray
  return (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: pl.bg, color: pl.text, border: `1px solid ${pl.border}`, whiteSpace: 'nowrap' }}>{children}</span>)
}


/* ─── Config (100% preserved) ─── */
function formatDate(iso) { if (!iso) return '—'; return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) }
function formatDateShort(iso) { if (!iso) return '—'; const d = new Date(iso); const now = new Date(); const diffMins = Math.floor((now - d) / 60000); if (diffMins < 1) return 'Just now'; if (diffMins < 60) return `${diffMins}m ago`; const diffHrs = Math.floor(diffMins / 60); if (diffHrs < 24) return `${diffHrs}h ago`; const diffDays = Math.floor(diffHrs / 24); if (diffDays < 7) return `${diffDays}d ago`; return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) }

const PRIORITY_CONFIG = {
  normal: { color: '#3b82f6', badge: 'blue', label: 'Normal', grad: 'linear-gradient(135deg, #3b82f6, #60a5fa)', glow: 'rgba(59,130,246,0.12)' },
  important: { color: '#f59e0b', badge: 'amber', label: 'Important', grad: 'linear-gradient(135deg, #f59e0b, #fbbf24)', glow: 'rgba(245,158,11,0.12)' },
  urgent: { color: '#ef4444', badge: 'red', label: 'Urgent', grad: 'linear-gradient(135deg, #ef4444, #f87171)', glow: 'rgba(239,68,68,0.15)' },
}

const PRIORITY_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'important', label: 'Important' },
  { value: 'urgent', label: 'Urgent' },
]


/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

export default function Broadcasts() {
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [staffList, setStaffList] = useState([])
  const [showNew, setShowNew] = useState(false)
  const [showDetail, setShowDetail] = useState(null)
  const [saving, setSaving] = useState(false)
  const [filterPriority, setFilterPriority] = useState('all')
  const [search, setSearch] = useState('')
  const [newMsg, setNewMsg] = useState({ title: '', body: '', priority: 'normal', audience: 'all', selected_staff: [] })

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
    return (<div style={{ background: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.96)', backdropFilter: 'blur(20px)', borderRadius: 16, border: `1px solid ${isDark ? 'rgba(51,65,85,0.6)' : 'rgba(0,0,0,0.08)'}`, padding: '14px 18px' }}>
      {payload.map((p, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: i > 0 ? 6 : 0 }}><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: 3, background: p.color || p.fill }} /><span style={{ fontSize: 12, color: dk.textMuted }}>{p.name}</span></div><span style={{ fontSize: 13, fontWeight: 800, color: dk.text }}>{p.value}</span></div>))}
    </div>)
  }


  /* ═══ ALL BACKEND — 100% PRESERVED ═══ */
  useEffect(() => { loadData() }, [])
  useEffect(() => { if (!loading) setTimeout(() => setLoaded(true), 50) }, [loading])

  const loadData = async () => {
    try {
      const [msgRes, staffRes] = await Promise.all([
        supabase.from('broadcast_messages').select('*, sender:sent_by(first_name, last_name)').order('created_at', { ascending: false }),
        supabase.from('staff').select('id, first_name, last_name, status, role').eq('status', 'active'),
      ])
      setMessages(msgRes.data || []); setStaffList(staffRes.data || [])
    } catch (err) { console.error('Broadcasts load error:', err) }
    finally { setLoading(false) }
  }

  const handleSend = async () => {
    if (!newMsg.title.trim() || !newMsg.body.trim()) { alert('Please fill in title and message'); return }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: staff } = await supabase.from('staff').select('id').eq('auth_id', user.id).maybeSingle()
      const payload = { title: newMsg.title.trim(), body: newMsg.body.trim(), priority: newMsg.priority, audience: newMsg.audience, recipient_ids: newMsg.audience === 'selected' ? newMsg.selected_staff : [], recipient_count: newMsg.audience === 'all' ? staffList.length : newMsg.selected_staff.length, sent_by: staff?.id || null, sent_at: new Date().toISOString() }
      const { data, error } = await supabase.from('broadcast_messages').insert(payload).select('*, sender:sent_by(first_name, last_name)').single()
      if (error) throw error
      setMessages([data, ...messages]); setShowNew(false); setNewMsg({ title: '', body: '', priority: 'normal', audience: 'all', selected_staff: [] })
    } catch (err) { alert('Failed to send: ' + (err.message || 'Unknown error')) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this message?')) return
    try { const { error } = await supabase.from('broadcast_messages').delete().eq('id', id); if (error) throw error; setMessages(messages.filter(m => m.id !== id)); setShowDetail(null) }
    catch (err) { alert('Failed to delete: ' + (err.message || 'Unknown error')) }
  }

  const toggleStaff = (staffId) => { setNewMsg(prev => ({ ...prev, selected_staff: prev.selected_staff.includes(staffId) ? prev.selected_staff.filter(id => id !== staffId) : [...prev.selected_staff, staffId] })) }


  /* ── Stats ── */
  const totalMessages = messages.length
  const urgentCount = messages.filter(m => m.priority === 'urgent').length
  const importantCount = messages.filter(m => m.priority === 'important').length
  const normalCount = messages.filter(m => m.priority === 'normal').length
  const totalRecipients = messages.reduce((s, m) => s + (m.recipient_count || 0), 0)

  const filtered = useMemo(() => {
    return messages.filter(m => {
      if (filterPriority !== 'all' && m.priority !== filterPriority) return false
      if (search) { const q = search.toLowerCase(); return (m.title || '').toLowerCase().includes(q) || (m.body || '').toLowerCase().includes(q) }
      return true
    })
  }, [messages, filterPriority, search])

  const priorityPie = useMemo(() => [
    { name: 'Normal', value: normalCount, color: '#3b82f6' },
    { name: 'Important', value: importantCount, color: '#f59e0b' },
    { name: 'Urgent', value: urgentCount, color: '#ef4444' },
  ].filter(s => s.value > 0), [normalCount, importantCount, urgentCount])


  /* ─── Loading ─── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${c.primary}40` }}><Megaphone size={32} color="white" /></div>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.3 }} />
      </div>
      <p style={{ color: dk.textMuted, fontSize: 14, fontWeight: 600 }}>Loading broadcasts...</p>
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
      <Orb color="#f59e0b" size={200} top="45%" right="8%" delay={3.5} />
      <Orb color="#ef4444" size={160} bottom="30%" left="40%" delay={5} />

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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}><Radio size={13} style={{ color: 'rgba(255,255,255,0.7)' }} /><span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Communications</span></div>
                {urgentCount > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(239,68,68,0.3)', backdropFilter: 'blur(8px)' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fca5a5', animation: 'pulse-dot 2s ease-in-out infinite' }} /><span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>{urgentCount} urgent</span></div>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15 }}>Broadcasts</h1>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>{totalMessages} messages sent to your team</p>
                </div>
                <button onClick={() => setShowNew(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 16, border: 'none', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}>
                  <Megaphone size={18} /> New Broadcast
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
                {[
                  { icon: MessageSquare, text: `${totalMessages} messages` },
                  { icon: Users, text: `${totalRecipients} total recipients` },
                  { icon: Users, text: `${staffList.length} active staff` },
                  urgentCount > 0 && { icon: AlertTriangle, text: `${urgentCount} urgent`, bg: 'rgba(239,68,68,0.3)' },
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
            { icon: MessageSquare, label: 'Total', value: totalMessages, grad: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, glow: `${c.primary}35` },
            { icon: AlertTriangle, label: 'Urgent', value: urgentCount, grad: 'linear-gradient(135deg, #ef4444, #f87171)', glow: 'rgba(239,68,68,0.2)', pulse: urgentCount > 0 },
            { icon: Bell, label: 'Important', value: importantCount, grad: 'linear-gradient(135deg, #f59e0b, #fbbf24)', glow: 'rgba(245,158,11,0.2)' },
            { icon: Users, label: 'Total Reach', value: totalRecipients, grad: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, glow: `${c.staff}25` },
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
        <Glass dark={isDark} style={{ padding: 6, ...stg(2) }}>
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
            {[
              { key: 'all', icon: Layers, label: 'All', count: totalMessages },
              { key: 'urgent', icon: AlertTriangle, label: 'Urgent', count: urgentCount },
              { key: 'important', icon: Bell, label: 'Important', count: importantCount },
              { key: 'normal', icon: MessageSquare, label: 'Normal', count: normalCount },
            ].map(t => {
              const isActive = filterPriority === t.key
              return (
                <button key={t.key} onClick={() => setFilterPriority(t.key)} style={{
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

        <Glass dark={isDark} style={{ ...stg(3), padding: '12px 18px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search broadcasts..." style={{ ...inputStyle, paddingLeft: 40 }} onFocus={e => e.target.style.borderColor = c.primary} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: dk.textFaint, padding: '6px 12px', borderRadius: 10, background: dk.subtleBg }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </Glass>

        {/* ══════════ MESSAGES LIST ══════════ */}
        {filtered.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((msg, i) => {
              const cfg = PRIORITY_CONFIG[msg.priority] || PRIORITY_CONFIG.normal
              return (
                <Glass key={msg.id} dark={isDark} hover glow={cfg.glow}
                  style={{ ...stg(i + 4), padding: '20px 22px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                  onClick={() => setShowDetail(msg)}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderRadius: '0 4px 4px 0', background: `linear-gradient(to bottom, ${cfg.color}, ${cfg.color}60)` }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, paddingLeft: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: cfg.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px -4px ${cfg.color}50` }}><Megaphone size={22} color="white" /></div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{msg.title}</p>
                          <Badge color={cfg.badge} dark={isDark}>{cfg.label}</Badge>
                        </div>
                        <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.5 }}>{msg.body}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, color: dk.textFaint, display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={10} /> {formatDateShort(msg.sent_at)}</span>
                          <span style={{ fontSize: 11, color: dk.textFaint, display: 'flex', alignItems: 'center', gap: 4 }}><Users size={10} /> {msg.recipient_count || 0} recipients</span>
                          {msg.sender && <span style={{ fontSize: 11, color: dk.textFaint }}>· {msg.sender.first_name} {msg.sender.last_name}</span>}
                        </div>
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
            <div style={{ width: 80, height: 80, borderRadius: 22, margin: '0 auto 20px', background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 32px -8px ${c.primary}40` }}><Megaphone size={36} color="white" /></div>
            <p style={{ fontWeight: 700, color: dk.text, fontSize: 18 }}>{search || filterPriority !== 'all' ? 'No matching broadcasts' : 'No broadcasts sent yet'}</p>
            <p style={{ fontSize: 14, color: dk.textFaint, marginTop: 6, marginBottom: 20 }}>{search ? 'Try adjusting your search' : 'Send your first broadcast to keep your team informed'}</p>
            {!search && filterPriority === 'all' && (
              <button onClick={() => setShowNew(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 24px', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 6px 24px -6px ${c.primary}50` }}><Megaphone size={16} /> Send First Broadcast</button>
            )}
          </Glass>
        )}

        {/* ══════════ INSIGHTS ══════════ */}
        {messages.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, ...stg(6) }}>
            <Glass dark={isDark} glow={`${c.primary}10`} style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><BarChart3 size={18} style={{ color: c.primary }} /><h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>By Priority</h3></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <ResponsiveContainer width={120} height={120}><PieChart><Pie data={priorityPie} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} stroke="none">{priorityPie.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip content={<CT />} /></PieChart></ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{priorityPie.map((s, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} /><span style={{ fontSize: 12, color: dk.textMuted }}>{s.name}</span><span style={{ fontSize: 13, fontWeight: 800, color: dk.text, marginLeft: 'auto' }}>{s.value}</span></div>))}</div>
              </div>
            </Glass>

            <Glass dark={isDark} glow="rgba(59,130,246,0.1)" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}><Activity size={18} style={{ color: '#3b82f6' }} /><h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Quick Stats</h3></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Total Messages', value: totalMessages, color: c.primary },
                  { label: 'Total Recipients', value: totalRecipients, color: '#3b82f6' },
                  { label: 'Active Staff', value: staffList.length, color: '#10b981' },
                  { label: 'Avg Recipients/Msg', value: totalMessages > 0 ? Math.round(totalRecipients / totalMessages) : 0, color: '#8b5cf6' },
                ].map((stat, i) => (
                  <div key={i} style={{ padding: '12px 16px', borderRadius: 12, background: dk.subtleBg, border: `1px solid ${dk.subtleBg2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: dk.textMuted }}>{stat.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: stat.color }}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </Glass>
          </div>
        )}
      </div>


      {/* ══════════ NEW BROADCAST MODAL ══════════ */}
      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="New Broadcast" wide>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ margin: '-24px -24px 0 -24px', padding: '24px 28px 20px', background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 50%, #3b82f6 100%)`, position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
            <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -40, right: -20 }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Megaphone size={26} color="white" /></div>
              <div><h3 style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>New Broadcast</h3><p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Send a message to your team</p></div>
            </div>
          </div>

          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><Hash size={11} /> Title *</p>
            <input value={newMsg.title} onChange={e => setNewMsg({ ...newMsg, title: e.target.value })} placeholder="e.g. Important Update - New COVID Protocols" style={inputStyle} onFocus={e => e.target.style.borderColor = c.primary} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><MessageSquare size={11} /> Message *</p>
            <textarea value={newMsg.body} onChange={e => setNewMsg({ ...newMsg, body: e.target.value })} rows={5} placeholder="Type your message here..." style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = c.primary} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Priority</p>
              <select value={newMsg.priority} onChange={e => setNewMsg({ ...newMsg, priority: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Audience</p>
              <select value={newMsg.audience} onChange={e => setNewMsg({ ...newMsg, audience: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="all">All Staff ({staffList.length})</option>
                <option value="selected">Select Staff</option>
              </select>
            </div>
          </div>

          {newMsg.audience === 'selected' && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Select Recipients ({newMsg.selected_staff.length} selected)</p>
              <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {staffList.map(s => {
                  const selected = newMsg.selected_staff.includes(s.id)
                  return (
                    <button key={s.id} onClick={() => toggleStaff(s.id)} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12,
                      border: `1.5px solid ${selected ? (isDark ? 'rgba(20,184,166,0.3)' : '#99f6e4') : dk.inputBorder}`,
                      background: selected ? (isDark ? 'rgba(20,184,166,0.08)' : '#f0fdfa') : dk.inputBg,
                      cursor: 'pointer', textAlign: 'left', transition: 'all .2s',
                    }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${selected ? '#14b8a6' : (isDark ? '#475569' : '#d1d5db')}`, background: selected ? '#14b8a6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {selected && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </div>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{s.first_name?.[0]}{s.last_name?.[0]}</div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: dk.text }}>{s.first_name} {s.last_name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {newMsg.priority === 'urgent' && (
            <div style={{ padding: '14px 18px', borderRadius: 14, background: isDark ? 'rgba(239,68,68,0.06)' : '#fef2f2', border: `1px solid ${isDark ? 'rgba(239,68,68,0.15)' : '#fecaca'}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
              <p style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#fca5a5' : '#b91c1c' }}>Urgent messages will be highlighted in staff portals and trigger push notifications if enabled.</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, borderTop: `1px solid ${dk.divider}`, paddingTop: 16 }}>
            <button onClick={() => setShowNew(false)} style={{ flex: 1, padding: '15px 0', borderRadius: 14, background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9', border: `1px solid ${dk.inputBorder}`, color: dk.textMuted, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSend} disabled={saving} style={{ flex: 2, padding: '15px 0', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 8px 28px -6px ${c.primary}50`, opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {saving ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <><Send size={16} /> Send Broadcast</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* ══════════ DETAIL MODAL ══════════ */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Broadcast Details" wide>
        {showDetail && (() => {
          const cfg = PRIORITY_CONFIG[showDetail.priority] || PRIORITY_CONFIG.normal
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ margin: '-24px -24px 0 -24px', padding: '24px 28px 20px', background: cfg.grad, position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
                <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -40, right: -20 }} />
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }} />
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Megaphone size={26} color="white" /></div>
                  <div style={{ flex: 1 }}><h3 style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{showDetail.title}</h3><p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{cfg.label} Priority</p></div>
                  <Badge color={cfg.badge} dark>{cfg.label}</Badge>
                </div>
              </div>

              <Glass dark={isDark} style={{ padding: '18px 20px' }}>
                <p style={{ fontSize: 14, color: dk.textSoft, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{showDetail.body}</p>
              </Glass>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                {[
                  { label: 'Sent', value: formatDate(showDetail.sent_at), icon: Calendar, color: '#3b82f6' },
                  { label: 'Recipients', value: showDetail.recipient_count || 0, icon: Users, color: '#10b981' },
                  { label: 'Sent By', value: showDetail.sender ? `${showDetail.sender.first_name} ${showDetail.sender.last_name}` : '—', icon: User, color: c.primary },
                ].map((item, idx) => (
                  <div key={idx} style={{ padding: '14px 16px', borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.subtleBg2}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><item.icon size={12} style={{ color: item.color }} /><p style={{ fontSize: 10, fontWeight: 600, color: dk.textFaint, textTransform: 'uppercase' }}>{item.label}</p></div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: dk.text }}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, borderTop: `1px solid ${dk.divider}`, paddingTop: 16 }}>
                <button onClick={() => handleDelete(showDetail.id)} style={{ padding: '14px 20px', borderRadius: 14, background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : '#fecaca'}`, color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Trash2 size={14} /> Delete</button>
                <button onClick={() => setShowDetail(null)} style={{ flex: 1, padding: '14px 0', borderRadius: 14, background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9', border: `1px solid ${dk.inputBorder}`, color: dk.textMuted, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Close</button>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}