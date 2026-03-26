import { useState, useEffect, useRef, useMemo } from 'react'
import {
  DollarSign, Plus, Loader2, Search, Download, CheckCircle, Clock,
  AlertTriangle, FileSpreadsheet, TrendingUp, User, ArrowRight,
  BarChart3, XCircle, Receipt, CreditCard, Sparkles, Layers,
  ChevronRight, ChevronDown, Activity, Shield, Zap, Users,
  Calendar, Hash, Target, Eye, RefreshCw
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

function AnimNum({ value, prefix = '', suffix = '', duration = 900 }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef()
  useEffect(() => { const num = typeof value === 'number' ? value : parseFloat(value) || 0; const start = performance.now(); function tick(now) { const p = Math.min((now - start) / duration, 1); setDisplay(Math.round(num * (1 - Math.pow(1 - p, 3)))); if (p < 1) ref.current = requestAnimationFrame(tick) }; ref.current = requestAnimationFrame(tick); return () => cancelAnimationFrame(ref.current) }, [value, duration])
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
  }
  const pl = palettes[color] || palettes.gray
  return (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: pl.bg, color: pl.text, border: `1px solid ${pl.border}`, whiteSpace: 'nowrap' }}>{children}</span>)
}


/* ─── Helpers (100% preserved) ─── */
function formatDate(iso) { if (!iso) return '—'; return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) }
function calcHours(clockIn, clockOut) { if (!clockIn || !clockOut) return 0; return Math.round(((new Date(clockOut) - new Date(clockIn)) / 3600000) * 100) / 100 }

const SUPPORT_CATEGORIES = [
  { code: '01', name: 'Assistance with Daily Life', rate: 65.09 },
  { code: '02', name: 'Transport', rate: 0.91 },
  { code: '04', name: 'Assistance with Social & Community Participation', rate: 65.09 },
  { code: '07', name: 'Support Coordination', rate: 100.14 },
  { code: '08', name: 'Improved Living Arrangements', rate: 65.09 },
  { code: '09', name: 'Increased Social & Community Participation', rate: 65.09 },
  { code: '11', name: 'Improved Health & Wellbeing', rate: 65.09 },
  { code: '12', name: 'Improved Daily Living Skills', rate: 65.09 },
  { code: '14', name: 'Community Nursing Care', rate: 78.65 },
  { code: '15', name: 'Innovative Community Participation', rate: 65.09 },
]

const CLAIM_STATUSES = ['draft', 'ready', 'submitted', 'paid', 'rejected']

