import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, FileText, Play, Square, MapPin, Activity, CheckCircle2,
  ChevronLeft, ChevronRight, Clock, Mic, Search, X, Filter, Loader2,
  AlertTriangle, Eye, Shield, Users, Flame, ArrowRight, Target, CheckCircle
} from 'lucide-react'
import { useStaff } from '../../context/StaffContext'
import { useBrandColors } from '../../hooks/useBrandColors'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'
import Modal from '../../components/ui/Modal'
import GpsVerification from '../../components/GpsVerification'
import VoiceRecorder from '../../components/VoiceRecorder'

/* ═══════════════════════════════════════════════
   HELPERS — 100% preserved
   ═══════════════════════════════════════════════ */
function formatTime(iso) { if (!iso) return null; return new Date(iso).toLocaleTimeString('en-AU', { hour:'numeric', minute:'2-digit', hour12:true }) }
function formatDate(iso) {
  if (!iso) return '—'; const d=new Date(iso),today=new Date(),tomorrow=new Date(today),yesterday=new Date(today)
  tomorrow.setDate(tomorrow.getDate()+1);yesterday.setDate(yesterday.getDate()-1)
  if (d.toDateString()===today.toDateString()) return 'Today'; if (d.toDateString()===tomorrow.toDateString()) return 'Tomorrow'; if (d.toDateString()===yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short'})
}
function getShiftDuration(s) {
  if (s.clock_in&&s.clock_out) return ((new Date(s.clock_out)-new Date(s.clock_in))/3600000).toFixed(1)
  if (s.start_time&&s.end_time) return ((new Date(s.end_time)-new Date(s.start_time))/3600000).toFixed(1)
  return null
}

/* ═══════════════════════════════════════════════
   MAP PREVIEW — 100% preserved logic
   ═══════════════════════════════════════════════ */
function MapPreview({ location, mapKey, isDark, c, dk }) {
  const [coords,setCoords]=useState(null)
  const [loading,setLoading]=useState(false)
  const fetched=useRef(false)
  if (!location||location.length<5) return null
  if (!fetched.current) {
    fetched.current=true; setLoading(true)
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location+', Australia')}&limit=1`,{headers:{'User-Agent':'VelCare/1.0'}})
      .then(r=>r.json()).then(data=>{if(data?.[0])setCoords({lat:parseFloat(data[0].lat),lon:parseFloat(data[0].lon),display:data[0].display_name})}).catch(()=>{}).finally(()=>setLoading(false))
  }
  if (loading) return <div style={{height:190,borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',background:dk.subtleBg,border:`1px solid ${dk.divider}`}}><Loader2 size={20} style={{color:c.staff,animation:'spin 1s linear infinite'}} /></div>
  if (!coords) return null
  const zoom=15,n=Math.pow(2,zoom),xtile=((coords.lon+180)/360)*n,ytile=((1-Math.log(Math.tan(coords.lat*Math.PI/180)+1/Math.cos(coords.lat*Math.PI/180))/Math.PI)/2)*n
  const cx=Math.floor(xtile),cy=Math.floor(ytile),tiles=[]
  for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++)tiles.push({x:cx+dx,y:cy+dy,dx,dy})
  const offsetX=(xtile-cx)*256,offsetY=(ytile-cy)*256,tileStyle=isDark?'dark_all':'light_all'
  return (
    <div style={{borderRadius:16,overflow:'hidden',border:`1px solid ${isDark?`${c.staff}30`:dk.divider}`,background:isDark?'#1e293b':'#f8f9fa'}}>
      <div style={{position:'relative',height:190,overflow:'hidden'}}>
        <div style={{position:'absolute',left:`calc(50% - ${offsetX}px - 512px)`,top:`calc(50% - ${offsetY}px - 512px)`,width:`${256*5}px`,height:`${256*5}px`}}>
          {tiles.map(t=><img key={`${t.x}-${t.y}`} src={`https://a.basemaps.cartocdn.com/${tileStyle}/${zoom}/${t.x}/${t.y}@2x.png`} alt="" style={{position:'absolute',left:`${(t.dx+2)*256}px`,top:`${(t.dy+2)*256}px`,width:256,height:256}} draggable={false} />)}
        </div>
        <div style={{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-100%)',zIndex:10,filter:`drop-shadow(0 2px 4px ${c.staff}66)`}}>
          <svg width="36" height="46" viewBox="0 0 36 46" fill="none"><path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.06 27.94 0 18 0z" fill={c.staff}/><circle cx="18" cy="16.5" r="7" fill="white"/><circle cx="18" cy="16.5" r="3.5" fill={c.staffHover}/></svg>
        </div>
      </div>
      <div style={{padding:'10px 16px',display:'flex',alignItems:'center',gap:10,background:isDark?`${c.staff}12`:`${c.staff}06`}}>
        <div style={{width:28,height:28,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`,flexShrink:0}}><MapPin size={13} style={{color:'white'}}/></div>
        <div style={{flex:1,minWidth:0}}>
          <p style={{fontSize:11,fontWeight:600,color:dk.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{coords.display?.split(',').slice(0,3).join(',')}</p>
          <p style={{fontSize:9,color:dk.textFaint,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{coords.display?.split(',').slice(3).join(',').trim()}</p>
        </div>
        <div style={{display:'flex',gap:6,flexShrink:0}}>
          <a href={`https://maps.apple.com/?q=${encodeURIComponent(coords.display)}&ll=${coords.lat},${coords.lon}`} target="_blank" rel="noopener noreferrer" style={{padding:'4px 10px',borderRadius:8,background:isDark?'rgba(255,255,255,0.15)':'#1f2937',fontSize:10,color:'white',fontWeight:700,textDecoration:'none'}}>Apple</a>
          <a href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lon}`} target="_blank" rel="noopener noreferrer" style={{padding:'4px 10px',borderRadius:8,background:c.staff,fontSize:10,color:'white',fontWeight:700,textDecoration:'none'}}>Google</a>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   DESIGN SYSTEM
   ═══════════════════════════════════════════════ */
function Glass({children,className='',glow,style={},hover=false,isDark=false,onClick,...p}){const base=isDark?'rgba(30,41,59,0.6)':'rgba(255,255,255,0.55)';const border=isDark?'rgba(51,65,85,0.4)':'rgba(255,255,255,0.7)';return<div className={className} onClick={onClick} style={{background:base,backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',border:`1px solid ${border}`,borderRadius:'1.25rem',boxShadow:glow?`0 8px 32px -8px ${glow}`:'0 4px 24px -4px rgba(0,0,0,0.06)',transition:hover?'all .3s cubic-bezier(.16,1,.3,1)':undefined,cursor:hover||onClick?'pointer':undefined,...style}} onMouseEnter={hover?e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=glow?`0 16px 48px -8px ${glow}`:'0 12px 40px -8px rgba(0,0,0,0.12)'}:undefined} onMouseLeave={hover?e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=glow?`0 8px 32px -8px ${glow}`:'0 4px 24px -4px rgba(0,0,0,0.06)'}:undefined} {...p}>{children}</div>}
function Orb({color,size=200,top,left,right,bottom,delay=0}){return<div style={{position:'absolute',width:size,height:size,top,left,right,bottom,background:`radial-gradient(circle,${color} 0%,transparent 70%)`,opacity:0.12,borderRadius:'50%',animation:`orbFloat ${6+delay}s ease-in-out ${delay}s infinite`,pointerEvents:'none',zIndex:0}}/>}
function AnimNum({value,duration=1200,suffix=''}){const[display,setDisplay]=useState(0);const frameRef=useRef();useEffect(()=>{const num=typeof value==='number'?value:parseFloat(value)||0;const start=performance.now();function tick(now){const p=Math.min((now-start)/duration,1);setDisplay(Math.round(num*(1-Math.pow(1-p,3))*10)/10);if(p<1)frameRef.current=requestAnimationFrame(tick)}frameRef.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frameRef.current)},[value,duration]);const isInt=Number.isInteger(typeof value==='number'?value:parseFloat(value));return<>{isInt?Math.round(display):display.toFixed(1)}{suffix}</>}
function Badge({children,color='gray',isDark}){const palettes={gray:isDark?{bg:'rgba(100,116,139,0.2)',text:'#94a3b8',border:'rgba(100,116,139,0.3)'}:{bg:'#f1f5f9',text:'#64748b',border:'#e2e8f0'},green:isDark?{bg:'rgba(16,185,129,0.15)',text:'#34d399',border:'rgba(16,185,129,0.3)'}:{bg:'#ecfdf5',text:'#059669',border:'#a7f3d0'},amber:isDark?{bg:'rgba(245,158,11,0.15)',text:'#fbbf24',border:'rgba(245,158,11,0.3)'}:{bg:'#fffbeb',text:'#d97706',border:'#fde68a'},red:isDark?{bg:'rgba(239,68,68,0.15)',text:'#f87171',border:'rgba(239,68,68,0.3)'}:{bg:'#fef2f2',text:'#dc2626',border:'#fecaca'},blue:isDark?{bg:'rgba(59,130,246,0.15)',text:'#60a5fa',border:'rgba(59,130,246,0.3)'}:{bg:'#eff6ff',text:'#2563eb',border:'#bfdbfe'},purple:isDark?{bg:'rgba(139,92,246,0.15)',text:'#a78bfa',border:'rgba(139,92,246,0.3)'}:{bg:'#f5f3ff',text:'#7c3aed',border:'#ddd6fe'},orange:isDark?{bg:'rgba(249,115,22,0.15)',text:'#fb923c',border:'rgba(249,115,22,0.3)'}:{bg:'#fff7ed',text:'#ea580c',border:'#fed7aa'},teal:isDark?{bg:'rgba(20,184,166,0.15)',text:'#2dd4bf',border:'rgba(20,184,166,0.3)'}:{bg:'#f0fdfa',text:'#0d9488',border:'#99f6e4'}};const pl=palettes[color]||palettes.gray;return<span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',fontSize:10,fontWeight:700,letterSpacing:'0.02em',borderRadius:999,background:pl.bg,color:pl.text,border:`1px solid ${pl.border}`,whiteSpace:'nowrap'}}>{children}</span>}

/* ═══════════════════════════════════════════════
   WEEK STRIP — preserved + glassmorphism
   ═══════════════════════════════════════════════ */
function WeekStrip({ shifts, c, isDark, dk }) {
  const today=new Date(),days=[]
  for(let i=-1;i<6;i++){const d=new Date(today);d.setDate(d.getDate()+i);const dateStr=d.toISOString().split('T')[0];days.push({date:d,dateStr,shifts:shifts.filter(s=>s.shift_date===dateStr),isToday:i===0})}
  return (
    <div style={{display:'flex',gap:6}}>
      {days.map(d=>(
        <div key={d.dateStr} style={{flex:1,borderRadius:14,padding:'10px 4px',textAlign:'center',transition:'all .3s cubic-bezier(.16,1,.3,1)',
          background:d.isToday?`linear-gradient(135deg,${c.staff},${c.staffHover})`:(isDark?'rgba(30,41,59,0.6)':'rgba(255,255,255,0.6)'),
          border:d.isToday?'none':`1px solid ${isDark?'rgba(51,65,85,0.4)':'rgba(255,255,255,0.7)'}`,
          transform:d.isToday?'scale(1.05)':'scale(1)',boxShadow:d.isToday?`0 8px 20px -4px ${c.staff}50`:'none',
          backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)'}}>
          <p style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:d.isToday?'rgba(255,255,255,0.7)':dk.textFaint}}>
            {d.date.toLocaleDateString('en-AU',{weekday:'short'})}
          </p>
          <p style={{fontSize:18,fontWeight:900,color:d.isToday?'white':dk.text,marginTop:2}}>{d.date.getDate()}</p>
          {d.shifts.length>0&&(
            <div style={{display:'flex',justifyContent:'center',gap:3,marginTop:4}}>
              {d.shifts.slice(0,3).map((s,i)=>(
                <div key={i} style={{width:5,height:5,borderRadius:3,background:d.isToday?'white':(s.status==='completed'?'#10b981':s.status==='in_progress'?'#f59e0b':c.staff)}} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function StaffShifts() {
  const navigate=useNavigate()
  const { myShifts, upcomingShifts, handleClockIn, handleClockOut, staffProfile, refreshShifts } = useStaff()
  const c=useBrandColors()
  const { isDark }=useTheme()
  const [loaded,setLoaded]=useState(false)
  const [expandedShift,setExpandedShift]=useState(null)
  const [showNote,setShowNote]=useState(null)
  const [viewShift,setViewShift]=useState(null)
  const [noteForm,setNoteForm]=useState({mood:'',activities:'',goals_progress:'',concerns:'',recommendations:''})
  const [shiftView,setShiftView]=useState('week')
  const [viewDate,setViewDate]=useState(new Date())
  const [gpsModal,setGpsModal]=useState(null)
  const [showVoiceFor,setShowVoiceFor]=useState(null)
  const [activeTab,setActiveTab]=useState('upcoming')
  const [searchQuery,setSearchQuery]=useState('')

  useEffect(()=>{const t=setTimeout(()=>setLoaded(true),80);return()=>clearTimeout(t)},[])

  const dk={text:isDark?'#e2e8f0':'#1f2937',textSoft:isDark?'#cbd5e1':'#374151',textMuted:isDark?'#94a3b8':'#6b7280',textFaint:isDark?'#64748b':'#9ca3af',subtleBg:isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.02)',subtleBg2:isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)',inputBg:isDark?'rgba(30,41,59,0.8)':'white',inputBorder:isDark?'rgba(51,65,85,0.5)':'#e5e7eb',divider:isDark?'rgba(51,65,85,0.3)':'rgba(0,0,0,0.05)'}
  const stg=(i)=>({transitionDelay:`${i*50}ms`,opacity:loaded?1:0,transform:loaded?'translateY(0)':'translateY(14px)',transition:'all .6s cubic-bezier(.16,1,.3,1)'})
  const inputStyle={width:'100%',padding:'12px 14px',background:dk.inputBg,border:`1.5px solid ${dk.inputBorder}`,borderRadius:12,fontSize:13,fontWeight:600,color:dk.text,outline:'none',transition:'all .2s',resize:'vertical',minHeight:70}

  /* ─── handlers (100% preserved) ─── */
  const startClockIn=(shift)=>setGpsModal({shift,action:'in'})
  const startClockOut=(shift)=>setGpsModal({shift,action:'out'})
  const handleGpsVerified=(gpsData)=>{if(!gpsModal)return;const{shift,action}=gpsModal;if(action==='in')handleClockIn(shift.id,gpsData);else handleClockOut(shift.id,gpsData);setGpsModal(null);if(viewShift)setViewShift(null)}
  const handleSubmitNote=async()=>{
    if(!showNote)return
    try{
      const hasExisting=showNote.shift_notes&&showNote.shift_notes.length>0
      const payload={...noteForm}
      payload.content=[noteForm.mood&&`Mood: ${noteForm.mood}`,noteForm.activities&&`Activities: ${noteForm.activities}`,noteForm.goals_progress&&`Goals: ${noteForm.goals_progress}`,noteForm.concerns&&`Concerns: ${noteForm.concerns}`,noteForm.recommendations&&`Recommendations: ${noteForm.recommendations}`].filter(Boolean).join('\n\n')
      if(hasExisting){const{error}=await supabase.from('shift_notes').update(payload).eq('id',showNote.shift_notes[0].id);if(error)throw error;alert('Note updated!')}
      else{payload.shift_id=showNote.id;payload.staff_id=staffProfile?.id;const{error}=await supabase.from('shift_notes').insert(payload).select();if(error){if(error.message?.includes('column')||error.code==='42703'){await supabase.from('shift_notes').insert({shift_id:showNote.id,staff_id:staffProfile?.id,content:payload.content})}else throw error}alert('Shift note submitted!')}
      await refreshShifts();setShowNote(null);setNoteForm({mood:'',activities:'',goals_progress:'',concerns:'',recommendations:''});setShowVoiceFor(null)
    }catch(err){console.error(err);alert('Failed to save note: '+(err.message||'Unknown error'))}
  }
  const handleVoiceTranscript=(text)=>{if(!showVoiceFor)return;setNoteForm(prev=>({...prev,[showVoiceFor]:prev[showVoiceFor]?prev[showVoiceFor]+' '+text:text}));setShowVoiceFor(null)}

  /* ─── computed ─── */
  const completedCount=myShifts.filter(s=>s.status==='completed').length
  const inProgressCount=myShifts.filter(s=>s.status==='in_progress').length
  const upcomingCount=upcomingShifts.length
  const totalHours=myShifts.filter(s=>s.status==='completed').reduce((a,s)=>s.clock_in&&s.clock_out?a+(new Date(s.clock_out)-new Date(s.clock_in))/3600000:a,0)
  const pendingNotesCount=myShifts.filter(s=>s.status==='completed'&&(!s.shift_notes||s.shift_notes.length===0)).length

  const filterShifts=(shifts)=>{
    if(!searchQuery.trim())return shifts
    const q=searchQuery.toLowerCase()
    return shifts.filter(s=>{
      const pName=s.participants?`${s.participants.first_name} ${s.participants.last_name}`.toLowerCase():''
      return pName.includes(q)||(s.service_type||'').toLowerCase().includes(q)||(s.location||'').toLowerCase().includes(q)||(s.shift_date||'').includes(q)
    })
  }
  const tabShifts=activeTab==='upcoming'?filterShifts(upcomingShifts):activeTab==='completed'?filterShifts(myShifts.filter(s=>s.status==='completed')):filterShifts(myShifts)

  return (
    <div style={{position:'relative',minHeight:'100vh',overflow:'hidden'}}>
      <style>{`
        @keyframes orbFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-15px) scale(1.03)}}
        @keyframes ping{75%,100%{transform:scale(1.8);opacity:0}}
        @keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes countUp{from{opacity:0;transform:translateY(8px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .count-up{animation:countUp .7s cubic-bezier(.16,1,.3,1) forwards}
      `}</style>
      <Orb color={c.staff} size={280} top="-80px" right="-60px" delay={0}/>
      <Orb color={c.staffHover} size={200} bottom="10%" left="-40px" delay={2}/>
      <Orb color="#8b5cf6" size={160} top="40%" right="15%" delay={4}/>
      <Orb color="#06b6d4" size={200} bottom="-50px" right="25%" delay={1}/>
      <Orb color="#f59e0b" size={140} top="20%" left="20%" delay={3}/>

      <div style={{position:'relative',zIndex:1,padding:'0 0 40px'}}>
        {/* ═══════ HERO ═══════ */}
        <div style={{...stg(0),background:`linear-gradient(135deg,${c.staff} 0%,${c.staffHover} 40%,#3b82f6 70%,#06b6d4 100%)`,borderRadius:20,padding:'28px 24px',marginBottom:24,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:-40,right:-40,width:180,height:180,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
          <div style={{position:'absolute',bottom:-50,left:-30,width:150,height:150,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
          <div style={{position:'absolute',top:'55%',right:'22%',width:50,height:50,borderRadius:'50%',background:'rgba(255,255,255,0.08)'}}/>
          <div style={{position:'absolute',inset:0,opacity:0.15,backgroundImage:'radial-gradient(rgba(255,255,255,0.5) 1px,transparent 1px)',backgroundSize:'16px 16px'}}/>
          {[{top:'15%',left:'85%',size:5,delay:'0s'},{top:'70%',left:'90%',size:3,delay:'1s'},{top:'35%',left:'8%',size:4,delay:'2s'}].map((dot,i)=>(
            <div key={i} style={{position:'absolute',top:dot.top,left:dot.left,width:dot.size,height:dot.size,borderRadius:'50%',background:'rgba(255,255,255,0.4)',animation:`pulse-dot 2s ease-in-out ${dot.delay} infinite`}}/>
          ))}
          <div style={{position:'relative',zIndex:2}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,flexWrap:'wrap'}}>
              <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:999,background:'rgba(255,255,255,0.2)',backdropFilter:'blur(8px)',fontSize:11,fontWeight:700,color:'white',letterSpacing:'0.04em'}}><Calendar size={12}/> MY SHIFTS</span>
              {inProgressCount>0&&<span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:999,background:'rgba(16,185,129,0.3)',backdropFilter:'blur(8px)',fontSize:10,fontWeight:700,color:'#a7f3d0'}}><span style={{width:6,height:6,borderRadius:3,background:'#34d399',animation:'pulse-dot 1.5s infinite'}}/> {inProgressCount} ACTIVE</span>}
              {pendingNotesCount>0&&<span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:999,background:'rgba(245,158,11,0.3)',backdropFilter:'blur(8px)',fontSize:10,fontWeight:700,color:'#fde68a'}}><AlertTriangle size={10}/> {pendingNotesCount} NOTES DUE</span>}
            </div>
            <h1 style={{fontSize:26,fontWeight:900,color:'white',lineHeight:1.2,marginBottom:4}}>My Shifts</h1>
            <p style={{fontSize:13,color:'rgba(255,255,255,0.75)',marginBottom:16}}>{myShifts.length} total · {upcomingCount} upcoming · {completedCount} completed</p>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {[{label:'Total',value:myShifts.length,icon:Calendar},{label:'Upcoming',value:upcomingCount,icon:Clock},{label:'Hours',value:`${totalHours.toFixed(0)}h`,icon:Flame},{label:'Active',value:inProgressCount,icon:Activity}].map((pill,i)=>(
                <div key={i} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:999,background:'rgba(255,255,255,0.15)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.15)'}}>
                  <pill.icon size={12} style={{color:'rgba(255,255,255,0.7)'}}/><span style={{fontSize:12,fontWeight:800,color:'white'}}>{pill.value}</span><span style={{fontSize:10,color:'rgba(255,255,255,0.6)'}}>{pill.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════ STAT CARDS ═══════ */}
        <div style={{...stg(1),display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:14,marginBottom:24}}>
          {[
            {icon:Calendar,label:'Total Shifts',value:myShifts.length,gradient:`linear-gradient(135deg,${c.staff},${c.staffHover})`,glow:`${c.staff}40`},
            {icon:Clock,label:'Upcoming',value:upcomingCount,gradient:'linear-gradient(135deg,#3b82f6,#06b6d4)',glow:'rgba(59,130,246,0.3)'},
            {icon:CheckCircle,label:'Completed',value:completedCount,gradient:'linear-gradient(135deg,#10b981,#059669)',glow:'rgba(16,185,129,0.3)'},
            {icon:Flame,label:'Hours',value:totalHours,suffix:'h',decimals:1,gradient:'linear-gradient(135deg,#f97316,#ef4444)',glow:'rgba(249,115,22,0.3)'},
            {icon:Activity,label:'In Progress',value:inProgressCount,gradient:'linear-gradient(135deg,#f59e0b,#f97316)',glow:'rgba(245,158,11,0.3)',alert:inProgressCount>0},
            {icon:FileText,label:'Notes Due',value:pendingNotesCount,gradient:'linear-gradient(135deg,#8b5cf6,#6366f1)',glow:'rgba(139,92,246,0.3)',alert:pendingNotesCount>0},
          ].map((stat,i)=>(
            <Glass key={i} isDark={isDark} hover glow={stat.glow} style={{padding:'16px 14px'}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:8}}>
                <div style={{width:34,height:34,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:stat.gradient,boxShadow:`0 4px 12px -2px ${stat.glow}`}}><stat.icon size={16} style={{color:'white'}}/></div>
                {stat.alert&&<span style={{width:8,height:8,borderRadius:4,background:'#ef4444',animation:'pulse-dot 1.5s ease-in-out infinite'}}/>}
              </div>
              <p style={{fontSize:24,fontWeight:900,color:dk.text,lineHeight:1}}><AnimNum value={stat.decimals?Math.round(stat.value*10)/10:stat.value} suffix={stat.suffix||''}/></p>
              <p style={{fontSize:10,fontWeight:600,color:dk.textFaint,marginTop:4}}>{stat.label}</p>
            </Glass>
          ))}
        </div>

        {/* ═══════ WEEK STRIP ═══════ */}
        <Glass isDark={isDark} style={{...stg(2),padding:14,marginBottom:20}}>
          <WeekStrip shifts={myShifts} c={c} isDark={isDark} dk={dk}/>
        </Glass>

        {/* ═══════ TABS + SEARCH ═══════ */}
        <div style={{...stg(3),display:'flex',flexWrap:'wrap',gap:12,marginBottom:20}}>
          <Glass isDark={isDark} style={{padding:6,display:'flex',gap:4,flexWrap:'wrap'}}>
            {[{id:'upcoming',label:'Upcoming',icon:Clock,count:upcomingCount},{id:'completed',label:'Completed',icon:CheckCircle,count:completedCount},{id:'all',label:'All Shifts',icon:Calendar,count:myShifts.length}].map(tab=>(
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{flex:'1 1 auto',display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'9px 14px',borderRadius:12,border:'none',cursor:'pointer',fontSize:12,fontWeight:700,transition:'all .25s cubic-bezier(.16,1,.3,1)',background:activeTab===tab.id?`linear-gradient(135deg,${c.staff},${c.staffHover})`:'transparent',color:activeTab===tab.id?'white':dk.textMuted,boxShadow:activeTab===tab.id?`0 4px 16px -4px ${c.staff}50`:'none'}}>
                <tab.icon size={14}/>{tab.label}
                {tab.count>0&&<span style={{padding:'1px 7px',borderRadius:999,fontSize:9,fontWeight:800,background:activeTab===tab.id?'rgba(255,255,255,0.25)':dk.subtleBg2,color:activeTab===tab.id?'white':dk.textMuted}}>{tab.count}</span>}
              </button>
            ))}
          </Glass>
          <Glass isDark={isDark} style={{padding:'4px 14px',display:'flex',alignItems:'center',gap:8,flex:'1 1 200px',minWidth:0}}>
            <Search size={16} style={{color:dk.textFaint,flexShrink:0}}/>
            <input type="text" placeholder="Search shifts..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} style={{flex:1,padding:'8px 0',background:'transparent',border:'none',outline:'none',fontSize:13,fontWeight:600,color:dk.text,minWidth:0}}/>
            {searchQuery&&<button onClick={()=>setSearchQuery('')} style={{padding:4,borderRadius:6,border:'none',cursor:'pointer',background:dk.subtleBg2,color:dk.textFaint}}><X size={12}/></button>}
          </Glass>
        </div>

        {/* ═══════ NAV (week/month for range view) ═══════ */}
        <Glass isDark={isDark} style={{...stg(4),padding:'6px 10px',display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
          <button onClick={()=>{const d=new Date(viewDate);shiftView==='week'?d.setDate(d.getDate()-7):d.setMonth(d.getMonth()-1);setViewDate(d)}} style={{padding:6,borderRadius:8,border:'none',cursor:'pointer',background:'transparent',color:dk.textMuted}}><ChevronLeft size={16}/></button>
          <p style={{flex:1,textAlign:'center',fontSize:13,fontWeight:800,color:dk.text}}>
            {(()=>{if(shiftView==='week'){const s=new Date(viewDate);s.setDate(s.getDate()-s.getDay()+1);const e=new Date(s);e.setDate(e.getDate()+6);return`${s.toLocaleDateString('en-AU',{day:'numeric',month:'short'})} – ${e.toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'})}`}return viewDate.toLocaleDateString('en-AU',{month:'long',year:'numeric'})})()}
          </p>
          <Glass isDark={isDark} style={{padding:4,display:'flex',gap:2}}>
            {['week','month'].map(v=>(
              <button key={v} onClick={()=>setShiftView(v)} style={{padding:'5px 10px',borderRadius:8,border:'none',cursor:'pointer',fontSize:10,fontWeight:700,background:shiftView===v?(isDark?`${c.staff}25`:`${c.staff}12`):'transparent',color:shiftView===v?c.staff:dk.textFaint}}>{v.charAt(0).toUpperCase()+v.slice(1)}</button>
            ))}
          </Glass>
          <button onClick={()=>setViewDate(new Date())} style={{padding:'4px 10px',borderRadius:8,border:'none',cursor:'pointer',fontSize:10,fontWeight:700,background:isDark?`${c.staff}20`:`${c.staff}10`,color:c.staff}}>Today</button>
          <button onClick={()=>{const d=new Date(viewDate);shiftView==='week'?d.setDate(d.getDate()+7):d.setMonth(d.getMonth()+1);setViewDate(d)}} style={{padding:6,borderRadius:8,border:'none',cursor:'pointer',background:'transparent',color:dk.textMuted}}><ChevronRight size={16}/></button>
        </Glass>

        {/* ═══════ SHIFT LIST ═══════ */}
        <div style={stg(5)}>
          <p style={{fontSize:12,color:dk.textFaint,marginBottom:10}}>{tabShifts.length} shift{tabShifts.length!==1?'s':''}{searchQuery&&` matching "${searchQuery}"`}</p>
          {tabShifts.length>0?(
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {tabShifts.map(s=>{
                const pName=s.participants?`${s.participants.first_name} ${s.participants.last_name}`:'Unassigned'
                const isActive=s.status==='in_progress',isDone=s.status==='completed'
                const isToday=s.shift_date===new Date().toISOString().split('T')[0]
                const duration=getShiftDuration(s)
                const hasNote=s.shift_notes&&s.shift_notes.length>0
                return (
                  <Glass key={s.id} isDark={isDark} glow={isActive?`${c.staff}20`:undefined}
                    style={{overflow:'hidden',borderLeft:isActive?`4px solid #10b981`:isDone?`4px solid #94a3b8`:isToday?`4px solid ${c.staff}`:undefined}}>
                    {/* Main content - clickable */}
                    <div onClick={()=>setViewShift(s)} style={{padding:16,cursor:'pointer',display:'flex',alignItems:'center',gap:14}}>
                      <div style={{width:44,height:44,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
                        background:isDone?'linear-gradient(135deg,#94a3b8,#64748b)':isActive?'linear-gradient(135deg,#10b981,#059669)':`linear-gradient(135deg,${c.staff},${c.staffHover})`,
                        boxShadow:isDone?'none':isActive?'0 4px 12px -2px rgba(16,185,129,0.4)':`0 4px 12px -2px ${c.staff}40`}}>
                        {isActive?<Activity size={18} style={{color:'white'}}/>:isDone?<CheckCircle2 size={18} style={{color:'white'}}/>:<Calendar size={18} style={{color:'white'}}/>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginBottom:2}}>
                          <p style={{fontSize:14,fontWeight:700,color:dk.text}}>{pName}</p>
                          <Badge color={isActive?'green':isDone?'gray':'blue'} isDark={isDark}>{(s.status||'scheduled').replace('_',' ')}</Badge>
                          {isToday&&!isActive&&!isDone&&<Badge color="teal" isDark={isDark}>Today</Badge>}
                          {isDone&&!hasNote&&<Badge color="amber" isDark={isDark}>Note due</Badge>}
                        </div>
                        <p style={{fontSize:12,color:dk.textMuted}}>{s.service_type||s.title||'Support'}</p>
                        <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:8,marginTop:4}}>
                          <span style={{fontSize:11,color:dk.textFaint}}>{formatDate(s.shift_date)}</span>
                          <span style={{fontSize:11,color:dk.textFaint}}>{formatTime(s.start_time)} – {formatTime(s.end_time)}</span>
                          {duration&&<span style={{fontSize:11,fontWeight:600,color:c.staff}}>{duration}h</span>}
                          {s.location&&<span style={{fontSize:11,color:dk.textFaint,display:'flex',alignItems:'center',gap:3}}><MapPin size={10}/>{s.location}</span>}
                        </div>
                        {s.clock_in&&(
                          <div style={{display:'flex',gap:10,marginTop:4}}>
                            <span style={{fontSize:10,fontWeight:600,color:isDark?'#34d399':'#059669'}}>In: {formatTime(s.clock_in)}{s.clock_in_lat?' 📍':''}</span>
                            {s.clock_out&&<span style={{fontSize:10,fontWeight:600,color:isDark?'#fb923c':'#ea580c'}}>Out: {formatTime(s.clock_out)}{s.clock_out_lat?' 📍':''}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Action buttons */}
                    <div style={{padding:'0 16px 14px',display:'flex',gap:8}} onClick={e=>e.stopPropagation()}>
                      {(s.status==='scheduled'||s.status==='upcoming')&&(
                        <button onClick={()=>startClockIn(s)} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'10px 16px',borderRadius:12,border:'none',cursor:'pointer',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`,color:'white',fontSize:12,fontWeight:700,boxShadow:`0 4px 12px -2px ${c.staff}40`}}><Play size={14}/> Clock In</button>
                      )}
                      {isActive&&<>
                        <button onClick={()=>startClockOut(s)} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'10px 16px',borderRadius:12,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#ef4444,#dc2626)',color:'white',fontSize:12,fontWeight:700,boxShadow:'0 4px 12px -2px rgba(239,68,68,0.4)'}}><Square size={12}/> Clock Out</button>
                        <button onClick={()=>setShowNote(s)} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'10px 16px',borderRadius:12,border:`1.5px solid ${dk.divider}`,background:'transparent',color:dk.text,fontSize:12,fontWeight:600,cursor:'pointer'}}><FileText size={14}/> Note</button>
                      </>}
                      {isDone&&(
                        <button onClick={()=>setShowNote(s)} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'10px 16px',borderRadius:12,border:'none',cursor:'pointer',background:hasNote?'linear-gradient(135deg,#10b981,#059669)':'linear-gradient(135deg,#f59e0b,#f97316)',color:'white',fontSize:12,fontWeight:700}}><FileText size={14}/> {hasNote?'Edit Note':'Add Note'}</button>
                      )}
                    </div>
                  </Glass>
                )
              })}
            </div>
          ):(
            <Glass isDark={isDark} style={{padding:'50px 24px',textAlign:'center'}}>
              <div style={{width:56,height:56,borderRadius:18,margin:'0 auto 14px',display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${c.staff}20,${c.staffHover}15)`}}><Calendar size={24} style={{color:c.staff}}/></div>
              <p style={{fontSize:15,fontWeight:800,color:dk.text}}>{searchQuery?'No matching shifts':'No shifts yet'}</p>
              <p style={{fontSize:12,color:dk.textFaint,marginTop:4}}>{searchQuery?'Try adjusting your search':'Your admin will assign shifts to you'}</p>
              {searchQuery&&<button onClick={()=>setSearchQuery('')} style={{display:'inline-flex',alignItems:'center',gap:6,marginTop:14,padding:'10px 20px',borderRadius:12,border:'none',cursor:'pointer',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`,color:'white',fontSize:13,fontWeight:700}}>Clear search</button>}
            </Glass>
          )}
        </div>
      </div>

      {/* ═══════ SHIFT DETAIL MODAL ═══════ */}
      <Modal isOpen={!!viewShift} onClose={()=>setViewShift(null)} title="" wide>
        {viewShift&&(()=>{
          const s=viewShift,pName=s.participants?`${s.participants.first_name} ${s.participants.last_name}`:'Unassigned',isActive=s.status==='in_progress',isDone=s.status==='completed',duration=getShiftDuration(s)
          const shiftDate=s.shift_date?new Date(s.shift_date+'T00:00:00').toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long',year:'numeric'}):''
          return(
            <div>
              <div style={{margin:'-24px -24px 0',marginBottom:0}}>
                <div style={{background:isDone?'linear-gradient(135deg,#64748b,#475569)':isActive?'linear-gradient(135deg,#10b981,#059669)':`linear-gradient(135deg,${c.staff},${c.staffHover},#3b82f6)`,padding:'24px',position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',top:-20,right:-20,width:100,height:100,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
                  <div style={{position:'absolute',bottom:-15,left:-15,width:60,height:60,borderRadius:'50%',background:'rgba(255,255,255,0.08)'}}/>
                  <div style={{position:'relative',zIndex:2,display:'flex',alignItems:'center',gap:14}}>
                    <div style={{width:48,height:48,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.2)',backdropFilter:'blur(8px)'}}>{isActive?<Activity size={22} style={{color:'white'}}/>:isDone?<CheckCircle2 size={22} style={{color:'white'}}/>:<Calendar size={22} style={{color:'white'}}/>}</div>
                    <div><h3 style={{fontSize:18,fontWeight:900,color:'white'}}>{pName}</h3><p style={{fontSize:12,color:'rgba(255,255,255,0.8)',marginTop:2}}>{s.service_type||s.title||'Support'}</p></div>
                    <span style={{marginLeft:'auto',padding:'4px 12px',borderRadius:999,fontSize:10,fontWeight:700,background:'rgba(255,255,255,0.2)',color:'white'}}>{(s.status||'scheduled').replace('_',' ')}</span>
                  </div>
                </div>
              </div>
              <div style={{padding:'20px 0 0',display:'flex',flexDirection:'column',gap:14}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:10}}>
                  <div style={{padding:14,borderRadius:14,background:dk.subtleBg,border:`1px solid ${dk.divider}`}}><p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:dk.textFaint}}>Date</p><p style={{fontSize:13,fontWeight:700,color:dk.text,marginTop:4}}>{shiftDate}</p></div>
                  <div style={{padding:14,borderRadius:14,background:dk.subtleBg,border:`1px solid ${dk.divider}`}}><p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:dk.textFaint}}>Time</p><p style={{fontSize:13,fontWeight:700,color:dk.text,marginTop:4}}>{formatTime(s.start_time)} – {formatTime(s.end_time)}</p></div>
                  {duration&&<div style={{padding:14,borderRadius:14,background:dk.subtleBg,border:`1px solid ${dk.divider}`}}><p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:dk.textFaint}}>Duration</p><p style={{fontSize:13,fontWeight:700,color:dk.text,marginTop:4}}>{duration}h</p></div>}
                  {s.clock_in&&<div style={{padding:14,borderRadius:14,background:isDark?'rgba(16,185,129,0.1)':'#ecfdf5',border:`1px solid ${isDark?'rgba(16,185,129,0.2)':'#a7f3d0'}`}}><p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:'#10b981'}}>Clocked In</p><p style={{fontSize:13,fontWeight:700,color:'#10b981',marginTop:4}}>{formatTime(s.clock_in)}</p>{s.clock_in_lat&&<p style={{fontSize:9,color:dk.textFaint,marginTop:2,display:'flex',alignItems:'center',gap:3}}><Shield size={8} style={{color:'#10b981'}}/> GPS verified</p>}</div>}
                  {s.clock_out&&<div style={{padding:14,borderRadius:14,background:isDark?'rgba(249,115,22,0.1)':'#fff7ed',border:`1px solid ${isDark?'rgba(249,115,22,0.2)':'#fed7aa'}`}}><p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:'#f97316'}}>Clocked Out</p><p style={{fontSize:13,fontWeight:700,color:'#f97316',marginTop:4}}>{formatTime(s.clock_out)}</p>{s.clock_out_lat&&<p style={{fontSize:9,color:dk.textFaint,marginTop:2,display:'flex',alignItems:'center',gap:3}}><Shield size={8} style={{color:'#f97316'}}/> GPS verified</p>}</div>}
                </div>
                {s.location&&<div><p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:dk.textFaint,display:'flex',alignItems:'center',gap:4,marginBottom:8}}><MapPin size={10}/> Location</p><p style={{fontSize:13,fontWeight:600,color:dk.text,marginBottom:10}}>{s.location}</p><MapPreview key={s.id} location={s.location} mapKey={s.id} isDark={isDark} c={c} dk={dk}/></div>}
                {s.notes&&<div style={{padding:14,borderRadius:14,background:dk.subtleBg,border:`1px solid ${dk.divider}`}}><p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:dk.textFaint,marginBottom:6}}>Notes</p><p style={{fontSize:13,color:dk.text,whiteSpace:'pre-wrap',lineHeight:1.6}}>{s.notes}</p></div>}
                <div style={{display:'flex',gap:10,flexWrap:'wrap',paddingTop:4}}>
                  {(s.status==='scheduled'||s.status==='upcoming')&&<button onClick={()=>{setViewShift(null);startClockIn(s)}} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'12px 20px',borderRadius:14,border:'none',cursor:'pointer',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`,color:'white',fontSize:13,fontWeight:700,boxShadow:`0 4px 16px -4px ${c.staff}50`}}><Play size={16}/> Clock In</button>}
                  {isActive&&<><button onClick={()=>{setViewShift(null);startClockOut(s)}} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'12px 20px',borderRadius:14,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#ef4444,#dc2626)',color:'white',fontSize:13,fontWeight:700,boxShadow:'0 4px 16px -4px rgba(239,68,68,0.4)'}}><Square size={14}/> Clock Out</button><button onClick={()=>{setViewShift(null);setShowNote(s)}} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'12px 20px',borderRadius:14,border:`1.5px solid ${dk.divider}`,background:'transparent',color:dk.text,fontSize:13,fontWeight:600,cursor:'pointer'}}><FileText size={14}/> Note</button></>}
                  {isDone&&<button onClick={()=>{setViewShift(null);setShowNote(s)}} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'12px 20px',borderRadius:14,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#f59e0b,#f97316)',color:'white',fontSize:13,fontWeight:700}}><FileText size={14}/> Add Note</button>}
                  <button onClick={()=>setViewShift(null)} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'12px 20px',borderRadius:14,border:`1.5px solid ${dk.divider}`,background:'transparent',color:dk.textMuted,fontSize:13,fontWeight:600,cursor:'pointer'}}>Close</button>
                </div>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* ═══════ GPS MODAL ═══════ */}
      <Modal isOpen={!!gpsModal} onClose={()=>setGpsModal(null)} title={`GPS Verification — Clock ${gpsModal?.action==='in'?'In':'Out'}`} wide>
        {gpsModal&&<GpsVerification participant={gpsModal.shift.participants} shiftLocation={gpsModal.shift.location} onVerified={handleGpsVerified} onCancel={()=>setGpsModal(null)} action={gpsModal.action} maxDistance={200} accentColor={c.staff} accentHover={c.staffHover} isDark={isDark}/>}
      </Modal>

      {/* ═══════ NOTE MODAL WITH VOICE ═══════ */}
      <Modal isOpen={!!showNote} onClose={()=>{setShowNote(null);setShowVoiceFor(null)}} title="" wide>
        {showNote&&(
          <div>
            <div style={{margin:'-24px -24px 0',marginBottom:0}}>
              <div style={{background:(showNote.shift_notes?.length>0)?'linear-gradient(135deg,#10b981,#059669,#06b6d4)':`linear-gradient(135deg,${c.staff},${c.staffHover},#3b82f6)`,padding:'24px',position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:-20,right:-20,width:100,height:100,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
                <div style={{position:'relative',zIndex:2,display:'flex',alignItems:'center',gap:14}}>
                  <div style={{width:48,height:48,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.2)',backdropFilter:'blur(8px)'}}><FileText size={22} style={{color:'white'}}/></div>
                  <div><h3 style={{fontSize:18,fontWeight:900,color:'white'}}>{showNote.participants?`${showNote.participants.first_name} ${showNote.participants.last_name}`:'Shift Note'}</h3><p style={{fontSize:12,color:'rgba(255,255,255,0.8)',marginTop:2}}>{formatDate(showNote.shift_date)} · {showNote.service_type||showNote.title||'Support'}</p></div>
                  <span style={{marginLeft:'auto',padding:'4px 12px',borderRadius:999,fontSize:10,fontWeight:700,background:'rgba(255,255,255,0.2)',color:'white'}}>{showNote.shift_notes?.length>0?'Edit':'New'}</span>
                </div>
              </div>
            </div>
            <div style={{padding:'20px 0 0',display:'flex',flexDirection:'column',gap:14}}>
              <div style={{padding:12,borderRadius:12,display:'flex',alignItems:'center',gap:8,background:isDark?'rgba(59,130,246,0.1)':'#eff6ff',border:`1px solid ${isDark?'rgba(59,130,246,0.2)':'#bfdbfe'}`}}>
                <Shield size={14} style={{color:'#3b82f6',flexShrink:0}}/>
                <p style={{fontSize:12,color:isDark?'#93c5fd':'#1d4ed8'}}>Complete all sections for NDIS compliance. Use the mic to dictate notes.</p>
              </div>
              {showVoiceFor&&(
                <div style={{padding:14,borderRadius:14,background:isDark?'rgba(16,185,129,0.05)':'#f0fdf4',border:`1px solid ${isDark?'rgba(16,185,129,0.2)':'#bbf7d0'}`}}>
                  <p style={{fontSize:11,fontWeight:700,color:isDark?'#6ee7b7':'#065f46',marginBottom:8}}>Voice recording for: {showVoiceFor.replace(/_/g,' ')}</p>
                  <VoiceRecorder onTranscript={handleVoiceTranscript} accentColor={c.staff} accentHover={c.staffHover} isDark={isDark} placeholder="Tap the microphone to start dictating..."/>
                </div>
              )}
              {[{key:'mood',label:"Participant's Mood & Wellbeing",placeholder:'Describe mood, energy, emotional state...',color:'#f59e0b'},{key:'activities',label:'Activities Completed',placeholder:'List activities, tasks, engagement...',color:'#3b82f6'},{key:'goals_progress',label:'Progress Toward Goals',placeholder:'Note progress toward NDIS plan goals...',color:'#10b981'},{key:'concerns',label:'Concerns or Incidents',placeholder:'Document issues, incidents, risks...',color:'#ef4444'},{key:'recommendations',label:'Recommendations & Handover',placeholder:'Notes for next support worker...',color:'#8b5cf6'}].map(f=>(
                <div key={f.key}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                    <p style={{fontSize:11,fontWeight:700,color:dk.textMuted,display:'flex',alignItems:'center',gap:6}}><span style={{width:8,height:8,borderRadius:4,background:f.color}}/>{f.label}</p>
                    <button onClick={()=>setShowVoiceFor(showVoiceFor===f.key?null:f.key)} style={{padding:6,borderRadius:8,border:'none',cursor:'pointer',background:showVoiceFor===f.key?(isDark?`${c.staff}20`:`${c.staff}10`):'transparent',color:showVoiceFor===f.key?c.staff:dk.textFaint,transition:'all .2s'}}><Mic size={14}/></button>
                  </div>
                  <textarea value={noteForm[f.key]} onChange={e=>setNoteForm({...noteForm,[f.key]:e.target.value})} rows={2} placeholder={f.placeholder}
                    style={{...inputStyle,borderLeft:`3px solid ${f.color}20`}}
                    onFocus={e=>{e.currentTarget.style.borderColor=f.color;e.currentTarget.style.borderLeftColor=f.color;e.currentTarget.style.boxShadow=`0 0 0 3px ${f.color}15`}}
                    onBlur={e=>{e.currentTarget.style.borderColor=dk.inputBorder;e.currentTarget.style.borderLeftColor=`${f.color}20`;e.currentTarget.style.boxShadow='none'}}/>
                </div>
              ))}
              <div style={{display:'flex',gap:10,flexWrap:'wrap',paddingTop:4}}>
                <button onClick={()=>{setShowNote(null);setShowVoiceFor(null)}} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'14px 20px',borderRadius:14,border:`1.5px solid ${dk.divider}`,background:'transparent',color:dk.text,fontSize:13,fontWeight:600,cursor:'pointer'}}>Cancel</button>
                <button onClick={handleSubmitNote} style={{flex:2,display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'14px 20px',borderRadius:14,border:'none',cursor:'pointer',background:(showNote.shift_notes?.length>0)?'linear-gradient(135deg,#10b981,#059669)':`linear-gradient(135deg,${c.staff},${c.staffHover})`,color:'white',fontSize:13,fontWeight:800,boxShadow:(showNote.shift_notes?.length>0)?'0 4px 16px -4px rgba(16,185,129,0.5)':`0 4px 16px -4px ${c.staff}50`}}>{showNote.shift_notes?.length>0?'Update Note':'Submit Note'}</button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}