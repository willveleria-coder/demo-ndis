import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap, Loader2, CheckCircle, AlertTriangle, Clock, BookOpen, Award,
  Search, X, Shield, Target, Flame, Eye, ChevronRight, Star, CheckCircle2
} from 'lucide-react'
import { useStaff } from '../../context/StaffContext'
import { useBrandColors } from '../../hooks/useBrandColors'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'

/* ═══════════════════════════════════════════════
   HELPERS — 100% preserved
   ═══════════════════════════════════════════════ */
function formatDate(iso) { if (!iso) return '—'; return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) }
function daysUntil(dateStr) { if (!dateStr) return null; return Math.ceil((new Date(dateStr) - new Date()) / 86400000) }

const ONBOARDING_ITEMS = [
  { key: 'wwcc', label: 'Working With Children Check', mandatory: true },
  { key: 'ndis_screening', label: 'NDIS Worker Screening Check', mandatory: true },
  { key: 'police_check', label: 'National Police Check', mandatory: true },
  { key: 'first_aid', label: 'First Aid Certificate', mandatory: true },
  { key: 'cpr', label: 'CPR Certificate', mandatory: true },
  { key: 'ndis_orientation', label: 'NDIS Worker Orientation Module', mandatory: true },
  { key: 'manual_handling', label: 'Manual Handling Training', mandatory: true },
  { key: 'infection_control', label: 'Infection Control Training', mandatory: true },
  { key: 'company_induction', label: 'Company Induction Completed', mandatory: true },
  { key: 'policies_read', label: 'Policies & Procedures Acknowledged', mandatory: true },
  { key: 'uniform_issued', label: 'Uniform / ID Badge Issued', mandatory: false },
  { key: 'system_access', label: 'System Access Set Up', mandatory: false },
  { key: 'buddy_shift', label: 'Buddy / Shadow Shift Completed', mandatory: false },
  { key: 'emergency_contacts', label: 'Emergency Contacts Provided', mandatory: false },
  { key: 'bank_details', label: 'Bank & Tax Details Submitted', mandatory: false },
  { key: 'car_insurance', label: 'Car Insurance & Registration', mandatory: false },
]

/* ═══════════════════════════════════════════════
   DESIGN SYSTEM
   ═══════════════════════════════════════════════ */
