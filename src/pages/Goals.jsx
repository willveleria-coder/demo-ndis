import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Target, Plus, Search, X, Filter, ChevronRight, Edit2, Trash2,
  CheckCircle, Clock, PauseCircle, TrendingUp, Users, Loader2,
  AlertTriangle, Star, BarChart3, ArrowUp, ArrowDown, Save, Calendar
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useBrandColors } from '../hooks/useBrandColors'
import { useTheme } from '../context/ThemeContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import Modal from '../components/ui/Modal'

/* ═══════════════════════════════════════════════
   DESIGN SYSTEM
   ═══════════════════════════════════════════════ */
function Glass({children,className='',glow,style={},hover=false,dark=false,onClick,...p}){return<div className={className} onClick={onClick} style={{background:dark?'rgba(30,41,59,0.6)':'rgba(255,255,255,0.55)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',border:`1px solid ${dark?'rgba(51,65,85,0.4)':'rgba(255,255,255,0.7)'}`,borderRadius:'1.25rem',boxShadow:glow?`0 8px 32px -8px ${glow}`:'0 4px 24px -4px rgba(0,0,0,0.06)',transition:hover?'all .3s cubic-bezier(.16,1,.3,1)':undefined,cursor:hover||onClick?'pointer':undefined,...style}} onMouseEnter={hover?e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=glow?`0 16px 48px -8px ${glow}`:'0 12px 40px -8px rgba(0,0,0,0.12)'}:undefined} onMouseLeave={hover?e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=glow?`0 8px 32px -8px ${glow}`:'0 4px 24px -4px rgba(0,0,0,0.06)'}:undefined} {...p}>{children}</div>}
function Orb({color,size=200,top,left,right,bottom,delay=0}){return<div style={{position:'absolute',width:size,height:size,top,left,right,bottom,background:`radial-gradient(circle,${color} 0%,transparent 70%)`,opacity:0.12,borderRadius:'50%',animation:`orbFloat ${6+delay}s ease-in-out ${delay}s infinite`,pointerEvents:'none',zIndex:0}}/>}
function AnimNum({value,duration=1200,suffix=''}){const[display,setDisplay]=useState(0);const frameRef=useRef();useEffect(()=>{const num=typeof value==='number'?value:parseFloat(value)||0;const start=performance.now();function tick(now){const p=Math.min((now-start)/duration,1);setDisplay(Math.round(num*(1-Math.pow(1-p,3))));if(p<1)frameRef.current=requestAnimationFrame(tick)}frameRef.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frameRef.current)},[value,duration]);return<>{display}{suffix}</>}
function Badge({children,color='gray',isDark}){const palettes={gray:isDark?{bg:'rgba(100,116,139,0.2)',text:'#94a3b8',border:'rgba(100,116,139,0.3)'}:{bg:'#f1f5f9',text:'#64748b',border:'#e2e8f0'},green:isDark?{bg:'rgba(16,185,129,0.15)',text:'#34d399',border:'rgba(16,185,129,0.3)'}:{bg:'#ecfdf5',text:'#059669',border:'#a7f3d0'},amber:isDark?{bg:'rgba(245,158,11,0.15)',text:'#fbbf24',border:'rgba(245,158,11,0.3)'}:{bg:'#fffbeb',text:'#d97706',border:'#fde68a'},red:isDark?{bg:'rgba(239,68,68,0.15)',text:'#f87171',border:'rgba(239,68,68,0.3)'}:{bg:'#fef2f2',text:'#dc2626',border:'#fecaca'},blue:isDark?{bg:'rgba(59,130,246,0.15)',text:'#60a5fa',border:'rgba(59,130,246,0.3)'}:{bg:'#eff6ff',text:'#2563eb',border:'#bfdbfe'},purple:isDark?{bg:'rgba(139,92,246,0.15)',text:'#a78bfa',border:'rgba(139,92,246,0.3)'}:{bg:'#f5f3ff',text:'#7c3aed',border:'#ddd6fe'},teal:isDark?{bg:'rgba(20,184,166,0.15)',text:'#2dd4bf',border:'rgba(20,184,166,0.3)'}:{bg:'#f0fdfa',text:'#0d9488',border:'#99f6e4'}};const pl=palettes[color]||palettes.gray;return<span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',fontSize:10,fontWeight:700,letterSpacing:'0.02em',borderRadius:999,background:pl.bg,color:pl.text,border:`1px solid ${pl.border}`,whiteSpace:'nowrap'}}>{children}</span>}
function CT({active,payload,label,isDark}){if(!active||!payload?.length)return null;return<div style={{background:isDark?'rgba(30,41,59,0.95)':'rgba(255,255,255,0.95)',backdropFilter:'blur(12px)',border:`1px solid ${isDark?'rgba(51,65,85,0.5)':'rgba(0,0,0,0.08)'}`,borderRadius:12,padding:'10px 14px',boxShadow:'0 8px 32px -4px rgba(0,0,0,0.15)'}}>{label&&<p style={{fontSize:11,fontWeight:700,color:isDark?'#e2e8f0':'#1f2937',marginBottom:4}}>{label}</p>}{payload.map((p,i)=><p key={i} style={{fontSize:11,color:isDark?'#94a3b8':'#6b7280'}}><span style={{display:'inline-block',width:8,height:8,borderRadius:4,background:p.color||'#3b82f6',marginRight:6}}/>{p.name}: <span style={{fontWeight:700,color:isDark?'#e2e8f0':'#1f2937'}}>{p.value}</span></p>)}</div>}

const CHART_COLORS = ['#7c3aed','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4','#8b5cf6']

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function Goals() {
  const { user } = useAuth()
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [goals, setGoals] = useState([])
  const [participants, setParticipants] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [participantFilter, setParticipantFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editGoal, setEditGoal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [newGoal, setNewGoal] = useState({ participant_id: '', title: '', description: '', status: 'active', target_date: '', progress: 0 })

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
  const inputStyle = { width: '100%', padding: '12px 14px', background: dk.inputBg, border: `1.5px solid ${dk.inputBorder}`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none', transition: 'all .2s' }

  /* ─── Data fetch ─── */
  useEffect(() => {
    async function load() {
      try {
        const [goalsRes, partRes] = await Promise.all([
          supabase.from('goals').select('*, participants(id, first_name, last_name, ndis_number)').order('created_at', { ascending: false }),
          supabase.from('participants').select('id, first_name, last_name').eq('status', 'active').order('first_name'),
        ])
        setGoals(goalsRes.data || [])
        setParticipants(partRes.data || [])
      } catch (err) { console.error('Goals load error:', err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  /* ─── CRUD ─── */
  const handleCreate = async () => {
    if (!newGoal.participant_id || !newGoal.title) { alert('Please select a participant and enter a goal title'); return }
    setSaving(true)
    try {
      const { data, error } = await supabase.from('goals').insert(newGoal).select('*, participants(id, first_name, last_name, ndis_number)').single()
      if (error) throw error
      setGoals([data, ...goals])
      setShowCreate(false); setNewGoal({ participant_id: '', title: '', description: '', status: 'active', target_date: '', progress: 0 })
    } catch (err) { alert('Failed: ' + (err.message || 'Unknown error')) }
    finally { setSaving(false) }
  }

  const handleUpdate = async () => {
    if (!editGoal) return
    setSaving(true)
    try {
      const { id, participants: _, ...payload } = editGoal
      const { data, error } = await supabase.from('goals').update(payload).eq('id', id).select('*, participants(id, first_name, last_name, ndis_number)').single()
      if (error) throw error
      setGoals(goals.map(g => g.id === id ? data : g))
      setEditGoal(null)
    } catch (err) { alert('Failed: ' + (err.message || 'Unknown error')) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this goal?')) return
    try {
      const { error } = await supabase.from('goals').delete().eq('id', id)
      if (error) throw error
      setGoals(goals.filter(g => g.id !== id))
    } catch (err) { alert('Failed: ' + err.message) }
  }

  const handleProgressChange = async (goal, newProgress) => {
    const progress = Math.max(0, Math.min(100, newProgress))
    try {
      await supabase.from('goals').update({ progress }).eq('id', goal.id)
      setGoals(goals.map(g => g.id === goal.id ? { ...g, progress } : g))
    } catch (err) { console.error(err) }
  }

  /* ─── Computed ─── */
  const activeCount = goals.filter(g => g.status === 'active').length
  const completedCount = goals.filter(g => g.status === 'completed').length
  const onHoldCount = goals.filter(g => g.status === 'on_hold').length
  const avgProgress = goals.filter(g => g.status === 'active').length > 0
    ? Math.round(goals.filter(g => g.status === 'active').reduce((a, g) => a + (g.progress || 0), 0) / goals.filter(g => g.status === 'active').length)
    : 0
  const overdue = goals.filter(g => g.status === 'active' && g.target_date && new Date(g.target_date) < new Date()).length

  const filtered = goals.filter(g => {
    if (statusFilter !== 'all' && g.status !== statusFilter) return false
    if (participantFilter !== 'all' && g.participant_id !== participantFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const pName = g.participants ? `${g.participants.first_name} ${g.participants.last_name}`.toLowerCase() : ''
      return g.title.toLowerCase().includes(q) || pName.includes(q) || (g.description || '').toLowerCase().includes(q)
    }
    return true
  })

  /* Chart data */
  const progressDistribution = [
    { name: '0-25%', value: goals.filter(g => g.status === 'active' && (g.progress || 0) <= 25).length, color: '#ef4444' },
    { name: '26-50%', value: goals.filter(g => g.status === 'active' && g.progress > 25 && g.progress <= 50).length, color: '#f59e0b' },
    { name: '51-75%', value: goals.filter(g => g.status === 'active' && g.progress > 50 && g.progress <= 75).length, color: '#3b82f6' },
    { name: '76-100%', value: goals.filter(g => g.status === 'active' && g.progress > 75).length, color: '#10b981' },
  ].filter(d => d.value > 0)

  const byParticipant = participants.map(p => {
    const pGoals = goals.filter(g => g.participant_id === p.id && g.status === 'active')
    return { name: p.first_name, goals: pGoals.length, avgProgress: pGoals.length > 0 ? Math.round(pGoals.reduce((a, g) => a + (g.progress || 0), 0) / pGoals.length) : 0 }
  }).filter(d => d.goals > 0).sort((a, b) => b.avgProgress - a.avgProgress).slice(0, 10)

  const statusConfig = {
    active: { color: 'green', label: 'Active', icon: Target, gradient: 'linear-gradient(135deg, #10b981, #059669)' },
    completed: { color: 'blue', label: 'Completed', icon: CheckCircle, gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
    on_hold: { color: 'amber', label: 'On Hold', icon: PauseCircle, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  }

  const getProgressColor = (p) => p >= 80 ? '#10b981' : p >= 50 ? '#3b82f6' : p >= 25 ? '#f59e0b' : '#ef4444'

  /* ─── Loading ─── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})` }}><Target size={22} style={{ color: 'white' }} /></div>
        <div style={{ position: 'absolute', inset: -4, borderRadius: 18, border: `2px solid ${c.primary}`, opacity: 0.3, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: dk.textMuted }}>Loading goals...</p>
    </div>
  )

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <style>{`
        @keyframes orbFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-15px) scale(1.03)}}
        @keyframes ping{75%,100%{transform:scale(1.8);opacity:0}}
        @keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>
      <Orb color={c.primary} size={280} top="-80px" right="-60px" delay={0} />
      <Orb color={c.adminHover} size={200} bottom="10%" left="-40px" delay={2} />
      <Orb color="#10b981" size={180} top="35%" right="10%" delay={4} />
      <Orb color="#f59e0b" size={160} bottom="-40px" left="30%" delay={1} />
      <Orb color="#3b82f6" size={150} top="15%" left="15%" delay={3} />

      <div style={{ position: 'relative', zIndex: 1, padding: '0 0 40px' }}>

        {/* ═══════ HERO ═══════ */}
        <div style={{ ...stg(0), background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 40%, #3b82f6 70%, #06b6d4 100%)`, borderRadius: 20, padding: '28px 24px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', bottom: -50, left: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
          {[{ top: '15%', left: '85%', size: 5, delay: '0s' }, { top: '70%', left: '90%', size: 3, delay: '1s' }, { top: '35%', left: '8%', size: 4, delay: '2s' }].map((dot, i) => (
            <div key={i} style={{ position: 'absolute', top: dot.top, left: dot.left, width: dot.size, height: dot.size, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', animation: `pulse-dot 2s ease-in-out ${dot.delay} infinite` }} />
          ))}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', fontSize: 11, fontWeight: 700, color: 'white', letterSpacing: '0.04em' }}><Target size={12} /> NDIS GOALS</span>
              {overdue > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.3)', backdropFilter: 'blur(8px)', fontSize: 10, fontWeight: 700, color: '#fca5a5' }}><AlertTriangle size={10} /> {overdue} OVERDUE</span>}
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', lineHeight: 1.2, marginBottom: 4 }}>Participant Goals</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 16 }}>Track, manage, and monitor NDIS goal progress across all participants</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {[{ label: 'Active', value: activeCount, icon: Target }, { label: 'Completed', value: completedCount, icon: CheckCircle }, { label: 'On Hold', value: onHoldCount, icon: PauseCircle }, { label: 'Avg Progress', value: `${avgProgress}%`, icon: TrendingUp }].map((pill, i) => (
                <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <pill.icon size={12} style={{ color: 'rgba(255,255,255,0.7)' }} /><span style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>{pill.value}</span><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{pill.label}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowCreate(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
              <Plus size={16} /> Add Goal
            </button>
          </div>
        </div>

        {/* ═══════ STAT CARDS ═══════ */}
        <div style={{ ...stg(1), display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { icon: Target, label: 'Active Goals', value: activeCount, gradient: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, glow: `${c.primary}40` },
            { icon: CheckCircle, label: 'Completed', value: completedCount, gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', glow: 'rgba(59,130,246,0.3)' },
            { icon: PauseCircle, label: 'On Hold', value: onHoldCount, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', glow: 'rgba(245,158,11,0.3)' },
            { icon: TrendingUp, label: 'Avg Progress', value: avgProgress, suffix: '%', gradient: 'linear-gradient(135deg, #10b981, #059669)', glow: 'rgba(16,185,129,0.3)' },
            { icon: Users, label: 'Participants', value: [...new Set(goals.map(g => g.participant_id))].length, gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)', glow: 'rgba(6,182,212,0.3)' },
            { icon: AlertTriangle, label: 'Overdue', value: overdue, gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', glow: 'rgba(239,68,68,0.3)', alert: overdue > 0 },
          ].map((stat, i) => (
            <Glass key={i} dark={isDark} hover glow={stat.glow} style={{ padding: '18px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: stat.gradient, boxShadow: `0 4px 12px -2px ${stat.glow}` }}><stat.icon size={18} style={{ color: 'white' }} /></div>
                {stat.alert && <span style={{ width: 8, height: 8, borderRadius: 4, background: '#ef4444', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />}
              </div>
              <p style={{ fontSize: 26, fontWeight: 900, color: dk.text, lineHeight: 1 }}><AnimNum value={stat.value} suffix={stat.suffix || ''} /></p>
              <p style={{ fontSize: 11, fontWeight: 600, color: dk.textFaint, marginTop: 4 }}>{stat.label}</p>
            </Glass>
          ))}
        </div>

        {/* ═══════ CHARTS ROW ═══════ */}
        <div style={{ ...stg(2), display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
          {progressDistribution.length > 0 && (
            <Glass dark={isDark} style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})` }}><BarChart3 size={13} style={{ color: 'white' }} /></div>
                <p style={{ fontSize: 14, fontWeight: 800, color: dk.text }}>Progress Distribution</p>
              </div>
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={progressDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" nameKey="name" stroke="none">
                    {progressDistribution.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie><Tooltip content={<CT isDark={isDark} />} /></PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                {progressDistribution.map((d, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 4, background: d.color }} /><span style={{ fontSize: 10, color: dk.textMuted }}>{d.name}: {d.value}</span></div>))}
              </div>
            </Glass>
          )}
          {byParticipant.length > 0 && (
            <Glass dark={isDark} style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #10b981, #059669)' }}><Users size={13} style={{ color: 'white' }} /></div>
                <p style={{ fontSize: 14, fontWeight: 800, color: dk.text }}>Progress by Participant</p>
              </div>
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byParticipant}><XAxis dataKey="name" tick={{ fontSize: 10, fill: dk.textFaint }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: dk.textFaint }} axisLine={false} tickLine={false} domain={[0, 100]} /><Tooltip content={<CT isDark={isDark} />} /><Bar dataKey="avgProgress" name="Avg Progress %" radius={[6, 6, 0, 0]}>
                    {byParticipant.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar></BarChart>
                </ResponsiveContainer>
              </div>
            </Glass>
          )}
        </div>

        {/* ═══════ FILTERS ═══════ */}
        <div style={{ ...stg(3), display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <Glass dark={isDark} style={{ padding: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {[{ id: 'all', label: 'All Goals', count: goals.length }, { id: 'active', label: 'Active', count: activeCount }, { id: 'completed', label: 'Completed', count: completedCount }, { id: 'on_hold', label: 'On Hold', count: onHoldCount }].map(f => (
              <button key={f.id} onClick={() => setStatusFilter(f.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all .25s',
                background: statusFilter === f.id ? `linear-gradient(135deg, ${c.primary}, ${c.adminHover})` : 'transparent', color: statusFilter === f.id ? 'white' : dk.textMuted, boxShadow: statusFilter === f.id ? `0 4px 16px -4px ${c.primary}50` : 'none' }}>
                {f.label}{f.count > 0 && <span style={{ padding: '1px 7px', borderRadius: 999, fontSize: 9, fontWeight: 800, background: statusFilter === f.id ? 'rgba(255,255,255,0.25)' : dk.subtleBg2, color: statusFilter === f.id ? 'white' : dk.textFaint }}>{f.count}</span>}
              </button>
            ))}
          </Glass>
          <Glass dark={isDark} style={{ padding: '4px 14px', display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 200px', minWidth: 0 }}>
            <Search size={16} style={{ color: dk.textFaint, flexShrink: 0 }} />
            <input type="text" placeholder="Search goals..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ flex: 1, padding: '8px 0', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, fontWeight: 600, color: dk.text, minWidth: 0 }} />
            {searchQuery && <button onClick={() => setSearchQuery('')} style={{ padding: 4, borderRadius: 6, border: 'none', cursor: 'pointer', background: dk.subtleBg2, color: dk.textFaint }}><X size={12} /></button>}
          </Glass>
          <Glass dark={isDark} style={{ padding: '4px 10px' }}>
            <select value={participantFilter} onChange={e => setParticipantFilter(e.target.value)} style={{ padding: '8px 6px', background: 'transparent', border: 'none', outline: 'none', fontSize: 12, fontWeight: 600, color: dk.text, cursor: 'pointer' }}>
              <option value="all">All Participants</option>
              {participants.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
            </select>
          </Glass>
        </div>

        {/* ═══════ GOALS LIST ═══════ */}
        <div style={stg(4)}>
          <p style={{ fontSize: 12, color: dk.textFaint, marginBottom: 10 }}>{filtered.length} goal{filtered.length !== 1 ? 's' : ''}</p>
          {filtered.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(g => {
                const sc = statusConfig[g.status] || statusConfig.active
                const pName = g.participants ? `${g.participants.first_name} ${g.participants.last_name}` : '—'
                const progress = g.progress || 0
                const pCol = getProgressColor(progress)
                const isOverdue = g.status === 'active' && g.target_date && new Date(g.target_date) < new Date()
                return (
                  <Glass key={g.id} dark={isDark} hover style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '18px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                        {/* Progress ring */}
                        <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
                          <svg width={56} height={56} style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx={28} cy={28} r={22} fill="none" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'} strokeWidth={6} />
                            <circle cx={28} cy={28} r={22} fill="none" stroke={pCol} strokeWidth={6} strokeLinecap="round"
                              strokeDasharray={2 * Math.PI * 22} strokeDashoffset={2 * Math.PI * 22 * (1 - progress / 100)}
                              style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.16,1,.3,1)', filter: `drop-shadow(0 0 4px ${pCol}40)` }} />
                          </svg>
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 13, fontWeight: 900, color: pCol }}>{progress}%</span>
                          </div>
                        </div>
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                            <p style={{ fontSize: 15, fontWeight: 800, color: dk.text }}>{g.title}</p>
                            <Badge color={sc.color} isDark={isDark}>{sc.label}</Badge>
                            {isOverdue && <Badge color="red" isDark={isDark}>Overdue</Badge>}
                          </div>
                          <p style={{ fontSize: 12, color: dk.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Users size={12} /> {pName}
                            {g.target_date && <><Calendar size={11} /> {new Date(g.target_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</>}
                          </p>
                          {g.description && <p style={{ fontSize: 12, color: dk.textFaint, marginTop: 6, lineHeight: 1.5 }}>{g.description.length > 120 ? g.description.substring(0, 120) + '...' : g.description}</p>}
                          {/* Progress bar */}
                          <div style={{ marginTop: 10, height: 8, borderRadius: 999, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${pCol}, ${pCol}cc)`, width: `${progress}%`, transition: 'width 1s cubic-bezier(.16,1,.3,1)', boxShadow: `0 0 8px ${pCol}40` }} />
                          </div>
                        </div>
                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignSelf: 'center' }}>
                          <button onClick={() => setEditGoal({ ...g })} style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${dk.divider}`, background: 'transparent', color: dk.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={e => { e.currentTarget.style.background = isDark ? `${c.primary}15` : `${c.primary}08`; e.currentTarget.style.color = c.primary }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = dk.textMuted }}>
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(g.id)} style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${dk.divider}`, background: 'transparent', color: dk.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)'; e.currentTarget.style.color = '#ef4444' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = dk.textMuted }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      {/* Quick progress buttons */}
                      <div style={{ display: 'flex', gap: 6, marginTop: 12, paddingLeft: 70 }}>
                        {[0, 25, 50, 75, 100].map(v => (
                          <button key={v} onClick={() => handleProgressChange(g, v)} style={{ padding: '4px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, transition: 'all .2s',
                            background: progress === v ? `${getProgressColor(v)}20` : dk.subtleBg, color: progress === v ? getProgressColor(v) : dk.textFaint }}>
                            {v}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </Glass>
                )
              })}
            </div>
          ) : (
            <Glass dark={isDark} style={{ padding: '50px 24px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 18, margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${c.primary}20, ${c.adminHover}15)` }}><Target size={24} style={{ color: c.primary }} /></div>
              <p style={{ fontSize: 15, fontWeight: 800, color: dk.text }}>{searchQuery || statusFilter !== 'all' ? 'No matching goals' : 'No goals yet'}</p>
              <p style={{ fontSize: 12, color: dk.textFaint, marginTop: 4 }}>{searchQuery || statusFilter !== 'all' ? 'Try different filters' : 'Add goals to track participant progress'}</p>
              {!searchQuery && statusFilter === 'all' && <button onClick={() => setShowCreate(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14, padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, color: 'white', fontSize: 13, fontWeight: 700 }}><Plus size={14} /> Add Goal</button>}
            </Glass>
          )}
        </div>
      </div>

      {/* ═══════ CREATE MODAL ═══════ */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="" wide>
        <div>
          <div style={{ margin: '-24px -24px 0', marginBottom: 0 }}>
            <div style={{ background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover}, #3b82f6)`, padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}><Target size={20} style={{ color: 'white' }} /></div>
                <div><h3 style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>Add New Goal</h3><p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Set an NDIS goal for a participant</p></div>
              </div>
            </div>
          </div>
          <div style={{ padding: '20px 0 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6 }}>Participant *</p>
              <select value={newGoal.participant_id} onChange={e => setNewGoal({ ...newGoal, participant_id: e.target.value })} style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = c.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${c.primary}15` }}
                onBlur={e => { e.currentTarget.style.borderColor = dk.inputBorder; e.currentTarget.style.boxShadow = 'none' }}>
                <option value="">Select participant...</option>
                {participants.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
              </select>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6 }}>Goal Title *</p>
              <input type="text" value={newGoal.title} onChange={e => setNewGoal({ ...newGoal, title: e.target.value })} placeholder="e.g. Independent grocery shopping" style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = c.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${c.primary}15` }}
                onBlur={e => { e.currentTarget.style.borderColor = dk.inputBorder; e.currentTarget.style.boxShadow = 'none' }} />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6 }}>Description</p>
              <textarea value={newGoal.description} onChange={e => setNewGoal({ ...newGoal, description: e.target.value })} placeholder="Describe the goal, success criteria, and support needed..." rows={3}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }}
                onFocus={e => { e.currentTarget.style.borderColor = c.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${c.primary}15` }}
                onBlur={e => { e.currentTarget.style.borderColor = dk.inputBorder; e.currentTarget.style.boxShadow = 'none' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6 }}>Target Date</p>
                <input type="date" value={newGoal.target_date} onChange={e => setNewGoal({ ...newGoal, target_date: e.target.value })} style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = c.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${c.primary}15` }}
                  onBlur={e => { e.currentTarget.style.borderColor = dk.inputBorder; e.currentTarget.style.boxShadow = 'none' }} />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6 }}>Initial Progress</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="range" min={0} max={100} step={5} value={newGoal.progress} onChange={e => setNewGoal({ ...newGoal, progress: parseInt(e.target.value) })} style={{ flex: 1, accentColor: c.primary }} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: getProgressColor(newGoal.progress), minWidth: 40, textAlign: 'right' }}>{newGoal.progress}%</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button onClick={() => setShowCreate(false)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '14px 20px', borderRadius: 14, border: `1.5px solid ${dk.divider}`, background: 'transparent', color: dk.text, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreate} disabled={saving} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 20px', borderRadius: 14, border: 'none', cursor: saving ? 'default' : 'pointer', background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, color: 'white', fontSize: 13, fontWeight: 800, opacity: saving ? 0.6 : 1, boxShadow: `0 4px 16px -4px ${c.primary}50` }}>
                {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</> : <><Target size={16} /> Create Goal</>}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ═══════ EDIT MODAL ═══════ */}
      <Modal isOpen={!!editGoal} onClose={() => setEditGoal(null)} title="" wide>
        {editGoal && (
          <div>
            <div style={{ margin: '-24px -24px 0', marginBottom: 0 }}>
              <div style={{ background: statusConfig[editGoal.status]?.gradient || `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, padding: '24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}><Edit2 size={20} style={{ color: 'white' }} /></div>
                  <div><h3 style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>Edit Goal</h3><p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{editGoal.participants ? `${editGoal.participants.first_name} ${editGoal.participants.last_name}` : 'Participant'}</p></div>
                </div>
              </div>
            </div>
            <div style={{ padding: '20px 0 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6 }}>Goal Title *</p>
                <input type="text" value={editGoal.title} onChange={e => setEditGoal({ ...editGoal, title: e.target.value })} style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = c.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${c.primary}15` }}
                  onBlur={e => { e.currentTarget.style.borderColor = dk.inputBorder; e.currentTarget.style.boxShadow = 'none' }} />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6 }}>Description</p>
                <textarea value={editGoal.description || ''} onChange={e => setEditGoal({ ...editGoal, description: e.target.value })} rows={3}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }}
                  onFocus={e => { e.currentTarget.style.borderColor = c.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${c.primary}15` }}
                  onBlur={e => { e.currentTarget.style.borderColor = dk.inputBorder; e.currentTarget.style.boxShadow = 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6 }}>Status</p>
                  <select value={editGoal.status} onChange={e => setEditGoal({ ...editGoal, status: e.target.value })} style={inputStyle}>
                    <option value="active">Active</option><option value="completed">Completed</option><option value="on_hold">On Hold</option>
                  </select>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6 }}>Target Date</p>
                  <input type="date" value={editGoal.target_date || ''} onChange={e => setEditGoal({ ...editGoal, target_date: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6 }}>Progress: <span style={{ color: getProgressColor(editGoal.progress || 0), fontWeight: 800 }}>{editGoal.progress || 0}%</span></p>
                <input type="range" min={0} max={100} step={5} value={editGoal.progress || 0} onChange={e => setEditGoal({ ...editGoal, progress: parseInt(e.target.value) })} style={{ width: '100%', accentColor: getProgressColor(editGoal.progress || 0) }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  {[0, 25, 50, 75, 100].map(v => <span key={v} style={{ fontSize: 9, color: dk.textFaint, cursor: 'pointer' }} onClick={() => setEditGoal({ ...editGoal, progress: v })}>{v}%</span>)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button onClick={() => setEditGoal(null)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '14px 20px', borderRadius: 14, border: `1.5px solid ${dk.divider}`, background: 'transparent', color: dk.text, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleUpdate} disabled={saving} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 20px', borderRadius: 14, border: 'none', cursor: saving ? 'default' : 'pointer', background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, color: 'white', fontSize: 13, fontWeight: 800, opacity: saving ? 0.6 : 1, boxShadow: `0 4px 16px -4px ${c.primary}50` }}>
                  {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Save size={16} /> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}