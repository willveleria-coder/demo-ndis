import { useState, useEffect, useRef } from 'react'
import {
  BarChart3, Play, Download, Loader2, Clock, Users, AlertTriangle, DollarSign,
  FileText, Search, ChevronRight, ChevronDown, Activity, Shield, Zap, Layers,
  TrendingUp, RefreshCw, Calendar, CheckCircle, XCircle, Filter, Hash, Eye,
  Sparkles, Database, FileSpreadsheet, Table, ArrowRight, Timer
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


/* ─────────────────────────────────────────────
   REPORT TEMPLATES (100% PRESERVED)
   ───────────────────────────────────────────── */

const TEMPLATES = [
  { id: 'staff_hours', name: 'Staff Hours Summary', desc: 'Total hours per staff member with shift counts', icon: Clock, color: '#0d9488', grad: 'linear-gradient(135deg, #14b8a6, #06b6d4)',
    run: async (f) => { const { data } = await supabase.from('shifts').select('*, staff(first_name, last_name)').eq('status', 'completed'); const m = {}; (data||[]).forEach(s => { if (!s.clock_in||!s.clock_out) return; const n = s.staff?`${s.staff.first_name} ${s.staff.last_name}`:'Unknown'; if(!m[n])m[n]={staff_name:n,shifts:0,hours:0}; m[n].shifts++; m[n].hours+=(new Date(s.clock_out)-new Date(s.clock_in))/3600000 }); return Object.values(m).map(s=>({...s,hours:s.hours.toFixed(2)})).sort((a,b)=>b.hours-a.hours) }},
  { id: 'participant_hours', name: 'Participant Service Hours', desc: 'Hours delivered per participant with NDIS numbers', icon: Users, color: '#7c3aed', grad: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    run: async (f) => { const { data } = await supabase.from('shifts').select('*, participants(first_name, last_name, ndis_number)').eq('status', 'completed'); const m = {}; (data||[]).forEach(s => { if (!s.clock_in||!s.clock_out||!s.participants) return; const n=`${s.participants.first_name} ${s.participants.last_name}`; if(!m[n])m[n]={participant:n,ndis:s.participants.ndis_number||'—',shifts:0,hours:0}; m[n].shifts++; m[n].hours+=(new Date(s.clock_out)-new Date(s.clock_in))/3600000 }); return Object.values(m).map(p=>({...p,hours:p.hours.toFixed(2)})).sort((a,b)=>b.hours-a.hours) }},
  { id: 'incidents', name: 'Incident Report', desc: 'All incidents with type, severity, and NDIS flags', icon: AlertTriangle, color: '#ef4444', grad: 'linear-gradient(135deg, #ef4444, #f97316)',
    run: async (f) => { const q = supabase.from('incidents').select('*, participants(first_name, last_name)').order('incident_date',{ascending:false}); if(f.date_from)q.gte('incident_date',f.date_from); if(f.date_to)q.lte('incident_date',f.date_to); const{data}=await q; return(data||[]).map(i=>({date:i.incident_date?.split('T')[0],type:(i.incident_type||'').replace(/_/g,' '),severity:i.severity,status:i.status,ndis_reportable:i.ndis_reportable?'Yes':'No',participant:i.participants?`${i.participants.first_name} ${i.participants.last_name}`:'—',description:(i.description||'').slice(0,80)})) }},
  { id: 'doc_compliance', name: 'Document Compliance', desc: 'Staff document expiry status and days remaining', icon: FileText, color: '#f59e0b', grad: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    run: async () => { const{data}=await supabase.from('documents').select('*, staff(first_name, last_name)').order('expiry_date'); return(data||[]).map(d=>{const days=d.expiry_date?Math.ceil((new Date(d.expiry_date)-new Date())/86400000):null; return{document:d.name||d.document_type,staff:d.staff?`${d.staff.first_name} ${d.staff.last_name}`:'—',expiry:d.expiry_date||'None',status:days===null?'Valid':days<0?'EXPIRED':days<=30?'Expiring':'Valid',days_left:days!==null?days:'—'}}) }},
  { id: 'billing', name: 'Billing Summary', desc: 'NDIS claims with amounts and payment status', icon: DollarSign, color: '#10b981', grad: 'linear-gradient(135deg, #10b981, #14b8a6)',
    run: async () => { const{data}=await supabase.from('ndis_claims').select('*, participants(first_name, last_name)').order('created_at',{ascending:false}); return(data||[]).map(cl=>({reference:cl.claim_reference,participant:cl.participants?`${cl.participants.first_name} ${cl.participants.last_name}`:'—',category:cl.support_category,hours:cl.total_hours,rate:`$${cl.hourly_rate}`,amount:`$${parseFloat(cl.total_amount).toFixed(2)}`,status:cl.status})) }},
  { id: 'notes_compliance', name: 'Shift Notes Compliance', desc: 'Missing shift notes audit for completed shifts', icon: FileSpreadsheet, color: '#3b82f6', grad: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    run: async (f) => { const q=supabase.from('shifts').select('*, staff(first_name, last_name), participants(first_name, last_name), shift_notes(id)').eq('status','completed'); if(f.date_from)q.gte('shift_date',f.date_from); if(f.date_to)q.lte('shift_date',f.date_to); const{data}=await q; return(data||[]).map(s=>({date:s.shift_date,staff:s.staff?`${s.staff.first_name} ${s.staff.last_name}`:'—',participant:s.participants?`${s.participants.first_name} ${s.participants.last_name}`:'—',note_submitted:s.shift_notes?.length>0?'Yes':'NO'})) }},
]

function toCSV(data, filename) {
  if (!data?.length) return
  const h = Object.keys(data[0])
  const rows = data.map(r => h.map(k => `"${String(r[k]||'').replace(/"/g,'""')}"`).join(','))
  const csv = [h.join(','), ...rows].join('\n')
  const b = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(b); a.download = filename; a.click()
}


/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

export default function ReportBuilder() {
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loaded, setLoaded] = useState(false)
  const [selected, setSelected] = useState(null)
  const [filters, setFilters] = useState({ date_from: '', date_to: '' })
  const [results, setResults] = useState(null)
  const [running, setRunning] = useState(false)

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

  const inputStyle = {
    width: '100%', padding: '12px 14px', background: dk.inputBg,
    border: `1.5px solid ${dk.inputBorder}`, borderRadius: 12,
    fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none', transition: 'all .2s',
  }

  const run = async (t) => {
    setRunning(true); setSelected(t); setResults(null)
    try { setResults(await t.run(filters)) }
    catch(e) { alert('Failed: ' + e.message) }
    finally { setRunning(false) }
  }

  // Determine badge color for cell values
  const badValues = ['EXPIRED', 'Missing', 'NO', 'red', 'critical', 'high', 'rejected']
  const goodValues = ['Yes', 'Complete', 'Valid', 'resolved', 'paid', 'green']


  /* ─────────────────────────────────────────────
     RENDER
     ───────────────────────────────────────────── */

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>

      <style>{`
        @keyframes orbFloat { 0%,100% { transform:translateY(0) scale(1) } 50% { transform:translateY(-15px) scale(1.03) } }
        @keyframes ping { 75%,100% { transform:scale(1.8);opacity:0 } }
        @keyframes pulse-dot { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes shimmer { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }
        @keyframes countUp { from { opacity:0;transform:translateY(8px) scale(0.95) } to { opacity:1;transform:translateY(0) scale(1) } }
        .count-up { animation: countUp .7s cubic-bezier(.16,1,.3,1) forwards }
      `}</style>

      <Orb color={c.primary} size={380} top="-100px" right="-80px" delay={0} />
      <Orb color="#3b82f6" size={280} bottom="15%" left="-60px" delay={2} />
      <Orb color="#10b981" size={200} top="45%" right="8%" delay={3.5} />
      <Orb color="#8b5cf6" size={160} bottom="30%" left="40%" delay={5} />

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
                  <BarChart3 size={13} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Analytics</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                  <Database size={13} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{TEMPLATES.length} Reports</span>
                </div>
              </div>
              <div>
                <h1 style={{ fontSize: 32, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15 }}>Report Builder</h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>Generate NDIS-compliant reports and export custom data</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
                {[
                  { icon: Layers, text: `${TEMPLATES.length} report templates` },
                  { icon: Download, text: 'CSV export' },
                  { icon: Shield, text: 'NDIS compliant', bg: 'rgba(16,185,129,0.25)' },
                  { icon: Calendar, text: 'Date range filtering' },
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


        {/* ══════════ DATE RANGE FILTER ══════════ */}
        <Glass dark={isDark} glow={`${c.primary}10`} style={{ ...stg(1), padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: `linear-gradient(135deg, ${c.primary}20, ${c.primary}08)`,
              border: `1px solid ${c.primary}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Calendar size={18} style={{ color: c.primary }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: dk.text }}>Date Range</p>
              <p style={{ fontSize: 11, color: dk.textFaint, marginTop: 1 }}>Filter reports by date (optional)</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
              <input type="date" value={filters.date_from} onChange={e => setFilters({...filters, date_from: e.target.value})}
                style={{ padding: '10px 14px', background: dk.inputBg, border: `1.5px solid ${dk.inputBorder}`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = c.primary}
                onBlur={e => e.target.style.borderColor = dk.inputBorder} />
              <span style={{ fontSize: 12, color: dk.textFaint, fontWeight: 600 }}>to</span>
              <input type="date" value={filters.date_to} onChange={e => setFilters({...filters, date_to: e.target.value})}
                style={{ padding: '10px 14px', background: dk.inputBg, border: `1.5px solid ${dk.inputBorder}`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = c.primary}
                onBlur={e => e.target.style.borderColor = dk.inputBorder} />
              {(filters.date_from || filters.date_to) && (
                <button onClick={() => setFilters({ date_from: '', date_to: '' })} style={{
                  padding: '10px 16px', borderRadius: 12, border: 'none',
                  background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', color: '#ef4444',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>Clear</button>
              )}
            </div>
          </div>
        </Glass>


        {/* ══════════ REPORT TEMPLATE GRID ══════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, ...stg(2) }}>
          {TEMPLATES.map((t, i) => {
            const isSelected = selected?.id === t.id
            return (
              <Glass key={t.id} dark={isDark} hover
                glow={isSelected ? `${t.color}35` : `${t.color}10`}
                style={{
                  padding: '22px', cursor: 'pointer',
                  borderColor: isSelected ? `${t.color}50` : undefined,
                  position: 'relative', overflow: 'hidden',
                }}
                onClick={() => run(t)}>

                {/* Selected indicator */}
                {isSelected && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: t.grad }} />
                )}

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                    background: t.grad, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 6px 20px -4px ${t.color}40`,
                  }}>
                    <t.icon size={22} color="white" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{t.name}</p>
                    <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 3 }}>{t.desc}</p>
                  </div>
                </div>

                {/* Run button area */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginTop: 16, paddingTop: 14, borderTop: `1px solid ${dk.divider}`,
                }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {isSelected && results ? `${results.length} rows` : 'Click to run'}
                  </span>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 10,
                    background: isSelected ? t.grad : dk.subtleBg2,
                    color: isSelected ? 'white' : dk.textFaint,
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {running && isSelected ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                    {running && isSelected ? 'Running' : 'Generate'}
                  </div>
                </div>
              </Glass>
            )
          })}
        </div>


        {/* ══════════ RUNNING STATE ══════════ */}
        {running && (
          <Glass dark={isDark} glow={`${selected?.color || c.primary}20`} style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto 16px' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 18,
                background: selected?.grad || `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 40px ${selected?.color || c.primary}40`,
              }}>
                {selected && <selected.icon size={28} color="white" />}
              </div>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 18,
                background: selected?.grad || `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`,
                animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.3,
              }} />
            </div>
            <p style={{ fontWeight: 700, color: dk.text, fontSize: 16 }}>Generating {selected?.name}...</p>
            <p style={{ fontSize: 13, color: dk.textMuted, marginTop: 4 }}>Querying database and preparing report</p>
            {/* Shimmer bar */}
            <div style={{
              width: 200, height: 4, borderRadius: 999, margin: '20px auto 0', overflow: 'hidden',
              background: dk.subtleBg2,
            }}>
              <div style={{
                width: '40%', height: '100%', borderRadius: 999,
                background: `linear-gradient(90deg, transparent, ${selected?.color || c.primary}, transparent)`,
                backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite',
              }} />
            </div>
          </Glass>
        )}


        {/* ══════════ RESULTS TABLE ══════════ */}
        {results && !running && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, ...stg(3) }}>

            {/* Results header */}
            <Glass dark={isDark} glow={`${selected?.color || c.primary}12`} style={{ padding: '16px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: selected?.grad || `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 4px 14px -4px ${selected?.color || c.primary}40`,
                  }}>
                    {selected && <selected.icon size={20} color="white" />}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>{selected?.name}</p>
                    <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 1 }}>{results.length} row{results.length !== 1 ? 's' : ''} generated</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => run(selected)} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 18px', borderRadius: 12, border: 'none',
                    background: dk.subtleBg2, color: dk.textMuted,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}>
                    <RefreshCw size={14} /> Refresh
                  </button>
                  <button onClick={() => toCSV(results, `${selected?.id||'report'}_${new Date().toISOString().split('T')[0]}.csv`)}
                    disabled={!results.length} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 20px', borderRadius: 12, border: 'none',
                    background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`,
                    color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    boxShadow: `0 4px 16px -4px ${c.primary}50`,
                    opacity: results.length ? 1 : 0.5,
                  }}>
                    <Download size={16} /> Export CSV
                  </button>
                </div>
              </div>
            </Glass>

            {/* Data table */}
            {results.length > 0 ? (
              <Glass dark={isDark} style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: dk.subtleBg2 }}>
                        {Object.keys(results[0]).map(k => (
                          <th key={k} style={{
                            padding: '12px 16px', fontWeight: 700, color: dk.textMuted,
                            textAlign: 'left', fontSize: 11, textTransform: 'uppercase',
                            letterSpacing: '0.04em', whiteSpace: 'nowrap',
                            borderBottom: `1px solid ${dk.divider}`,
                          }}>
                            {k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.slice(0, 100).map((r, i) => (
                        <tr key={i} style={{
                          borderTop: i > 0 ? `1px solid ${dk.divider}` : 'none',
                          transition: 'background .15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = dk.subtleBg}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          {Object.values(r).map((v, j) => {
                            const str = String(v)
                            const isBad = badValues.includes(str)
                            const isGood = goodValues.includes(str)
                            return (
                              <td key={j} style={{
                                padding: '10px 16px', color: dk.textSoft, whiteSpace: 'nowrap',
                                maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis',
                                fontWeight: j === 0 ? 600 : 400,
                              }}>
                                {isBad ? <Badge color="red" dark={isDark}>{str}</Badge>
                                  : isGood ? <Badge color="green" dark={isDark}>{str}</Badge>
                                  : str}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {results.length > 100 && (
                  <div style={{
                    padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600,
                    color: dk.textFaint, background: dk.subtleBg,
                    borderTop: `1px solid ${dk.divider}`,
                  }}>
                    Showing 100 of {results.length} rows — export for full data
                  </div>
                )}
              </Glass>
            ) : (
              <Glass dark={isDark} style={{ padding: '48px 24px', textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px',
                  background: dk.subtleBg2, border: `1px solid ${dk.divider}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Table size={24} style={{ color: dk.textFaint }} />
                </div>
                <p style={{ fontWeight: 600, color: dk.textMuted, fontSize: 15 }}>No data found</p>
                <p style={{ fontSize: 13, color: dk.textFaint, marginTop: 4 }}>Try adjusting the date range or check that data exists</p>
              </Glass>
            )}
          </div>
        )}

      </div>
    </div>
  )
}