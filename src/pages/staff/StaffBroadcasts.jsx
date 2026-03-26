import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Megaphone, Loader2, AlertTriangle, Clock, Search, Filter, Bell,
  ChevronRight, CheckCircle, Eye, EyeOff, Pin, Star, Archive,
  MessageSquare, Inbox, X, ArrowRight, Sparkles, Shield
} from 'lucide-react'
import { useStaff } from '../../context/StaffContext'
import { useBrandColors } from '../../hooks/useBrandColors'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'

/* ═══════════════════════════════════════════════
   HELPERS — original preserved + new
   ═══════════════════════════════════════════════ */
function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso), now = new Date(), diff = (now - d) / 1000
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}
function formatDateFull(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
}

/* ═══════════════════════════════════════════════
   DESIGN SYSTEM COMPONENTS
   ═══════════════════════════════════════════════ */

function Glass({ children, className = '', glow, style = {}, hover = false, isDark = false, onClick, ...p }) {
  const base = isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.55)'
  const border = isDark ? 'rgba(51,65,85,0.4)' : 'rgba(255,255,255,0.7)'
  return (
    <div className={className} onClick={onClick}
      style={{
        background: base, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${border}`, borderRadius: '1.25rem',
        boxShadow: glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)',
        transition: hover ? 'all .3s cubic-bezier(.16,1,.3,1)' : undefined,
        cursor: hover || onClick ? 'pointer' : undefined, ...style,
      }}
      onMouseEnter={hover ? e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = glow ? `0 16px 48px -8px ${glow}` : '0 12px 40px -8px rgba(0,0,0,0.12)' } : undefined}
      onMouseLeave={hover ? e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)' } : undefined}
      {...p}
    >{children}</div>
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

function AnimNum({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0)
  const frameRef = useRef()
  useEffect(() => {
    const num = typeof value === 'number' ? value : parseInt(value) || 0
    const start = performance.now()
    function tick(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(num * eased))
      if (progress < 1) frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [value, duration])
  return <>{display}</>
}

function Badge({ children, color = 'gray', isDark }) {
  const palettes = {
    gray:   isDark ? { bg: 'rgba(100,116,139,0.2)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)' } : { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
    green:  isDark ? { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' } : { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
    amber:  isDark ? { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' } : { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    red:    isDark ? { bg: 'rgba(239,68,68,0.15)', text: '#f87171', border: 'rgba(239,68,68,0.3)' } : { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    blue:   isDark ? { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' } : { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    purple: isDark ? { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa', border: 'rgba(139,92,246,0.3)' } : { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
    orange: isDark ? { bg: 'rgba(249,115,22,0.15)', text: '#fb923c', border: 'rgba(249,115,22,0.3)' } : { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
    teal:   isDark ? { bg: 'rgba(20,184,166,0.15)', text: '#2dd4bf', border: 'rgba(20,184,166,0.3)' } : { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
  }
  const pl = palettes[color] || palettes.gray
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
      fontSize: 10, fontWeight: 700, letterSpacing: '0.02em',
      borderRadius: 999, background: pl.bg, color: pl.text,
      border: `1px solid ${pl.border}`, whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function StaffBroadcasts() {
  const navigate = useNavigate()
  const { staffProfile } = useStaff()
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [readIds, setReadIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('velcare_read_broadcasts') || '[]') } catch { return [] }
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [pinnedIds, setPinnedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('velcare_pinned_broadcasts') || '[]') } catch { return [] }
  })

  useEffect(() => { const t = setTimeout(() => setLoaded(true), 80); return () => clearTimeout(t) }, [])

  /* ─── color tokens ─── */
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

  /* ─── data fetch (100% preserved) ─── */
  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from('broadcast_messages')
          .select('*, sender:sent_by(first_name, last_name)')
          .order('sent_at', { ascending: false })
          .limit(50)
        const visible = (data || []).filter(m =>
          m.audience === 'all' || (Array.isArray(m.recipient_ids) && m.recipient_ids.includes(staffProfile?.id))
        )
        setMessages(visible)
      } catch (err) { console.error('Broadcasts load error:', err) }
      finally { setLoading(false) }
    }
    load()
  }, [staffProfile?.id])

  /* ─── read/pin persistence ─── */
  const markRead = (id) => {
    if (!readIds.includes(id)) {
      const next = [...readIds, id]
      setReadIds(next)
      try { localStorage.setItem('velcare_read_broadcasts', JSON.stringify(next)) } catch {}
    }
  }
  const togglePin = (id) => {
    const next = pinnedIds.includes(id) ? pinnedIds.filter(x => x !== id) : [...pinnedIds, id]
    setPinnedIds(next)
    try { localStorage.setItem('velcare_pinned_broadcasts', JSON.stringify(next)) } catch {}
  }
  const markAllRead = () => {
    const allIds = messages.map(m => m.id)
    setReadIds(allIds)
    try { localStorage.setItem('velcare_read_broadcasts', JSON.stringify(allIds)) } catch {}
  }

  /* ─── computed ─── */
  const unreadCount = messages.filter(m => !readIds.includes(m.id)).length
  const urgentCount = messages.filter(m => m.priority === 'urgent').length
  const importantCount = messages.filter(m => m.priority === 'important').length

  const filtered = messages.filter(m => {
    if (priorityFilter === 'urgent' && m.priority !== 'urgent') return false
    if (priorityFilter === 'important' && m.priority !== 'important') return false
    if (priorityFilter === 'unread' && readIds.includes(m.id)) return false
    if (priorityFilter === 'pinned' && !pinnedIds.includes(m.id)) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (m.title || '').toLowerCase().includes(q) || (m.body || '').toLowerCase().includes(q) ||
        (m.sender ? `${m.sender.first_name} ${m.sender.last_name}`.toLowerCase().includes(q) : false)
    }
    return true
  })

  // Sort: pinned first, then by date
  const sorted = [...filtered].sort((a, b) => {
    const aPinned = pinnedIds.includes(a.id), bPinned = pinnedIds.includes(b.id)
    if (aPinned && !bPinned) return -1
    if (!aPinned && bPinned) return 1
    return new Date(b.sent_at) - new Date(a.sent_at)
  })

  /* ─── loading state ─── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` }}>
          <Megaphone size={22} style={{ color: 'white' }} />
        </div>
        <div style={{ position: 'absolute', inset: -4, borderRadius: 18, border: `2px solid ${c.staff}`, opacity: 0.3, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: dk.textMuted }}>Loading broadcasts...</p>
    </div>
  )

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* ─── Keyframes ─── */}
      <style>{`
        @keyframes orbFloat { 0%,100% { transform:translateY(0) scale(1) } 50% { transform:translateY(-15px) scale(1.03) } }
        @keyframes ping { 75%,100% { transform:scale(1.8);opacity:0 } }
        @keyframes pulse-dot { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes countUp { from { opacity:0;transform:translateY(8px) scale(0.95) } to { opacity:1;transform:translateY(0) scale(1) } }
        @keyframes slideDown { from { opacity:0;max-height:0 } to { opacity:1;max-height:600px } }
        .count-up { animation: countUp .7s cubic-bezier(.16,1,.3,1) forwards }
      `}</style>

      {/* ─── Background Orbs ─── */}
      <Orb color={c.staff} size={280} top="-80px" right="-60px" delay={0} />
      <Orb color={c.staffHover} size={200} bottom="10%" left="-40px" delay={2} />
      <Orb color="#8b5cf6" size={160} top="40%" right="15%" delay={4} />
      <Orb color="#06b6d4" size={200} bottom="-50px" right="25%" delay={1} />
      <Orb color="#f59e0b" size={140} top="20%" left="20%" delay={3} />

      {/* ─── Content ─── */}
      <div style={{ position: 'relative', zIndex: 1, padding: '0 0 40px' }}>

        {/* ═══════ HERO BANNER ═══════ */}
        <div style={{
          ...stg(0),
          background: `linear-gradient(135deg, ${c.staff} 0%, ${c.staffHover} 40%, #3b82f6 70%, #06b6d4 100%)`,
          borderRadius: 20, padding: '28px 24px', marginBottom: 24,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', bottom: -50, left: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', top: '55%', right: '20%', width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
          {[{ top: '15%', left: '85%', size: 5, delay: '0s' }, { top: '70%', left: '90%', size: 3, delay: '1s' }, { top: '35%', left: '8%', size: 4, delay: '2s' }].map((dot, i) => (
            <div key={i} style={{ position: 'absolute', top: dot.top, left: dot.left, width: dot.size, height: dot.size, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', animation: `pulse-dot 2s ease-in-out ${dot.delay} infinite` }} />
          ))}

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', fontSize: 11, fontWeight: 700, color: 'white', letterSpacing: '0.04em' }}>
                <Megaphone size={12} /> BROADCASTS
              </span>
              {unreadCount > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'rgba(245,158,11,0.3)', backdropFilter: 'blur(8px)', fontSize: 10, fontWeight: 700, color: '#fde68a' }}>
                  <Bell size={10} /> {unreadCount} UNREAD
                </span>
              )}
              {urgentCount > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.3)', backdropFilter: 'blur(8px)', fontSize: 10, fontWeight: 700, color: '#fca5a5' }}>
                  <AlertTriangle size={10} /> {urgentCount} URGENT
                </span>
              )}
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', lineHeight: 1.2, marginBottom: 4 }}>Messages & Broadcasts</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 16 }}>
              Stay up to date with announcements from your organisation
            </p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'Total', value: messages.length, icon: MessageSquare },
                { label: 'Unread', value: unreadCount, icon: Bell },
                { label: 'Urgent', value: urgentCount, icon: AlertTriangle },
                { label: 'Pinned', value: pinnedIds.filter(id => messages.some(m => m.id === id)).length, icon: Pin },
              ].map((pill, i) => (
                <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <pill.icon size={12} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>{pill.value}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{pill.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════ STAT CARDS ═══════ */}
        <div style={{ ...stg(1), display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { icon: MessageSquare, label: 'Total Messages', value: messages.length, gradient: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, glow: `${c.staff}40` },
            { icon: Bell, label: 'Unread', value: unreadCount, gradient: 'linear-gradient(135deg, #f59e0b, #f97316)', glow: 'rgba(245,158,11,0.3)', alert: unreadCount > 0 },
            { icon: AlertTriangle, label: 'Urgent', value: urgentCount, gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', glow: 'rgba(239,68,68,0.3)', alert: urgentCount > 0 },
            { icon: Star, label: 'Important', value: importantCount, gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)', glow: 'rgba(139,92,246,0.3)' },
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
              { id: 'all', label: 'All', count: messages.length },
              { id: 'unread', label: 'Unread', count: unreadCount },
              { id: 'urgent', label: 'Urgent', count: urgentCount },
              { id: 'important', label: 'Important', count: importantCount },
              { id: 'pinned', label: 'Pinned', count: pinnedIds.filter(id => messages.some(m => m.id === id)).length },
            ].map(f => (
              <button key={f.id} onClick={() => setPriorityFilter(f.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700, transition: 'all .25s cubic-bezier(.16,1,.3,1)',
                  background: priorityFilter === f.id ? `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` : 'transparent',
                  color: priorityFilter === f.id ? 'white' : dk.textMuted,
                  boxShadow: priorityFilter === f.id ? `0 4px 16px -4px ${c.staff}50` : 'none',
                }}>
                {f.label}
                {f.count > 0 && (
                  <span style={{
                    padding: '1px 7px', borderRadius: 999, fontSize: 10, fontWeight: 800,
                    background: priorityFilter === f.id ? 'rgba(255,255,255,0.25)' : dk.subtleBg2,
                    color: priorityFilter === f.id ? 'white' : dk.textFaint,
                  }}>{f.count}</span>
                )}
              </button>
            ))}
          </Glass>

          <Glass isDark={isDark} style={{ padding: '4px 14px', display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 200px', minWidth: 0 }}>
            <Search size={16} style={{ color: dk.textFaint, flexShrink: 0 }} />
            <input
              type="text" placeholder="Search messages..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                flex: 1, padding: '8px 0', background: 'transparent', border: 'none', outline: 'none',
                fontSize: 13, fontWeight: 600, color: dk.text, minWidth: 0,
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ padding: 4, borderRadius: 6, border: 'none', cursor: 'pointer', background: dk.subtleBg2, color: dk.textFaint }}>
                <X size={12} />
              </button>
            )}
          </Glass>

          {unreadCount > 0 && (
            <button onClick={markAllRead}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12,
                border: `1.5px solid ${dk.divider}`, background: 'transparent', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, color: dk.textMuted, transition: 'all .2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = dk.subtleBg2}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <CheckCircle size={14} /> Mark all read
            </button>
          )}
        </div>

        {/* ═══════ MESSAGES LIST ═══════ */}
        <div style={{ ...stg(3), display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Result count */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 12, color: dk.textFaint }}>
              {sorted.length} message{sorted.length !== 1 ? 's' : ''}
              {priorityFilter !== 'all' && ` · Filtered by ${priorityFilter}`}
              {searchQuery && ` · "${searchQuery}"`}
            </p>
          </div>

          {sorted.length > 0 ? sorted.map((msg, idx) => {
            const isUrgent = msg.priority === 'urgent'
            const isImportant = msg.priority === 'important'
            const isExpanded = expanded === msg.id
            const isRead = readIds.includes(msg.id)
            const isPinned = pinnedIds.includes(msg.id)

            const borderColor = isUrgent ? (isDark ? 'rgba(239,68,68,0.4)' : '#fecaca')
              : isImportant ? (isDark ? 'rgba(245,158,11,0.3)' : '#fde68a')
              : isDark ? 'rgba(51,65,85,0.4)' : 'rgba(255,255,255,0.7)'

            const glowColor = isUrgent ? 'rgba(239,68,68,0.15)' : isImportant ? 'rgba(245,158,11,0.1)' : undefined

            return (
              <Glass key={msg.id} isDark={isDark} glow={glowColor}
                style={{
                  overflow: 'hidden', cursor: 'pointer', transition: 'all .3s cubic-bezier(.16,1,.3,1)',
                  borderColor, opacity: isRead && !isExpanded ? 0.8 : 1,
                  borderLeft: `4px solid ${isUrgent ? '#ef4444' : isImportant ? '#f59e0b' : c.staff}`,
                }}
              >
                <div
                  onClick={() => { setExpanded(isExpanded ? null : msg.id); markRead(msg.id) }}
                  style={{ padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 14 }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    background: isUrgent ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                      : isImportant ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                      : `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`,
                    boxShadow: isUrgent ? '0 4px 12px -2px rgba(239,68,68,0.4)'
                      : isImportant ? '0 4px 12px -2px rgba(245,158,11,0.3)'
                      : `0 4px 12px -2px ${c.staff}30`,
                  }}>
                    {isUrgent ? <AlertTriangle size={20} style={{ color: 'white' }} /> : <Megaphone size={20} style={{ color: 'white' }} />}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <p style={{ fontSize: 14, fontWeight: isRead ? 600 : 800, color: dk.text }}>{msg.title}</p>
                      {!isRead && <span style={{ width: 7, height: 7, borderRadius: 4, background: c.staff, flexShrink: 0 }} />}
                      {isUrgent && <Badge color="red" isDark={isDark}>Urgent</Badge>}
                      {isImportant && <Badge color="amber" isDark={isDark}>Important</Badge>}
                      {isPinned && <Pin size={12} style={{ color: c.staff, flexShrink: 0 }} />}
                    </div>
                    {!isExpanded && (
                      <p style={{
                        fontSize: 12, color: dk.textMuted, lineHeight: 1.5,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>{msg.body}</p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: dk.textFaint }}>
                        <Clock size={10} /> {formatDate(msg.sent_at)}
                      </span>
                      {msg.sender && (
                        <span style={{ fontSize: 10, color: dk.textFaint }}>· {msg.sender.first_name} {msg.sender.last_name}</span>
                      )}
                      {msg.audience && (
                        <Badge color={msg.audience === 'all' ? 'blue' : 'purple'} isDark={isDark}>
                          {msg.audience === 'all' ? 'All Staff' : 'Direct'}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                    <button onClick={(e) => { e.stopPropagation(); togglePin(msg.id) }}
                      style={{
                        padding: 6, borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all .2s',
                        background: isPinned ? (isDark ? `${c.staff}20` : `${c.staff}10`) : 'transparent',
                        color: isPinned ? c.staff : dk.textFaint,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = dk.subtleBg2}
                      onMouseLeave={e => e.currentTarget.style.background = isPinned ? (isDark ? `${c.staff}20` : `${c.staff}10`) : 'transparent'}
                    >
                      <Pin size={14} />
                    </button>
                  </div>
                </div>

                {/* Expanded body */}
                {isExpanded && (
                  <div style={{ padding: '0 18px 18px', animation: 'slideDown .3s ease' }}>
                    <div style={{
                      padding: 16, borderRadius: 14,
                      background: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(249,250,251,0.8)',
                      border: `1px solid ${dk.divider}`,
                    }}>
                      <p style={{ fontSize: 13, color: dk.text, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{msg.body}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
                      <p style={{ fontSize: 11, color: dk.textFaint }}>
                        Sent {formatDateFull(msg.sent_at)}
                        {msg.sender && ` by ${msg.sender.first_name} ${msg.sender.last_name}`}
                      </p>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={(e) => { e.stopPropagation(); togglePin(msg.id) }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8,
                            border: `1px solid ${dk.divider}`, background: 'transparent', cursor: 'pointer',
                            fontSize: 11, fontWeight: 600, color: isPinned ? c.staff : dk.textMuted, transition: 'all .2s',
                          }}>
                          <Pin size={12} /> {isPinned ? 'Unpin' : 'Pin'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </Glass>
            )
          }) : (
            /* ─── Empty state ─── */
            <Glass isDark={isDark} style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20, margin: '0 auto 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `linear-gradient(135deg, ${c.staff}20, ${c.staffHover}15)`,
              }}>
                <Megaphone size={28} style={{ color: c.staff }} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 800, color: dk.text }}>
                {searchQuery || priorityFilter !== 'all' ? 'No matching messages' : 'No messages yet'}
              </p>
              <p style={{ fontSize: 13, color: dk.textFaint, marginTop: 6, maxWidth: 320, margin: '6px auto 0' }}>
                {searchQuery || priorityFilter !== 'all' ? 'Try adjusting your filters or search query' : 'Broadcasts from your admin team will appear here'}
              </p>
              {(searchQuery || priorityFilter !== 'all') && (
                <button onClick={() => { setSearchQuery(''); setPriorityFilter('all') }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16,
                    padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, color: 'white',
                    fontSize: 13, fontWeight: 700, transition: 'all .2s',
                  }}>
                  Clear filters
                </button>
              )}
            </Glass>
          )}
        </div>
      </div>
    </div>
  )
}