const STATUS_CONFIG = {
  draft: { color: '#3b82f6', badge: 'blue', icon: FileSpreadsheet, label: 'Draft', grad: 'linear-gradient(135deg, #3b82f6, #60a5fa)' },
  ready: { color: '#8b5cf6', badge: 'purple', icon: CheckCircle, label: 'Ready', grad: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
  submitted: { color: '#f59e0b', badge: 'amber', icon: Clock, label: 'Submitted', grad: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
  paid: { color: '#10b981', badge: 'green', icon: DollarSign, label: 'Paid', grad: 'linear-gradient(135deg, #10b981, #34d399)' },
  rejected: { color: '#ef4444', badge: 'red', icon: XCircle, label: 'Rejected', grad: 'linear-gradient(135deg, #ef4444, #f87171)' },
}


/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

export default function Billing() {
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [shifts, setShifts] = useState([])
  const [claims, setClaims] = useState([])
  const [participants, setParticipants] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [showGenerate, setShowGenerate] = useState(false)
  const [showClaimDetail, setShowClaimDetail] = useState(null)
  const [saving, setSaving] = useState(false)
  const [generateForm, setGenerateForm] = useState({ participant_id: '', support_category: '', date_from: '', date_to: '', rate_override: '' })

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
      {payload.map((p, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: i > 0 ? 6 : 0 }}><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: 3, background: p.color || p.fill }} /><span style={{ fontSize: 12, color: dk.textMuted }}>{p.name}</span></div><span style={{ fontSize: 13, fontWeight: 800, color: dk.text }}>${p.value?.toLocaleString()}</span></div>))}
    </div>)
  }


  /* ═══ ALL BACKEND — 100% PRESERVED ═══ */
  useEffect(() => { loadData() }, [])
  useEffect(() => { if (!loading) setTimeout(() => setLoaded(true), 50) }, [loading])

  const loadData = async () => {
    try {
      const [shiftRes, claimRes, partRes] = await Promise.all([
        supabase.from('shifts').select('*, staff(first_name, last_name), participants(id, first_name, last_name, ndis_number, plan_budget)').eq('status', 'completed').order('shift_date', { ascending: false }),
        supabase.from('ndis_claims').select('*, participants(id, first_name, last_name, ndis_number)').order('created_at', { ascending: false }),
        supabase.from('participants').select('id, first_name, last_name, ndis_number, plan_budget, status'),
      ])
      setShifts(shiftRes.data || []); setClaims(claimRes.data || []); setParticipants((partRes.data || []).filter(p => p.status === 'active'))
    } catch (err) { console.error('Billing load error:', err) }
    finally { setLoading(false) }
  }

  const handleGenerateClaim = async () => {
    if (!generateForm.participant_id || !generateForm.support_category || !generateForm.date_from || !generateForm.date_to) { alert('Please fill in all required fields'); return }
    setSaving(true)
    try {
      const pShifts = shifts.filter(s => s.participant_id === generateForm.participant_id && s.shift_date >= generateForm.date_from && s.shift_date <= generateForm.date_to && s.clock_in && s.clock_out)
      if (pShifts.length === 0) { alert('No completed shifts found for this participant in the selected date range'); setSaving(false); return }
      const category = SUPPORT_CATEGORIES.find(ct => ct.code === generateForm.support_category)
      const rate = generateForm.rate_override ? parseFloat(generateForm.rate_override) : (category?.rate || 65.09)
      const lineItems = pShifts.map(s => { const hours = calcHours(s.clock_in, s.clock_out); return { shift_id: s.id, shift_date: s.shift_date, staff_name: s.staff ? `${s.staff.first_name} ${s.staff.last_name}` : 'Unknown', hours, rate, amount: Math.round(hours * rate * 100) / 100, service_type: s.service_type || category?.name || 'Support' } })
      const totalAmount = lineItems.reduce((sum, li) => sum + li.amount, 0)
      const totalHours = lineItems.reduce((sum, li) => sum + li.hours, 0)
      const participant = participants.find(p => p.id === generateForm.participant_id)
      const payload = { participant_id: generateForm.participant_id, ndis_number: participant?.ndis_number || '', support_category: category?.name || '', support_category_code: generateForm.support_category, date_from: generateForm.date_from, date_to: generateForm.date_to, total_hours: Math.round(totalHours * 100) / 100, hourly_rate: rate, total_amount: Math.round(totalAmount * 100) / 100, line_items: lineItems, status: 'draft', claim_reference: `CLM-${Date.now().toString(36).toUpperCase()}` }
      const { data, error } = await supabase.from('ndis_claims').insert(payload).select('*, participants(id, first_name, last_name, ndis_number)').single()
      if (error) throw error
      setClaims([data, ...claims]); setShowGenerate(false); setGenerateForm({ participant_id: '', support_category: '', date_from: '', date_to: '', rate_override: '' })
    } catch (err) { alert('Failed to generate: ' + (err.message || 'Unknown error')) }
    finally { setSaving(false) }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      const updates = { status: newStatus }
      if (newStatus === 'submitted') updates.submitted_at = new Date().toISOString()
      if (newStatus === 'paid') updates.paid_at = new Date().toISOString()
      const { error } = await supabase.from('ndis_claims').update(updates).eq('id', id)
      if (error) throw error
      setClaims(claims.map(cl => cl.id === id ? { ...cl, ...updates } : cl))
      if (showClaimDetail?.id === id) setShowClaimDetail(prev => ({ ...prev, ...updates }))
    } catch (err) { alert('Failed to update: ' + (err.message || 'Unknown error')) }
  }

  const handleDeleteClaim = async (id) => {
    if (!confirm('Delete this claim?')) return
    try { const { error } = await supabase.from('ndis_claims').delete().eq('id', id); if (error) throw error; setClaims(claims.filter(cl => cl.id !== id)); setShowClaimDetail(null) }
    catch (err) { alert('Failed to delete: ' + (err.message || 'Unknown error')) }
  }

  const exportClaimsCSV = () => {
    const readyClaims = claims.filter(cl => cl.status === 'ready' || cl.status === 'draft')
    if (readyClaims.length === 0) { alert('No claims to export'); return }
    const headers = ['Claim Reference', 'NDIS Number', 'Participant', 'Support Category', 'Category Code', 'Date From', 'Date To', 'Total Hours', 'Hourly Rate', 'Total Amount', 'Status']
    const rows = readyClaims.map(cl => [cl.claim_reference, cl.ndis_number, cl.participants ? `${cl.participants.first_name} ${cl.participants.last_name}` : '', cl.support_category, cl.support_category_code, cl.date_from, cl.date_to, cl.total_hours, `$${cl.hourly_rate}`, `$${cl.total_amount}`, cl.status])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `ndis-claims-${new Date().toISOString().split('T')[0]}.csv`; link.click()
  }


  /* ── Stats ── */
  const filteredClaims = useMemo(() => {
    let list = filterStatus === 'all' ? claims : claims.filter(cl => cl.status === filterStatus)
    if (search) { const q = search.toLowerCase(); list = list.filter(cl => (cl.claim_reference || '').toLowerCase().includes(q) || (cl.participants ? `${cl.participants.first_name} ${cl.participants.last_name}`.toLowerCase() : '').includes(q)) }
    return list
  }, [claims, filterStatus, search])

  const totalDraft = claims.filter(cl => cl.status === 'draft').reduce((s, cl) => s + (parseFloat(cl.total_amount) || 0), 0)
  const totalSubmitted = claims.filter(cl => cl.status === 'submitted').reduce((s, cl) => s + (parseFloat(cl.total_amount) || 0), 0)
  const totalPaid = claims.filter(cl => cl.status === 'paid').reduce((s, cl) => s + (parseFloat(cl.total_amount) || 0), 0)
  const totalAll = totalDraft + totalSubmitted + totalPaid

  const claimedShiftIds = new Set(); claims.forEach(cl => { (cl.line_items || []).forEach(li => { if (li.shift_id) claimedShiftIds.add(li.shift_id) }) })
  const unbilledShifts = shifts.filter(s => s.clock_in && s.clock_out && !claimedShiftIds.has(s.id))
  const unbilledHours = unbilledShifts.reduce((sum, s) => sum + calcHours(s.clock_in, s.clock_out), 0)

  const statusPie = useMemo(() => Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({ name: cfg.label, value: claims.filter(cl => cl.status === key).length, color: cfg.color })).filter(s => s.value > 0), [claims])


  /* ─── Loading ─── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${c.primary}40` }}><DollarSign size={32} color="white" /></div>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.3 }} />
      </div>
      <p style={{ color: dk.textMuted, fontSize: 14, fontWeight: 600 }}>Loading billing...</p>
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
      <Orb color="#10b981" size={280} bottom="15%" left="-60px" delay={2} />
      <Orb color="#f59e0b" size={200} top="45%" right="8%" delay={3.5} />
      <Orb color="#8b5cf6" size={160} bottom="30%" left="40%" delay={5} />

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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}><Receipt size={13} style={{ color: 'rgba(255,255,255,0.7)' }} /><span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>NDIS Claims</span></div>
                {unbilledShifts.length > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(245,158,11,0.35)', backdropFilter: 'blur(8px)' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fde68a', animation: 'pulse-dot 2s ease-in-out infinite' }} /><span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>{unbilledShifts.length} unbilled</span></div>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15 }}>NDIS Billing</h1>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>{claims.length} claims · {unbilledShifts.length} unbilled shifts ({unbilledHours.toFixed(1)}h)</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={exportClaimsCSV} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderRadius: 16, border: 'none', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}><Download size={16} /> Export</button>
                  <button onClick={() => setShowGenerate(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 16, border: 'none', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}><Plus size={18} /> Generate</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
                {[
                  { icon: FileSpreadsheet, text: `$${totalDraft.toFixed(0)} draft`, bg: 'rgba(59,130,246,0.25)' },
                  { icon: Clock, text: `$${totalSubmitted.toFixed(0)} submitted`, bg: 'rgba(245,158,11,0.35)' },
                  { icon: DollarSign, text: `$${totalPaid.toFixed(0)} paid`, bg: 'rgba(16,185,129,0.3)' },
                  { icon: Layers, text: `$${totalAll.toFixed(0)} pipeline` },
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

        {/* ══════════ UNBILLED ALERT ══════════ */}
        {unbilledShifts.length > 0 && (
          <Glass dark={isDark} glow="rgba(245,158,11,0.15)" style={{ ...stg(1), padding: '16px 20px', borderColor: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px -4px rgba(245,158,11,0.4)' }}><AlertTriangle size={22} color="white" /></div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{unbilledShifts.length} completed shifts not yet claimed</p>
                <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>{unbilledHours.toFixed(1)} hours of unbilled services</p>
              </div>
              <button onClick={() => setShowGenerate(true)} style={{ padding: '10px 18px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 14px -4px ${c.primary}50`, flexShrink: 0 }}>Generate Claim</button>
            </div>
          </Glass>
        )}

        {/* ══════════ STAT CARDS ══════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, ...stg(2) }}>
          {[
            { icon: FileSpreadsheet, label: 'Draft', value: Math.round(totalDraft), prefix: '$', grad: 'linear-gradient(135deg, #3b82f6, #60a5fa)', glow: 'rgba(59,130,246,0.2)' },
            { icon: Clock, label: 'Submitted', value: Math.round(totalSubmitted), prefix: '$', grad: 'linear-gradient(135deg, #f59e0b, #fbbf24)', glow: 'rgba(245,158,11,0.2)' },
            { icon: DollarSign, label: 'Paid', value: Math.round(totalPaid), prefix: '$', grad: 'linear-gradient(135deg, #10b981, #34d399)', glow: 'rgba(16,185,129,0.2)' },
            { icon: Layers, label: 'Pipeline', value: Math.round(totalAll), prefix: '$', grad: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, glow: `${c.primary}35` },
          ].map((card, i) => (
            <Glass key={i} dark={isDark} hover glow={card.glow} style={{ padding: '18px 20px' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: card.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 20px -4px ${card.glow}`, marginBottom: 12 }}><card.icon size={20} color="white" /></div>
              <p style={{ fontSize: 22, fontWeight: 800, color: dk.text, lineHeight: 1 }} className="count-up"><AnimNum value={card.value} prefix={card.prefix || ''} /></p>
              <p style={{ fontSize: 11, fontWeight: 600, color: dk.textFaint, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</p>
            </Glass>
          ))}
        </div>

        {/* ══════════ FILTERS ══════════ */}
        <Glass dark={isDark} style={{ padding: 6, ...stg(3) }}>
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
            {['all', ...CLAIM_STATUSES].map(s => {
              const cfg = STATUS_CONFIG[s]; const isActive = filterStatus === s
              const count = s === 'all' ? claims.length : claims.filter(cl => cl.status === s).length
              return (
                <button key={s} onClick={() => setFilterStatus(s)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '12px 14px', borderRadius: 14, border: 'none',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', flex: '1 1 auto', justifyContent: 'center', whiteSpace: 'nowrap',
                  background: isActive ? `linear-gradient(135deg, ${c.primary}, ${c.adminHover})` : 'transparent',
                  color: isActive ? 'white' : dk.textMuted,
                  boxShadow: isActive ? `0 4px 16px -4px ${c.primary}60` : 'none',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = isDark ? 'rgba(51,65,85,0.4)' : 'rgba(0,0,0,0.04)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
                  {cfg && <cfg.icon size={13} />} {s === 'all' ? 'All' : cfg?.label || s}
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 8, background: isActive ? 'rgba(255,255,255,0.2)' : dk.subtleBg2, color: isActive ? 'rgba(255,255,255,0.9)' : dk.textFaint }}>{count}</span>
                </button>
              )
            })}
          </div>
        </Glass>

        <Glass dark={isDark} style={{ ...stg(4), padding: '12px 18px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by reference or participant..." style={{ ...inputStyle, paddingLeft: 40 }} onFocus={e => e.target.style.borderColor = c.primary} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: dk.textFaint, padding: '6px 12px', borderRadius: 10, background: dk.subtleBg }}>{filteredClaims.length} claim{filteredClaims.length !== 1 ? 's' : ''}</span>
          </div>
        </Glass>

        {/* ══════════ CLAIMS LIST ══════════ */}
        {filteredClaims.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredClaims.map((cl, i) => {
              const pName = cl.participants ? `${cl.participants.first_name} ${cl.participants.last_name}` : 'Unknown'
              const cfg = STATUS_CONFIG[cl.status] || STATUS_CONFIG.draft
              const StatusIcon = cfg.icon
              return (
                <Glass key={cl.id} dark={isDark} hover glow={`${cfg.color}12`}
                  style={{ ...stg(i + 5), padding: '20px 22px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                  onClick={() => setShowClaimDetail(cl)}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderRadius: '0 4px 4px 0', background: `linear-gradient(to bottom, ${cfg.color}, ${cfg.color}60)` }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, paddingLeft: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: cfg.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px -4px ${cfg.color}50` }}><StatusIcon size={22} color="white" /></div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{cl.claim_reference}</p>
                        <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>{pName} · {cl.support_category}</p>
                        <p style={{ fontSize: 11, color: dk.textFaint, marginTop: 3 }}>{formatDate(cl.date_from)} – {formatDate(cl.date_to)} · {cl.total_hours}h @ ${cl.hourly_rate}/hr</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 20, fontWeight: 800, color: dk.text }}>${parseFloat(cl.total_amount).toLocaleString()}</span>
                      <Badge color={cfg.badge} dark={isDark}>{cfg.label}</Badge>
                    </div>
                  </div>
                </Glass>
              )
            })}
          </div>
        ) : (
          <Glass dark={isDark} style={{ ...stg(5), padding: '56px 24px', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px', background: `linear-gradient(135deg, ${c.primary}15, ${c.primary}05)`, border: `1px solid ${c.primary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DollarSign size={32} style={{ color: c.primary }} /></div>
            <p style={{ fontWeight: 600, color: dk.textMuted, fontSize: 16 }}>{filterStatus !== 'all' || search ? 'No matching claims' : 'No claims yet'}</p>
            <p style={{ color: dk.textFaint, fontSize: 13, marginTop: 4 }}>{search ? 'Try a different search' : 'Generate your first NDIS claim to get started'}</p>
          </Glass>
        )}

        {/* ══════════ INSIGHTS ══════════ */}
        {claims.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, ...stg(7) }}>
            <Glass dark={isDark} glow={`${c.primary}10`} style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><BarChart3 size={18} style={{ color: c.primary }} /><h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Claim Status</h3></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <ResponsiveContainer width={120} height={120}><PieChart><Pie data={statusPie} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} stroke="none">{statusPie.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip content={<CT />} /></PieChart></ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{statusPie.map((s, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} /><span style={{ fontSize: 12, color: dk.textMuted }}>{s.name}</span><span style={{ fontSize: 13, fontWeight: 800, color: dk.text, marginLeft: 'auto' }}>{s.value}</span></div>))}</div>
              </div>
            </Glass>

            <Glass dark={isDark} glow="rgba(16,185,129,0.1)" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}><Activity size={18} style={{ color: '#10b981' }} /><h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Revenue Pipeline</h3></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Draft', value: `$${totalDraft.toFixed(0)}`, color: '#3b82f6', pct: totalAll > 0 ? (totalDraft / totalAll) * 100 : 0 },
                  { label: 'Submitted', value: `$${totalSubmitted.toFixed(0)}`, color: '#f59e0b', pct: totalAll > 0 ? (totalSubmitted / totalAll) * 100 : 0 },
                  { label: 'Paid', value: `$${totalPaid.toFixed(0)}`, color: '#10b981', pct: totalAll > 0 ? (totalPaid / totalAll) * 100 : 0 },
                ].map((item, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: dk.textSoft }}>{item.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: item.color }}>{item.value}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, overflow: 'hidden', background: dk.subtleBg2 }}>
                      <div style={{ height: '100%', borderRadius: 999, width: `${item.pct}%`, background: item.color, transition: 'width 1s cubic-bezier(.16,1,.3,1)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </Glass>
          </div>
        )}
      </div>


      {/* ══════════ GENERATE MODAL ══════════ */}
      <Modal isOpen={showGenerate} onClose={() => setShowGenerate(false)} title="Generate NDIS Claim" wide>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ margin: '-24px -24px 0 -24px', padding: '24px 28px 20px', background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 50%, #10b981 100%)`, position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
            <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -40, right: -20 }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Receipt size={26} color="white" /></div>
              <div><h3 style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>Generate Claim</h3><p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Calculate billable hours from completed shifts</p></div>
            </div>
          </div>

          <div style={{ padding: '12px 16px', borderRadius: 12, background: isDark ? 'rgba(59,130,246,0.08)' : '#eff6ff', border: `1px solid ${isDark ? 'rgba(59,130,246,0.15)' : '#bfdbfe'}`, fontSize: 12, fontWeight: 600, color: isDark ? '#60a5fa' : '#2563eb', display: 'flex', alignItems: 'center', gap: 8 }}><Sparkles size={14} /> Auto-calculates from completed shifts in the date range at the selected NDIS rate.</div>

          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><User size={11} /> Participant *</p>
            <select value={generateForm.participant_id} onChange={e => setGenerateForm({ ...generateForm, participant_id: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Select participant...</option>
              {participants.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}{p.ndis_number ? ` (${p.ndis_number})` : ''}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Support Category *</p>
              <select value={generateForm.support_category} onChange={e => setGenerateForm({ ...generateForm, support_category: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Select category...</option>
                {SUPPORT_CATEGORIES.map(sc => <option key={sc.code} value={sc.code}>{sc.code} — {sc.name} (${sc.rate}/hr)</option>)}
              </select>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rate Override ($/hr)</p>
              <input type="number" step="0.01" value={generateForm.rate_override} onChange={e => setGenerateForm({ ...generateForm, rate_override: e.target.value })} placeholder="Leave blank for default" style={inputStyle} onFocus={e => e.target.style.borderColor = c.primary} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={11} /> From *</p>
              <input type="date" value={generateForm.date_from} onChange={e => setGenerateForm({ ...generateForm, date_from: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={11} /> To *</p>
              <input type="date" value={generateForm.date_to} onChange={e => setGenerateForm({ ...generateForm, date_to: e.target.value })} style={inputStyle} />
            </div>
          </div>

          {generateForm.participant_id && generateForm.date_from && generateForm.date_to && (() => {
            const pShifts = shifts.filter(s => s.participant_id === generateForm.participant_id && s.shift_date >= generateForm.date_from && s.shift_date <= generateForm.date_to && s.clock_in && s.clock_out)
            const hours = pShifts.reduce((sum, s) => sum + calcHours(s.clock_in, s.clock_out), 0)
            const cat = SUPPORT_CATEGORIES.find(ct => ct.code === generateForm.support_category)
            const rate = generateForm.rate_override ? parseFloat(generateForm.rate_override) : (cat?.rate || 0)
            return (
              <div style={{ padding: '14px 18px', borderRadius: 14, background: isDark ? 'rgba(16,185,129,0.08)' : '#ecfdf5', border: `1px solid ${isDark ? 'rgba(16,185,129,0.15)' : '#a7f3d0'}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <BarChart3 size={16} style={{ color: '#10b981' }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>{pShifts.length} shifts · {hours.toFixed(1)} hours · ${(hours * rate).toFixed(2)} total</p>
              </div>
            )
          })()}

          <div style={{ display: 'flex', gap: 12, borderTop: `1px solid ${dk.divider}`, paddingTop: 16 }}>
            <button onClick={() => setShowGenerate(false)} style={{ flex: 1, padding: '15px 0', borderRadius: 14, background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9', border: `1px solid ${dk.inputBorder}`, color: dk.textMuted, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleGenerateClaim} disabled={saving} style={{ flex: 2, padding: '15px 0', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 8px 28px -6px ${c.primary}50`, opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {saving ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Receipt size={16} /> Generate Claim</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* ══════════ CLAIM DETAIL MODAL ══════════ */}
      <Modal isOpen={!!showClaimDetail} onClose={() => setShowClaimDetail(null)} title="Claim Details" wide>
        {showClaimDetail && (() => {
          const cfg = STATUS_CONFIG[showClaimDetail.status] || STATUS_CONFIG.draft
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ margin: '-24px -24px 0 -24px', padding: '24px 28px 20px', background: cfg.grad, position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
                <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -40, right: -20 }} />
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }} />
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><cfg.icon size={26} color="white" /></div>
                  <div style={{ flex: 1 }}><h3 style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{showClaimDetail.claim_reference}</h3><p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{cfg.label}</p></div>
                  <span style={{ fontSize: 24, fontWeight: 900, color: 'white' }}>${parseFloat(showClaimDetail.total_amount).toLocaleString()}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                {[
                  { label: 'Reference', value: showClaimDetail.claim_reference, icon: Hash, color: '#3b82f6' },
                  { label: 'NDIS Number', value: showClaimDetail.ndis_number || '—', icon: Shield, color: '#8b5cf6' },
                  { label: 'Category', value: `${showClaimDetail.support_category_code} — ${showClaimDetail.support_category}`, icon: Layers, color: c.primary },
                  { label: 'Period', value: `${formatDate(showClaimDetail.date_from)} – ${formatDate(showClaimDetail.date_to)}`, icon: Calendar, color: '#f59e0b' },
                  { label: 'Hours @ Rate', value: `${showClaimDetail.total_hours}h @ $${showClaimDetail.hourly_rate}/hr`, icon: Clock, color: '#10b981' },
                ].map((item, idx) => (
                  <div key={idx} style={{ padding: '14px 16px', borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.subtleBg2}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><item.icon size={12} style={{ color: item.color }} /><p style={{ fontSize: 10, fontWeight: 600, color: dk.textFaint, textTransform: 'uppercase' }}>{item.label}</p></div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: dk.text }}>{item.value}</p>
                  </div>
                ))}
                <div style={{ padding: '14px 16px', borderRadius: 14, background: isDark ? 'rgba(16,185,129,0.08)' : '#ecfdf5', border: `1px solid ${isDark ? 'rgba(16,185,129,0.15)' : '#a7f3d0'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><DollarSign size={12} style={{ color: '#10b981' }} /><p style={{ fontSize: 10, fontWeight: 600, color: '#059669', textTransform: 'uppercase' }}>Total</p></div>
                  <p style={{ fontSize: 18, fontWeight: 900, color: '#059669' }}>${parseFloat(showClaimDetail.total_amount).toLocaleString()}</p>
                </div>
              </div>

              {showClaimDetail.line_items?.length > 0 && (
                <Glass dark={isDark} style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: `1px solid ${dk.divider}` }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: dk.text }}>Line Items ({showClaimDetail.line_items.length})</p>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead><tr style={{ background: dk.subtleBg2 }}>
                        {['Date', 'Staff', 'Service', 'Hours', 'Amount'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Hours' || h === 'Amount' ? 'right' : 'left', fontSize: 10, fontWeight: 700, color: dk.textFaint, textTransform: 'uppercase', borderBottom: `1px solid ${dk.divider}` }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>{showClaimDetail.line_items.map((li, i) => (
                        <tr key={i} style={{ borderTop: i > 0 ? `1px solid ${dk.divider}` : 'none' }}
                          onMouseEnter={e => e.currentTarget.style.background = dk.subtleBg}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '10px 14px', color: dk.textSoft }}>{formatDate(li.shift_date)}</td>
                          <td style={{ padding: '10px 14px', color: dk.textMuted }}>{li.staff_name}</td>
                          <td style={{ padding: '10px 14px', color: dk.textMuted }}>{li.service_type}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', color: dk.textMuted }}>{li.hours?.toFixed(2)}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: dk.text }}>${li.amount?.toFixed(2)}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </Glass>
              )}

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', borderTop: `1px solid ${dk.divider}`, paddingTop: 16 }}>
                {showClaimDetail.status === 'draft' && <button onClick={() => handleStatusChange(showClaimDetail.id, 'ready')} style={{ flex: 1, padding: '14px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 16px -4px rgba(139,92,246,0.5)' }}><CheckCircle size={16} /> Mark Ready</button>}
                {showClaimDetail.status === 'ready' && <button onClick={() => handleStatusChange(showClaimDetail.id, 'submitted')} style={{ flex: 1, padding: '14px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 16px -4px rgba(245,158,11,0.5)' }}><FileSpreadsheet size={16} /> Mark Submitted</button>}
                {showClaimDetail.status === 'submitted' && (<>
                  <button onClick={() => handleStatusChange(showClaimDetail.id, 'paid')} style={{ flex: 1, padding: '14px 0', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #10b981, #14b8a6)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 16px -4px rgba(16,185,129,0.5)' }}><DollarSign size={16} /> Mark Paid</button>
                  <button onClick={() => handleStatusChange(showClaimDetail.id, 'rejected')} style={{ padding: '14px 18px', borderRadius: 14, background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : '#fecaca'}`, color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Rejected</button>
                </>)}
                <button onClick={() => handleDeleteClaim(showClaimDetail.id)} style={{ padding: '14px 18px', borderRadius: 14, background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : '#fecaca'}`, color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><XCircle size={14} /> Delete</button>
                <button onClick={() => setShowClaimDetail(null)} style={{ padding: '14px 20px', borderRadius: 14, background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9', border: `1px solid ${dk.inputBorder}`, color: dk.textMuted, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Close</button>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}