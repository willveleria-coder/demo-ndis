import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, FileText, AlertTriangle, CheckCircle2, Clock, Search, X,
  ChevronRight, Filter, Smile, Activity, Target, AlertCircle, MessageSquare,
  ArrowRight, Loader2, CheckCircle, Eye, Sparkles, Shield, Heart, Brain
} from 'lucide-react'
import { useStaff } from '../../context/StaffContext'
import { useBrandColors } from '../../hooks/useBrandColors'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'
import Modal from '../../components/ui/Modal'

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */
function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso), today = new Date(), tomorrow = new Date(today), yesterday = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1); yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}
function formatTime(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
}

const NOTE_SECTIONS = [
  { key: 'mood', label: "Participant's Mood & Wellbeing", placeholder: 'Describe mood, energy, emotional state...', icon: Smile, gradient: 'linear-gradient(135deg, #f59e0b, #f97316)', color: '#f59e0b' },
  { key: 'activities', label: 'Activities Completed', placeholder: 'List activities, tasks, engagement...', icon: Activity, gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)', color: '#3b82f6' },
  { key: 'goals_progress', label: 'Progress Toward Goals', placeholder: 'Note progress toward NDIS plan goals...', icon: Target, gradient: 'linear-gradient(135deg, #10b981, #059669)', color: '#10b981' },
  { key: 'concerns', label: 'Concerns or Incidents', placeholder: 'Document issues, incidents, risks...', icon: AlertCircle, gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#ef4444' },
  { key: 'recommendations', label: 'Recommendations & Handover', placeholder: 'Notes for next support worker...', icon: MessageSquare, gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#8b5cf6' },
]

/* ═══════════════════════════════════════════════
   DESIGN SYSTEM
   ═══════════════════════════════════════════════ */
function Glass({ children, className = '', glow, style = {}, hover = false, isDark = false, onClick, ...p }) {
  const base = isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.55)'
  const border = isDark ? 'rgba(51,65,85,0.4)' : 'rgba(255,255,255,0.7)'
  return (
    <div className={className} onClick={onClick}
      style={{ background: base, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${border}`, borderRadius: '1.25rem', boxShadow: glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)', transition: hover ? 'all .3s cubic-bezier(.16,1,.3,1)' : undefined, cursor: hover || onClick ? 'pointer' : undefined, ...style }}
      onMouseEnter={hover ? e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=glow?`0 16px 48px -8px ${glow}`:'0 12px 40px -8px rgba(0,0,0,0.12)' } : undefined}
      onMouseLeave={hover ? e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=glow?`0 8px 32px -8px ${glow}`:'0 4px 24px -4px rgba(0,0,0,0.06)' } : undefined}
      {...p}>{children}</div>
  )
}
function Orb({ color, size = 200, top, left, right, bottom, delay = 0 }) {
  return <div style={{ position:'absolute', width:size, height:size, top, left, right, bottom, background:`radial-gradient(circle, ${color} 0%, transparent 70%)`, opacity:0.12, borderRadius:'50%', animation:`orbFloat ${6+delay}s ease-in-out ${delay}s infinite`, pointerEvents:'none', zIndex:0 }} />
}
function AnimNum({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0)
  const frameRef = useRef()
  useEffect(() => { const num = typeof value==='number'?value:parseInt(value)||0; const start=performance.now(); function tick(now){const p=Math.min((now-start)/duration,1);setDisplay(Math.round(num*(1-Math.pow(1-p,3))));if(p<1)frameRef.current=requestAnimationFrame(tick)} frameRef.current=requestAnimationFrame(tick); return()=>cancelAnimationFrame(frameRef.current) }, [value, duration])
  return <>{display}</>
}
function Badge({ children, color = 'gray', isDark }) {
  const palettes = {
    gray:isDark?{bg:'rgba(100,116,139,0.2)',text:'#94a3b8',border:'rgba(100,116,139,0.3)'}:{bg:'#f1f5f9',text:'#64748b',border:'#e2e8f0'},
    green:isDark?{bg:'rgba(16,185,129,0.15)',text:'#34d399',border:'rgba(16,185,129,0.3)'}:{bg:'#ecfdf5',text:'#059669',border:'#a7f3d0'},
    amber:isDark?{bg:'rgba(245,158,11,0.15)',text:'#fbbf24',border:'rgba(245,158,11,0.3)'}:{bg:'#fffbeb',text:'#d97706',border:'#fde68a'},
    red:isDark?{bg:'rgba(239,68,68,0.15)',text:'#f87171',border:'rgba(239,68,68,0.3)'}:{bg:'#fef2f2',text:'#dc2626',border:'#fecaca'},
    blue:isDark?{bg:'rgba(59,130,246,0.15)',text:'#60a5fa',border:'rgba(59,130,246,0.3)'}:{bg:'#eff6ff',text:'#2563eb',border:'#bfdbfe'},
    purple:isDark?{bg:'rgba(139,92,246,0.15)',text:'#a78bfa',border:'rgba(139,92,246,0.3)'}:{bg:'#f5f3ff',text:'#7c3aed',border:'#ddd6fe'},
    orange:isDark?{bg:'rgba(249,115,22,0.15)',text:'#fb923c',border:'rgba(249,115,22,0.3)'}:{bg:'#fff7ed',text:'#ea580c',border:'#fed7aa'},
    teal:isDark?{bg:'rgba(20,184,166,0.15)',text:'#2dd4bf',border:'rgba(20,184,166,0.3)'}:{bg:'#f0fdfa',text:'#0d9488',border:'#99f6e4'},
  }
  const pl=palettes[color]||palettes.gray
  return <span style={{ display:'inline-flex',alignItems:'center',padding:'3px 10px',fontSize:10,fontWeight:700,letterSpacing:'0.02em',borderRadius:999,background:pl.bg,color:pl.text,border:`1px solid ${pl.border}`,whiteSpace:'nowrap' }}>{children}</span>
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function StaffNotes() {
  const navigate = useNavigate()
  const { completedShifts, pendingNotes, staffProfile, refreshShifts } = useStaff()
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loaded, setLoaded] = useState(false)
  const [showNote, setShowNote] = useState(null)
  const [noteForm, setNoteForm] = useState({ mood: '', activities: '', goals_progress: '', concerns: '', recommendations: '' })
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { const t = setTimeout(() => setLoaded(true), 80); return () => clearTimeout(t) }, [])

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
  const stg = (i) => ({ transitionDelay:`${i*50}ms`, opacity:loaded?1:0, transform:loaded?'translateY(0)':'translateY(14px)', transition:'all .6s cubic-bezier(.16,1,.3,1)' })
  const inputStyle = { width:'100%', padding:'12px 14px', background:dk.inputBg, border:`1.5px solid ${dk.inputBorder}`, borderRadius:12, fontSize:13, fontWeight:600, color:dk.text, outline:'none', transition:'all .2s', resize:'vertical', minHeight:70 }

  /* ─── submit handler (100% preserved) ─── */
  const handleSubmitNote = async () => {
    if (!showNote) return
    setSubmitting(true)
    try {
      const hasExisting = showNote.shift_notes && showNote.shift_notes.length > 0
      const payload = { ...noteForm }
      payload.content = [noteForm.mood && `Mood: ${noteForm.mood}`, noteForm.activities && `Activities: ${noteForm.activities}`, noteForm.goals_progress && `Goals: ${noteForm.goals_progress}`, noteForm.concerns && `Concerns: ${noteForm.concerns}`, noteForm.recommendations && `Recommendations: ${noteForm.recommendations}`].filter(Boolean).join('\n\n')
      if (hasExisting) {
        const { error } = await supabase.from('shift_notes').update(payload).eq('id', showNote.shift_notes[0].id)
        if (error) throw error; alert('Note updated!')
      } else {
        payload.shift_id = showNote.id; payload.staff_id = staffProfile?.id
        const { error } = await supabase.from('shift_notes').insert(payload).select()
        if (error) { if (error.message?.includes('column') || error.code === '42703') { await supabase.from('shift_notes').insert({ shift_id: showNote.id, staff_id: staffProfile?.id, content: payload.content }) } else throw error }
        alert('Shift note submitted!')
      }
      await refreshShifts()
      setShowNote(null); setNoteForm({ mood: '', activities: '', goals_progress: '', concerns: '', recommendations: '' })
    } catch (err) { console.error(err); alert('Failed to save note: ' + (err.message || 'Unknown error')) }
    finally { setSubmitting(false) }
  }

  /* ─── computed ─── */
  const completedCount = completedShifts.length
  const notesSubmitted = completedShifts.filter(s => s.shift_notes && s.shift_notes.length > 0).length
  const notesPending = pendingNotes.length
  const compliancePct = completedCount === 0 ? 100 : Math.round((notesSubmitted / completedCount) * 100)

  const pendingShifts = completedShifts.filter(s => !s.shift_notes || s.shift_notes.length === 0)
  const submittedShifts = completedShifts.filter(s => s.shift_notes && s.shift_notes.length > 0)

  const filterShifts = (shifts) => {
    if (!searchQuery.trim()) return shifts
    const q = searchQuery.toLowerCase()
    return shifts.filter(s => {
      const pName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}`.toLowerCase() : ''
      return pName.includes(q) || (s.service_type || '').toLowerCase().includes(q) || (s.shift_date || '').includes(q)
    })
  }

  /* ─── completion ring ─── */
  const ComplianceRing = ({ size = 72 }) => {
    const r = (size - 8) / 2, circ = 2 * Math.PI * r, offset = circ - (compliancePct / 100) * circ
    const ringColor = compliancePct === 100 ? '#10b981' : compliancePct >= 80 ? '#f59e0b' : '#ef4444'
    return (
      <div style={{ position:'relative', width:size, height:size }}>
        <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={isDark?'rgba(51,65,85,0.5)':'#f1f5f9'} strokeWidth="6" />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={ringColor} strokeWidth="6" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition:'stroke-dashoffset 1.2s cubic-bezier(.16,1,.3,1)' }} />
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:14, fontWeight:900, color:isDark?'#e2e8f0':'#1f2937' }}>{compliancePct}%</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position:'relative', minHeight:'100vh', overflow:'hidden' }}>
      <style>{`
        @keyframes orbFloat { 0%,100% { transform:translateY(0) scale(1) } 50% { transform:translateY(-15px) scale(1.03) } }
        @keyframes ping { 75%,100% { transform:scale(1.8);opacity:0 } }
        @keyframes pulse-dot { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes countUp { from { opacity:0;transform:translateY(8px) scale(0.95) } to { opacity:1;transform:translateY(0) scale(1) } }
        .count-up { animation: countUp .7s cubic-bezier(.16,1,.3,1) forwards }
      `}</style>

      <Orb color={c.staff} size={280} top="-80px" right="-60px" delay={0} />
      <Orb color={c.staffHover} size={200} bottom="10%" left="-40px" delay={2} />
      <Orb color="#8b5cf6" size={160} top="40%" right="15%" delay={4} />
      <Orb color="#ef4444" size={180} bottom="-40px" right="30%" delay={1} />
      <Orb color="#f59e0b" size={140} top="20%" left="20%" delay={3} />

      <div style={{ position:'relative', zIndex:1, padding:'0 0 40px' }}>

        {/* ═══════ HERO ═══════ */}
        <div style={{ ...stg(0), background:`linear-gradient(135deg, ${c.staff} 0%, ${c.staffHover} 40%, #3b82f6 70%, #06b6d4 100%)`, borderRadius:20, padding:'28px 24px', marginBottom:24, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.1)' }} />
          <div style={{ position:'absolute', bottom:-50, left:-30, width:150, height:150, borderRadius:'50%', background:'rgba(255,255,255,0.1)' }} />
          <div style={{ position:'absolute', top:'55%', right:'22%', width:50, height:50, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
          <div style={{ position:'absolute', inset:0, opacity:0.15, backgroundImage:'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize:'16px 16px' }} />
          {[{top:'15%',left:'85%',size:5,delay:'0s'},{top:'70%',left:'90%',size:3,delay:'1s'},{top:'35%',left:'8%',size:4,delay:'2s'}].map((dot,i)=>(
            <div key={i} style={{ position:'absolute', top:dot.top, left:dot.left, width:dot.size, height:dot.size, borderRadius:'50%', background:'rgba(255,255,255,0.4)', animation:`pulse-dot 2s ease-in-out ${dot.delay} infinite` }} />
          ))}
          <div style={{ position:'relative', zIndex:2 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, flexWrap:'wrap' }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:999, background:'rgba(255,255,255,0.2)', backdropFilter:'blur(8px)', fontSize:11, fontWeight:700, color:'white', letterSpacing:'0.04em' }}>
                <FileText size={12} /> SHIFT NOTES
              </span>
              {notesPending > 0 && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:999, background:'rgba(245,158,11,0.3)', backdropFilter:'blur(8px)', fontSize:10, fontWeight:700, color:'#fde68a' }}>
                  <AlertTriangle size={10} /> {notesPending} OVERDUE
                </span>
              )}
              {compliancePct === 100 && completedCount > 0 && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:999, background:'rgba(16,185,129,0.3)', backdropFilter:'blur(8px)', fontSize:10, fontWeight:700, color:'#a7f3d0' }}>
                  <CheckCircle size={10} /> 100% COMPLIANT
                </span>
              )}
            </div>
            <h1 style={{ fontSize:26, fontWeight:900, color:'white', lineHeight:1.2, marginBottom:4 }}>Shift Notes</h1>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.75)', marginBottom:16 }}>Document each shift for NDIS compliance</p>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {[
                { label:'Completed', value:completedCount, icon:Calendar },
                { label:'Submitted', value:notesSubmitted, icon:CheckCircle2 },
                { label:'Pending', value:notesPending, icon:AlertTriangle },
                { label:'Compliance', value:`${compliancePct}%`, icon:Shield },
              ].map((pill,i) => (
                <div key={i} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:999, background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.15)' }}>
                  <pill.icon size={12} style={{ color:'rgba(255,255,255,0.7)' }} />
                  <span style={{ fontSize:12, fontWeight:800, color:'white' }}>{pill.value}</span>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.6)' }}>{pill.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════ STAT CARDS ═══════ */}
        <div style={{ ...stg(1), display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:14, marginBottom:24 }}>
          {[
            { icon:Calendar, label:'Completed Shifts', value:completedCount, gradient:`linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, glow:`${c.staff}40` },
            { icon:CheckCircle2, label:'Notes Submitted', value:notesSubmitted, gradient:'linear-gradient(135deg, #10b981, #059669)', glow:'rgba(16,185,129,0.3)' },
            { icon:AlertTriangle, label:'Notes Pending', value:notesPending, gradient:'linear-gradient(135deg, #f59e0b, #f97316)', glow:'rgba(245,158,11,0.3)', alert:notesPending > 0 },
            { icon:Shield, label:'Compliance', value:compliancePct, suffix:'%', gradient: compliancePct===100?'linear-gradient(135deg, #10b981, #059669)':compliancePct>=80?'linear-gradient(135deg, #f59e0b, #f97316)':'linear-gradient(135deg, #ef4444, #dc2626)', glow: compliancePct===100?'rgba(16,185,129,0.3)':compliancePct>=80?'rgba(245,158,11,0.3)':'rgba(239,68,68,0.3)' },
          ].map((stat,i) => (
            <Glass key={i} isDark={isDark} hover glow={stat.glow} style={{ padding:'18px 16px' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
                <div style={{ width:38, height:38, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:stat.gradient, boxShadow:`0 4px 12px -2px ${stat.glow}` }}>
                  <stat.icon size={18} style={{ color:'white' }} />
                </div>
                {stat.alert && <span style={{ width:8, height:8, borderRadius:4, background:'#ef4444', animation:'pulse-dot 1.5s ease-in-out infinite' }} />}
              </div>
              <p style={{ fontSize:26, fontWeight:900, color:dk.text, lineHeight:1 }}><AnimNum value={stat.value} />{stat.suffix||''}</p>
              <p style={{ fontSize:11, fontWeight:600, color:dk.textFaint, marginTop:4 }}>{stat.label}</p>
            </Glass>
          ))}
        </div>

        {/* ═══════ COMPLIANCE ALERT ═══════ */}
        {notesPending > 0 && (
          <div style={{ ...stg(2), background:'linear-gradient(135deg, #f59e0b, #f97316)', borderRadius:16, padding:20, marginBottom:20, display:'flex', alignItems:'flex-start', gap:14, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.1)' }} />
            <AlertTriangle size={22} style={{ color:'white', flexShrink:0, marginTop:2 }} />
            <div>
              <p style={{ fontSize:15, fontWeight:800, color:'white' }}>{notesPending} shift note{notesPending > 1 ? 's' : ''} overdue</p>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.8)', marginTop:2 }}>Submit within 24 hours for NDIS compliance. Late submissions may be flagged in audits.</p>
            </div>
          </div>
        )}

        {/* ═══════ TABS ═══════ */}
        <Glass isDark={isDark} style={{ ...stg(3), padding:6, marginBottom:20, display:'flex', gap:4, flexWrap:'wrap' }}>
          {[
            { id:'pending', label:'Needs Notes', icon:AlertTriangle, count:pendingShifts.length },
            { id:'submitted', label:'Submitted', icon:CheckCircle2, count:submittedShifts.length },
            { id:'all', label:'All Shifts', icon:Calendar, count:completedCount },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                flex:'1 1 auto', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                padding:'10px 16px', borderRadius:14, border:'none', cursor:'pointer',
                fontSize:13, fontWeight:700, transition:'all .25s cubic-bezier(.16,1,.3,1)',
                background: activeTab===tab.id ? `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` : 'transparent',
                color: activeTab===tab.id ? 'white' : dk.textMuted,
                boxShadow: activeTab===tab.id ? `0 4px 16px -4px ${c.staff}50` : 'none',
              }}>
              <tab.icon size={15} />
              {tab.label}
              {tab.count > 0 && <span style={{ padding:'1px 7px', borderRadius:999, fontSize:10, fontWeight:800, background:activeTab===tab.id?'rgba(255,255,255,0.25)':dk.subtleBg2, color:activeTab===tab.id?'white':dk.textMuted }}>{tab.count}</span>}
            </button>
          ))}
        </Glass>

        {/* ═══════ SEARCH ═══════ */}
        <Glass isDark={isDark} style={{ ...stg(4), padding:'4px 14px', display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
          <Search size={16} style={{ color:dk.textFaint, flexShrink:0 }} />
          <input type="text" placeholder="Search by participant or service type..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ flex:1, padding:'10px 0', background:'transparent', border:'none', outline:'none', fontSize:13, fontWeight:600, color:dk.text, minWidth:0 }} />
          {searchQuery && <button onClick={() => setSearchQuery('')} style={{ padding:4, borderRadius:6, border:'none', cursor:'pointer', background:dk.subtleBg2, color:dk.textFaint }}><X size={12} /></button>}
        </Glass>

        {/* ═══════ SHIFT LIST ═══════ */}
        <div style={stg(5)}>
          {(() => {
            const shifts = activeTab === 'pending' ? filterShifts(pendingShifts)
              : activeTab === 'submitted' ? filterShifts(submittedShifts)
              : filterShifts(completedShifts)
            const label = activeTab === 'pending' ? 'pending' : activeTab === 'submitted' ? 'submitted' : 'completed'

            if (shifts.length === 0) return (
              <Glass isDark={isDark} style={{ padding:'50px 24px', textAlign:'center' }}>
                <div style={{ width:56, height:56, borderRadius:18, margin:'0 auto 14px', display:'flex', alignItems:'center', justifyContent:'center', background: activeTab==='pending' ? 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(249,115,22,0.1))' : `linear-gradient(135deg, ${c.staff}20, ${c.staffHover}15)` }}>
                  {activeTab === 'pending' ? <AlertTriangle size={24} style={{ color:'#f59e0b' }} /> : <CheckCircle2 size={24} style={{ color:c.staff }} />}
                </div>
                <p style={{ fontSize:15, fontWeight:800, color:dk.text }}>
                  {searchQuery ? 'No matching shifts' : activeTab === 'pending' ? 'All notes submitted!' : `No ${label} shifts`}
                </p>
                <p style={{ fontSize:12, color:dk.textFaint, marginTop:4 }}>
                  {searchQuery ? 'Try adjusting your search' : activeTab === 'pending' ? "You're fully compliant — great work!" : 'Complete shifts will appear here'}
                </p>
              </Glass>
            )

            return (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <p style={{ fontSize:12, color:dk.textFaint }}>{shifts.length} shift{shifts.length !== 1 ? 's' : ''}</p>
                {shifts.map(s => {
                  const pName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Unassigned'
                  const hasNote = s.shift_notes && s.shift_notes.length > 0
                  return (
                    <Glass key={s.id} isDark={isDark} hover
                      style={{
                        padding:16, display:'flex', alignItems:'center', gap:14,
                        borderLeft: hasNote ? '4px solid #10b981' : '4px solid #f59e0b',
                      }}
                    >
                      <div style={{
                        width:44, height:44, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                        background: hasNote ? (isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5') : (isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7'),
                      }}>
                        {hasNote ? <CheckCircle2 size={20} style={{ color:'#10b981' }} /> : <FileText size={20} style={{ color:'#f59e0b' }} />}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                          <p style={{ fontSize:14, fontWeight:700, color:dk.text }}>{pName}</p>
                          <Badge color={hasNote ? 'green' : 'amber'} isDark={isDark}>{hasNote ? 'Submitted' : 'Pending'}</Badge>
                        </div>
                        <p style={{ fontSize:11, color:dk.textMuted }}>{formatDate(s.shift_date)} · {s.service_type || s.title || 'Support'}</p>
                        {s.location && <p style={{ fontSize:10, color:dk.textFaint, marginTop:2 }}>{s.location}</p>}
                      </div>
                      {hasNote ? (
                        <button onClick={() => { setNoteForm({ mood:s.shift_notes[0]?.mood||'', activities:s.shift_notes[0]?.activities||'', goals_progress:s.shift_notes[0]?.goals_progress||'', concerns:s.shift_notes[0]?.concerns||'', recommendations:s.shift_notes[0]?.recommendations||'' }); setShowNote(s) }}
                          style={{
                            display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10,
                            background: isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5',
                            border:`1px solid ${isDark ? 'rgba(16,185,129,0.3)' : '#a7f3d0'}`,
                            color: isDark ? '#34d399' : '#059669', fontSize:12, fontWeight:700,
                            cursor:'pointer', transition:'all .2s', flexShrink:0,
                          }}>
                          <Eye size={14} /> View
                        </button>
                      ) : (
                        <button onClick={() => setShowNote(s)}
                          style={{
                            display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10,
                            background:`linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, color:'white',
                            fontSize:12, fontWeight:700, cursor:'pointer', transition:'all .2s',
                            boxShadow:`0 4px 12px -2px ${c.staff}40`, flexShrink:0,
                          }}>
                          <FileText size={14} /> Submit
                        </button>
                      )}
                    </Glass>
                  )
                })}
              </div>
            )
          })()}
        </div>

      </div>

      {/* ═══════ NOTE MODAL — gradient hero ═══════ */}
      <Modal isOpen={!!showNote} onClose={() => setShowNote(null)} title="" wide>
        {showNote && (
          <div>
            {/* Gradient hero header */}
            <div style={{ margin:'-24px -24px 0', marginBottom:0 }}>
              <div style={{
                background: (showNote.shift_notes?.length > 0) ? 'linear-gradient(135deg, #10b981, #059669, #06b6d4)' : `linear-gradient(135deg, ${c.staff}, ${c.staffHover}, #3b82f6)`,
                padding:'24px', position:'relative', overflow:'hidden',
              }}>
                <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.1)' }} />
                <div style={{ position:'absolute', bottom:-15, left:-15, width:60, height:60, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
                <div style={{ position:'relative', zIndex:2, display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:48, height:48, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.2)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.2)' }}>
                    <FileText size={22} style={{ color:'white' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize:18, fontWeight:900, color:'white' }}>
                      {showNote.participants ? `${showNote.participants.first_name} ${showNote.participants.last_name}` : 'Shift Note'}
                    </h3>
                    <p style={{ fontSize:12, color:'rgba(255,255,255,0.8)', marginTop:2 }}>
                      {formatDate(showNote.shift_date)} · {showNote.service_type || showNote.title || 'Support'}
                    </p>
                  </div>
                  <div style={{ marginLeft:'auto' }}>
                    <span style={{ padding:'4px 12px', borderRadius:999, fontSize:10, fontWeight:700, background:'rgba(255,255,255,0.2)', color:'white' }}>
                      {showNote.shift_notes?.length > 0 ? 'Edit' : 'New'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding:'20px 0 0', display:'flex', flexDirection:'column', gap:16 }}>
              {/* NDIS compliance info */}
              <div style={{
                padding:14, borderRadius:14, display:'flex', alignItems:'center', gap:10,
                background: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff',
                border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe'}`,
              }}>
                <Shield size={16} style={{ color:'#3b82f6', flexShrink:0 }} />
                <p style={{ fontSize:12, color: isDark ? '#93c5fd' : '#1d4ed8' }}>Complete all sections for NDIS compliance. Notes are attached to the shift record.</p>
              </div>

              {/* Color-coded note sections */}
              {NOTE_SECTIONS.map(section => {
                const Icon = section.icon
                const filled = !!noteForm[section.key]?.trim()
                return (
                  <div key={section.key}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                      <div style={{
                        width:26, height:26, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center',
                        background: section.gradient,
                      }}>
                        <Icon size={12} style={{ color:'white' }} />
                      </div>
                      <p style={{ fontSize:12, fontWeight:700, color:dk.text }}>{section.label}</p>
                      {filled && <CheckCircle size={12} style={{ color:'#10b981', marginLeft:'auto' }} />}
                    </div>
                    <textarea
                      value={noteForm[section.key]}
                      onChange={e => setNoteForm({ ...noteForm, [section.key]: e.target.value })}
                      rows={3}
                      placeholder={section.placeholder}
                      style={{
                        ...inputStyle,
                        borderLeft: `3px solid ${section.color}20`,
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = section.color; e.currentTarget.style.borderLeftColor = section.color; e.currentTarget.style.boxShadow = `0 0 0 3px ${section.color}15` }}
                      onBlur={e => { e.currentTarget.style.borderColor = dk.inputBorder; e.currentTarget.style.borderLeftColor = `${section.color}20`; e.currentTarget.style.boxShadow = 'none' }}
                    />
                  </div>
                )
              })}

              {/* Progress indicator */}
              <div style={{ padding:14, borderRadius:14, background:dk.subtleBg, border:`1px solid ${dk.divider}` }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <p style={{ fontSize:11, fontWeight:700, color:dk.textMuted }}>Completion</p>
                  <p style={{ fontSize:11, fontWeight:700, color:dk.text }}>
                    {NOTE_SECTIONS.filter(s => noteForm[s.key]?.trim()).length} / {NOTE_SECTIONS.length} sections
                  </p>
                </div>
                <div style={{ display:'flex', gap:4 }}>
                  {NOTE_SECTIONS.map(s => (
                    <div key={s.key} style={{
                      flex:1, height:6, borderRadius:3,
                      background: noteForm[s.key]?.trim() ? s.gradient : dk.subtleBg2,
                      transition:'all .3s',
                    }} />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <button onClick={() => setShowNote(null)}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'14px 20px', borderRadius:14, border:`1.5px solid ${dk.divider}`, background:'transparent', color:dk.text, fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = dk.subtleBg2}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  Cancel
                </button>
                <button disabled={submitting} onClick={handleSubmitNote}
                  style={{
                    flex:2, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    padding:'14px 20px', borderRadius:14, border:'none', cursor:submitting?'default':'pointer',
                    background: (showNote.shift_notes?.length > 0) ? 'linear-gradient(135deg, #10b981, #059669)' : `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`,
                    color:'white', fontSize:13, fontWeight:800, opacity:submitting?0.6:1,
                    boxShadow: (showNote.shift_notes?.length > 0) ? '0 4px 16px -4px rgba(16,185,129,0.5)' : `0 4px 16px -4px ${c.staff}50`,
                    transition:'all .2s',
                  }}
                  onMouseEnter={e => { if(!submitting) e.currentTarget.style.transform = 'scale(1.02)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}>
                  {submitting ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }} /> Saving...</>
                    : showNote.shift_notes?.length > 0 ? <><CheckCircle size={16} /> Update Note</>
                    : <><FileText size={16} /> Submit Note</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}