import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Pill, Plus, Loader2, Search, Clock, AlertTriangle, CheckCircle, User, Calendar,
  Trash2, Eye, ChevronRight, ChevronDown, Activity, Shield, Users, Zap, TrendingUp,
  BarChart3, Star, Heart, Target, RefreshCw, Layers, XCircle, Hash, Timer,
  ClipboardList, FileText, Briefcase
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
    teal: dark ? { bg: 'rgba(20,184,166,0.15)', text: '#2dd4bf', border: 'rgba(20,184,166,0.3)' } : { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
  }
  const p = palettes[color] || palettes.gray
  return (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: p.bg, color: p.text, border: `1px solid ${p.border}`, whiteSpace: 'nowrap' }}>{children}</span>)
}

function Toggle({ checked, onChange, color, dark }) {
  return (<button onClick={onChange} style={{ width: 48, height: 26, borderRadius: 999, position: 'relative', background: checked ? color : (dark ? 'rgba(51,65,85,0.6)' : '#d1d5db'), border: 'none', cursor: 'pointer', transition: 'background .25s ease', flexShrink: 0, boxShadow: checked ? `0 0 12px ${color}30` : 'none' }}>
    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: checked ? 25 : 3, transition: 'left .25s cubic-bezier(.16,1,.3,1)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
  </button>)
}

/* ─── Helpers ─── */
function formatDate(iso) { if (!iso) return '—'; return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) }
function formatTime(iso) { if (!iso) return ''; return new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }) }

const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'Every morning', 'Every evening', 'With meals', 'Before meals', 'After meals', 'As needed (PRN)', 'Weekly', 'Fortnightly', 'Monthly', 'Other']
const ROUTES = ['Oral', 'Topical', 'Inhaled', 'Injection', 'Sublingual', 'Rectal', 'Transdermal', 'Eye drops', 'Ear drops', 'Nasal', 'Other']


/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

