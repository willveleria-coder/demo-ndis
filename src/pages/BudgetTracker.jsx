import { useState, useEffect, useRef, useMemo } from 'react'
import {
  DollarSign, TrendingUp, AlertTriangle, Loader2, Search, Users,
  Calendar, TrendingDown, Shield, BarChart3, ArrowRight, Activity,
  CheckCircle, XCircle, Wallet, Clock, ChevronRight, ChevronDown,
  Layers, Zap, Target, Eye, Hash, User, RefreshCw
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
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
    <div style={{ background: base, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${border}`, borderRadius: '1.25rem', boxShadow: glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)', transition: hover ? 'all .3s cubic-bezier(.16,1,.3,1)' : undefined, ...style }}
    onMouseEnter={hover ? e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = glow ? `0 16px 48px -8px ${glow}` : '0 12px 40px -8px rgba(0,0,0,0.12)' } : undefined}
    onMouseLeave={hover ? e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)' } : undefined}
    {...p}>{children}</div>
  )
}

function Orb({ color, size = 200, top, left, right, bottom, delay = 0 }) {
  return (<div style={{ position: 'absolute', width: size, height: size, top, left, right, bottom, background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, opacity: 0.12, borderRadius: '50%', animation: `orbFloat ${6 + delay}s ease-in-out ${delay}s infinite`, pointerEvents: 'none', zIndex: 0 }} />)
}

function AnimNum({ value, prefix = '', suffix = '', duration = 900 }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef()
  useEffect(() => {
    const num = typeof value === 'number' ? value : parseFloat(value) || 0
    const start = performance.now()
    function tick(now) { const p = Math.min((now - start) / duration, 1); setDisplay(Math.round(num * (1 - Math.pow(1 - p, 3)))); if (p < 1) ref.current = requestAnimationFrame(tick) }
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
  }
  const pl = palettes[color] || palettes.gray
  return (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: pl.bg, color: pl.text, border: `1px solid ${pl.border}`, whiteSpace: 'nowrap' }}>{children}</span>)
}


/* ─── Helpers (100% preserved) ─── */
function calcHours(clockIn, clockOut) { if (!clockIn || !clockOut) return 0; return (new Date(clockOut) - new Date(clockIn)) / 3600000 }
function daysRemaining(endDate) { if (!endDate) return null; return Math.ceil((new Date(endDate) - new Date()) / 86400000) }


/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

export default function BudgetTracker() {
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [participants, setParticipants] = useState([])
  const [shifts, setShifts] = useState([])
  const [claims, setClaims] = useState([])
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('usage') // usage | remaining | risk

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
  useEffect(() => {
    async function load() {
      try {
        const [partRes, shiftRes, claimRes] = await Promise.all([
          supabase.from('participants').select('id, first_name, last_name, ndis_number, plan_budget, plan_start_date, plan_end_date, status').eq('status', 'active'),
          supabase.from('shifts').select('id, participant_id, clock_in, clock_out, status, shift_date, service_type').eq('status', 'completed'),
          supabase.from('ndis_claims').select('id, participant_id, total_amount, status').then(r => r).catch(() => ({ data: [] })),
        ])
        setParticipants(partRes.data || []); setShifts(shiftRes.data || []); setClaims(claimRes.data || [])
      } catch (err) { console.error('Budget tracker load error:', err) }
      finally { setLoading(false); setTimeout(() => setLoaded(true), 50) }
    }
    load()
  }, [])

  const getBudgetData = (p) => {
    const budget = parseFloat(p.plan_budget) || 0
    const pShifts = shifts.filter(s => s.participant_id === p.id && s.clock_in && s.clock_out)
    const totalHours = pShifts.reduce((sum, s) => sum + calcHours(s.clock_in, s.clock_out), 0)
    const pClaims = claims.filter(cl => cl.participant_id === p.id)
    const claimed = pClaims.reduce((sum, cl) => sum + (parseFloat(cl.total_amount) || 0), 0)
    const estimatedSpend = totalHours * 65
    const spent = claimed > 0 ? claimed : estimatedSpend
    const remaining = Math.max(0, budget - spent)
    const usedPct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
    const daysLeft = daysRemaining(p.plan_end_date)
    const totalPlanDays = p.plan_start_date && p.plan_end_date ? Math.ceil((new Date(p.plan_end_date) - new Date(p.plan_start_date)) / 86400000) : null
    const daysElapsed = totalPlanDays && daysLeft !== null ? totalPlanDays - daysLeft : null
    const dailyBurnRate = daysElapsed && daysElapsed > 0 ? spent / daysElapsed : 0
    const projectedTotal = dailyBurnRate > 0 && totalPlanDays ? dailyBurnRate * totalPlanDays : spent
    const projectedOverspend = projectedTotal > budget
    const weeklyBurn = dailyBurnRate * 7
    return { budget, totalHours, spent, remaining, usedPct, daysLeft, dailyBurnRate, weeklyBurn, projectedTotal, projectedOverspend, shiftCount: pShifts.length, totalPlanDays }
  }

  const participantsWithBudget = useMemo(() => {
    try {
      return participants.filter(p => p.plan_budget).map(p => ({ ...p, budgetData: getBudgetData(p) }))
    } catch (err) {
      console.error('Budget data calc error:', err)
      return []
    }
  }, [participants, shifts, claims])

  const filtered = useMemo(() => {
    let list = participantsWithBudget.filter(p => { if (!search) return true; const q = search.toLowerCase(); return `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) || (p.ndis_number || '').includes(q) })
    if (sortBy === 'usage') list.sort((a, b) => b.budgetData.usedPct - a.budgetData.usedPct)
    else if (sortBy === 'remaining') list.sort((a, b) => a.budgetData.remaining - b.budgetData.remaining)
    else if (sortBy === 'risk') list.sort((a, b) => (b.budgetData.projectedOverspend ? 1 : 0) - (a.budgetData.projectedOverspend ? 1 : 0) || b.budgetData.usedPct - a.budgetData.usedPct)
    return list
  }, [participantsWithBudget, search, sortBy])

  const totalBudget = participantsWithBudget.reduce((s, p) => s + p.budgetData.budget, 0)
  const totalSpent = participantsWithBudget.reduce((s, p) => s + p.budgetData.spent, 0)
  const totalRemaining = participantsWithBudget.reduce((s, p) => s + p.budgetData.remaining, 0)
  const atRisk = participantsWithBudget.filter(p => p.budgetData.usedPct > 80 || p.budgetData.projectedOverspend).length
  const onTrack = participantsWithBudget.length - atRisk
  const overallPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0

  /* Charts */
  const statusPie = useMemo(() => [
    { name: 'On Track', value: onTrack, color: '#10b981' },
    { name: 'At Risk', value: atRisk, color: '#ef4444' },
  ].filter(s => s.value > 0), [onTrack, atRisk])


  /* ─── Loading ─── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${c.primary}40` }}><Wallet size={32} color="white" /></div>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.3 }} />
      </div>
      <p style={{ color: dk.textMuted, fontSize: 14, fontWeight: 600 }}>Loading budgets...</p>
    </div>
  )


  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <style>{`
        @keyframes orbFloat { 0%,100% { transform:translateY(0) scale(1) } 50% { transform:translateY(-15px) scale(1.03) } }
        @keyframes ping { 75%,100% { transform:scale(1.8);opacity:0 } }
        @keyframes pulse-dot { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes countUp { from { opacity:0;transform:translateY(8px) scale(0.95) } to { opacity:1;transform:translateY(0) scale(1) } }
        @keyframes barGrow { from { width: 0% } }
        .count-up { animation: countUp .7s cubic-bezier(.16,1,.3,1) forwards }
        .bar-grow { animation: barGrow 1s cubic-bezier(.16,1,.3,1) forwards }
      `}</style>

      <Orb color={c.primary} size={380} top="-100px" right="-80px" delay={0} />
      <Orb color="#10b981" size={280} bottom="15%" left="-60px" delay={2} />
      <Orb color="#ef4444" size={200} top="45%" right="8%" delay={3.5} />
      <Orb color="#f59e0b" size={160} bottom="30%" left="40%" delay={5} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ══════════ HERO ══════════ */}
        <div style={stg(0)}>
          <div style={{ borderRadius: 24, padding: '28px 24px', position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 40%, #10b981 70%, #06b6d4 100%)` }}>
            <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: -80, right: -40 }} />
            <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -50, left: '25%' }} />
            <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent)', top: 30, left: '55%', animation: 'orbFloat 8s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.5 }} />
            {[{ top: '15%', right: '20%', s: 4, d: 0 }, { top: '60%', right: '10%', s: 3, d: 1.5 }, { bottom: '25%', left: '35%', s: 5, d: 3 }].map((dot, i) => (
              <div key={i} style={{ position: 'absolute', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', width: dot.s * 2, height: dot.s * 2, top: dot.top, right: dot.right, bottom: dot.bottom, left: dot.left, animation: `orbFloat ${4 + dot.d}s ease-in-out infinite ${dot.d}s` }} />
            ))}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}><BarChart3 size={13} style={{ color: 'rgba(255,255,255,0.7)' }} /><span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>NDIS Plan Budgets</span></div>
                {atRisk > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(239,68,68,0.3)', backdropFilter: 'blur(8px)' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fca5a5', animation: 'pulse-dot 2s ease-in-out infinite' }} /><span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>{atRisk} at risk</span></div>}
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15 }}>Budget Tracker</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>{participantsWithBudget.length} participants with NDIS plan budgets</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
                {[
                  { icon: DollarSign, text: `$${(totalBudget / 1000).toFixed(0)}k total budget` },
                  { icon: TrendingUp, text: `$${(totalSpent / 1000).toFixed(0)}k spent`, bg: 'rgba(245,158,11,0.35)' },
                  { icon: Wallet, text: `$${(totalRemaining / 1000).toFixed(0)}k remaining`, bg: 'rgba(16,185,129,0.3)' },
                  { icon: CheckCircle, text: `${onTrack} on track` },
                  atRisk > 0 && { icon: AlertTriangle, text: `${atRisk} at risk`, bg: 'rgba(239,68,68,0.3)' },
                ].filter(Boolean).map((pill, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 12, background: pill.bg || 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <pill.icon size={14} style={{ color: 'rgba(255,255,255,0.8)' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{pill.text}</span>
                  </div>
                ))}
              </div>
              {/* Overall progress */}
              <div style={{ maxWidth: 400, marginTop: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
                  <span>${totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })} spent</span>
                  <span>${totalBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })} budget</span>
                </div>
                <div style={{ height: 10, borderRadius: 999, overflow: 'hidden', background: 'rgba(255,255,255,0.15)' }}>
                  <div className="bar-grow" style={{ height: '100%', borderRadius: 999, width: `${overallPct}%`, background: `linear-gradient(90deg, #10b981 0%, #f59e0b 60%, #ef4444 100%)`, backgroundSize: '300% 100%', backgroundPosition: `${overallPct}% 0` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════ AT-RISK ALERT ══════════ */}
        {atRisk > 0 && (
          <Glass dark={isDark} glow="rgba(239,68,68,0.15)" style={{ ...stg(1), padding: '16px 20px', borderColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #ef4444, #f87171)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px -4px rgba(239,68,68,0.4)' }}><AlertTriangle size={22} color="white" /></div>
              <div>
                <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{atRisk} participant{atRisk > 1 ? 's' : ''} at risk of budget overrun</p>
                <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>Review burn rates and adjust service delivery</p>
              </div>
            </div>
          </Glass>
        )}

        {/* ══════════ STAT CARDS ══════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, ...stg(2) }}>
          {[
            { icon: Wallet, label: 'Total Budget', value: Math.round(totalBudget / 1000), prefix: '$', suffix: 'k', grad: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, glow: `${c.primary}35` },
            { icon: TrendingUp, label: 'Total Spent', value: Math.round(totalSpent / 1000), prefix: '$', suffix: 'k', grad: 'linear-gradient(135deg, #f59e0b, #fbbf24)', glow: 'rgba(245,158,11,0.2)' },
            { icon: DollarSign, label: 'Remaining', value: Math.round(totalRemaining / 1000), prefix: '$', suffix: 'k', grad: 'linear-gradient(135deg, #10b981, #34d399)', glow: 'rgba(16,185,129,0.2)' },
            { icon: CheckCircle, label: 'On Track', value: onTrack, grad: 'linear-gradient(135deg, #3b82f6, #60a5fa)', glow: 'rgba(59,130,246,0.2)' },
            { icon: AlertTriangle, label: 'At Risk', value: atRisk, grad: 'linear-gradient(135deg, #ef4444, #f87171)', glow: 'rgba(239,68,68,0.2)', pulse: atRisk > 0 },
            { icon: Users, label: 'Tracked', value: participantsWithBudget.length, grad: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', glow: 'rgba(139,92,246,0.2)' },
          ].map((card, i) => (
            <Glass key={i} dark={isDark} hover glow={card.glow} style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
              {card.pulse && <div style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse-dot 2s ease-in-out infinite' }} />}
              <div style={{ width: 42, height: 42, borderRadius: 12, background: card.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 20px -4px ${card.glow}`, marginBottom: 12 }}><card.icon size={20} color="white" /></div>
              <p style={{ fontSize: 22, fontWeight: 800, color: dk.text, lineHeight: 1 }} className="count-up"><AnimNum value={card.value} prefix={card.prefix || ''} suffix={card.suffix || ''} /></p>
              <p style={{ fontSize: 11, fontWeight: 600, color: dk.textFaint, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</p>
            </Glass>
          ))}
        </div>

        {/* ══════════ SEARCH + SORT ══════════ */}
        <Glass dark={isDark} style={{ ...stg(3), padding: '12px 18px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or NDIS number..." style={{ ...inputStyle, paddingLeft: 40 }} onFocus={e => e.target.style.borderColor = c.primary} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
            </div>
            <div style={{ position: 'relative' }}>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '11px 36px 11px 14px', background: dk.inputBg, border: `1px solid ${dk.inputBorder}`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none', appearance: 'none', cursor: 'pointer', minWidth: 140 }}>
                <option value="usage">Sort: Highest Usage</option>
                <option value="remaining">Sort: Lowest Remaining</option>
                <option value="risk">Sort: At Risk First</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint, pointerEvents: 'none' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: dk.textFaint, padding: '6px 12px', borderRadius: 10, background: dk.subtleBg }}>{filtered.length} participant{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </Glass>

        {/* ══════════ BUDGET CARDS ══════════ */}
        {filtered.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map((p, i) => {
              const d = p.budgetData
              const barColor = d.usedPct > 90 ? '#ef4444' : d.usedPct > 75 ? '#f59e0b' : '#10b981'
              const statusGlow = d.projectedOverspend ? 'rgba(239,68,68,0.12)' : d.usedPct > 75 ? 'rgba(245,158,11,0.1)' : `${c.primary}08`

              return (
                <Glass key={p.id} dark={isDark} hover glow={statusGlow}
                  style={{ ...stg(i + 4), padding: '22px', position: 'relative', overflow: 'hidden', borderColor: d.projectedOverspend ? (isDark ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.3)') : d.usedPct > 75 ? (isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.25)') : undefined }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderRadius: '0 4px 4px 0', background: `linear-gradient(to bottom, ${barColor}, ${barColor}60)` }} />

                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, paddingLeft: 8, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${barColor}, ${barColor}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 15, fontWeight: 800, boxShadow: `0 4px 16px -4px ${barColor}50`, flexShrink: 0 }}>{p.first_name?.[0]}{p.last_name?.[0]}</div>
                      <div>
                        <p style={{ fontWeight: 800, color: dk.text, fontSize: 15 }}>{p.first_name} {p.last_name}</p>
                        <p style={{ fontSize: 12, color: dk.textFaint, marginTop: 2 }}>NDIS: {p.ndis_number || '—'}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      {d.projectedOverspend && <Badge color="red" dark={isDark}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', display: 'inline-block', marginRight: 3, animation: 'pulse-dot 2s ease-in-out infinite' }} />Over Budget Risk</Badge>}
                      {!d.projectedOverspend && d.usedPct > 75 && <Badge color="amber" dark={isDark}>High Usage</Badge>}
                      {!d.projectedOverspend && d.usedPct <= 75 && <Badge color="green" dark={isDark}>On Track</Badge>}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ paddingLeft: 8, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                      <span style={{ color: dk.textMuted }}>${d.spent.toFixed(0)} spent</span>
                      <span style={{ fontWeight: 700, color: dk.textSoft }}>${d.budget.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 10, borderRadius: 999, overflow: 'hidden', background: dk.subtleBg2 }}>
                      <div className="bar-grow" style={{ height: '100%', borderRadius: 999, width: `${d.usedPct}%`, background: barColor, transition: 'width 1s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 6 }}>
                      <span style={{ color: dk.textFaint }}>{d.usedPct.toFixed(0)}% used</span>
                      <span style={{ fontWeight: 700, color: barColor }}>${d.remaining.toFixed(0)} remaining</span>
                    </div>
                  </div>

                  {/* Mini stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 8, paddingLeft: 8 }}>
                    {[
                      { label: 'Shifts', value: d.shiftCount, icon: Activity, color: '#3b82f6' },
                      { label: 'Hours', value: `${d.totalHours.toFixed(1)}h`, icon: Clock, color: '#8b5cf6' },
                      { label: 'Weekly Burn', value: `$${d.weeklyBurn.toFixed(0)}`, icon: TrendingUp, color: '#f59e0b' },
                      { label: 'Plan Left', value: d.daysLeft !== null ? `${d.daysLeft}d` : '—', icon: Calendar, color: d.daysLeft !== null && d.daysLeft < 30 ? '#ef4444' : '#10b981', alert: d.daysLeft !== null && d.daysLeft < 30 },
                    ].map((stat, si) => (
                      <div key={si} style={{ padding: '10px 12px', borderRadius: 12, textAlign: 'center', background: stat.alert ? (isDark ? 'rgba(239,68,68,0.06)' : '#fef2f2') : dk.subtleBg, border: `1px solid ${stat.alert ? (isDark ? 'rgba(239,68,68,0.15)' : '#fecaca') : dk.subtleBg2}` }}>
                        <stat.icon size={13} style={{ color: stat.color, margin: '0 auto 4px' }} />
                        <p style={{ fontSize: 13, fontWeight: 800, color: stat.alert ? '#ef4444' : dk.text }}>{stat.value}</p>
                        <p style={{ fontSize: 9, fontWeight: 600, color: dk.textFaint, textTransform: 'uppercase', marginTop: 2 }}>{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Overspend warning */}
                  {d.projectedOverspend && (
                    <div style={{ marginTop: 14, marginLeft: 8, padding: '12px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, background: isDark ? 'rgba(239,68,68,0.06)' : '#fef2f2', border: `1px solid ${isDark ? 'rgba(239,68,68,0.15)' : '#fecaca'}` }}>
                      <TrendingUp size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                      <p style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#fca5a5' : '#b91c1c' }}>
                        At current burn rate (${d.dailyBurnRate.toFixed(0)}/day), projected spend is ${d.projectedTotal.toFixed(0)} — exceeds budget by <strong>${(d.projectedTotal - d.budget).toFixed(0)}</strong>
                      </p>
                    </div>
                  )}
                </Glass>
              )
            })}
          </div>
        ) : (
          <Glass dark={isDark} style={{ ...stg(4), padding: '56px 24px', textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: 22, margin: '0 auto 20px', background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 32px -8px ${c.primary}40` }}><Wallet size={36} color="white" /></div>
            <p style={{ fontWeight: 700, color: dk.text, fontSize: 18 }}>{search ? 'No matching participants' : 'No participants with plan budgets set'}</p>
            <p style={{ fontSize: 14, color: dk.textFaint, marginTop: 6 }}>{search ? 'Try a different search' : 'Set plan budgets on participant profiles to enable tracking'}</p>
          </Glass>
        )}

        {/* ══════════ INSIGHTS ══════════ */}
        {participantsWithBudget.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, ...stg(6) }}>
            <Glass dark={isDark} glow={`${c.primary}10`} style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><BarChart3 size={18} style={{ color: c.primary }} /><h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Budget Status</h3></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ minWidth: 0 }}><ResponsiveContainer width={120} height={120}><PieChart><Pie data={statusPie} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} stroke="none">{statusPie.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip content={<CT />} /></PieChart></ResponsiveContainer></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{statusPie.map((s, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} /><span style={{ fontSize: 12, color: dk.textMuted }}>{s.name}</span><span style={{ fontSize: 13, fontWeight: 800, color: dk.text, marginLeft: 'auto' }}>{s.value}</span></div>))}</div>
              </div>
            </Glass>

            {/* Overall usage ring */}
            <Glass dark={isDark} glow="rgba(16,185,129,0.1)" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginBottom: 20 }}><DollarSign size={18} style={{ color: '#10b981' }} /><h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Overall Usage</h3></div>
              {(() => {
                const r = 46, circ = 2 * Math.PI * r, off = circ - (overallPct / 100) * circ
                const col = overallPct > 90 ? '#ef4444' : overallPct > 70 ? '#f59e0b' : '#10b981'
                return (<>
                  <div style={{ position: 'relative', width: 110, height: 110 }}>
                    <svg width={110} height={110} style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx={55} cy={55} r={r} fill="none" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'} strokeWidth="8" />
                      <circle cx={55} cy={55} r={r} fill="none" stroke={col} strokeWidth="8" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 4px ${col}40)` }} />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 24, fontWeight: 900, color: col }}>{overallPct.toFixed(0)}%</span>
                      <span style={{ fontSize: 9, fontWeight: 600, color: dk.textFaint, textTransform: 'uppercase' }}>used</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                    {[{ label: 'Spent', value: `$${(totalSpent / 1000).toFixed(0)}k`, color: '#f59e0b' }, { label: 'Left', value: `$${(totalRemaining / 1000).toFixed(0)}k`, color: '#10b981' }].map((m, i) => (
                      <div key={i} style={{ textAlign: 'center' }}><p style={{ fontSize: 18, fontWeight: 800, color: m.color }}>{m.value}</p><p style={{ fontSize: 10, fontWeight: 600, color: dk.textFaint, textTransform: 'uppercase' }}>{m.label}</p></div>
                    ))}
                  </div>
                </>)
              })()}
            </Glass>

            {/* Quick stats */}
            <Glass dark={isDark} glow="rgba(59,130,246,0.1)" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}><Activity size={18} style={{ color: '#3b82f6' }} /><h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Quick Stats</h3></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Total Participants', value: participantsWithBudget.length, color: '#8b5cf6' },
                  { label: 'Total Shifts', value: shifts.length, color: '#3b82f6' },
                  { label: 'Total Hours', value: `${participantsWithBudget.reduce((s, p) => s + p.budgetData.totalHours, 0).toFixed(0)}h`, color: '#10b981' },
                  { label: 'Avg Usage', value: `${participantsWithBudget.length > 0 ? (participantsWithBudget.reduce((s, p) => s + p.budgetData.usedPct, 0) / participantsWithBudget.length).toFixed(0) : 0}%`, color: '#f59e0b' },
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
    </div>
  )
}