function Glass({children,className='',glow,style={},hover=false,isDark=false,onClick,...p}){const base=isDark?'rgba(30,41,59,0.6)':'rgba(255,255,255,0.55)';const border=isDark?'rgba(51,65,85,0.4)':'rgba(255,255,255,0.7)';return<div className={className} onClick={onClick} style={{background:base,backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',border:`1px solid ${border}`,borderRadius:'1.25rem',boxShadow:glow?`0 8px 32px -8px ${glow}`:'0 4px 24px -4px rgba(0,0,0,0.06)',transition:hover?'all .3s cubic-bezier(.16,1,.3,1)':undefined,cursor:hover||onClick?'pointer':undefined,...style}} onMouseEnter={hover?e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=glow?`0 16px 48px -8px ${glow}`:'0 12px 40px -8px rgba(0,0,0,0.12)'}:undefined} onMouseLeave={hover?e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=glow?`0 8px 32px -8px ${glow}`:'0 4px 24px -4px rgba(0,0,0,0.06)'}:undefined} {...p}>{children}</div>}
function Orb({color,size=200,top,left,right,bottom,delay=0}){return<div style={{position:'absolute',width:size,height:size,top,left,right,bottom,background:`radial-gradient(circle,${color} 0%,transparent 70%)`,opacity:0.12,borderRadius:'50%',animation:`orbFloat ${6+delay}s ease-in-out ${delay}s infinite`,pointerEvents:'none',zIndex:0}}/>}
function AnimNum({value,duration=1200}){const[display,setDisplay]=useState(0);const frameRef=useRef();useEffect(()=>{const num=typeof value==='number'?value:parseInt(value)||0;const start=performance.now();function tick(now){const p=Math.min((now-start)/duration,1);setDisplay(Math.round(num*(1-Math.pow(1-p,3))));if(p<1)frameRef.current=requestAnimationFrame(tick)}frameRef.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frameRef.current)},[value,duration]);return<>{display}</>}
function Badge({children,color='gray',isDark}){const palettes={gray:isDark?{bg:'rgba(100,116,139,0.2)',text:'#94a3b8',border:'rgba(100,116,139,0.3)'}:{bg:'#f1f5f9',text:'#64748b',border:'#e2e8f0'},green:isDark?{bg:'rgba(16,185,129,0.15)',text:'#34d399',border:'rgba(16,185,129,0.3)'}:{bg:'#ecfdf5',text:'#059669',border:'#a7f3d0'},amber:isDark?{bg:'rgba(245,158,11,0.15)',text:'#fbbf24',border:'rgba(245,158,11,0.3)'}:{bg:'#fffbeb',text:'#d97706',border:'#fde68a'},red:isDark?{bg:'rgba(239,68,68,0.15)',text:'#f87171',border:'rgba(239,68,68,0.3)'}:{bg:'#fef2f2',text:'#dc2626',border:'#fecaca'},blue:isDark?{bg:'rgba(59,130,246,0.15)',text:'#60a5fa',border:'rgba(59,130,246,0.3)'}:{bg:'#eff6ff',text:'#2563eb',border:'#bfdbfe'},purple:isDark?{bg:'rgba(139,92,246,0.15)',text:'#a78bfa',border:'rgba(139,92,246,0.3)'}:{bg:'#f5f3ff',text:'#7c3aed',border:'#ddd6fe'},orange:isDark?{bg:'rgba(249,115,22,0.15)',text:'#fb923c',border:'rgba(249,115,22,0.3)'}:{bg:'#fff7ed',text:'#ea580c',border:'#fed7aa'},teal:isDark?{bg:'rgba(20,184,166,0.15)',text:'#2dd4bf',border:'rgba(20,184,166,0.3)'}:{bg:'#f0fdfa',text:'#0d9488',border:'#99f6e4'}};const pl=palettes[color]||palettes.gray;return<span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',fontSize:10,fontWeight:700,letterSpacing:'0.02em',borderRadius:999,background:pl.bg,color:pl.text,border:`1px solid ${pl.border}`,whiteSpace:'nowrap'}}>{children}</span>}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function StaffTrainingView() {
  const navigate = useNavigate()
  const { staffProfile } = useStaff()
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [trainings, setTrainings] = useState([])
  const [tab, setTab] = useState('training')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => { const t = setTimeout(() => setLoaded(true), 80); return () => clearTimeout(t) }, [])

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

  /* ─── data fetch (100% preserved) ─── */
  useEffect(() => {
    async function load() {
      if (!staffProfile?.id) return
      try {
        const { data } = await supabase.from('staff_training').select('*').eq('staff_id', staffProfile.id).order('completed_date', { ascending: false })
        setTrainings(data || [])
      } catch (err) { console.error('Training load error:', err) }
      finally { setLoading(false) }
    }
    load()
  }, [staffProfile?.id])

  /* ─── computed (100% preserved + new) ─── */
  const checklist = staffProfile?.onboarding_checklist || {}
  const completedCount = ONBOARDING_ITEMS.filter(item => checklist[item.key]).length
  const mandatoryComplete = ONBOARDING_ITEMS.filter(i => i.mandatory).every(i => checklist[i.key])
  const mandatoryCount = ONBOARDING_ITEMS.filter(i => i.mandatory).length
  const mandatoryDone = ONBOARDING_ITEMS.filter(i => i.mandatory && checklist[i.key]).length
  const pct = Math.round((completedCount / ONBOARDING_ITEMS.length) * 100)
  const mandatoryPct = Math.round((mandatoryDone / mandatoryCount) * 100)

  const validCount = trainings.filter(t => { const d = daysUntil(t.expiry_date); return d === null || d > 30 }).length
  const expiringCount = trainings.filter(t => { const d = daysUntil(t.expiry_date); return d !== null && d <= 30 && d >= 0 }).length
  const expiredCount = trainings.filter(t => { const d = daysUntil(t.expiry_date); return d !== null && d < 0 }).length

  const filteredTrainings = trainings.filter(t => {
    if (statusFilter === 'valid') { const d = daysUntil(t.expiry_date); return d === null || d > 30 }
    if (statusFilter === 'expiring') { const d = daysUntil(t.expiry_date); return d !== null && d <= 30 && d >= 0 }
    if (statusFilter === 'expired') { const d = daysUntil(t.expiry_date); return d !== null && d < 0 }
    if (searchQuery.trim()) return (t.training_type || '').toLowerCase().includes(searchQuery.toLowerCase()) || (t.provider || '').toLowerCase().includes(searchQuery.toLowerCase())
    return true
  }).filter(t => {
    if (!searchQuery.trim()) return true
    return (t.training_type || '').toLowerCase().includes(searchQuery.toLowerCase()) || (t.provider || '').toLowerCase().includes(searchQuery.toLowerCase())
  })

  /* ─── Completion ring ─── */
  const CompletionRing = ({ value, size = 72, color }) => {
    const r = (size - 8) / 2, circ = 2 * Math.PI * r, offset = circ - (value / 100) * circ
    return (
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9'} strokeWidth="6" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.16,1,.3,1)' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: isDark ? '#e2e8f0' : '#1f2937' }}>{value}%</span>
        </div>
      </div>
    )
  }

  /* ─── loading ─── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` }}>
          <GraduationCap size={22} style={{ color: 'white' }} />
        </div>
        <div style={{ position: 'absolute', inset: -4, borderRadius: 18, border: `2px solid ${c.staff}`, opacity: 0.3, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: dk.textMuted }}>Loading training records...</p>
    </div>
  )

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <style>{`
        @keyframes orbFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-15px) scale(1.03)}}
        @keyframes ping{75%,100%{transform:scale(1.8);opacity:0}}
        @keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes countUp{from{opacity:0;transform:translateY(8px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        .count-up{animation:countUp .7s cubic-bezier(.16,1,.3,1) forwards}
      `}</style>
      <Orb color={c.staff} size={280} top="-80px" right="-60px" delay={0} />
      <Orb color={c.staffHover} size={200} bottom="10%" left="-40px" delay={2} />
      <Orb color="#8b5cf6" size={160} top="40%" right="15%" delay={4} />
      <Orb color="#10b981" size={200} bottom="-50px" right="25%" delay={1} />
      <Orb color="#f59e0b" size={140} top="20%" left="20%" delay={3} />

      <div style={{ position: 'relative', zIndex: 1, padding: '0 0 40px' }}>

        {/* ═══════ HERO ═══════ */}
        <div style={{ ...stg(0), background: `linear-gradient(135deg, ${c.staff} 0%, ${c.staffHover} 40%, #3b82f6 70%, #06b6d4 100%)`, borderRadius: 20, padding: '28px 24px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', bottom: -50, left: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', top: '55%', right: '22%', width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
          {[{ top: '15%', left: '85%', size: 5, delay: '0s' }, { top: '70%', left: '90%', size: 3, delay: '1s' }, { top: '35%', left: '8%', size: 4, delay: '2s' }].map((dot, i) => (
            <div key={i} style={{ position: 'absolute', top: dot.top, left: dot.left, width: dot.size, height: dot.size, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', animation: `pulse-dot 2s ease-in-out ${dot.delay} infinite` }} />
          ))}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', fontSize: 11, fontWeight: 700, color: 'white', letterSpacing: '0.04em' }}>
                <GraduationCap size={12} /> TRAINING & ONBOARDING
              </span>
              {expiredCount > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.3)', backdropFilter: 'blur(8px)', fontSize: 10, fontWeight: 700, color: '#fca5a5' }}><AlertTriangle size={10} /> {expiredCount} EXPIRED</span>}
              {expiringCount > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'rgba(245,158,11,0.3)', backdropFilter: 'blur(8px)', fontSize: 10, fontWeight: 700, color: '#fde68a' }}><Clock size={10} /> {expiringCount} EXPIRING</span>}
              {mandatoryComplete && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.3)', backdropFilter: 'blur(8px)', fontSize: 10, fontWeight: 700, color: '#a7f3d0' }}><CheckCircle size={10} /> ONBOARDED</span>}
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', lineHeight: 1.2, marginBottom: 4 }}>My Training</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 16 }}>{trainings.length} training record{trainings.length !== 1 ? 's' : ''} · Onboarding {pct}% complete</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'Records', value: trainings.length, icon: GraduationCap },
                { label: 'Valid', value: validCount, icon: CheckCircle },
                { label: 'Expiring', value: expiringCount, icon: Clock },
                { label: 'Onboarding', value: `${pct}%`, icon: Target },
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
        <div style={{ ...stg(1), display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { icon: GraduationCap, label: 'Total Records', value: trainings.length, gradient: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, glow: `${c.staff}40` },
            { icon: CheckCircle, label: 'Valid', value: validCount, gradient: 'linear-gradient(135deg, #10b981, #059669)', glow: 'rgba(16,185,129,0.3)' },
            { icon: Clock, label: 'Expiring Soon', value: expiringCount, gradient: 'linear-gradient(135deg, #f59e0b, #f97316)', glow: 'rgba(245,158,11,0.3)', alert: expiringCount > 0 },
            { icon: AlertTriangle, label: 'Expired', value: expiredCount, gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', glow: 'rgba(239,68,68,0.3)', alert: expiredCount > 0 },
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

        {/* ═══════ TABS ═══════ */}
        <Glass isDark={isDark} style={{ ...stg(2), padding: 6, marginBottom: 20, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {[
            { id: 'training', label: 'Training Records', icon: GraduationCap, count: trainings.length },
            { id: 'onboarding', label: 'Onboarding', icon: BookOpen, count: `${pct}%` },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', borderRadius: 14, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all .25s cubic-bezier(.16,1,.3,1)',
                background: tab === t.id ? `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` : 'transparent',
                color: tab === t.id ? 'white' : dk.textMuted,
                boxShadow: tab === t.id ? `0 4px 16px -4px ${c.staff}50` : 'none' }}>
              <t.icon size={15} /> {t.label}
              <span style={{ padding: '1px 7px', borderRadius: 999, fontSize: 10, fontWeight: 800, background: tab === t.id ? 'rgba(255,255,255,0.25)' : dk.subtleBg2, color: tab === t.id ? 'white' : dk.textMuted }}>{t.count}</span>
            </button>
          ))}
        </Glass>

        {/* ═══════ TRAINING TAB ═══════ */}
        {tab === 'training' && (
          <div style={stg(3)}>
            {/* Filters + Search */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <Glass isDark={isDark} style={{ padding: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {[{ id: 'all', label: 'All', count: trainings.length }, { id: 'valid', label: 'Valid', count: validCount }, { id: 'expiring', label: 'Expiring', count: expiringCount }, { id: 'expired', label: 'Expired', count: expiredCount }].map(f => (
                  <button key={f.id} onClick={() => setStatusFilter(f.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, transition: 'all .25s',
                      background: statusFilter === f.id ? (isDark ? `${c.staff}25` : `${c.staff}12`) : 'transparent',
                      color: statusFilter === f.id ? c.staff : dk.textFaint }}>
                    {f.label}
                    {f.count > 0 && <span style={{ padding: '0 5px', borderRadius: 999, fontSize: 9, fontWeight: 800, background: dk.subtleBg2, color: dk.textFaint }}>{f.count}</span>}
                  </button>
                ))}
              </Glass>
              <Glass isDark={isDark} style={{ padding: '4px 14px', display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 180px', minWidth: 0 }}>
                <Search size={16} style={{ color: dk.textFaint, flexShrink: 0 }} />
                <input type="text" placeholder="Search training..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  style={{ flex: 1, padding: '8px 0', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, fontWeight: 600, color: dk.text, minWidth: 0 }} />
                {searchQuery && <button onClick={() => setSearchQuery('')} style={{ padding: 4, borderRadius: 6, border: 'none', cursor: 'pointer', background: dk.subtleBg2, color: dk.textFaint }}><X size={12} /></button>}
              </Glass>
            </div>

            {/* Alert banner */}
            {(expiringCount > 0 || expiredCount > 0) && (
              <div style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', borderRadius: 16, padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -15, right: -15, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                <AlertTriangle size={18} style={{ color: 'white', flexShrink: 0 }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>
                  {expiredCount > 0 ? `${expiredCount} expired` : ''}{expiredCount > 0 && expiringCount > 0 ? ' · ' : ''}{expiringCount > 0 ? `${expiringCount} expiring soon` : ''} — contact your admin to renew
                </p>
              </div>
            )}

            {/* Training list */}
            <p style={{ fontSize: 12, color: dk.textFaint, marginBottom: 10 }}>{filteredTrainings.length} record{filteredTrainings.length !== 1 ? 's' : ''}</p>
            {filteredTrainings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredTrainings.map(t => {
                  const days = daysUntil(t.expiry_date)
                  const expired = days !== null && days < 0
                  const expiring = days !== null && days <= 30 && days >= 0
                  const statusGrad = expired ? 'linear-gradient(135deg, #ef4444, #dc2626)' : expiring ? 'linear-gradient(135deg, #f59e0b, #f97316)' : 'linear-gradient(135deg, #10b981, #059669)'
                  const statusGlow = expired ? 'rgba(239,68,68,0.15)' : expiring ? 'rgba(245,158,11,0.1)' : undefined
                  return (
                    <Glass key={t.id} isDark={isDark} hover glow={statusGlow}
                      style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14,
                        borderLeft: `4px solid ${expired ? '#ef4444' : expiring ? '#f59e0b' : '#10b981'}` }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: statusGrad, boxShadow: '0 4px 12px -2px rgba(0,0,0,0.15)', flexShrink: 0 }}>
                        {expired ? <AlertTriangle size={18} style={{ color: 'white' }} /> : <Award size={18} style={{ color: 'white' }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: dk.text }}>{t.training_type}</p>
                          <Badge color={expired ? 'red' : expiring ? 'amber' : 'green'} isDark={isDark}>
                            {expired ? 'Expired' : expiring ? `${days}d left` : 'Valid'}
                          </Badge>
                        </div>
                        <p style={{ fontSize: 11, color: dk.textMuted }}>
                          {t.provider ? `${t.provider} · ` : ''}Completed {formatDate(t.completed_date)}
                          {t.expiry_date && ` · Expires ${formatDate(t.expiry_date)}`}
                        </p>
                        {t.certificate_number && <p style={{ fontSize: 10, color: dk.textFaint, marginTop: 2 }}>Cert: {t.certificate_number}</p>}
                      </div>
                    </Glass>
                  )
                })}
              </div>
            ) : (
              <Glass isDark={isDark} style={{ padding: '50px 24px', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 18, margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${c.staff}20, ${c.staffHover}15)` }}>
                  <GraduationCap size={24} style={{ color: c.staff }} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 800, color: dk.text }}>{searchQuery || statusFilter !== 'all' ? 'No matching records' : 'No training records'}</p>
                <p style={{ fontSize: 12, color: dk.textFaint, marginTop: 4 }}>{searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Your admin will add training records as you complete them'}</p>
              </Glass>
            )}
          </div>
        )}

        {/* ═══════ ONBOARDING TAB ═══════ */}
        {tab === 'onboarding' && (
          <div style={stg(3)}>
            {/* Progress cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
              <Glass isDark={isDark} style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <CompletionRing value={pct} size={72} color={pct === 100 ? '#10b981' : c.staff} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: dk.text }}>Overall Progress</p>
                    <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>{completedCount}/{ONBOARDING_ITEMS.length} items</p>
                    <Badge color={pct === 100 ? 'green' : 'amber'} isDark={isDark}>{pct === 100 ? 'Complete' : 'In Progress'}</Badge>
                  </div>
                </div>
              </Glass>
              <Glass isDark={isDark} style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <CompletionRing value={mandatoryPct} size={72} color={mandatoryComplete ? '#10b981' : '#f59e0b'} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: dk.text }}>Mandatory Items</p>
                    <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>{mandatoryDone}/{mandatoryCount} required</p>
                    <Badge color={mandatoryComplete ? 'green' : 'red'} isDark={isDark}>{mandatoryComplete ? 'Ready to Work' : 'Incomplete'}</Badge>
                  </div>
                </div>
              </Glass>
            </div>

            {/* Progress bar */}
            <Glass isDark={isDark} style={{ padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: dk.text }}>Onboarding Progress</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: pct === 100 ? '#10b981' : c.staff }}>{pct}%</p>
              </div>
              <div style={{ height: 10, borderRadius: 999, overflow: 'hidden', background: dk.subtleBg2 }}>
                <div style={{ height: '100%', borderRadius: 999, width: `${pct}%`, background: pct === 100 ? 'linear-gradient(90deg, #10b981, #059669)' : `linear-gradient(90deg, ${c.staff}, ${c.staffHover})`, transition: 'width 1.5s cubic-bezier(.16,1,.3,1)' }} />
              </div>
            </Glass>

            {/* Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ONBOARDING_ITEMS.map((item, idx) => {
                const done = !!checklist[item.key]
                return (
                  <Glass key={item.key} isDark={isDark}
                    style={{
                      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                      borderLeft: done ? '4px solid #10b981' : item.mandatory ? '4px solid #f59e0b' : undefined,
                      opacity: done ? 1 : 0.85,
                    }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      background: done ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                      border: done ? 'none' : `2px solid ${dk.divider}`,
                      boxShadow: done ? '0 2px 8px -2px rgba(16,185,129,0.4)' : 'none',
                    }}>
                      {done && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                    <p style={{ flex: 1, fontSize: 13, fontWeight: done ? 600 : 500, color: done ? (isDark ? '#34d399' : '#059669') : dk.text }}>{item.label}</p>
                    {item.mandatory && !done && <Badge color="red" isDark={isDark}>Required</Badge>}
                    {done && <Badge color="green" isDark={isDark}>Done</Badge>}
                  </Glass>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}