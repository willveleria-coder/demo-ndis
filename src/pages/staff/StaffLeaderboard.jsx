import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Trophy, Medal, Crown, Star, Flame, Clock, CheckCircle, FileText,
  TrendingUp, Users, Award, Target, Zap, Heart, Shield, ChevronRight,
  Calendar, Activity, Loader2, ArrowUp, ArrowDown, Minus
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { supabase } from '../../lib/supabase'
import { useStaff } from '../../context/StaffContext'
import { useBrandColors } from '../../hooks/useBrandColors'
import { useTheme } from '../../context/ThemeContext'

/* ═══════════════════════════════════════════════
   DESIGN SYSTEM
   ═══════════════════════════════════════════════ */
function Glass({children,className='',glow,style={},hover=false,isDark=false,onClick,...p}){const base=isDark?'rgba(30,41,59,0.6)':'rgba(255,255,255,0.55)';const border=isDark?'rgba(51,65,85,0.4)':'rgba(255,255,255,0.7)';return<div className={className} onClick={onClick} style={{background:base,backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',border:`1px solid ${border}`,borderRadius:'1.25rem',boxShadow:glow?`0 8px 32px -8px ${glow}`:'0 4px 24px -4px rgba(0,0,0,0.06)',transition:hover?'all .3s cubic-bezier(.16,1,.3,1)':undefined,cursor:hover||onClick?'pointer':undefined,...style}} onMouseEnter={hover?e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=glow?`0 16px 48px -8px ${glow}`:'0 12px 40px -8px rgba(0,0,0,0.12)'}:undefined} onMouseLeave={hover?e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=glow?`0 8px 32px -8px ${glow}`:'0 4px 24px -4px rgba(0,0,0,0.06)'}:undefined} {...p}>{children}</div>}
function Orb({color,size=200,top,left,right,bottom,delay=0}){return<div style={{position:'absolute',width:size,height:size,top,left,right,bottom,background:`radial-gradient(circle,${color} 0%,transparent 70%)`,opacity:0.12,borderRadius:'50%',animation:`orbFloat ${6+delay}s ease-in-out ${delay}s infinite`,pointerEvents:'none',zIndex:0}}/>}
function AnimNum({value,duration=1200,suffix=''}){const[display,setDisplay]=useState(0);const frameRef=useRef();useEffect(()=>{const num=typeof value==='number'?value:parseFloat(value)||0;const start=performance.now();function tick(now){const p=Math.min((now-start)/duration,1);setDisplay(Math.round(num*(1-Math.pow(1-p,3))*10)/10);if(p<1)frameRef.current=requestAnimationFrame(tick)}frameRef.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frameRef.current)},[value,duration]);const isInt=Number.isInteger(typeof value==='number'?value:parseFloat(value));return<>{isInt?Math.round(display):display.toFixed(1)}{suffix}</>}
function Badge({children,color='gray',isDark}){const palettes={gray:isDark?{bg:'rgba(100,116,139,0.2)',text:'#94a3b8',border:'rgba(100,116,139,0.3)'}:{bg:'#f1f5f9',text:'#64748b',border:'#e2e8f0'},green:isDark?{bg:'rgba(16,185,129,0.15)',text:'#34d399',border:'rgba(16,185,129,0.3)'}:{bg:'#ecfdf5',text:'#059669',border:'#a7f3d0'},amber:isDark?{bg:'rgba(245,158,11,0.15)',text:'#fbbf24',border:'rgba(245,158,11,0.3)'}:{bg:'#fffbeb',text:'#d97706',border:'#fde68a'},red:isDark?{bg:'rgba(239,68,68,0.15)',text:'#f87171',border:'rgba(239,68,68,0.3)'}:{bg:'#fef2f2',text:'#dc2626',border:'#fecaca'},blue:isDark?{bg:'rgba(59,130,246,0.15)',text:'#60a5fa',border:'rgba(59,130,246,0.3)'}:{bg:'#eff6ff',text:'#2563eb',border:'#bfdbfe'},purple:isDark?{bg:'rgba(139,92,246,0.15)',text:'#a78bfa',border:'rgba(139,92,246,0.3)'}:{bg:'#f5f3ff',text:'#7c3aed',border:'#ddd6fe'},orange:isDark?{bg:'rgba(249,115,22,0.15)',text:'#fb923c',border:'rgba(249,115,22,0.3)'}:{bg:'#fff7ed',text:'#ea580c',border:'#fed7aa'},teal:isDark?{bg:'rgba(20,184,166,0.15)',text:'#2dd4bf',border:'rgba(20,184,166,0.3)'}:{bg:'#f0fdfa',text:'#0d9488',border:'#99f6e4'}};const pl=palettes[color]||palettes.gray;return<span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',fontSize:10,fontWeight:700,letterSpacing:'0.02em',borderRadius:999,background:pl.bg,color:pl.text,border:`1px solid ${pl.border}`,whiteSpace:'nowrap'}}>{children}</span>}
function CT({active,payload,label,isDark}){if(!active||!payload?.length)return null;return<div style={{background:isDark?'rgba(30,41,59,0.95)':'rgba(255,255,255,0.95)',backdropFilter:'blur(12px)',border:`1px solid ${isDark?'rgba(51,65,85,0.5)':'rgba(0,0,0,0.08)'}`,borderRadius:12,padding:'10px 14px',boxShadow:'0 8px 32px -4px rgba(0,0,0,0.15)'}}>{label&&<p style={{fontSize:11,fontWeight:700,color:isDark?'#e2e8f0':'#1f2937',marginBottom:4}}>{label}</p>}{payload.map((p,i)=><p key={i} style={{fontSize:11,color:isDark?'#94a3b8':'#6b7280'}}><span style={{display:'inline-block',width:8,height:8,borderRadius:4,background:p.color||'#3b82f6',marginRight:6}}/>{p.name}: <span style={{fontWeight:700,color:isDark?'#e2e8f0':'#1f2937'}}>{p.value}</span></p>)}</div>}

const PODIUM_COLORS = ['linear-gradient(135deg, #f59e0b, #f97316)', 'linear-gradient(135deg, #94a3b8, #64748b)', 'linear-gradient(135deg, #cd7f32, #a0522d)']
const PODIUM_ICONS = [Crown, Medal, Award]
const RANK_COLORS = ['#f59e0b', '#94a3b8', '#cd7f32']
const CHART_COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#14b8a6']

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function StaffLeaderboard() {
  const navigate = useNavigate()
  const { staffProfile } = useStaff()
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [staffList, setStaffList] = useState([])
  const [shifts, setShifts] = useState([])
  const [notes, setNotes] = useState([])
  const [timePeriod, setTimePeriod] = useState('month')
  const [sortBy, setSortBy] = useState('score')
  const [activeTab, setActiveTab] = useState('leaderboard')

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

  /* ─── data fetch ─── */
  useEffect(() => {
    async function load() {
      try {
        const now = new Date()
        let startDate
        if (timePeriod === 'week') { startDate = new Date(now); startDate.setDate(now.getDate() - now.getDay() + 1); startDate.setHours(0, 0, 0, 0) }
        else if (timePeriod === 'month') { startDate = new Date(now.getFullYear(), now.getMonth(), 1) }
        else { startDate = new Date(now.getFullYear(), 0, 1) }
        const startStr = startDate.toISOString().split('T')[0]

        const [staffRes, shiftsRes, notesRes] = await Promise.all([
          supabase.from('staff').select('id, first_name, last_name, status, role, position').eq('status', 'active'),
          supabase.from('shifts').select('id, staff_id, shift_date, clock_in, clock_out, status, participant_id').gte('shift_date', startStr).eq('status', 'completed'),
          supabase.from('shift_notes').select('id, staff_id, shift_id, created_at').gte('created_at', startDate.toISOString()),
        ])
        setStaffList((staffRes.data || []).filter(s => s.role !== 'admin'))
        setShifts(shiftsRes.data || [])
        setNotes(notesRes.data || [])
      } catch (err) { console.error('Leaderboard load error:', err) }
      finally { setLoading(false) }
    }
    load()
  }, [timePeriod])

  /* ─── compute rankings ─── */
  const rankings = useMemo(() => {
    return staffList.map(staff => {
      const staffShifts = shifts.filter(s => s.staff_id === staff.id)
      const staffNotes = notes.filter(n => n.staff_id === staff.id)
      const totalShifts = staffShifts.length
      const totalHours = staffShifts.reduce((a, s) => s.clock_in && s.clock_out ? a + (new Date(s.clock_out) - new Date(s.clock_in)) / 3600000 : a, 0)
      const noteCompletion = totalShifts === 0 ? 100 : Math.round((staffNotes.length / totalShifts) * 100)
      const uniqueParticipants = [...new Set(staffShifts.map(s => s.participant_id).filter(Boolean))].length

      // Streak calculation
      let streak = 0
      const sorted = [...staffShifts].sort((a, b) => new Date(b.shift_date) - new Date(a.shift_date))
      const today = new Date(); today.setHours(0, 0, 0, 0)
      for (let i = 0; i < sorted.length; i++) {
        const d = new Date(sorted[i].shift_date); d.setHours(0, 0, 0, 0)
        const expected = new Date(today); expected.setDate(expected.getDate() - i)
        if (d.getTime() === expected.getTime()) streak++; else break
      }

      // Avg hours per shift
      const avgHoursPerShift = totalShifts > 0 ? totalHours / totalShifts : 0

      // Score: weighted formula
      const score = Math.round(
        (totalShifts * 10) +
        (totalHours * 5) +
        (Math.min(noteCompletion, 100) * 2) +
        (streak * 15) +
        (uniqueParticipants * 8)
      )

      // Badges earned
      const badges = []
      if (totalShifts >= 20) badges.push({ label: 'Shift Machine', icon: Zap, color: '#f59e0b' })
      if (totalHours >= 80) badges.push({ label: 'Hour Hero', icon: Clock, color: '#3b82f6' })
      if (noteCompletion === 100 && totalShifts > 0) badges.push({ label: 'Perfect Notes', icon: FileText, color: '#10b981' })
      if (streak >= 5) badges.push({ label: 'On Fire', icon: Flame, color: '#ef4444' })
      if (uniqueParticipants >= 5) badges.push({ label: 'Team Player', icon: Heart, color: '#ec4899' })
      if (totalShifts >= 50) badges.push({ label: 'Veteran', icon: Shield, color: '#8b5cf6' })

      return {
        ...staff,
        totalShifts, totalHours, noteCompletion, streak, uniqueParticipants, avgHoursPerShift, score, badges,
        initials: `${staff.first_name?.[0] || ''}${staff.last_name?.[0] || ''}`,
        name: `${staff.first_name} ${staff.last_name}`,
        isMe: staff.id === staffProfile?.id,
      }
    }).sort((a, b) => sortBy === 'score' ? b.score - a.score : sortBy === 'hours' ? b.totalHours - a.totalHours : sortBy === 'shifts' ? b.totalShifts - a.totalShifts : sortBy === 'notes' ? b.noteCompletion - a.noteCompletion : b.streak - a.streak)
      .map((s, i) => ({ ...s, rank: i + 1 }))
  }, [staffList, shifts, notes, sortBy, staffProfile?.id])

  const myRanking = rankings.find(r => r.isMe)
  const top3 = rankings.slice(0, 3)
  const chartData = rankings.slice(0, 8).map(r => ({ name: r.first_name, hours: Math.round(r.totalHours * 10) / 10, shifts: r.totalShifts, score: r.score }))
  const categoryData = [
    { name: 'Shifts', value: rankings.reduce((a, r) => a + r.totalShifts, 0) },
    { name: 'Hours', value: Math.round(rankings.reduce((a, r) => a + r.totalHours, 0)) },
    { name: 'Notes', value: notes.length },
  ].filter(d => d.value > 0)

  /* ─── loading ─── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` }}>
          <Trophy size={22} style={{ color: 'white' }} />
        </div>
        <div style={{ position: 'absolute', inset: -4, borderRadius: 18, border: `2px solid ${c.staff}`, opacity: 0.3, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: dk.textMuted }}>Loading leaderboard...</p>
    </div>
  )

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <style>{`
        @keyframes orbFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-15px) scale(1.03)}}
        @keyframes ping{75%,100%{transform:scale(1.8);opacity:0}}
        @keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes countUp{from{opacity:0;transform:translateY(8px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes podiumRise{from{transform:scaleY(0);transform-origin:bottom}to{transform:scaleY(1);transform-origin:bottom}}
        @keyframes crownBounce{0%,100%{transform:translateY(0) rotate(-5deg)}50%{transform:translateY(-4px) rotate(5deg)}}
        .count-up{animation:countUp .7s cubic-bezier(.16,1,.3,1) forwards}
      `}</style>
      <Orb color="#f59e0b" size={300} top="-100px" right="-80px" delay={0} />
      <Orb color={c.staff} size={220} bottom="5%" left="-60px" delay={2} />
      <Orb color="#8b5cf6" size={180} top="35%" right="10%" delay={4} />
      <Orb color="#ef4444" size={160} bottom="-40px" left="30%" delay={1} />
      <Orb color="#10b981" size={150} top="15%" left="15%" delay={3} />

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
                <Trophy size={12} /> LEADERBOARD
              </span>
              {myRanking && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)', fontSize: 10, fontWeight: 700, color: 'white' }}>
                  <Star size={10} /> YOU'RE #{myRanking.rank}
                </span>
              )}
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', lineHeight: 1.2, marginBottom: 4 }}>Staff Leaderboard</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 16 }}>
              {rankings.length} team member{rankings.length !== 1 ? 's' : ''} competing — who's on top this {timePeriod}?
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {[
                { label: 'Competitors', value: rankings.length, icon: Users },
                { label: 'Total Shifts', value: shifts.length, icon: Calendar },
                { label: 'Total Hours', value: `${Math.round(rankings.reduce((a, r) => a + r.totalHours, 0))}h`, icon: Clock },
                { label: 'Top Score', value: top3[0]?.score || 0, icon: Trophy },
              ].map((pill, i) => (
                <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <pill.icon size={12} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>{pill.value}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{pill.label}</span>
                </div>
              ))}
            </div>
            {/* Time period selector in hero */}
            <div style={{ display: 'flex', gap: 6 }}>
              {['week', 'month', 'year'].map(p => (
                <button key={p} onClick={() => { setTimePeriod(p); setLoading(true) }}
                  style={{ padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all .2s',
                    background: timePeriod === p ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                    color: 'white', backdropFilter: 'blur(8px)' }}>
                  This {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════ MY RANKING CARD ═══════ */}
        {myRanking && (
          <Glass isDark={isDark} glow={`${c.staff}25`} style={{ ...stg(1), padding: 20, marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.04, background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 56, height: 56, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, fontSize: 20, fontWeight: 900, color: 'white', boxShadow: `0 6px 20px -4px ${c.staff}50` }}>
                  {myRanking.initials}
                </div>
                <div style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: myRanking.rank <= 3 ? PODIUM_COLORS[myRanking.rank - 1] : 'linear-gradient(135deg, #64748b, #475569)', fontSize: 10, fontWeight: 900, color: 'white', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
                  #{myRanking.rank}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: c.staff, marginBottom: 2 }}>Your Ranking</p>
                <p style={{ fontSize: 18, fontWeight: 900, color: dk.text }}>{myRanking.name}</p>
                <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>
                  {myRanking.totalShifts} shifts · {myRanking.totalHours.toFixed(1)}h · {myRanking.noteCompletion}% notes · {myRanking.streak}d streak
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 32, fontWeight: 900, color: dk.text }}><AnimNum value={myRanking.score} /></p>
                <p style={{ fontSize: 10, fontWeight: 700, color: dk.textFaint, textTransform: 'uppercase' }}>Score</p>
              </div>
            </div>
            {myRanking.badges.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                {myRanking.badges.map((b, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: isDark ? `${b.color}20` : `${b.color}10`, border: `1px solid ${b.color}30`, fontSize: 10, fontWeight: 700, color: b.color }}>
                    <b.icon size={10} /> {b.label}
                  </span>
                ))}
              </div>
            )}
          </Glass>
        )}

        {/* ═══════ TABS ═══════ */}
        <Glass isDark={isDark} style={{ ...stg(2), padding: 6, marginBottom: 20, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {[
            { id: 'leaderboard', label: 'Rankings', icon: Trophy },
            { id: 'podium', label: 'Podium', icon: Crown },
            { id: 'stats', label: 'Stats', icon: TrendingUp },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', borderRadius: 14, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all .25s cubic-bezier(.16,1,.3,1)',
                background: activeTab === tab.id ? `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` : 'transparent',
                color: activeTab === tab.id ? 'white' : dk.textMuted,
                boxShadow: activeTab === tab.id ? `0 4px 16px -4px ${c.staff}50` : 'none' }}>
              <tab.icon size={15} /> {tab.label}
            </button>
          ))}
        </Glass>

        {/* ═══════ RANKINGS TAB ═══════ */}
        {activeTab === 'leaderboard' && (
          <div style={stg(3)}>
            {/* Sort options */}
            <Glass isDark={isDark} style={{ padding: 6, marginBottom: 16, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {[
                { id: 'score', label: 'Overall Score' },
                { id: 'hours', label: 'Hours' },
                { id: 'shifts', label: 'Shifts' },
                { id: 'notes', label: 'Note Compliance' },
                { id: 'streak', label: 'Streak' },
              ].map(s => (
                <button key={s.id} onClick={() => setSortBy(s.id)}
                  style={{ padding: '7px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, transition: 'all .2s',
                    background: sortBy === s.id ? (isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.1)') : 'transparent',
                    color: sortBy === s.id ? '#f59e0b' : dk.textFaint }}>
                  {s.label}
                </button>
              ))}
            </Glass>

            <p style={{ fontSize: 12, color: dk.textFaint, marginBottom: 10 }}>{rankings.length} team member{rankings.length !== 1 ? 's' : ''} · Sorted by {sortBy}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rankings.map((r, idx) => {
                const isTop3 = r.rank <= 3
                const RankIcon = isTop3 ? PODIUM_ICONS[r.rank - 1] : null
                return (
                  <Glass key={r.id} isDark={isDark} hover
                    glow={isTop3 ? `${RANK_COLORS[r.rank - 1]}30` : r.isMe ? `${c.staff}20` : undefined}
                    style={{
                      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
                      borderLeft: isTop3 ? `4px solid ${RANK_COLORS[r.rank - 1]}` : r.isMe ? `4px solid ${c.staff}` : undefined,
                      background: r.isMe ? (isDark ? `${c.staff}08` : `${c.staff}04`) : undefined,
                    }}>
                    {/* Rank */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      background: isTop3 ? PODIUM_COLORS[r.rank - 1] : dk.subtleBg2,
                      boxShadow: isTop3 ? `0 4px 12px -2px ${RANK_COLORS[r.rank - 1]}50` : 'none',
                      fontSize: isTop3 ? 14 : 13, fontWeight: 900, color: isTop3 ? 'white' : dk.textFaint,
                    }}>
                      {isTop3 ? <RankIcon size={16} /> : `#${r.rank}`}
                    </div>
                    {/* Avatar */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      background: r.isMe ? `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` : `linear-gradient(135deg, ${CHART_COLORS[idx % CHART_COLORS.length]}60, ${CHART_COLORS[idx % CHART_COLORS.length]}30)`,
                      fontSize: 13, fontWeight: 800,
                      color: r.isMe ? 'white' : CHART_COLORS[idx % CHART_COLORS.length],
                    }}>
                      {r.initials}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: dk.text }}>{r.name}</p>
                        {r.isMe && <Badge color="blue" isDark={isDark}>You</Badge>}
                        {r.rank === 1 && <Badge color="amber" isDark={isDark}>Leader</Badge>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, color: dk.textFaint }}>{r.totalShifts} shifts</span>
                        <span style={{ fontSize: 10, color: dk.textFaint }}>{r.totalHours.toFixed(1)}h</span>
                        <span style={{ fontSize: 10, color: r.noteCompletion === 100 ? '#10b981' : r.noteCompletion >= 80 ? '#f59e0b' : '#ef4444' }}>{r.noteCompletion}% notes</span>
                        {r.streak > 0 && <span style={{ fontSize: 10, color: '#f97316', display: 'flex', alignItems: 'center', gap: 2 }}><Flame size={9} /> {r.streak}d</span>}
                      </div>
                      {r.badges.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                          {r.badges.slice(0, 3).map((b, i) => (
                            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 999, fontSize: 9, fontWeight: 700, background: isDark ? `${b.color}15` : `${b.color}08`, color: b.color }}>
                              <b.icon size={8} /> {b.label}
                            </span>
                          ))}
                          {r.badges.length > 3 && <span style={{ fontSize: 9, color: dk.textFaint }}>+{r.badges.length - 3}</span>}
                        </div>
                      )}
                    </div>
                    {/* Score */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 20, fontWeight: 900, color: isTop3 ? RANK_COLORS[r.rank - 1] : dk.text }}>{r.score}</p>
                      <p style={{ fontSize: 9, fontWeight: 700, color: dk.textFaint, textTransform: 'uppercase' }}>pts</p>
                    </div>
                  </Glass>
                )
              })}
              {rankings.length === 0 && (
                <Glass isDark={isDark} style={{ padding: '50px 24px', textAlign: 'center' }}>
                  <Trophy size={40} style={{ color: dk.textFaint, margin: '0 auto 12px' }} />
                  <p style={{ fontSize: 15, fontWeight: 800, color: dk.text }}>No rankings yet</p>
                  <p style={{ fontSize: 12, color: dk.textFaint, marginTop: 4 }}>Complete shifts to start earning points!</p>
                </Glass>
              )}
            </div>
          </div>
        )}

        {/* ═══════ PODIUM TAB ═══════ */}
        {activeTab === 'podium' && (
          <div style={stg(3)}>
            {top3.length >= 3 ? (
              <Glass isDark={isDark} style={{ padding: '30px 20px', marginBottom: 20 }}>
                {/* Podium visualization */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
                  {/* 2nd place */}
                  <div style={{ textAlign: 'center', flex: '0 0 auto' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 16, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: PODIUM_COLORS[1], fontSize: 18, fontWeight: 900, color: 'white', boxShadow: `0 6px 20px -4px ${RANK_COLORS[1]}50` }}>
                      {top3[1].initials}
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 800, color: dk.text, marginBottom: 2 }}>{top3[1].first_name}</p>
                    <p style={{ fontSize: 10, color: dk.textFaint }}>{top3[1].score} pts</p>
                    <div style={{ width: 80, height: 90, borderRadius: '12px 12px 0 0', background: PODIUM_COLORS[1], marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'podiumRise 0.8s cubic-bezier(.16,1,.3,1) forwards', animationDelay: '0.2s' }}>
                      <Medal size={20} style={{ color: 'white' }} />
                      <p style={{ fontSize: 18, fontWeight: 900, color: 'white', marginTop: 4 }}>2nd</p>
                    </div>
                  </div>
                  {/* 1st place */}
                  <div style={{ textAlign: 'center', flex: '0 0 auto' }}>
                    <div style={{ animation: 'crownBounce 2s ease-in-out infinite', margin: '0 auto 4px' }}>
                      <Crown size={24} style={{ color: '#f59e0b' }} />
                    </div>
                    <div style={{ width: 64, height: 64, borderRadius: 20, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: PODIUM_COLORS[0], fontSize: 22, fontWeight: 900, color: 'white', boxShadow: `0 8px 24px -4px ${RANK_COLORS[0]}60`, border: '3px solid rgba(255,255,255,0.3)' }}>
                      {top3[0].initials}
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 900, color: dk.text, marginBottom: 2 }}>{top3[0].first_name}</p>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>{top3[0].score} pts</p>
                    <div style={{ width: 90, height: 120, borderRadius: '12px 12px 0 0', background: PODIUM_COLORS[0], marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'podiumRise 0.8s cubic-bezier(.16,1,.3,1) forwards', boxShadow: `0 4px 20px -4px ${RANK_COLORS[0]}40` }}>
                      <Trophy size={24} style={{ color: 'white' }} />
                      <p style={{ fontSize: 20, fontWeight: 900, color: 'white', marginTop: 4 }}>1st</p>
                    </div>
                  </div>
                  {/* 3rd place */}
                  <div style={{ textAlign: 'center', flex: '0 0 auto' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: PODIUM_COLORS[2], fontSize: 16, fontWeight: 900, color: 'white', boxShadow: `0 6px 20px -4px ${RANK_COLORS[2]}50` }}>
                      {top3[2].initials}
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 800, color: dk.text, marginBottom: 2 }}>{top3[2].first_name}</p>
                    <p style={{ fontSize: 10, color: dk.textFaint }}>{top3[2].score} pts</p>
                    <div style={{ width: 74, height: 70, borderRadius: '12px 12px 0 0', background: PODIUM_COLORS[2], marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'podiumRise 0.8s cubic-bezier(.16,1,.3,1) forwards', animationDelay: '0.4s' }}>
                      <Award size={18} style={{ color: 'white' }} />
                      <p style={{ fontSize: 16, fontWeight: 900, color: 'white', marginTop: 4 }}>3rd</p>
                    </div>
                  </div>
                </div>

                {/* Top 3 detail cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
                  {top3.map((r, i) => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.divider}` }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: PODIUM_COLORS[i], flexShrink: 0 }}>
                        {React.createElement(PODIUM_ICONS[i], { size: 14, style: { color: 'white' } })}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: dk.text }}>{r.name} {r.isMe ? '(You)' : ''}</p>
                        <p style={{ fontSize: 10, color: dk.textFaint }}>{r.totalShifts} shifts · {r.totalHours.toFixed(1)}h · {r.noteCompletion}% notes</p>
                      </div>
                      <p style={{ fontSize: 18, fontWeight: 900, color: RANK_COLORS[i] }}>{r.score}</p>
                    </div>
                  ))}
                </div>
              </Glass>
            ) : (
              <Glass isDark={isDark} style={{ padding: '50px 24px', textAlign: 'center' }}>
                <Crown size={40} style={{ color: dk.textFaint, margin: '0 auto 12px' }} />
                <p style={{ fontSize: 15, fontWeight: 800, color: dk.text }}>Need at least 3 team members</p>
                <p style={{ fontSize: 12, color: dk.textFaint, marginTop: 4 }}>The podium will appear once there are enough competitors</p>
              </Glass>
            )}

            {/* Badge legend */}
            <Glass isDark={isDark} style={{ padding: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: dk.text, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Star size={16} style={{ color: '#f59e0b' }} /> Achievement Badges
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                {[
                  { label: 'Shift Machine', desc: '20+ shifts', icon: Zap, color: '#f59e0b' },
                  { label: 'Hour Hero', desc: '80+ hours', icon: Clock, color: '#3b82f6' },
                  { label: 'Perfect Notes', desc: '100% completion', icon: FileText, color: '#10b981' },
                  { label: 'On Fire', desc: '5+ day streak', icon: Flame, color: '#ef4444' },
                  { label: 'Team Player', desc: '5+ participants', icon: Heart, color: '#ec4899' },
                  { label: 'Veteran', desc: '50+ shifts', icon: Shield, color: '#8b5cf6' },
                ].map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: isDark ? `${b.color}08` : `${b.color}05`, border: `1px solid ${b.color}20` }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${b.color}20` }}>
                      <b.icon size={14} style={{ color: b.color }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: b.color }}>{b.label}</p>
                      <p style={{ fontSize: 9, color: dk.textFaint }}>{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Glass>
          </div>
        )}

        {/* ═══════ STATS TAB ═══════ */}
        {activeTab === 'stats' && (
          <div style={{ ...stg(3), display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Hours chart */}
            <Glass isDark={isDark} style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
                  <TrendingUp size={13} style={{ color: 'white' }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 800, color: dk.text }}>Hours by Staff</p>
              </div>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: dk.textFaint }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: dk.textFaint }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CT isDark={isDark} />} />
                    <Bar dataKey="hours" name="Hours" radius={[6, 6, 0, 0]}>
                      {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Glass>

            {/* Score chart */}
            <Glass isDark={isDark} style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` }}>
                  <Trophy size={13} style={{ color: 'white' }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 800, color: dk.text }}>Scores by Staff</p>
              </div>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: dk.textFaint }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: dk.textFaint }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CT isDark={isDark} />} />
                    <Bar dataKey="score" name="Score" radius={[6, 6, 0, 0]}>
                      {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Glass>

            {/* Team summary donut */}
            {categoryData.length > 0 && (
              <Glass isDark={isDark} style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
                    <Activity size={13} style={{ color: 'white' }} />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: dk.text }}>Team Activity Summary</p>
                </div>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" nameKey="name" stroke="none">
                        {categoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CT isDark={isDark} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
                  {categoryData.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: CHART_COLORS[i] }} />
                      <span style={{ fontSize: 11, color: dk.textMuted }}>{d.name}: <span style={{ fontWeight: 700, color: dk.text }}>{d.value}</span></span>
                    </div>
                  ))}
                </div>
              </Glass>
            )}

            {/* Scoring breakdown */}
            <Glass isDark={isDark} style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  <Target size={13} style={{ color: 'white' }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 800, color: dk.text }}>How Scoring Works</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Completed Shifts', points: '10 pts each', color: '#3b82f6' },
                  { label: 'Hours Worked', points: '5 pts per hour', color: '#06b6d4' },
                  { label: 'Note Completion %', points: '2 pts per %', color: '#10b981' },
                  { label: 'Day Streak', points: '15 pts per day', color: '#f97316' },
                  { label: 'Unique Participants', points: '8 pts each', color: '#8b5cf6' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10, background: dk.subtleBg }}>
                    <span style={{ fontSize: 12, color: dk.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 3, background: item.color }} />
                      {item.label}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: item.color }}>{item.points}</span>
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