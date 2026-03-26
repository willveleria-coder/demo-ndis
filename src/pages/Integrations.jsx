import { useState, useEffect, useRef } from 'react'
import {
  Link2, CheckCircle, RefreshCw, Loader2, Settings, DollarSign, Users, FileText,
  AlertTriangle, Zap, ChevronRight, Shield, Activity, Eye, XCircle, ArrowRight,
  Layers, Clock, Hash, Star
} from 'lucide-react'
import { useBrandColors } from '../hooks/useBrandColors'
import { useTheme } from '../context/ThemeContext'


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

function Badge({ children, color = 'gray', dark }) {
  const palettes = {
    gray: dark ? { bg: 'rgba(100,116,139,0.2)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)' } : { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
    green: dark ? { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' } : { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
    amber: dark ? { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' } : { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    red: dark ? { bg: 'rgba(239,68,68,0.15)', text: '#f87171', border: 'rgba(239,68,68,0.3)' } : { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    blue: dark ? { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' } : { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    purple: dark ? { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa', border: 'rgba(139,92,246,0.3)' } : { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
  }
  const p = palettes[color] || palettes.gray
  return (<span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
    background: p.bg, color: p.text, border: `1px solid ${p.border}`,
    whiteSpace: 'nowrap',
  }}>{children}</span>)
}

function Toggle({ checked, onChange, color, dark }) {
  return (<button onClick={onChange} style={{
    width: 48, height: 26, borderRadius: 999, position: 'relative',
    background: checked ? color : (dark ? 'rgba(51,65,85,0.6)' : '#d1d5db'),
    border: 'none', cursor: 'pointer', transition: 'background .25s ease',
    flexShrink: 0, boxShadow: checked ? `0 0 12px ${color}30` : 'none',
  }}>
    <div style={{
      width: 20, height: 20, borderRadius: '50%', background: 'white',
      position: 'absolute', top: 3, left: checked ? 25 : 3,
      transition: 'left .25s cubic-bezier(.16,1,.3,1)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
    }} />
  </button>)
}


/* ─────────────────────────────────────────────
   CONFIG (100% PRESERVED)
   ───────────────────────────────────────────── */

const PLATFORMS = [
  { id: 'xero', name: 'Xero', logo: '🔵', desc: 'Cloud accounting for small business', color: '#13b5ea', grad: 'linear-gradient(135deg, #0ea5e9, #0284c7)', features: ['Invoice syncing', 'Payroll journals', 'Contact management', 'Expense tracking', 'Bank reconciliation'] },
  { id: 'myob', name: 'MYOB', logo: '🟣', desc: 'Australian accounting & payroll', color: '#6b21a8', grad: 'linear-gradient(135deg, #7c3aed, #6d28d9)', features: ['Invoice creation', 'Payroll export', 'Supplier payments', 'Contact syncing', 'Tax reporting'] },
]

const SYNC_CATS_INIT = [
  { id: 'invoices', label: 'Invoices', icon: DollarSign, desc: 'Push NDIS claims as invoices', enabled: true, lastSync: '2 hours ago', count: 24, color: '#10b981' },
  { id: 'contacts', label: 'Contacts', icon: Users, desc: 'Sync participants & staff', enabled: true, lastSync: '1 day ago', count: 45, color: '#3b82f6' },
  { id: 'payroll', label: 'Payroll', icon: FileText, desc: 'Export timesheets & pay runs', enabled: false, lastSync: 'Never', count: 0, color: '#f59e0b' },
  { id: 'expenses', label: 'Expenses', icon: DollarSign, desc: 'Push mileage & expenses', enabled: false, lastSync: 'Never', count: 0, color: '#8b5cf6' },
]


/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

export default function Integrations() {
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loaded, setLoaded] = useState(false)
  const [selected, setSelected] = useState(null)
  const [connectingId, setConnectingId] = useState(null)
  const [connected, setConnected] = useState({})
  const [syncing, setSyncing] = useState(null)
  const [cats, setCats] = useState(SYNC_CATS_INIT)

  useEffect(() => { setTimeout(() => setLoaded(true), 50) }, [])

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

  /* ═══ ALL DEMO LOGIC — 100% PRESERVED (bug fixed: connectingId per-platform) ═══ */
  const connect = async (id) => {
    setConnectingId(id)
    await new Promise(r => setTimeout(r, 2000))
    setConnected(p => ({ ...p, [id]: true }))
    setConnectingId(null)
    setSelected(id)
  }
  const disconnect = (id) => { if (!confirm('Disconnect?')) return; setConnected(p => ({ ...p, [id]: false })); if (selected === id) setSelected(null) }
  const sync = async (id) => {
    setSyncing(id)
    await new Promise(r => setTimeout(r, 1500))
    setCats(p => p.map(ct => ct.id === id ? { ...ct, lastSync: 'Just now', count: ct.count + Math.floor(Math.random() * 5) + 1 } : ct))
    setSyncing(null)
  }
  const toggle = (id) => setCats(p => p.map(ct => ct.id === id ? { ...ct, enabled: !ct.enabled } : ct))

  const hasAnyConnection = Object.values(connected).some(v => v)
  const activeConnections = Object.entries(connected).filter(([_, v]) => v).length
  const enabledSyncs = cats.filter(ct => ct.enabled).length
  const totalRecords = cats.reduce((s, ct) => s + ct.count, 0)


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
      <Orb color="#8b5cf6" size={200} top="45%" right="8%" delay={3.5} />
      <Orb color="#10b981" size={160} bottom="30%" left="40%" delay={5} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>


        {/* ══════════ HERO ══════════ */}
        <div style={stg(0)}>
          <div style={{
            borderRadius: 24, padding: '28px 24px', position: 'relative', overflow: 'hidden',
            background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 40%, #3b82f6 70%, #06b6d4 100%)`,
          }}>
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
                  <Link2 size={13} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Accounting</span>
                </div>
                {hasAnyConnection && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.3)', backdropFilter: 'blur(8px)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', animation: 'pulse-dot 2s ease-in-out infinite' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>Active</span>
                  </div>
                )}
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15 }}>Integrations</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>Connect your accounting software to auto-sync data</p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
                {[
                  { icon: Link2, text: `${activeConnections} connected` },
                  { icon: Activity, text: `${enabledSyncs} syncs active`, bg: enabledSyncs > 0 ? 'rgba(16,185,129,0.25)' : undefined },
                  { icon: Hash, text: `${totalRecords} records synced` },
                  ...Object.entries(connected).filter(([_, v]) => v).map(([k]) => ({
                    icon: CheckCircle, text: `${k === 'xero' ? 'Xero' : 'MYOB'} connected`, bg: 'rgba(16,185,129,0.25)',
                  })),
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


        {/* ══════════ NOT CONNECTED BANNER ══════════ */}
        {!hasAnyConnection && (
          <Glass dark={isDark} glow="rgba(59,130,246,0.12)" style={{ ...stg(1), padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px -4px rgba(59,130,246,0.4)' }}>
                <Link2 size={22} color="white" />
              </div>
              <p style={{ fontSize: 13, color: dk.textMuted }}>Connect your accounting software to auto-sync invoices, payroll, and contacts.</p>
            </div>
          </Glass>
        )}


        {/* ══════════ PLATFORM CARDS ══════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, ...stg(2) }}>
          {PLATFORMS.map(plat => {
            const conn = connected[plat.id]
            const isConnecting = connectingId === plat.id

            return (
              <Glass key={plat.id} dark={isDark} hover={!conn}
                glow={conn ? 'rgba(16,185,129,0.15)' : `${plat.color}15`}
                style={{
                  padding: '24px', position: 'relative', overflow: 'hidden',
                  borderColor: conn ? (isDark ? 'rgba(16,185,129,0.25)' : 'rgba(16,185,129,0.3)') : undefined,
                }}>
                {/* Connected indicator */}
                {conn && <div style={{ position: 'absolute', top: 16, right: 16, width: 10, height: 10, borderRadius: '50%', background: '#10b981', animation: 'pulse-dot 2s ease-in-out infinite' }} />}

                {/* Platform header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 16,
                    background: plat.grad, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 6px 20px -4px ${plat.color}40`, flexShrink: 0,
                    fontSize: 24,
                  }}>
                    {plat.logo}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ fontWeight: 800, fontSize: 18, color: dk.text }}>{plat.name}</p>
                      <Badge color={conn ? 'green' : 'gray'} dark={isDark}>{conn ? 'Connected' : 'Not Connected'}</Badge>
                    </div>
                    <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>{plat.desc}</p>
                  </div>
                </div>

                {/* Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {plat.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle size={15} style={{ color: conn ? '#10b981' : dk.textFaint, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: dk.textSoft }}>{f}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {conn ? (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setSelected(plat.id)} style={{
                      flex: 1, padding: '13px 0', borderRadius: 14, border: `1.5px solid ${c.primary}35`,
                      background: isDark ? `${c.primary}12` : `${c.primary}08`, color: c.primary,
                      fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'all .2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                      <Settings size={15} /> Manage
                    </button>
                    <button onClick={() => disconnect(plat.id)} style={{
                      padding: '13px 18px', borderRadius: 14,
                      background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
                      border: `1.5px solid ${isDark ? 'rgba(239,68,68,0.2)' : '#fecaca'}`,
                      color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      transition: 'all .2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button onClick={() => connect(plat.id)} disabled={!!connectingId} style={{
                    width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
                    background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`,
                    color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    boxShadow: `0 6px 24px -6px ${c.primary}50`,
                    opacity: connectingId && !isConnecting ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all .2s',
                  }}
                  onMouseEnter={e => { if (!connectingId) e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    {isConnecting ? <><Loader2 size={16} className="animate-spin" /> Connecting...</> : <><Link2 size={16} /> Connect {plat.name}</>}
                  </button>
                )}
              </Glass>
            )
          })}
        </div>


        {/* ══════════ SYNC SETTINGS ══════════ */}
        {selected && connected[selected] && (
          <Glass dark={isDark} glow={`${c.primary}10`} style={{ ...stg(3), padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: `1px solid ${dk.divider}`, flexWrap: 'wrap', gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: `linear-gradient(135deg, ${c.primary}20, ${c.primary}08)`,
                  border: `1px solid ${c.primary}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Settings size={18} style={{ color: c.primary }} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 16 }}>Sync Settings — {selected === 'xero' ? 'Xero' : 'MYOB'}</h3>
                  <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 1 }}>Configure what data flows between systems</p>
                </div>
              </div>
              <Badge color="green" dark={isDark}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block', marginRight: 3, animation: 'pulse-dot 2s ease-in-out infinite' }} />
                Connected
              </Badge>
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cats.map(cat => {
                const CatIcon = cat.icon
                return (
                  <Glass key={cat.id} dark={isDark} glow={cat.enabled ? `${cat.color}12` : undefined}
                    style={{ padding: '18px 20px', opacity: cat.enabled ? 1 : 0.6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                          background: cat.enabled ? `linear-gradient(135deg, ${cat.color}, ${cat.color}cc)` : (isDark ? 'rgba(51,65,85,0.5)' : '#e5e7eb'),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: cat.enabled ? `0 4px 14px -4px ${cat.color}40` : 'none',
                        }}>
                          <CatIcon size={20} style={{ color: cat.enabled ? 'white' : dk.textFaint }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: 14, color: cat.enabled ? dk.text : dk.textFaint }}>{cat.label}</p>
                          <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>{cat.desc}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, color: dk.textFaint, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={10} /> Last: {cat.lastSync}
                            </span>
                            {cat.count > 0 && <span style={{ fontSize: 11, color: dk.textFaint }}>{cat.count} records</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        {cat.enabled && (
                          <button onClick={() => sync(cat.id)} disabled={syncing === cat.id} style={{
                            width: 40, height: 40, borderRadius: 12, border: 'none',
                            background: dk.subtleBg2, color: dk.textMuted,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all .2s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                            {syncing === cat.id ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                          </button>
                        )}
                        <Toggle checked={cat.enabled} onChange={() => toggle(cat.id)} color={cat.color} dark={isDark} />
                      </div>
                    </div>
                  </Glass>
                )
              })}
            </div>

            {/* Demo warning */}
            <div style={{ padding: '0 24px 24px' }}>
              <div style={{
                padding: '14px 18px', borderRadius: 14,
                background: isDark ? 'rgba(245,158,11,0.06)' : '#fffbeb',
                border: `1px solid ${isDark ? 'rgba(245,158,11,0.15)' : '#fde68a'}`,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <AlertTriangle size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: isDark ? '#fcd34d' : '#92400e' }}>
                  <strong>Demo Mode:</strong> This is a demo UI. Configure API credentials in Settings to activate live syncing.
                </p>
              </div>
            </div>
          </Glass>
        )}


        {/* ══════════ HOW IT WORKS ══════════ */}
        <Glass dark={isDark} glow={`${c.primary}08`} style={{ ...stg(4), padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 10,
            borderBottom: `1px solid ${dk.divider}`,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: `linear-gradient(135deg, ${c.primary}20, ${c.primary}08)`,
              border: `1px solid ${c.primary}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={16} style={{ color: c.primary }} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: dk.text }}>How It Works</p>
          </div>

          <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
            {[
              { icon: Link2, title: 'Connect', desc: 'Authorise via OAuth', color: '#3b82f6' },
              { icon: Settings, title: 'Configure', desc: 'Choose what to sync', color: '#8b5cf6' },
              { icon: RefreshCw, title: 'Auto-Sync', desc: 'Data flows on shift completion', color: '#10b981' },
              { icon: CheckCircle, title: 'Reconcile', desc: 'Match payments to claims', color: '#f59e0b' },
            ].map((step, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, margin: '0 auto 12px',
                  background: `linear-gradient(135deg, ${step.color}, ${step.color}cc)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 6px 20px -4px ${step.color}40`,
                  transition: 'transform .3s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                  <step.icon size={22} color="white" />
                </div>
                <p style={{ fontWeight: 700, fontSize: 14, color: dk.text }}>{step.title}</p>
                <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 3 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </Glass>

      </div>
    </div>
  )
}