export default function Medications() {
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [medications, setMedications] = useState([])
  const [administrations, setAdministrations] = useState([])
  const [participants, setParticipants] = useState([])
  const [staffList, setStaffList] = useState([])
  const [search, setSearch] = useState('')
  const [filterParticipant, setFilterParticipant] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [showAdmin, setShowAdmin] = useState(null)
  const [showHistory, setShowHistory] = useState(null)
  const [saving, setSaving] = useState(false)
  const [newMed, setNewMed] = useState({ participant_id: '', medication_name: '', dosage: '', frequency: '', route: 'Oral', prescriber: '', pharmacy: '', start_date: '', end_date: '', instructions: '', requires_witness: false, is_prn: false, max_prn_daily: '' })
  const [adminForm, setAdminForm] = useState({ administered_by: '', administered_at: new Date().toISOString().slice(0, 16), notes: '', refused: false, refused_reason: '', witnessed_by: '' })

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

  const CT = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (<div style={{ background: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.96)', backdropFilter: 'blur(20px)', borderRadius: 16, border: `1px solid ${isDark ? 'rgba(51,65,85,0.6)' : 'rgba(0,0,0,0.08)'}`, padding: '14px 18px', boxShadow: isDark ? '0 16px 40px -8px rgba(0,0,0,0.5)' : '0 16px 40px -8px rgba(0,0,0,0.12)' }}>
      <p style={{ fontWeight: 800, fontSize: 13, color: dk.text, marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${isDark ? 'rgba(51,65,85,0.4)' : 'rgba(0,0,0,0.06)'}` }}>{label}</p>
      {payload.map((p, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: i > 0 ? 6 : 0 }}><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: 3, background: p.color || p.fill }} /><span style={{ fontSize: 12, color: dk.textMuted }}>{p.name}</span></div><span style={{ fontSize: 13, fontWeight: 800, color: dk.text }}>{p.value}</span></div>))}
    </div>)
  }

  /* ═══ ALL BACKEND — 100% PRESERVED ═══ */
  useEffect(() => { loadData() }, [])
  useEffect(() => { if (!loading) setTimeout(() => setLoaded(true), 50) }, [loading])

  const loadData = async () => {
    try {
      const [medRes, partRes, staffRes, adminRes] = await Promise.all([
        supabase.from('medications').select('*, participants(id, first_name, last_name)').order('created_at', { ascending: false }),
        supabase.from('participants').select('id, first_name, last_name, status'),
        supabase.from('staff').select('id, first_name, last_name, status'),
        supabase.from('medication_administrations').select('*, staff:administered_by(first_name, last_name), witness:witnessed_by(first_name, last_name)').order('administered_at', { ascending: false }).limit(100),
      ])
      setMedications(medRes.data || []); setParticipants((partRes.data || []).filter(p => p.status === 'active')); setStaffList((staffRes.data || []).filter(s => s.status === 'active')); setAdministrations(adminRes.data || [])
    } catch (err) { console.error('Medications load error:', err) } finally { setLoading(false) }
  }

  const handleCreateMed = async () => {
    if (!newMed.participant_id || !newMed.medication_name || !newMed.dosage) { alert('Please fill in participant, medication name, and dosage'); return }
    setSaving(true)
    try {
      const payload = { ...newMed, status: 'active' }; if (!payload.end_date) delete payload.end_date; if (!payload.max_prn_daily) delete payload.max_prn_daily; else payload.max_prn_daily = parseInt(payload.max_prn_daily)
      const { data, error } = await supabase.from('medications').insert(payload).select('*, participants(id, first_name, last_name)').single(); if (error) throw error
      setMedications([data, ...medications]); setShowAdd(false); setNewMed({ participant_id: '', medication_name: '', dosage: '', frequency: '', route: 'Oral', prescriber: '', pharmacy: '', start_date: '', end_date: '', instructions: '', requires_witness: false, is_prn: false, max_prn_daily: '' })
    } catch (err) { alert('Failed to create: ' + (err.message || 'Unknown error')) } finally { setSaving(false) }
  }

  const handleAdminister = async () => {
    if (!showAdmin || !adminForm.administered_by) { alert('Please select who administered the medication'); return }
    setSaving(true)
    try {
      const payload = { medication_id: showAdmin.id, participant_id: showAdmin.participant_id, administered_by: adminForm.administered_by, administered_at: adminForm.administered_at, notes: adminForm.notes || null, refused: adminForm.refused, refused_reason: adminForm.refused ? adminForm.refused_reason : null, witnessed_by: adminForm.witnessed_by || null }
      const { data, error } = await supabase.from('medication_administrations').insert(payload).select('*, staff:administered_by(first_name, last_name), witness:witnessed_by(first_name, last_name)').single(); if (error) throw error
      setAdministrations([data, ...administrations]); setShowAdmin(null); setAdminForm({ administered_by: '', administered_at: new Date().toISOString().slice(0, 16), notes: '', refused: false, refused_reason: '', witnessed_by: '' })
    } catch (err) { alert('Failed to record: ' + (err.message || 'Unknown error')) } finally { setSaving(false) }
  }

  const handleDeleteMed = async (id) => {
    if (!confirm('Delete this medication record?')) return
    try { await supabase.from('medication_administrations').delete().eq('medication_id', id); const { error } = await supabase.from('medications').delete().eq('id', id); if (error) throw error; setMedications(medications.filter(m => m.id !== id)) } catch (err) { alert('Failed to delete: ' + (err.message || 'Unknown error')) }
  }

  /* ── Filtering ── */
  const filtered = useMemo(() => {
    return medications.filter(m => {
      if (filterParticipant !== 'all' && m.participant_id !== filterParticipant) return false
      if (filterType === 'prn' && !m.is_prn) return false
      if (filterType === 'witness' && !m.requires_witness) return false
      if (filterType === 'active' && m.status !== 'active') return false
      if (search) { const q = search.toLowerCase(); const pName = m.participants ? `${m.participants.first_name} ${m.participants.last_name}`.toLowerCase() : ''; return m.medication_name.toLowerCase().includes(q) || pName.includes(q) }
      return true
    })
  }, [medications, filterParticipant, filterType, search])

  const activeMeds = medications.filter(m => m.status === 'active')
  const prnMeds = medications.filter(m => m.is_prn)
  const witnessRequired = medications.filter(m => m.requires_witness)
  const todayAdmins = administrations.filter(a => { const today = new Date().toISOString().split('T')[0]; return a.administered_at?.startsWith(today) })
  const refusedToday = todayAdmins.filter(a => a.refused).length

  /* ── Charts ── */
  const typePie = useMemo(() => {
    const map = {}; medications.forEach(m => { const r = m.route || 'Unknown'; map[r] = (map[r] || 0) + 1 })
    const colors = ['#8b5cf6', '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899']
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }))
  }, [medications])

  const topMeds = useMemo(() => {
    const map = {}; administrations.forEach(a => { const med = medications.find(m => m.id === a.medication_id); if (med) { map[med.medication_name] = (map[med.medication_name] || 0) + 1 } })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }))
  }, [administrations, medications])


  /* ─── Loading ─── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(139,92,246,0.4)' }}><Pill size={32} color="white" /></div>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.3 }} />
      </div>
      <p style={{ color: dk.textMuted, fontSize: 14, fontWeight: 600 }}>Loading medications...</p>
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

      <Orb color="#8b5cf6" size={380} top="-100px" right="-80px" delay={0} />
      <Orb color="#6366f1" size={280} bottom="15%" left="-60px" delay={2} />
      <Orb color="#f59e0b" size={200} top="45%" right="8%" delay={3.5} />
      <Orb color="#10b981" size={160} bottom="30%" left="40%" delay={5} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ══════════ HERO ══════════ */}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}><Pill size={13} style={{ color: 'rgba(255,255,255,0.7)' }} /><span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Medication Management</span></div>
                {witnessRequired.length > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(245,158,11,0.35)', backdropFilter: 'blur(8px)' }}><AlertTriangle size={13} style={{ color: 'rgba(255,255,255,0.9)' }} /><span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{witnessRequired.length} witness req.</span></div>}
                {refusedToday > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(239,68,68,0.3)', backdropFilter: 'blur(8px)' }}><XCircle size={13} style={{ color: 'rgba(255,255,255,0.9)' }} /><span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{refusedToday} refused today</span></div>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h1 style={{ fontSize: 32, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15 }}>Medications</h1>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>Prescriptions, administration records, and compliance</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={loadData} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderRadius: 16, border: 'none', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}><RefreshCw size={16} /></button>
                  <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 16, border: 'none', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}><Plus size={18} /> Add Medication</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
                {[
                  { icon: Pill, text: `${activeMeds.length} active` },
                  { icon: Zap, text: `${prnMeds.length} PRN` },
                  { icon: Eye, text: `${witnessRequired.length} witness req.`, bg: witnessRequired.length > 0 ? 'rgba(245,158,11,0.35)' : undefined },
                  { icon: CheckCircle, text: `${todayAdmins.length} given today`, bg: 'rgba(16,185,129,0.25)' },
                  refusedToday > 0 && { icon: XCircle, text: `${refusedToday} refused today`, bg: 'rgba(239,68,68,0.3)' },
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
            { icon: Pill, label: 'Active Meds', value: activeMeds.length, grad: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, glow: 'rgba(139,92,246,0.2)' },
            { icon: Zap, label: 'PRN', value: prnMeds.length, grad: 'linear-gradient(135deg, #a855f7, #7c3aed)', glow: 'rgba(168,85,247,0.2)' },
            { icon: Eye, label: 'Witness Req.', value: witnessRequired.length, grad: 'linear-gradient(135deg, #f59e0b, #fbbf24)', glow: 'rgba(245,158,11,0.2)', pulse: witnessRequired.length > 0 },
            { icon: CheckCircle, label: 'Given Today', value: todayAdmins.length, grad: 'linear-gradient(135deg, #10b981, #34d399)', glow: 'rgba(16,185,129,0.2)' },
            { icon: XCircle, label: 'Refused Today', value: refusedToday, grad: 'linear-gradient(135deg, #ef4444, #f87171)', glow: 'rgba(239,68,68,0.2)', pulse: refusedToday > 0 },
            { icon: Layers, label: 'Total Records', value: medications.length, grad: 'linear-gradient(135deg, #3b82f6, #60a5fa)', glow: 'rgba(59,130,246,0.2)' },
          ].map((card, i) => (
            <Glass key={i} dark={isDark} hover glow={card.glow} style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
              {card.pulse && <div style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: '50%', background: card.label.includes('Refused') ? '#ef4444' : '#f59e0b', animation: 'pulse-dot 2s ease-in-out infinite' }} />}
              <div style={{ width: 42, height: 42, borderRadius: 12, background: card.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 20px -4px ${card.glow}`, marginBottom: 12 }}><card.icon size={20} color="white" /></div>
              <p style={{ fontSize: 22, fontWeight: 800, color: dk.text, lineHeight: 1 }} className="count-up"><AnimNum value={card.value} /></p>
              <p style={{ fontSize: 11, fontWeight: 600, color: dk.textFaint, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</p>
            </Glass>
          ))}
        </div>

        {/* ══════════ SEARCH + FILTERS ══════════ */}
        <Glass dark={isDark} style={{ ...stg(2), padding: '14px 18px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search medications..." style={{ ...inputStyle, paddingLeft: 40 }} onFocus={e => e.target.style.borderColor = '#8b5cf6'} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
            </div>
            <div style={{ position: 'relative' }}>
              <select value={filterParticipant} onChange={e => setFilterParticipant(e.target.value)} style={{ padding: '11px 36px 11px 14px', background: dk.inputBg, border: `1px solid ${dk.inputBorder}`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none', appearance: 'none', cursor: 'pointer', minWidth: 150 }}>
                <option value="all">All Participants</option>
                {participants.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint, pointerEvents: 'none' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '11px 36px 11px 14px', background: dk.inputBg, border: `1px solid ${dk.inputBorder}`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none', appearance: 'none', cursor: 'pointer', minWidth: 130 }}>
                <option value="all">All Types</option>
                <option value="active">Active Only</option>
                <option value="prn">PRN Only</option>
                <option value="witness">Witness Req.</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint, pointerEvents: 'none' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: dk.textFaint, padding: '6px 12px', borderRadius: 10, background: dk.subtleBg }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </Glass>

        {/* ══════════ MEDICATION CARDS ══════════ */}
        {filtered.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((m, i) => {
              const pName = m.participants ? `${m.participants.first_name} ${m.participants.last_name}` : 'Unknown'
              const medAdmins = administrations.filter(a => a.medication_id === m.id)
              const lastAdmin = medAdmins[0]
              const accent = m.requires_witness ? '#f59e0b' : m.is_prn ? '#a855f7' : '#6366f1'
              const grad = m.requires_witness ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : m.is_prn ? 'linear-gradient(135deg, #a855f7, #7c3aed)' : 'linear-gradient(135deg, #8b5cf6, #6366f1)'

              return (
                <Glass key={m.id} dark={isDark} hover glow={`${accent}15`} style={{ ...stg(i + 3), padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderRadius: '0 4px 4px 0', background: `linear-gradient(to bottom, ${accent}, ${accent}60)` }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, paddingLeft: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px -4px ${accent}50` }}><Pill size={22} color="white" /></div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{m.medication_name}</p>
                        <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 3 }}>{m.dosage} · {m.frequency || 'No frequency'} · {m.route}</p>
                        <p style={{ fontSize: 11, color: dk.textFaint, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}><User size={10} /> {pName}{m.prescriber && ` · Dr. ${m.prescriber}`}</p>
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                          <Badge color={m.status === 'active' ? 'green' : 'gray'} dark={isDark}>{m.status === 'active' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block', marginRight: 3, animation: 'pulse-dot 2s ease-in-out infinite' }} />}{m.status || 'Active'}</Badge>
                          {m.is_prn && <Badge color="purple" dark={isDark}>PRN</Badge>}
                          {m.requires_witness && <Badge color="amber" dark={isDark}>Witness</Badge>}
                        </div>
                        {lastAdmin && <p style={{ fontSize: 11, color: dk.textFaint, marginTop: 6 }}>Last: {formatDate(lastAdmin.administered_at)} {formatTime(lastAdmin.administered_at)}{lastAdmin.staff && ` by ${lastAdmin.staff.first_name} ${lastAdmin.staff.last_name}`}{lastAdmin.refused && ' — REFUSED'}</p>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => { setAdminForm({ administered_by: '', administered_at: new Date().toISOString().slice(0, 16), notes: '', refused: false, refused_reason: '', witnessed_by: '' }); setShowAdmin(m) }} style={{ width: 38, height: 38, borderRadius: 11, border: 'none', background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: `0 4px 14px -4px ${c.staff}50`, transition: 'all .2s' }} title="Administer"
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}><CheckCircle size={16} /></button>
                      <button onClick={() => setShowHistory(m)} style={{ width: 38, height: 38, borderRadius: 11, border: 'none', background: dk.subtleBg2, color: dk.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .2s' }} title="History"
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}><Eye size={16} /></button>
                      <button onClick={() => handleDeleteMed(m.id)} style={{ width: 38, height: 38, borderRadius: 11, border: 'none', background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .2s' }} title="Delete"
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}><Trash2 size={16} /></button>
                    </div>
                  </div>
                  {m.instructions && (
                    <div style={{ marginTop: 12, marginLeft: 70, padding: '12px 16px', borderRadius: 12, background: isDark ? 'rgba(139,92,246,0.06)' : 'rgba(139,92,246,0.04)', border: `1px solid ${isDark ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.15)'}` }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Instructions</p>
                      <p style={{ fontSize: 12, color: dk.textSoft, marginTop: 3 }}>{m.instructions}</p>
                    </div>
                  )}
                </Glass>
              )
            })}
          </div>
        ) : (
          <Glass dark={isDark} style={{ ...stg(3), padding: '56px 24px', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px', background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(139,92,246,0.04))', border: '1px solid rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pill size={32} style={{ color: '#8b5cf6' }} /></div>
            <p style={{ color: dk.textMuted, fontWeight: 600, fontSize: 16 }}>{search || filterParticipant !== 'all' || filterType !== 'all' ? 'No matching medications' : 'No medications recorded'}</p>
            <p style={{ color: dk.textFaint, fontSize: 13, marginTop: 4 }}>Click "Add Medication" to get started</p>
          </Glass>
        )}

        {/* ══════════ INSIGHTS ══════════ */}
        {medications.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, ...stg(5) }}>
            <Glass dark={isDark} glow="rgba(139,92,246,0.1)" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><BarChart3 size={18} style={{ color: '#8b5cf6' }} /><h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>By Route</h3></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <ResponsiveContainer width={120} height={120}>
                  <PieChart><Pie data={typePie} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} stroke="none">
                    {typePie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie><Tooltip content={<CT />} /></PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {typePie.map((s, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} /><span style={{ fontSize: 12, color: dk.textMuted }}>{s.name}</span><span style={{ fontSize: 13, fontWeight: 800, color: dk.text, marginLeft: 'auto' }}>{s.value}</span></div>))}
                </div>
              </div>
            </Glass>

            <Glass dark={isDark} glow="rgba(59,130,246,0.1)" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><TrendingUp size={18} style={{ color: '#3b82f6' }} /><h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Most Administered</h3></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {topMeds.length > 0 ? topMeds.map((item, i) => {
                  const maxVal = Math.max(...topMeds.map(e => e.count)); const pct = Math.round((item.count / maxVal) * 100)
                  const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899']; const col = colors[i % colors.length]
                  return (<div key={item.name}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontSize: 12, fontWeight: 600, color: dk.textSoft }}>{item.name}</span><span style={{ fontSize: 13, fontWeight: 800, color: col }}>{item.count}</span></div><div style={{ height: 6, borderRadius: 999, overflow: 'hidden', background: dk.subtleBg2 }}><div style={{ height: '100%', borderRadius: 999, width: `${pct}%`, background: col, transition: 'width 1s cubic-bezier(.16,1,.3,1)' }} /></div></div>)
                }) : <p style={{ fontSize: 13, color: dk.textFaint }}>No data yet</p>}
              </div>
            </Glass>

            <Glass dark={isDark} glow="rgba(16,185,129,0.1)" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}><Activity size={18} style={{ color: '#10b981' }} /><h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Today's Activity</h3></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Administered', value: todayAdmins.filter(a => !a.refused).length, color: '#10b981' },
                  { label: 'Refused', value: refusedToday, color: '#ef4444' },
                  { label: 'Witnessed', value: todayAdmins.filter(a => a.witnessed_by).length, color: '#f59e0b' },
                  { label: 'Total Actions', value: todayAdmins.length, color: '#8b5cf6' },
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

      {/* ══════════ ADD MODAL ══════════ */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Medication" wide>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ margin: '-20px -20px 0 -20px', padding: '24px 28px 20px', background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 50%, #3b82f6 100%)`, position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
            <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -40, right: -20 }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pill size={26} color="white" /></div>
              <div><h3 style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>New Medication</h3><p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Add a prescription for a participant</p></div>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><User size={11} /> Participant *</p>
            <select value={newMed.participant_id} onChange={e => setNewMed({...newMed, participant_id: e.target.value})} style={{ ...inputStyle, cursor: 'pointer' }}><option value="">Select participant...</option>{participants.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}</select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {[
              { label: 'Medication *', key: 'medication_name', icon: Pill, placeholder: 'e.g. Paracetamol' },
              { label: 'Dosage *', key: 'dosage', icon: Hash, placeholder: 'e.g. 500mg' },
              { label: 'Prescriber', key: 'prescriber', icon: User, placeholder: 'Dr. Smith' },
              { label: 'Pharmacy', key: 'pharmacy', icon: Briefcase, placeholder: 'Chemist Warehouse' },
              { label: 'Start Date', key: 'start_date', type: 'date', icon: Calendar },
              { label: 'End Date', key: 'end_date', type: 'date', icon: Calendar },
            ].map(f => (
              <div key={f.key}>
                <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><f.icon size={11} /> {f.label}</p>
                <input type={f.type || 'text'} value={newMed[f.key]} onChange={e => setNewMed({...newMed, [f.key]: e.target.value})} placeholder={f.placeholder || ''} style={inputStyle} onFocus={e => e.target.style.borderColor = '#8b5cf6'} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
              </div>
            ))}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Frequency</p>
              <select value={newMed.frequency} onChange={e => setNewMed({...newMed, frequency: e.target.value})} style={{ ...inputStyle, cursor: 'pointer' }}><option value="">Select...</option>{FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}</select>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Route</p>
              <select value={newMed.route} onChange={e => setNewMed({...newMed, route: e.target.value})} style={{ ...inputStyle, cursor: 'pointer' }}>{ROUTES.map(r => <option key={r} value={r}>{r}</option>)}</select>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Special Instructions</p>
            <textarea value={newMed.instructions} onChange={e => setNewMed({...newMed, instructions: e.target.value})} rows={2} placeholder="e.g. Take with food..." style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = '#8b5cf6'} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Toggle checked={newMed.is_prn} onChange={() => setNewMed({...newMed, is_prn: !newMed.is_prn})} color="#a855f7" dark={isDark} />
              <span style={{ fontSize: 13, fontWeight: 700, color: dk.text }}>PRN (As Needed)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Toggle checked={newMed.requires_witness} onChange={() => setNewMed({...newMed, requires_witness: !newMed.requires_witness})} color="#f59e0b" dark={isDark} />
              <span style={{ fontSize: 13, fontWeight: 700, color: dk.text }}>Requires Witness</span>
            </div>
          </div>
          {newMed.is_prn && <div style={{ maxWidth: 200 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Max PRN doses/day</p>
            <input type="number" value={newMed.max_prn_daily} onChange={e => setNewMed({...newMed, max_prn_daily: e.target.value})} placeholder="4" style={inputStyle} onFocus={e => e.target.style.borderColor = '#a855f7'} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
          </div>}
          <div style={{ display: 'flex', gap: 12, borderTop: `1px solid ${dk.divider}`, paddingTop: 16 }}>
            <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '15px 0', borderRadius: 14, background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9', border: `1px solid ${dk.inputBorder}`, color: dk.textMuted, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleCreateMed} disabled={saving} style={{ flex: 2, padding: '15px 0', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 28px -6px rgba(139,92,246,0.5)', opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Pill size={16} /> Add Medication</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* ══════════ ADMINISTER MODAL ══════════ */}
      <Modal isOpen={!!showAdmin} onClose={() => setShowAdmin(null)} title="Record Administration" wide>
        {showAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ margin: '-20px -20px 0 -20px', padding: '24px 28px 20px', background: `linear-gradient(135deg, ${c.staff} 0%, ${c.staffHover} 50%, #14b8a6 100%)`, position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
              <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -30, right: -10 }} />
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }} />
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={24} color="white" /></div>
                <div><h3 style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>{showAdmin.medication_name}</h3><p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{showAdmin.dosage} · {showAdmin.frequency} · {showAdmin.route}</p></div>
              </div>
            </div>
            {showAdmin.instructions && <div style={{ padding: '12px 16px', borderRadius: 12, background: isDark ? 'rgba(245,158,11,0.08)' : '#fffbeb', border: `1px solid ${isDark ? 'rgba(245,158,11,0.2)' : '#fde68a'}`, fontSize: 12, fontWeight: 600, color: '#d97706', display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={14} /> {showAdmin.instructions}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Administered By *</p>
                <select value={adminForm.administered_by} onChange={e => setAdminForm({...adminForm, administered_by: e.target.value})} style={{ ...inputStyle, cursor: 'pointer' }}><option value="">Select staff...</option>{staffList.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date & Time</p>
                <input type="datetime-local" value={adminForm.administered_at} onChange={e => setAdminForm({...adminForm, administered_at: e.target.value})} style={inputStyle} />
              </div>
              {showAdmin.requires_witness && <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Witnessed By *</p>
                <select value={adminForm.witnessed_by} onChange={e => setAdminForm({...adminForm, witnessed_by: e.target.value})} style={{ ...inputStyle, cursor: 'pointer' }}><option value="">Select witness...</option>{staffList.filter(s => s.id !== adminForm.administered_by).map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select>
              </div>}
            </div>
            {/* Refused toggle */}
            <div style={{ padding: '14px 18px', borderRadius: 14, background: adminForm.refused ? (isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2') : dk.subtleBg, border: `1px solid ${adminForm.refused ? (isDark ? 'rgba(239,68,68,0.2)' : '#fecaca') : dk.subtleBg2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div><p style={{ fontSize: 13, fontWeight: 700, color: adminForm.refused ? '#ef4444' : dk.text }}>Medication Refused</p><p style={{ fontSize: 11, color: dk.textFaint, marginTop: 2 }}>Participant refused to take this medication</p></div>
              <Toggle checked={adminForm.refused} onChange={() => setAdminForm({...adminForm, refused: !adminForm.refused})} color="#ef4444" dark={isDark} />
            </div>
            {adminForm.refused && <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Reason for Refusal</p>
              <textarea value={adminForm.refused_reason} onChange={e => setAdminForm({...adminForm, refused_reason: e.target.value})} rows={2} placeholder="Document why..." style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = '#ef4444'} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
            </div>}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Notes</p>
              <textarea value={adminForm.notes} onChange={e => setAdminForm({...adminForm, notes: e.target.value})} rows={2} placeholder="Observations..." style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = c.staff} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
            </div>
            <div style={{ display: 'flex', gap: 12, borderTop: `1px solid ${dk.divider}`, paddingTop: 16 }}>
              <button onClick={() => setShowAdmin(null)} style={{ flex: 1, padding: '15px 0', borderRadius: 14, background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9', border: `1px solid ${dk.inputBorder}`, color: dk.textMuted, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAdminister} disabled={saving} style={{ flex: 2, padding: '15px 0', borderRadius: 14, border: 'none', background: adminForm.refused ? 'linear-gradient(135deg, #ef4444, #f87171)' : `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 8px 28px -6px ${adminForm.refused ? 'rgba(239,68,68,0.5)' : c.staff + '50'}`, opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {saving ? <><Loader2 size={16} className="animate-spin" /> Recording...</> : adminForm.refused ? <><XCircle size={16} /> Record Refusal</> : <><CheckCircle size={16} /> Record Administration</>}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ══════════ HISTORY MODAL ══════════ */}
      <Modal isOpen={!!showHistory} onClose={() => setShowHistory(null)} title="Administration History" wide>
        {showHistory && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ margin: '-20px -20px 0 -20px', padding: '24px 28px 20px', background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 50%, #3b82f6 100%)`, position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
              <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -30, right: -10 }} />
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={24} color="white" /></div>
                <div><h3 style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>{showHistory.medication_name}</h3><p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{showHistory.dosage} · {showHistory.frequency}</p></div>
              </div>
            </div>
            {(() => {
              const history = administrations.filter(a => a.medication_id === showHistory.id)
              return history.length > 0 ? (
                <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {history.map(a => (
                    <Glass key={a.id} dark={isDark} glow={a.refused ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)'} style={{ padding: '16px 20px', borderColor: a.refused ? (isDark ? 'rgba(239,68,68,0.15)' : '#fecaca') : (isDark ? 'rgba(16,185,129,0.15)' : '#a7f3d0') }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: dk.text }}>{a.refused ? '❌ Refused' : '✅ Administered'}</p>
                          <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>{a.staff ? `${a.staff.first_name} ${a.staff.last_name}` : 'Unknown'}{a.witness && ` · Witness: ${a.witness.first_name} ${a.witness.last_name}`}</p>
                          {a.refused_reason && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>Reason: {a.refused_reason}</p>}
                          {a.notes && <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 4 }}>{a.notes}</p>}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: dk.textSoft }}>{formatDate(a.administered_at)}</p>
                          <p style={{ fontSize: 11, color: dk.textFaint }}>{formatTime(a.administered_at)}</p>
                        </div>
                      </div>
                    </Glass>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '32px 24px', textAlign: 'center' }}><Clock size={32} style={{ color: dk.textFaint, margin: '0 auto 8px' }} /><p style={{ fontSize: 13, fontWeight: 600, color: dk.textMuted }}>No administration records yet</p></div>
              )
            })()}
          </div>
        )}
      </Modal>
    </div>
  )
}